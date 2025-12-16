/**
 * Simple Schedule Canvas - React Native Compatible
 * Basic drag-to-paint availability grid
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import type { WeeklyAvailability, DayOfWeek } from '../../types/availability';
import { SLOT_STATUS, DAYS_OF_WEEK } from '../../types/availability';

const CELL_HEIGHT = 22; // Reduced by 50% to fit more on screen
const CELL_WIDTH = 44;
const TIME_LABEL_WIDTH = 70;

// Business hours (slot indices: 2 slots per hour, 0 = midnight)
const WEEKDAY_START = 16; // 8 AM
const WEEKDAY_END = 36;   // 6 PM
const WEEKEND_START = 20; // 10 AM  
const WEEKEND_END = 44;   // 10 PM

interface ScheduleCanvasProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
  onSave?: () => void;
  onBack?: () => void;
  companyName?: string;
  location?: string;
  hourlyRate?: number;
}

type WizardStep = 'preferred' | 'available';

// Helper: Convert slot index to time string
function slotIndexToTime(index: number): string {
  const hour = Math.floor(index / 2);
  const minute = (index % 2) * 30;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

// Helper: Check if slot is within business hours for a given day
function isBusinessHours(dayIndex: number, slotIndex: number): boolean {
  const isWeekend = dayIndex >= 5; // Saturday (5) and Sunday (6)
  
  if (isWeekend) {
    return slotIndex >= WEEKEND_START && slotIndex <= WEEKEND_END;
  } else {
    return slotIndex >= WEEKDAY_START && slotIndex <= WEEKDAY_END;
  }
}

// Helper: Get background color for slot status
function getSlotColor(status: number, dayIndex: number, slotIndex: number): string {
  // If outside business hours, show grey (closed)
  if (!isBusinessHours(dayIndex, slotIndex)) {
    return '#eeeeee'; // Grey for closed
  }
  
  // Within business hours
  switch (status) {
    case SLOT_STATUS.PREFERRED:
      return '#d4edda'; // Light green
    case SLOT_STATUS.AVAILABLE:
      return '#d1ecf1'; // Light blue
    default:
      return '#ffffff'; // White (open, not selected)
  }
}

export default function ScheduleCanvasSimple({
  availability,
  onChange,
  onSave,
  onBack,
  companyName = 'WorkForce Mobile',
  location = 'Demo Location',
}: ScheduleCanvasProps) {
  const [step, setStep] = useState<WizardStep>('preferred');
  const [isPainting, setIsPainting] = useState(false);
  const [paintMode, setPaintMode] = useState<'paint' | 'erase'>('paint');
  const scrollViewRef = useRef<ScrollView>(null);
  const paintedCellsRef = useRef<Set<string>>(new Set());
  const autoScrollIntervalRef = useRef<any>(null);

  // Update a specific slot
  const updateSlot = (dayIndex: number, slotIndex: number, newStatus: number) => {
    console.log('📝 updateSlot called:', { dayIndex, slotIndex, newStatus });
    const newAvailability = [...availability];
    newAvailability[dayIndex].slots[slotIndex].status = newStatus;
    console.log('📝 Calling onChange with new availability');
    onChange(newAvailability);
    console.log('📝 onChange completed');
  };

  // Handle cell interaction (click or drag)
  const handleCellInteraction = (dayIndex: number, slotIndex: number, isInitial: boolean = false) => {
    // Can't interact with closed hours
    if (!isBusinessHours(dayIndex, slotIndex)) {
      return;
    }
    
    const currentStatus = availability[dayIndex].slots[slotIndex].status;
    
    // Step 2 constraint: can't modify preferred (green) cells
    if (step === 'available' && currentStatus === SLOT_STATUS.PREFERRED) {
      return;
    }

    // Check if already painted in this drag
    const cellKey = `${dayIndex}-${slotIndex}`;
    if (paintedCellsRef.current.has(cellKey) && !isInitial) {
      return; // Skip if already painted in this drag
    }

    // On initial press, determine paint mode based on current cell status
    if (isInitial) {
      const stepStatus = step === 'preferred' ? SLOT_STATUS.PREFERRED : SLOT_STATUS.AVAILABLE;
      setPaintMode(currentStatus === stepStatus ? 'erase' : 'paint');
      paintedCellsRef.current.clear();
    }

    // Apply paint mode
    const stepStatus = step === 'preferred' ? SLOT_STATUS.PREFERRED : SLOT_STATUS.AVAILABLE;
    const newStatus = paintMode === 'erase' ? SLOT_STATUS.UNAVAILABLE : stepStatus;
    
    if (currentStatus !== newStatus) {
      updateSlot(dayIndex, slotIndex, newStatus);
      paintedCellsRef.current.add(cellKey);
    }
  };

  // Start auto-scroll when near edges
  const startAutoScroll = (direction: 'up' | 'down') => {
    if (autoScrollIntervalRef.current) return;

    let currentScrollY = 0;
    autoScrollIntervalRef.current = setInterval(() => {
      if (scrollViewRef.current) {
        // @ts-ignore - Access the native scroll view
        const scrollView = scrollViewRef.current.getScrollableNode?.() || scrollViewRef.current;
        if (scrollView && scrollView.scrollTop !== undefined) {
          currentScrollY = scrollView.scrollTop;
          const newScrollY = direction === 'up' 
            ? Math.max(0, currentScrollY - 10) 
            : currentScrollY + 10;
          scrollView.scrollTop = newScrollY;
        }
      }
    }, 16); // ~60fps
  };

  // Stop auto-scroll
  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  // Handle mouse/touch move over grid
  const handlePointerMove = (event: any) => {
    if (!isPainting) return;

    const target = event.target || event.currentTarget;
    const dayIndex = target.getAttribute('data-day');
    const slotIndex = target.getAttribute('data-slot');

    if (dayIndex !== null && slotIndex !== null) {
      handleCellInteraction(parseInt(dayIndex), parseInt(slotIndex));
    }

    // Check for auto-scroll
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY);
    if (clientY) {
      const windowHeight = window.innerHeight;
      const topEdgeZone = 200; // px from top (larger to account for headers)
      const bottomEdgeZone = 100; // px from bottom

      if (clientY < topEdgeZone) {
        startAutoScroll('up');
      } else if (clientY > windowHeight - bottomEdgeZone) {
        startAutoScroll('down');
      } else {
        stopAutoScroll();
      }
    }
  };

  // Handle paint end
  const handlePaintEnd = () => {
    setIsPainting(false);
    stopAutoScroll();
    paintedCellsRef.current.clear();
  };

  // Calculate totals
  const preferredCount = availability.reduce(
    (sum, day) => sum + day.slots.filter(s => s.status === SLOT_STATUS.PREFERRED).length,
    0
  );
  const availableCount = availability.reduce(
    (sum, day) => sum + day.slots.filter(s => s.status === SLOT_STATUS.AVAILABLE).length,
    0
  );
  const preferredHours = (preferredCount * 0.5).toFixed(1);
  const availableHours = (availableCount * 0.5).toFixed(1);
  const totalHours = ((preferredCount + availableCount) * 0.5).toFixed(1);

  // Add global mouse/touch listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => handlePaintEnd();
    const handleGlobalTouchEnd = () => handlePaintEnd();
    const handleGlobalMouseMove = (e: MouseEvent) => handlePointerMove(e);
    const handleGlobalTouchMove = (e: TouchEvent) => handlePointerMove(e);

    // Always listen for mouse/touch up
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);

    // Listen for move events only when painting
    if (isPainting) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      stopAutoScroll();
    };
  }, [isPainting]); // Re-run when isPainting changes

  // Render slots from 7 AM to 10 PM to cover all business hours
  const startSlot = 14; // 7 AM (covers weekday 8 AM start)
  const endSlot = 44;   // 10 PM (covers weekend 10 PM end)
  const visibleSlots = Array.from({ length: endSlot - startSlot + 1 }, (_, i) => i + startSlot);

  return (
    <View style={styles.container}>
      {/* Instructions Bar */}
      <View style={styles.instructionBar}>
        <Text style={styles.instructionText}>
          {step === 'preferred' 
            ? 'Tap the hours you prefer to work' 
            : 'Add other hours you can work'}
        </Text>
        <View style={styles.buttonRow}>
          {step === 'preferred' ? (
            <>
              {onBack && (
                <TouchableOpacity style={[styles.button, styles.buttonGray]} onPress={onBack}>
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.button, styles.buttonBlue]} 
                onPress={() => setStep('available')}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.button, styles.buttonGray]} 
                onPress={() => setStep('preferred')}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonBlue]} onPress={onSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {step === 'preferred' 
            ? `Preferred: ${preferredHours} hrs`
            : `Preferred: ${preferredHours} hrs  •  Available: ${availableHours} hrs  •  Total: ${totalHours} hrs`}
        </Text>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaderRow}>
        <View style={[styles.timeLabel, { width: TIME_LABEL_WIDTH }]} />
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.gridScroll} 
        showsVerticalScrollIndicator={true}
      >
        {visibleSlots.map((slotIndex) => (
          <View key={slotIndex} style={styles.row}>
            {/* Time Label */}
            <View style={[styles.timeLabel, { width: TIME_LABEL_WIDTH, position: 'relative' }]}>
              {slotIndex % 2 === 0 && (
                <Text style={[styles.timeText, { position: 'absolute', top: -6, right: 8 }]}>
                  {slotIndexToTime(slotIndex)}
                </Text>
              )}
            </View>

            {/* Day Cells */}
            {DAYS_OF_WEEK.map((day, dayIndex) => {
              const slot = availability[dayIndex].slots[slotIndex];
              const isClosed = !isBusinessHours(dayIndex, slotIndex);
              const isLocked = step === 'available' && slot.status === SLOT_STATUS.PREFERRED;
              const isDisabled = isClosed || isLocked;
              
              return (
                <View
                  key={`${dayIndex}-${slotIndex}`}
                  style={[
                    styles.cell,
                    { backgroundColor: getSlotColor(slot.status, dayIndex, slotIndex) },
                    isLocked && styles.cellLocked,
                    isClosed && styles.cellClosed,
                  ]}
                  // @ts-ignore - data attributes and mouse events work in React Native Web
                  data-day={dayIndex}
                  data-slot={slotIndex}
                  onMouseDown={(e: any) => {
                    e.preventDefault();
                    if (!isDisabled) {
                      setIsPainting(true);
                      handleCellInteraction(dayIndex, slotIndex, true);
                    }
                  }}
                  onMouseEnter={(e: any) => {
                    if (isPainting && !isDisabled) {
                      handleCellInteraction(dayIndex, slotIndex);
                    }
                  }}
                  onTouchStart={(e: any) => {
                    e.preventDefault();
                    if (!isDisabled) {
                      setIsPainting(true);
                      handleCellInteraction(dayIndex, slotIndex, true);
                    }
                  }}
                >
                  {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  instructionBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
  },
  instructionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonGray: {
    backgroundColor: '#8E8E8F',
  },
  buttonBlue: {
    backgroundColor: '#0156FF',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  dayHeader: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  gridScroll: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  timeLabel: {
    height: CELL_HEIGHT,
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
  },
  cellLocked: {
    opacity: 0.6,
  },
  cellClosed: {
    opacity: 0.5,
  },
  lockIcon: {
    fontSize: 12,
  },
});

