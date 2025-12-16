/**
 * WorkForce Mobile - Trade Approvals Screen (Manager)
 * 
 * Shows all pending shift trades waiting for manager approval.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useShiftStore } from '../../store/shiftStore';

export default function TradeApprovalsScreen() {
  const shifts = useShiftStore((state) => state.shifts);
  const approveTrade = useShiftStore((state) => state.approveTrade);
  const declineTrade = useShiftStore((state) => state.declineTrade);
  
  // Get all shifts waiting for approval
  const pendingApprovals = shifts.filter(
    (shift) => shift.tradeStatus === 'ACCEPTED'
  );
  
  const handleApprove = (shiftId: string, fromName: string, toName: string, role: string) => {
    Alert.alert(
      'Approve Trade?',
      `Transfer ${role} shift from ${fromName} to ${toName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            approveTrade(shiftId);
            Alert.alert(
              'Trade Approved! ✓',
              `The ${role} shift has been transferred to ${toName}.`
            );
          },
        },
      ]
    );
  };
  
  const handleDecline = (shiftId: string, role: string) => {
    Alert.alert(
      'Decline Trade?',
      `This will cancel the trade request for the ${role} shift.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            declineTrade(shiftId);
            Alert.alert('Trade Declined', 'The trade request has been cancelled.');
          },
        },
      ]
    );
  };
  
  // Helper: Get user name from ID
  const getUserName = (userId?: string) => {
    if (!userId) return 'Unknown';
    if (userId.includes('alex')) return 'Alex';
    if (userId.includes('mike')) return 'Mike';
    if (userId.includes('sarah')) return 'Sarah';
    if (userId.includes('jessica')) return 'Jessica';
    return userId;
  };
  
  // Format date and time
  const formatShiftDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const formatShiftTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const end = new Date(endTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${start} - ${end}`;
  };
  
  if (pendingApprovals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>✅</Text>
        <Text style={styles.emptyTitle}>All Clear!</Text>
        <Text style={styles.emptyText}>
          No pending trade approvals at this time.
        </Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trade Approvals</Text>
        <Text style={styles.headerSubtitle}>
          {pendingApprovals.length} trade{pendingApprovals.length !== 1 ? 's' : ''} waiting for approval
        </Text>
      </View>
      
      {/* Pending Trades List */}
      {pendingApprovals.map((shift) => {
        const fromName = getUserName(shift.tradeInitiatorId);
        const toName = getUserName(shift.tradeTargetUserId);
        
        return (
          <View key={shift.id} style={styles.tradeCard}>
            {/* Trade Header */}
            <View style={styles.tradeHeader}>
              <Text style={styles.tradeRole}>{shift.role}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>PENDING</Text>
              </View>
            </View>
            
            {/* Trade Details */}
            <View style={styles.tradeInfo}>
              <Text style={styles.tradeParties}>
                {fromName} → {toName}
              </Text>
              <Text style={styles.tradeDate}>
                {formatShiftDate(shift.startTime)}
              </Text>
              <Text style={styles.tradeTime}>
                ⏰ {formatShiftTime(shift.startTime, shift.endTime)}
              </Text>
              <Text style={styles.tradeLocation}>
                📍 {shift.location}
              </Text>
            </View>
            
            {/* Timestamps */}
            {shift.tradeOfferedAt && (
              <Text style={styles.timestamp}>
                Offered: {new Date(shift.tradeOfferedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            )}
            {shift.tradeAcceptedAt && (
              <Text style={styles.timestamp}>
                Accepted: {new Date(shift.tradeAcceptedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            )}
            
            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDecline(shift.id, shift.role)}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(shift.id, fromName, toName, shift.role)}
              >
                <Text style={styles.approveButtonText}>✓ Approve Trade</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      
      {/* Help Text */}
      <View style={styles.helpBox}>
        <Text style={styles.helpText}>
          💡 Approving a trade transfers the shift to the new employee
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  tradeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeRole: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
  },
  tradeInfo: {
    marginBottom: 12,
  },
  tradeParties: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  tradeDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tradeTime: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  tradeLocation: {
    fontSize: 14,
    color: '#9ca3af',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  helpBox: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

