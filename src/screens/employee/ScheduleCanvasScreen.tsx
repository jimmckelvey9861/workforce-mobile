/**
 * WorkForce Mobile - Schedule Canvas Screen
 * 
 * Wrapper screen for the ZoomableScheduleCanvas component.
 * Web-only feature - shows a placeholder on native platforms.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import the simple React Native version
import ScheduleCanvasSimple from '../../components/schedule/ScheduleCanvasSimple';
import { createEmptySchedule, SLOT_STATUS } from '../../types/availability';

export default function ScheduleCanvasScreen() {
  const navigation = useNavigation();
  const [availability, setAvailability] = useState(createEmptySchedule());

  const handleChange = (newAvailability: any) => {
    console.log('🔄 ScheduleCanvasScreen: onChange called');
    setAvailability(newAvailability);
    console.log('🔄 ScheduleCanvasScreen: state updated');
  };

  const handleSave = () => {
    // Calculate totals for the alert
    let preferredCount = 0;
    let availableCount = 0;

    availability.forEach((day) => {
      day.slots.forEach((slot) => {
        if (slot.status === SLOT_STATUS.PREFERRED) {
          preferredCount++;
        } else if (slot.status === SLOT_STATUS.AVAILABLE) {
          availableCount++;
        }
      });
    });

    const preferredHours = (preferredCount * 0.5).toFixed(1);
    const availableHours = (availableCount * 0.5).toFixed(1);
    const totalHours = ((preferredCount + availableCount) * 0.5).toFixed(1);

    const message = `Availability saved!\n\nPreferred: ${preferredHours} hrs\nAvailable: ${availableHours} hrs\nTotal: ${totalHours} hrs`;

    // Show alert
    Alert.alert('Schedule Saved', message);

    // Navigate back to Dashboard
    navigation.goBack();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScheduleCanvasSimple
        availability={availability}
        onChange={handleChange}
        onSave={handleSave}
        onBack={handleBack}
        companyName="WorkForce Mobile"
        location="Demo Location"
        hourlyRate={15.00}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

