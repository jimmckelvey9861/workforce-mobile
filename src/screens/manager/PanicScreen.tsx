/**
 * WorkForce Mobile - Panic Screen (Manager)
 * 
 * Emergency fill interface for last-minute staffing needs.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';

const ROLES = ['Barista', 'Cook', 'Server', 'Bartender', 'Host', 'Cashier'];
const START_TIMES = ['Now', '+1 Hour', '+2 Hours', '+4 Hours'];

export default function PanicScreen() {
  const [selectedRole, setSelectedRole] = useState('Barista');
  const [selectedStartTime, setSelectedStartTime] = useState('Now');
  const [bonusEnabled, setBonusEnabled] = useState(false);
  
  const handleBlastNotification = () => {
    const bonusText = bonusEnabled ? ' (+$50 bonus)' : '';
    const message = `Sending notification to 12 eligible staff...\n\nRole: ${selectedRole}\nStart: ${selectedStartTime}${bonusText}`;
    
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('🚨 Emergency Notification', message, [{ text: 'OK' }]);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🚨</Text>
        <Text style={styles.headerTitle}>Emergency Fill</Text>
        <Text style={styles.headerSubtitle}>Need staff ASAP? Blast a notification!</Text>
      </View>
      
      {/* Role Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Role Needed</Text>
        <View style={styles.optionsGrid}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.optionCard,
                selectedRole === role && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedRole(role)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedRole === role && styles.optionTextSelected,
                ]}
              >
                {role}
              </Text>
              {selectedRole === role && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Start Time */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Start Time</Text>
        <View style={styles.optionsGrid}>
          {START_TIMES.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.optionCard,
                selectedStartTime === time && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedStartTime(time)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedStartTime === time && styles.optionTextSelected,
                ]}
              >
                {time}
              </Text>
              {selectedStartTime === time && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Bonus Toggle */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.bonusToggle}
          onPress={() => setBonusEnabled(!bonusEnabled)}
          activeOpacity={0.7}
        >
          <View style={styles.bonusInfo}>
            <Text style={styles.bonusLabel}>💰 Offer Bonus?</Text>
            <Text style={styles.bonusSubtext}>
              {bonusEnabled ? '+$50 bonus included' : 'Increase response rate'}
            </Text>
          </View>
          
          <View style={[styles.switch, bonusEnabled && styles.switchActive]}>
            <View style={[styles.switchThumb, bonusEnabled && styles.switchThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Preview */}
      <View style={styles.previewBox}>
        <Text style={styles.previewTitle}>📱 Preview Notification</Text>
        <View style={styles.previewMessage}>
          <Text style={styles.previewMessageText}>
            <Text style={styles.previewBold}>🚨 URGENT: </Text>
            We need a <Text style={styles.previewBold}>{selectedRole}</Text> starting{' '}
            <Text style={styles.previewBold}>{selectedStartTime.toLowerCase()}</Text>
            {bonusEnabled && (
              <Text style={styles.previewBonus}> (+$50 bonus)</Text>
            )}
            . Tap to accept!
          </Text>
        </View>
      </View>
      
      {/* Blast Button */}
      <TouchableOpacity
        style={styles.blastButton}
        onPress={handleBlastNotification}
        activeOpacity={0.8}
      >
        <Text style={styles.blastButtonText}>🔔 BLAST NOTIFICATION</Text>
        <Text style={styles.blastButtonSubtext}>Send to 12 eligible staff</Text>
      </TouchableOpacity>
      
      {/* Help Text */}
      <View style={styles.helpBox}>
        <Text style={styles.helpText}>
          💡 <Text style={styles.helpBold}>Pro Tip:</Text> Notifications are sent to all available staff with the selected role. Staff can accept directly from their phone.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2f2', // Light red background
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderBottomWidth: 2,
    borderBottomColor: '#fecaca',
  },
  headerIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b91c1c',
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f1d1d',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCardSelected: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 16,
    color: '#ffffff',
  },
  bonusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  bonusInfo: {
    flex: 1,
  },
  bonusLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  bonusSubtext: {
    fontSize: 14,
    color: '#b91c1c',
  },
  switch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#22c55e',
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  previewBox: {
    margin: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  previewMessage: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 8,
  },
  previewMessageText: {
    fontSize: 16,
    color: '#78350f',
    lineHeight: 24,
  },
  previewBold: {
    fontWeight: '700',
  },
  previewBonus: {
    fontWeight: '700',
    color: '#22c55e',
  },
  blastButton: {
    margin: 16,
    marginTop: 24,
    backgroundColor: '#dc2626',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  blastButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  blastButtonSubtext: {
    fontSize: 14,
    color: '#fecaca',
  },
  helpBox: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: '600',
    color: '#111827',
  },
});

