/**
 * WorkForce Mobile - Next Shift Card
 * 
 * Displays information about the user's upcoming shift.
 * Shows date, time, role, and location in a clean card format.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shift } from '../../types';

interface NextShiftCardProps {
  shift: Shift;
}

export const NextShiftCard: React.FC<NextShiftCardProps> = ({ shift }) => {
  /**
   * Format date as "Monday, Dec 13"
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  /**
   * Format time as "9:00 AM - 5:00 PM"
   */
  const formatTimeRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    return `${formatTime(startDate)} - ${formatTime(endDate)}`;
  };

  /**
   * Calculate hours between start and end time
   */
  const calculateHours = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10; // Round to 1 decimal
  };

  const hours = calculateHours(shift.startTime, shift.endTime);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Next Shift</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{hours}h</Text>
        </View>
      </View>

      {/* Date */}
      <View style={styles.row}>
        <Text style={styles.icon}>📅</Text>
        <View style={styles.rowContent}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{formatDate(shift.startTime)}</Text>
        </View>
      </View>

      {/* Time */}
      <View style={styles.row}>
        <Text style={styles.icon}>🕐</Text>
        <View style={styles.rowContent}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>
            {formatTimeRange(shift.startTime, shift.endTime)}
          </Text>
        </View>
      </View>

      {/* Status */}
      <View style={styles.row}>
        <Text style={styles.icon}>✅</Text>
        <View style={styles.rowContent}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{shift.status}</Text>
        </View>
      </View>

      {/* Notes */}
      {shift.notes && (
        <View style={styles.row}>
          <Text style={styles.icon}>📝</Text>
          <View style={styles.rowContent}>
            <Text style={styles.label}>Details</Text>
            <Text style={styles.value}>{shift.notes}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  rowContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    lineHeight: 22,
  },
});
