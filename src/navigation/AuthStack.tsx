/**
 * WorkForce Mobile - Auth Stack
 * 
 * Navigation stack for authentication flow.
 * Includes login, registration, and password reset screens.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import DevLoginScreen from '../screens/auth/DevLoginScreen';
import TruthTestScreen from '../screens/dev/TruthTestScreen';

// ============================================================================
// TYPES
// ============================================================================

export type AuthStackParamList = {
  DevLogin: undefined; // Development login screen
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  TruthTest: undefined; // Developer screen for testing anti-spoofing
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

// ============================================================================
// PLACEHOLDER SCREENS
// ============================================================================

const LoginScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Login Screen</Text>
    <Text style={styles.subtitle}>TODO: Implement login UI</Text>
  </View>
);

const RegisterScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Register Screen</Text>
    <Text style={styles.subtitle}>TODO: Implement registration UI</Text>
  </View>
);

const ForgotPasswordScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Forgot Password Screen</Text>
    <Text style={styles.subtitle}>TODO: Implement password reset UI</Text>
  </View>
);

// ============================================================================
// NAVIGATOR
// ============================================================================

export const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="DevLogin" // Start with Dev Login for easy testing
      screenOptions={{
        headerShown: false, // Hide header for cleaner dev login
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="DevLogin"
        component={DevLoginScreen}
        options={{ title: '🎭 Dev Login' }}
      />
      <Stack.Screen
        name="TruthTest"
        component={TruthTestScreen}
        options={{ 
          title: '🔒 Time Truth Test',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ 
          title: 'Sign In',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ 
          title: 'Create Account',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ 
          title: 'Reset Password',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
