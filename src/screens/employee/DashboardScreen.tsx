/**
 * WorkForce Mobile - Employee Dashboard Screen
 * 
 * Main dashboard for employees showing:
 * - Welcome message
 * - Next shift information
 * - Earnings wallet summary
 * - Available tasks/surveys
 * 
 * FEATURES:
 * - Start compliance tasks (enters ACTIVE mode)
 * - View upcoming shifts
 * - Track earnings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useComplianceStore } from '../../store/complianceStore';
import { useUserStore } from '../../store/userStore';
import { NextShiftCard } from '../../components/dashboard/NextShiftCard';
import { Shift, RemoteTask } from '../../types';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { startTunnel, appMode } = useComplianceStore();
  const { user } = useUserStore();
  const [isStartingTask, setIsStartingTask] = useState(false);

  // Mock user data
  const userName = user?.firstName || 'Alex';
  
  // Get greeting based on time of day
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Mock next shift data
  const nextShift: Shift = {
    id: 'shift-001',
    userId: user?.id || 'user-001',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // +8 hours
    breakMinutes: 30,
    isTradeable: true,
    status: 'SCHEDULED',
    locationId: 'location-001',
    notes: 'Warehouse Associate - Distribution Center - Building A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Get actual user balance from store (in cents, convert to dollars)
  const availableEarnings = (user?.currentBalance || 0) / 100;
  
  // Debug logging
  console.log('[Dashboard] Rendering balance:', {
    userBalanceCents: user?.currentBalance,
    availableEarningsDollars: availableEarnings,
    formattedBalance: `$${availableEarnings.toFixed(2)}`,
  });

  // Mock task data - converted to RemoteTask format
  const availableTasks: RemoteTask[] = [
    {
      id: 'task-001',
      name: 'Safety Survey',
      description: 'Complete workplace safety assessment',
      type: 'SURVEY',
      payRate: 25, // 25 cents per minute = $0.75 for 3 minutes
      maxDuration: 5,
      estimatedDuration: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-002',
      name: 'Equipment Check',
      description: 'Verify equipment condition',
      type: 'OTHER',
      payRate: 25, // 25 cents per minute = $1.25 for 5 minutes
      maxDuration: 10,
      estimatedDuration: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-003',
      name: 'Training Module',
      description: 'Watch safety training video',
      type: 'TRAINING',
      payRate: 25, // 25 cents per minute = $2.50 for 10 minutes
      maxDuration: 15,
      estimatedDuration: 10,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  /**
   * Handle starting a compliance task
   */
  const handleStartTask = async (task: RemoteTask) => {
    if (appMode === 'ACTIVE') {
      Alert.alert(
        'Task Already Active',
        'You already have an active task. Please complete it before starting a new one.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user) {
      Alert.alert(
        'Error',
        'You must be logged in to start a task.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsStartingTask(true);

    try {
      // Calculate expected earnings
      const expectedEarnings = (task.estimatedDuration * task.payRate) / 100;

      // Start the compliance tunnel - THIS IS THE CORRECT WAY
      const timeEntry = await startTunnel(task, user.id);

      if (timeEntry) {
        Alert.alert(
          'Task Started! 🎯',
          `You are now earning money! Complete "${task.name}" to earn approximately $${expectedEarnings.toFixed(2)}.`,
          [{ text: 'Start Working' }]
        );
      } else {
        throw new Error('Failed to start tunnel');
      }
    } catch (error) {
      console.error('[DashboardScreen] Failed to start task:', error);
      Alert.alert(
        'Error',
        'Failed to start task. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsStartingTask(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        {/* Next Shift Section */}
        <View style={styles.section}>
          <NextShiftCard shift={nextShift} />
        </View>

        {/* Schedule Availability Section */}
        {Platform.OS === 'web' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗓️ Availability</Text>
            <Text style={styles.sectionSubtitle}>
              Set your preferred and available working hours
            </Text>
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => navigation.navigate('ScheduleCanvas' as never)}
              activeOpacity={0.8}
            >
              <View style={styles.scheduleButtonContent}>
                <Text style={styles.scheduleButtonEmoji}>🗓️</Text>
                <View style={styles.scheduleButtonText}>
                  <Text style={styles.scheduleButtonTitle}>Schedule Demo</Text>
                  <Text style={styles.scheduleButtonSubtitle}>
                    Set your weekly availability
                  </Text>
                </View>
              </View>
              <Text style={styles.scheduleButtonArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Earnings Wallet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Wallet</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsContent}>
              <Text style={styles.earningsLabel}>Available Balance</Text>
              <Text style={styles.earningsAmount}>
                ${availableEarnings.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity style={styles.withdrawButton}>
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Tasks</Text>
          <Text style={styles.sectionSubtitle}>
            Complete tasks to earn instant rewards
          </Text>

          {availableTasks.map((task) => {
            // Get icon based on task type
            const getTaskIcon = () => {
              switch (task.type) {
                case 'SURVEY': return '✅';
                case 'TRAINING': return '📚';
                case 'CERTIFICATION': return '🎓';
                default: return '🔧';
              }
            };

            // Calculate expected earnings
            const expectedEarnings = (task.estimatedDuration * task.payRate) / 100;

            return (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskIcon}>{getTaskIcon()}</Text>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.name}</Text>
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  </View>
                </View>

                <View style={styles.taskFooter}>
                  <View style={styles.taskMeta}>
                    <View style={styles.taskMetaItem}>
                      <Text style={styles.taskMetaIcon}>⏱️</Text>
                      <Text style={styles.taskMetaText}>{task.estimatedDuration} min</Text>
                    </View>
                    <View style={styles.taskMetaItem}>
                      <Text style={styles.taskMetaIcon}>💰</Text>
                      <Text style={styles.taskMetaText}>
                        ${expectedEarnings.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.taskMetaItem}>
                      <Text style={styles.taskMetaIcon}>📊</Text>
                      <Text style={styles.taskMetaText}>
                        ${(task.payRate / 100).toFixed(2)}/min
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.startButton,
                      (isStartingTask || appMode === 'ACTIVE') && styles.startButtonDisabled,
                    ]}
                    onPress={() => handleStartTask(task)}
                    disabled={isStartingTask || appMode === 'ACTIVE'}
                  >
                    <Text style={styles.startButtonText}>
                      {appMode === 'ACTIVE' ? 'In Progress' : 'Start'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Active Session Notice */}
        {appMode === 'ACTIVE' && (
          <View style={styles.activeNotice}>
            <Text style={styles.activeNoticeIcon}>⚡</Text>
            <Text style={styles.activeNoticeText}>
              You have an active task in progress. Complete it to earn your reward!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '400',
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsContent: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#34C759',
  },
  withdrawButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  taskIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMetaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  taskMetaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  startButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  activeNotice: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  activeNoticeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activeNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  scheduleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  scheduleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduleButtonEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  scheduleButtonText: {
    flex: 1,
  },
  scheduleButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scheduleButtonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  scheduleButtonArrow: {
    fontSize: 32,
    color: '#999',
    fontWeight: '300',
  },
});
