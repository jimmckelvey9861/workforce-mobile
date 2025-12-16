/**
 * WorkForce Mobile - Dev Login Screen
 * 
 * Quick login screen for development/demo purposes.
 * Select a user persona to test different roles.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useUserStore } from '../../store/userStore';

const DEV_USERS = [
  {
    id: 'user-alex-001',
    name: 'Alex',
    role: 'EMPLOYEE' as const,
    title: 'Warehouse Associate',
    emoji: '📦',
    color: '#3b82f6',
  },
  {
    id: 'user-mike-001',
    name: 'Mike',
    role: 'EMPLOYEE' as const,
    title: 'Kitchen Staff',
    emoji: '👨‍🍳',
    color: '#10b981',
  },
  {
    id: 'user-sarah-001',
    name: 'Sarah',
    role: 'MANAGER' as const,
    title: 'Operations Manager',
    emoji: '👔',
    color: '#8b5cf6',
  },
];

export default function DevLoginScreen() {
  const setUser = useUserStore((state) => state.setUser);

  const handleLogin = (user: typeof DEV_USERS[0]) => {
    // Set the user in the store
    setUser({
      id: user.id,
      firstName: user.name,
      lastName: user.title.split(' ')[0], // e.g., "Warehouse" from "Warehouse Associate"
      role: user.role,
      email: `${user.name.toLowerCase()}@workforce.demo`,
      currentBalance: 0,
      companyId: 'demo-company-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Navigation will automatically switch to the appropriate stack
    // based on the user's role (EMPLOYEE/MANAGER)
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🎭 Dev Login</Text>
        <Text style={styles.subtitle}>Select a user to test</Text>
      </View>

      <View style={styles.userGrid}>
        {DEV_USERS.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={[styles.userCard, { borderColor: user.color }]}
            onPress={() => handleLogin(user)}
            activeOpacity={0.7}
          >
            <Text style={styles.userEmoji}>{user.emoji}</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userTitle}>{user.title}</Text>
            <View style={[styles.roleBadge, { backgroundColor: user.color }]}>
              <Text style={styles.roleText}>
                {user.role === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          👆 Tap any card to login instantly
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
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  userGrid: {
    gap: 20,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

