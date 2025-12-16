/**
 * WorkForce Mobile - Shift Details Screen
 * 
 * Shows details of a specific shift and allows trading.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useShiftStore } from '../../store/shiftStore';
import { useUserStore } from '../../store/userStore';

// Mock coworkers for demo
const MOCK_COWORKERS = [
  { id: 'user-mike-001', name: 'Mike', role: 'Kitchen Staff', emoji: '👨‍🍳' },
  { id: 'user-sarah-001', name: 'Sarah', role: 'Operations Manager', emoji: '👔' },
  { id: 'user-jessica-001', name: 'Jessica', role: 'Server', emoji: '🍽️' },
];

export default function ShiftDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { shiftId } = route.params as { shiftId: string };
  
  const user = useUserStore((state) => state.user);
  const shifts = useShiftStore((state) => state.shifts);
  const offerShift = useShiftStore((state) => state.offerShift);
  
  const [showCoworkerModal, setShowCoworkerModal] = useState(false);
  
  const shift = shifts.find((s) => s.id === shiftId);
  
  if (!shift) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Shift not found</Text>
      </View>
    );
  }
  
  const isMyShift = shift.userId === user?.id;
  const canOffer = isMyShift && shift.tradeStatus === 'NONE';
  const isPending = shift.tradeStatus === 'OFFERED' || shift.tradeStatus === 'ACCEPTED';
  
  // Format date and time
  const shiftDate = new Date(shift.startTime);
  const startTime = shiftDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = new Date(shift.endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dateStr = shiftDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  
  const handleOfferToCoworker = (coworkerId: string, coworkerName: string) => {
    if (!user) return;
    
    offerShift(shift.id, coworkerId, user.id);
    setShowCoworkerModal(false);
    
    Alert.alert(
      'Offer Sent!',
      `Your shift has been offered to ${coworkerName}. They will see it in their Trade Requests.`
    );
  };
  
  // Get trade status badge
  const getStatusBadge = () => {
    switch (shift.tradeStatus) {
      case 'OFFERED':
        return (
          <View style={[styles.badge, styles.badgeYellow]}>
            <Text style={styles.badgeText}>⏳ Pending Acceptance</Text>
          </View>
        );
      case 'ACCEPTED':
        return (
          <View style={[styles.badge, styles.badgeBlue]}>
            <Text style={styles.badgeText}>🔒 Waiting for Approval</Text>
          </View>
        );
      case 'APPROVED':
        return (
          <View style={[styles.badge, styles.badgeGreen]}>
            <Text style={styles.badgeText}>✅ Trade Approved</Text>
          </View>
        );
      default:
        return null;
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.role}>{shift.role}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        
        {/* Status Badge */}
        {getStatusBadge()}
        
        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>⏰ Time</Text>
            <Text style={styles.value}>{startTime} - {endTime}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>📍 Location</Text>
            <Text style={styles.value}>{shift.location}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>👤 Assigned To</Text>
            <Text style={styles.value}>{isMyShift ? 'You' : 'Other Employee'}</Text>
          </View>
          
          {shift.tradeTargetUserId && (
            <View style={styles.row}>
              <Text style={styles.label}>🔄 Offered To</Text>
              <Text style={styles.value}>
                {MOCK_COWORKERS.find((c) => c.id === shift.tradeTargetUserId)?.name || 'Coworker'}
              </Text>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        {canOffer && (
          <TouchableOpacity
            style={styles.offerButton}
            onPress={() => setShowCoworkerModal(true)}
          >
            <Text style={styles.offerButtonText}>🔄 Offer Swap</Text>
          </TouchableOpacity>
        )}
        
        {isPending && isMyShift && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your trade offer is pending. You'll be notified when there's an update.
            </Text>
          </View>
        )}
      </View>
      
      {/* Coworker Selection Modal */}
      <Modal
        visible={showCoworkerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCoworkerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Offer Shift To:</Text>
            <Text style={styles.modalSubtitle}>Select a coworker</Text>
            
            <View style={styles.coworkerList}>
              {MOCK_COWORKERS.filter((c) => c.id !== user?.id).map((coworker) => (
                <TouchableOpacity
                  key={coworker.id}
                  style={styles.coworkerCard}
                  onPress={() => handleOfferToCoworker(coworker.id, coworker.name)}
                >
                  <Text style={styles.coworkerEmoji}>{coworker.emoji}</Text>
                  <View style={styles.coworkerInfo}>
                    <Text style={styles.coworkerName}>{coworker.name}</Text>
                    <Text style={styles.coworkerRole}>{coworker.role}</Text>
                  </View>
                  <Text style={styles.coworkerArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCoworkerModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  role: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#6b7280',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: 16,
    color: '#6b7280',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  offerButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  offerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoBox: {
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  coworkerList: {
    marginBottom: 20,
  },
  coworkerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  coworkerEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  coworkerInfo: {
    flex: 1,
  },
  coworkerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  coworkerRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  coworkerArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});

