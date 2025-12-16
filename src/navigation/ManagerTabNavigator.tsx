/**
 * WorkForce Mobile - Manager Tab Navigator
 * 
 * Bottom tab navigation for manager users.
 * Provides access to:
 * - Triage Dashboard (Urgent actions)
 * - Roster (Team management)
 * - Panic Button (Emergency alerts)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================

export type ManagerTabParamList = {
  TriageDashboard: undefined;
  Roster: undefined;
  PanicButton: undefined;
};

const Tab = createBottomTabNavigator<ManagerTabParamList>();

// ============================================================================
// PLACEHOLDER SCREENS
// ============================================================================

const TriageDashboardScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Triage Dashboard</Text>
    <Text style={styles.subtitle}>
      • Pending shift trades{'\n'}
      • Time-off requests{'\n'}
      • Compliance violations{'\n'}
      • Urgent notifications
    </Text>
  </View>
);

const RosterScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Team Roster</Text>
    <Text style={styles.subtitle}>
      • View all employees{'\n'}
      • Manage schedules{'\n'}
      • Track attendance{'\n'}
      • Performance metrics
    </Text>
  </View>
);

const PanicButtonScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Panic Button</Text>
    <Text style={styles.subtitle}>
      • Emergency alerts{'\n'}
      • Broadcast messages{'\n'}
      • Critical notifications{'\n'}
      • Incident reporting
    </Text>
  </View>
);

// ============================================================================
// NAVIGATOR
// ============================================================================

export const ManagerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tab.Screen
        name="TriageDashboard"
        component={TriageDashboardScreen}
        options={{
          title: 'Triage',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>⚡</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Roster"
        component={RosterScreen}
        options={{
          title: 'Roster',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="PanicButton"
        component={PanicButtonScreen}
        options={{
          title: 'Panic',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🚨</Text>
          ),
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
  },
});
