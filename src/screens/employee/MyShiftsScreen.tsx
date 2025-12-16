/**
 * WorkForce Mobile - My Shifts Screen
 * 
 * Lists all shifts belonging to the current user.
 * Allows navigation to shift details for trading.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShiftStore } from '../../store/shiftStore';
import { useUserStore } from '../../store/userStore';

export default function MyShiftsScreen() {
  const navigation = useNavigation();
  const user = useUserStore((state) => state.user);
  const shifts = useShiftStore((state) => state.shifts);
  const generateMockShifts = useShiftStore((state) => state.generateMockShifts);
  const getUserShifts = useShiftStore((state) => state.getUserShifts);
  const getPendingTrades = useShiftStore((state) => state.getPendingTrades);
  
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Generate mock shifts on first load if none exist
  useEffect(() => {
    if (user && shifts.length === 0) {
      console.log('[MyShifts] Generating mock shifts for user:', user.id);
      generateMockShifts(user.id);
    }
  }, [user, shifts.length, generateMockShifts]);
  
  const myShifts = user ? getUserShifts(user.id) : [];
  const pendingTrades = user ? getPendingTrades(user.id) : [];
  
  // Sort shifts by date
  const sortedShifts = [...myShifts].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);
  
  const handleShiftPress = (shiftId: string) => {
    navigation.navigate('ShiftDetails' as never, { shiftId } as never);
  };
  
  // Get status badge for shift
  const getStatusBadge = (shift: any) => {
    switch (shift.tradeStatus) {
      case 'OFFERED':
        return (
          <View style={[styles.badge, styles.badgeYellow]}>
            <Text style={styles.badgeText}>⏳ Pending</Text>
          </View>
        );
      case 'ACCEPTED':
        return (
          <View style={[styles.badge, styles.badgeBlue]}>
            <Text style={styles.badgeText}>🔒 Awaiting Approval</Text>
          </View>
        );
      case 'APPROVED':
        return (
          <View style={[styles.badge, styles.badgeGreen]}>
            <Text style={styles.badgeText}>✅ Traded</Text>
          </View>
        );
      default:
        return null;
    }
  };
  
  // Format shift display
  const formatShiftDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
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
  
  if (myShifts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📅</Text>
        <Text style={styles.emptyTitle}>No Shifts Yet</Text>
        <Text style={styles.emptyText}>
          Your scheduled shifts will appear here.
        </Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => user && generateMockShifts(user.id)}
        >
          <Text style={styles.generateButtonText}>Generate Demo Shifts</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Summary Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Shifts</Text>
        <Text style={styles.headerSubtitle}>
          {myShifts.length} shift{myShifts.length !== 1 ? 's' : ''} scheduled
        </Text>
        {pendingTrades.length > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>
              {pendingTrades.length} pending trade{pendingTrades.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
      
      {/* Shifts List */}
      {sortedShifts.map((shift) => (
        <TouchableOpacity
          key={shift.id}
          style={styles.shiftCard}
          onPress={() => handleShiftPress(shift.id)}
          activeOpacity={0.7}
        >
          <View style={styles.shiftHeader}>
            <View style={styles.shiftHeaderLeft}>
              <Text style={styles.shiftRole}>{shift.role}</Text>
              <Text style={styles.shiftDate}>{formatShiftDate(shift.startTime)}</Text>
            </View>
            {getStatusBadge(shift)}
          </View>
          
          <View style={styles.shiftDetails}>
            <View style={styles.shiftDetailRow}>
              <Text style={styles.shiftDetailIcon}>⏰</Text>
              <Text style={styles.shiftDetailText}>
                {formatShiftTime(shift.startTime, shift.endTime)}
              </Text>
            </View>
            
            <View style={styles.shiftDetailRow}>
              <Text style={styles.shiftDetailIcon}>📍</Text>
              <Text style={styles.shiftDetailText}>{shift.location}</Text>
            </View>
          </View>
          
          <View style={styles.shiftFooter}>
            <Text style={styles.tapToView}>Tap to view details ›</Text>
          </View>
        </TouchableOpacity>
      ))}
      
      {/* Help Text */}
      <View style={styles.helpBox}>
        <Text style={styles.helpText}>
          💡 Tap any shift to view details and offer trades with coworkers
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
    marginBottom: 8,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pendingBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  shiftCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shiftHeaderLeft: {
    flex: 1,
  },
  shiftRole: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  shiftDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeYellow: {
    backgroundColor: '#fef3c7',
  },
  badgeBlue: {
    backgroundColor: '#dbeafe',
  },
  badgeGreen: {
    backgroundColor: '#d1fae5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  shiftDetails: {
    marginBottom: 12,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftDetailIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  shiftDetailText: {
    fontSize: 16,
    color: '#6b7280',
  },
  shiftFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  tapToView: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'right',
  },
  helpBox: {
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#0c4a6e',
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
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

