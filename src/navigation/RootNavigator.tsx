/**
 * WorkForce Mobile - Root Navigator
 * 
 * This is the main navigation structure that routes users to different
 * navigation stacks based on their authentication status and role.
 * 
 * NAVIGATION FLOW:
 * 1. Not authenticated -> AuthStack
 * 2. Authenticated as EMPLOYEE -> EmployeeTabNavigator
 * 3. Authenticated as MANAGER -> ManagerTabNavigator
 * 
 * FEATURES:
 * - PayStateHeader persists across all navigation
 * - Shows active compliance session status globally
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User } from '../types';
import { AuthStack } from './AuthStack';
import { EmployeeTabNavigator } from './EmployeeTabNavigator';
import { ManagerTabNavigator } from './ManagerTabNavigator';
import { PayStateHeader } from '../components/compliance/PayStateHeader';

// ============================================================================
// TYPES
// ============================================================================

export type RootStackParamList = {
  Auth: undefined;
  EmployeeApp: undefined;
  ManagerApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ============================================================================
// COMPONENT
// ============================================================================

interface RootNavigatorProps {
  user: User | null;
  isLoading?: boolean;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ user, isLoading }) => {
  // Show loading screen while checking auth
  if (isLoading) {
    return null; // TODO: Add loading screen component
  }
  
  return (
    <View style={styles.container}>
      {/* Global PayStateHeader - persists across all navigation */}
      <PayStateHeader />
      
      {/* Main Navigation */}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            // User is not authenticated
            <Stack.Screen name="Auth" component={AuthStack} />
          ) : user.role === 'EMPLOYEE' ? (
            // User is an employee
            <Stack.Screen name="EmployeeApp" component={EmployeeTabNavigator} />
          ) : (
            // User is a manager
            <Stack.Screen name="ManagerApp" component={ManagerTabNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
