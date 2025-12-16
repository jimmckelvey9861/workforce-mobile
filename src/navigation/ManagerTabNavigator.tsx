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
import { Text } from 'react-native';
import TradeApprovalsScreen from '../screens/manager/TradeApprovalsScreen';
import RosterScreen from '../screens/manager/RosterScreen';
import PanicScreen from '../screens/manager/PanicScreen';

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
        component={TradeApprovalsScreen}
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>✓</Text>
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
        component={PanicScreen}
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
