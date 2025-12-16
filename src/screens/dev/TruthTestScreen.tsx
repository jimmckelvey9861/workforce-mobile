/**
 * WorkForce Mobile - Truth Test Screen
 * 
 * Developer screen to verify the anti-spoofing mechanism.
 * 
 * PURPOSE:
 * - Demonstrate that wall-clock time can be manipulated
 * - Prove that monotonic uptime continues linearly regardless of date changes
 * - Validate cryptographic signing of time captures
 * 
 * TESTING PROCEDURE:
 * 1. Launch this screen and observe both timers
 * 2. Click "Simulate Clock In" to capture a signed time entry
 * 3. Change your device's date/time in Settings
 * 4. Return to this screen
 * 5. Observe: Wall clock reflects the new time, but uptime continues counting
 * 6. Click "Simulate Clock In" again
 * 7. Compare the monotonic time difference vs wall-clock difference
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TimeTruthService, SignedTimeCapture } from '../../services/TimeTruthService';

// Conditionally import DeviceInfo only on native platforms
let DeviceInfo: any = null;
if (Platform.OS !== 'web') {
  DeviceInfo = require('react-native-device-info').default;
}

export default function TruthTestScreen() {
  // Live updating times
  const [wallClockTime, setWallClockTime] = useState<Date>(new Date());
  const [monotonicUptime, setMonotonicUptime] = useState<number | null>(null);
  
  // Captured time entries
  const [captures, setCaptures] = useState<SignedTimeCapture[]>([]);
  
  // Loading state
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * Update wall clock time every second
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setWallClockTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Update monotonic uptime every second
   */
  useEffect(() => {
    const updateUptime = async () => {
      try {
        if (Platform.OS === 'web') {
          // On web, we don't have real monotonic time
          setMonotonicUptime(Date.now());
        } else if (DeviceInfo) {
          const uptime = await DeviceInfo.getSystemUptime();
          // Convert seconds to milliseconds
          setMonotonicUptime(uptime * 1000);
        } else {
          setMonotonicUptime(null);
        }
      } catch (error) {
        console.error('Failed to get system uptime:', error);
        setMonotonicUptime(null);
      }
    };

    // Initial update
    updateUptime();

    // Update every second
    const interval = setInterval(updateUptime, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Simulate a clock-in event
   */
  const handleSimulateClockIn = useCallback(async () => {
    setIsCapturing(true);
    
    try {
      const capture = await TimeTruthService.captureCurrentTime('CLOCK_IN');
      
      // Validate the signature
      const isValid = await TimeTruthService.validateIntegrity(capture);
      
      if (!isValid) {
        Alert.alert(
          'Signature Validation Failed',
          'The captured time entry has an invalid signature!',
          [{ text: 'OK' }]
        );
      }
      
      // Add to captures list (newest first)
      setCaptures(prev => [capture, ...prev]);
      
      Alert.alert(
        'Clock In Captured',
        `Signature: ${isValid ? '✅ Valid' : '❌ Invalid'}\n\n` +
        `Wall Clock: ${capture.payload.timestamp}\n` +
        `Monotonic: ${formatUptime(capture.payload.monotonicTime)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to capture clock in:', error);
      Alert.alert(
        'Capture Failed',
        error instanceof Error ? error.message : 'Unknown error',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Clear all captured entries
   */
  const handleClearCaptures = useCallback(() => {
    Alert.alert(
      'Clear Captures',
      'Are you sure you want to clear all captured time entries?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => setCaptures([])
        },
      ]
    );
  }, []);

  /**
   * Format uptime in a human-readable format
   */
  const formatUptime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const h = hours % 24;
    const m = minutes % 60;
    const s = seconds % 60;

    if (days > 0) {
      return `${days}d ${h}h ${m}m ${s}s`;
    } else if (hours > 0) {
      return `${h}h ${m}m ${s}s`;
    } else if (minutes > 0) {
      return `${m}m ${s}s`;
    } else {
      return `${s}s`;
    }
  };

  /**
   * Format a date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  /**
   * Calculate time difference between two captures
   */
  const calculateDifference = (index: number): string | null => {
    if (index >= captures.length - 1) return null;

    const current = captures[index];
    const previous = captures[index + 1];

    const wallClockDiff = current.payload.userTime - previous.payload.userTime;
    const monotonicDiff = current.payload.monotonicTime - previous.payload.monotonicTime;

    const wallClockSec = Math.floor(wallClockDiff / 1000);
    const monotonicSec = Math.floor(monotonicDiff / 1000);

    const variance = Math.abs(wallClockDiff - monotonicDiff);
    const variancePercent = (variance / wallClockDiff) * 100;

    return `Wall: ${wallClockSec}s | Mono: ${monotonicSec}s | Variance: ${variancePercent.toFixed(1)}%`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔒 Time Truth Test</Text>
          <Text style={styles.subtitle}>
            Anti-Spoofing Verification Screen
          </Text>
        </View>

        {/* Web Mode Warning Banner */}
        {Platform.OS === 'web' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Running in Web Mode</Text>
              <Text style={styles.warningText}>
                Monotonic Security Disabled - Time can be manipulated in web browsers. 
                For production time-tracking, use native mobile apps.
              </Text>
            </View>
          </View>
        )}

        {/* Live Time Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Time Display</Text>
          
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>System Wall Clock</Text>
            <Text style={styles.timeValue}>
              {formatDate(wallClockTime)}
            </Text>
            <Text style={styles.timeNote}>
              ⚠️ Can be manipulated by changing device date
            </Text>
          </View>

          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>Monotonic Uptime</Text>
            <Text style={styles.timeValue}>
              {monotonicUptime !== null 
                ? formatUptime(monotonicUptime)
                : 'Loading...'}
            </Text>
            <Text style={styles.timeNote}>
              ✅ Cannot be manipulated - counts since device boot
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isCapturing && styles.buttonDisabled]}
            onPress={handleSimulateClockIn}
            disabled={isCapturing}
          >
            <Text style={styles.buttonText}>
              {isCapturing ? '⏳ Capturing...' : '⏰ Simulate Clock In'}
            </Text>
          </TouchableOpacity>

          {captures.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleClearCaptures}
            >
              <Text style={styles.buttonText}>
                🗑️ Clear Captures ({captures.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing Instructions</Text>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionStep}>
              1️⃣ Click "Simulate Clock In" to capture current time
            </Text>
            <Text style={styles.instructionStep}>
              2️⃣ Go to device Settings and change the date/time
            </Text>
            <Text style={styles.instructionStep}>
              3️⃣ Return to this screen
            </Text>
            <Text style={styles.instructionStep}>
              4️⃣ Notice: Wall clock changed, but uptime continued
            </Text>
            <Text style={styles.instructionStep}>
              5️⃣ Click "Simulate Clock In" again
            </Text>
            <Text style={styles.instructionStep}>
              6️⃣ Compare the variance between captures
            </Text>
          </View>
        </View>

        {/* Captured Entries */}
        {captures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Captured Time Entries ({captures.length})
            </Text>
            
            {captures.map((capture, index) => {
              const difference = calculateDifference(index);
              
              return (
                <View key={index} style={styles.captureCard}>
                  <View style={styles.captureHeader}>
                    <Text style={styles.captureIndex}>#{captures.length - index}</Text>
                    <Text style={styles.captureType}>{capture.payload.eventType}</Text>
                  </View>
                  
                  <View style={styles.captureRow}>
                    <Text style={styles.captureLabel}>Wall Clock:</Text>
                    <Text style={styles.captureValue}>
                      {new Date(capture.payload.userTime).toLocaleString()}
                    </Text>
                  </View>
                  
                  <View style={styles.captureRow}>
                    <Text style={styles.captureLabel}>Monotonic:</Text>
                    <Text style={styles.captureValue}>
                      {formatUptime(capture.payload.monotonicTime)}
                    </Text>
                  </View>
                  
                  <View style={styles.captureRow}>
                    <Text style={styles.captureLabel}>Device ID:</Text>
                    <Text style={styles.captureValue} numberOfLines={1}>
                      {capture.payload.deviceId.substring(0, 20)}...
                    </Text>
                  </View>
                  
                  <View style={styles.captureRow}>
                    <Text style={styles.captureLabel}>Signature:</Text>
                    <Text style={styles.captureValue} numberOfLines={1}>
                      {capture.signature.substring(0, 32)}...
                    </Text>
                  </View>

                  {difference && (
                    <View style={styles.differenceCard}>
                      <Text style={styles.differenceLabel}>
                        Δ from previous capture:
                      </Text>
                      <Text style={styles.differenceValue}>{difference}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {captures.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No captures yet. Click "Simulate Clock In" to start testing.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  timeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  timeNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionStep: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 20,
  },
  captureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  captureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  captureIndex: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  captureType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  captureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  captureLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  captureValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
  differenceCard: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  differenceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  differenceValue: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
