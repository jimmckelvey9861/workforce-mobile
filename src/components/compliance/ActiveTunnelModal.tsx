/**
 * WorkForce Mobile - Active Tunnel Modal Component
 * 
 * This modal covers the entire screen when the user is in ACTIVE mode,
 * showing the current task, a large timer, and earnings. It prevents
 * all navigation until the user completes the task and clocks out.
 * 
 * FEATURES:
 * - Full-screen absolute positioning
 * - Real-time earnings calculation
 * - Large countdown/up timer
 * - Submit & Clock Out button
 * - Automatic balance update on submission
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { useComplianceStore } from '../../store/complianceStore';
import { useUserStore } from '../../store/userStore';

// ============================================================================
// COMPONENT
// ============================================================================

export const ActiveTunnelModal: React.FC = () => {
  const {
    appMode,
    activeTask,
    currentSessionEarnings,
    isPaused,
    sessionStartTime,
    updateEarnings,
    endTunnel,
  } = useComplianceStore();
  
  const { addToBalance } = useUserStore();
  
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // ========================================================================
  // TIMER EFFECT
  // ========================================================================
  
  useEffect(() => {
    if (appMode === 'ACTIVE' && !isPaused && sessionStartTime) {
      // Update elapsed time every second
      const interval = setInterval(() => {
        const startTime = new Date(sessionStartTime).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [appMode, isPaused, sessionStartTime]);
  
  // ========================================================================
  // EARNINGS UPDATE
  // ========================================================================
  
  useEffect(() => {
    if (appMode === 'ACTIVE' && !isPaused) {
      // Update earnings display every second
      const interval = setInterval(() => {
        updateEarnings();
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [appMode, isPaused, updateEarnings]);
  
  // ========================================================================
  // FADE IN ANIMATION
  // ========================================================================
  
  useEffect(() => {
    if (appMode === 'ACTIVE') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [appMode, fadeAnim]);
  
  // ========================================================================
  // HANDLERS
  // ========================================================================
  
  const handleSubmitAndClockOut = async () => {
    console.log('[ActiveTunnelModal] Submit clicked');
    console.log('[ActiveTunnelModal] Current state:', {
      appMode,
      isPaused,
      currentSessionEarnings,
      activeTask: activeTask?.name,
    });
    
    try {
      // Capture earnings BEFORE calling endTunnel (since endTunnel resets the state)
      const earningsToAdd = currentSessionEarnings;
      
      console.log('[ActiveTunnelModal] Calling endTunnel()...');
      console.log('[ActiveTunnelModal] Pre-endTunnel check:', {
        hasActiveTask: !!activeTask,
        activeTaskId: activeTask?.id,
        earningsToAdd,
        earningsCents: earningsToAdd,
        earningsDollars: (earningsToAdd / 100).toFixed(2),
        appMode,
        isPaused,
      });
      
      // End the tunnel session (this calculates final earnings)
      const completedEntry = await endTunnel();
      
      console.log('[ActiveTunnelModal] endTunnel() returned:', completedEntry ? 'success' : 'null');
      console.log('[ActiveTunnelModal] completedEntry:', completedEntry);
      
      if (completedEntry) {
        // Add earnings to user's wallet balance
        console.log(`[ActiveTunnelModal] Adding to balance: $${(earningsToAdd / 100).toFixed(2)} (${earningsToAdd} cents)`);
        addToBalance(earningsToAdd);
        
        console.log('[ActiveTunnelModal] Task completed successfully!');
        
        // Show success message (web-compatible)
        if (Platform.OS === 'web') {
          window.alert(
            `Task Complete! 🎉\n\nYou earned $${(earningsToAdd / 100).toFixed(2)}!\n\nThe money has been added to your wallet.`
          );
        } else {
          Alert.alert(
            'Task Complete! 🎉',
            `You earned $${(earningsToAdd / 100).toFixed(2)}!\n\nThe money has been added to your wallet.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        console.error('[ActiveTunnelModal] endTunnel() returned null');
        
        // Show error message (web-compatible)
        if (Platform.OS === 'web') {
          window.alert('Error: Failed to complete the task. Please try again.');
        } else {
          Alert.alert(
            'Error',
            'Failed to complete the task. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('[ActiveTunnelModal] Error submitting task:', error);
      
      // Show error message (web-compatible)
      if (Platform.OS === 'web') {
        window.alert('Error: An error occurred while submitting the task.');
      } else {
        Alert.alert(
          'Error',
          'An error occurred while submitting the task.',
          [{ text: 'OK' }]
        );
      }
    }
    
    console.log('[ActiveTunnelModal] Logic executed');
  };
  
  // ========================================================================
  // FORMAT TIME
  // ========================================================================
  
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  // Don't render if not in ACTIVE mode
  if (appMode !== 'ACTIVE') {
    return null;
  }
  
  const earningsDisplay = (currentSessionEarnings / 100).toFixed(2);
  const payRateDisplay = ((activeTask?.payRate || 0) / 100).toFixed(2);
  
  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.container}>
        {/* Header with earnings bar */}
        <View style={styles.header}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>EARNING NOW</Text>
          </View>
          
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>Current Earnings</Text>
            <Text style={styles.earningsAmount}>${earningsDisplay}</Text>
            <Text style={styles.payRateText}>
              ${payRateDisplay}/min
            </Text>
          </View>
        </View>
        
        {/* Main content area */}
        <View style={styles.content}>
          {/* Pause overlay */}
          {isPaused && (
            <View style={styles.pausedOverlay}>
              <View style={styles.pausedCard}>
                <Text style={styles.pausedIcon}>⏸️</Text>
                <Text style={styles.pausedTitle}>Session Paused</Text>
                <Text style={styles.pausedDescription}>
                  Your timer is paused because the app is in the background.
                  Return to the app to continue earning.
                </Text>
              </View>
            </View>
          )}
          
          {/* Task information */}
          <View style={styles.taskSection}>
            <Text style={styles.taskLabel}>Active Task</Text>
            <Text style={styles.taskName}>{activeTask?.name}</Text>
            {activeTask?.description && (
              <Text style={styles.taskDescription}>
                {activeTask.description}
              </Text>
            )}
          </View>
          
          {/* Large Timer Display */}
          <View style={styles.timerSection}>
            <Text style={styles.timerLabel}>Time Elapsed</Text>
            <Text style={styles.timerDisplay}>{formatTime(elapsedSeconds)}</Text>
            {activeTask?.maxDuration && (
              <Text style={styles.maxDurationText}>
                Max: {activeTask.maxDuration} minutes
              </Text>
            )}
          </View>
          
          {/* Task work area placeholder */}
          <View style={styles.taskWorkArea}>
            <Text style={styles.workAreaText}>
              Complete your task and then click "Submit & Clock Out" below
            </Text>
          </View>
        </View>
        
        {/* Bottom action button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isPaused && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitAndClockOut}
            disabled={isPaused}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit & Clock Out</Text>
            <Text style={styles.submitButtonSubtext}>
              Earn ${earningsDisplay}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Header styles
  header: {
    backgroundColor: '#10b981', // Green
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  earningsContainer: {
    alignItems: 'center',
  },
  earningsLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 8,
  },
  earningsAmount: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  payRateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 4,
  },
  
  // Content styles
  content: {
    flex: 1,
    padding: 24,
  },
  
  // Paused overlay
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 24,
  },
  pausedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  pausedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  pausedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  pausedDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Task section
  taskSection: {
    marginBottom: 32,
  },
  taskLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  taskName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  
  // Timer section
  timerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 32,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#10b981',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  maxDurationText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  
  // Work area
  taskWorkArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  workAreaText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Footer
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  submitButtonSubtext: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
});

