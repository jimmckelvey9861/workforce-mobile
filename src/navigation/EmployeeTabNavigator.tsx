/**
 * WorkForce Mobile - Employee Tab Navigator
 * 
 * Bottom tab navigation for employee users.
 * Provides access to:
 * - Dashboard (Home)
 * - Schedule & Marketplace (Shift Trading)
 * - Wallet (Earnings & Pay Stubs)
 * 
 * FEATURES:
 * - PayStateHeader persists across all tabs
 * - Shows active session status globally
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DashboardScreen from '../screens/employee/DashboardScreen';
import MyShiftsScreen from '../screens/employee/MyShiftsScreen';
import ScheduleCanvasScreen from '../screens/employee/ScheduleCanvasScreen';
import ShiftDetailsScreen from '../screens/employee/ShiftDetailsScreen';
import { PayStateHeader } from '../components/compliance/PayStateHeader';

// ============================================================================
// TYPES
// ============================================================================

export type EmployeeTabParamList = {
  Dashboard: undefined;
  TimeClock: undefined;
  Schedule: undefined;
  Tasks: undefined;
  ScheduleCanvas: undefined; // Hidden screen accessed from Dashboard
  ShiftDetails: { shiftId: string }; // Hidden screen for shift details
};

const Tab = createBottomTabNavigator<EmployeeTabParamList>();

// ============================================================================
// PLACEHOLDER SCREENS
// ============================================================================

const TimeClockScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>⏰ Time Clock</Text>
    <Text style={styles.subtitle}>
      • Clock in / Clock out{'\n'}
      • View current shift{'\n'}
      • GPS verification{'\n'}
      • Compliance tracking
    </Text>
    <Text style={styles.note}>Coming soon!</Text>
  </View>
);

const TasksScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>✅ Tasks</Text>
    <Text style={styles.subtitle}>
      • Shift checklist{'\n'}
      • Photo verification{'\n'}
      • Task completion{'\n'}
      • Compliance tracking
    </Text>
    <Text style={styles.note}>Coming soon!</Text>
  </View>
);

// ============================================================================
// NAVIGATOR
// ============================================================================

export const EmployeeTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="TimeClock"
        component={TimeClockScreen}
        options={{
          title: 'Clock',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>⏰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={MyShiftsScreen}
        options={{
          title: 'My Shifts',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>✅</Text>
          ),
        }}
      />

      
      {/* Hidden screen: ScheduleCanvas (accessed from Dashboard) */}
      <Tab.Screen
        name="ScheduleCanvas"
        component={ScheduleCanvasScreen}
        options={{
          headerShown: false,
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
      
      {/* Hidden screen: ShiftDetails (accessed from anywhere) */}
      <Tab.Screen
        name="ShiftDetails"
        component={ShiftDetailsScreen}
        options={{
          headerShown: true,
          title: 'Shift Details',
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
    </Tab.Navigator>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 28,
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 12,
  },
});
