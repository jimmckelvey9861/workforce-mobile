/**
 * WorkForce Mobile - Pay State Header
 * 
 * Global header that displays when the user is in an ACTIVE compliance tunnel.
 * Shows a live timer and session status.
 * 
 * BEHAVIOR:
 * - PASSIVE mode: Returns null (hidden)
 * - ACTIVE mode: Shows green banner with timer
 * - Persists across all navigation
 * - Timer updates every second
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useComplianceStore } from '../../store/complianceStore';

export const PayStateHeader: React.FC = () => {
  const { appMode, activeSession } = useComplianceStore();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update timer every second when in ACTIVE mode
  useEffect(() => {
    if (appMode !== 'ACTIVE' || !activeSession?.startTime) {
      setElapsedTime(0);
      return;
    }

    // Calculate initial elapsed time
    const calculateElapsed = () => {
      const start = new Date(activeSession.startTime).getTime();
      const now = Date.now();
      return Math.floor((now - start) / 1000); // seconds
    };

    // Set initial time
    setElapsedTime(calculateElapsed());

    // Update every second
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [appMode, activeSession?.startTime]);

  // Hide in PASSIVE mode
  if (appMode === 'PASSIVE') {
    return null;
  }

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>ACTIVE SESSION</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#34C759', // Green for active state
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
  },
});
