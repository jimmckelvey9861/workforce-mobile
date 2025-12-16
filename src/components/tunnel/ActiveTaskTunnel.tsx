/**
 * WorkForce Mobile - Active Task Tunnel Component
 * 
 * This component creates a "tunnel" experience that locks the user into
 * the current paid task. It overlays the entire screen and prevents navigation
 * until the task is completed.
 * 
 * COMPLIANCE FEATURES:
 * - Blocks hardware back button (Android)
 * - Hides navigation header
 * - Shows persistent earnings timer
 * - Displays pause overlay when app is backgrounded
 * - Prevents screen timeout during active sessions
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  BackHandler,
  AppState,
  AppStateStatus,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useComplianceStore } from '../../store/complianceStore';

// ============================================================================
// TYPES
// ============================================================================

interface ActiveTaskTunnelProps {
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ActiveTaskTunnel: React.FC<ActiveTaskTunnelProps> = ({ children }) => {
  const {
    appMode,
    activeTask,
    currentSessionEarnings,
    isPaused,
    updateEarnings,
    pauseSession,
    resumeSession,
    endTunnel,
  } = useComplianceStore();
  
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const earningsInterval = useRef<NodeJS.Timeout | null>(null);
  
  // ========================================================================
  // APP STATE MONITORING
  // ========================================================================
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Detect app going to background
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('[ActiveTaskTunnel] App backgrounded - pausing session');
        pauseSession();
      }
      
      // Detect app returning to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[ActiveTaskTunnel] App foregrounded - resuming session');
        resumeSession();
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [pauseSession, resumeSession]);
  
  // ========================================================================
  // EARNINGS TIMER
  // ========================================================================
  
  useEffect(() => {
    if (appMode === 'ACTIVE' && !isPaused) {
      // Update earnings every second
      earningsInterval.current = setInterval(() => {
        updateEarnings();
      }, 1000);
      
      return () => {
        if (earningsInterval.current) {
          clearInterval(earningsInterval.current);
        }
      };
    } else {
      if (earningsInterval.current) {
        clearInterval(earningsInterval.current);
      }
    }
  }, [appMode, isPaused, updateEarnings]);
  
  // ========================================================================
  // ELAPSED TIME DISPLAY
  // ========================================================================
  
  useEffect(() => {
    if (appMode === 'ACTIVE') {
      const startTime = Date.now();
      
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [appMode]);
  
  // ========================================================================
  // HARDWARE BACK BUTTON BLOCKING (Android)
  // ========================================================================
  
  useEffect(() => {
    if (appMode === 'ACTIVE') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          // Block back button and show warning
          Alert.alert(
            'Task In Progress',
            'You must complete or cancel the current task before navigating away.',
            [{ text: 'OK' }]
          );
          return true; // Prevent default back behavior
        }
      );
      
      return () => backHandler.remove();
    }
  }, [appMode]);
  
  // ========================================================================
  // HANDLERS
  // ========================================================================
  
  const handleEndTask = () => {
    Alert.alert(
      'End Task',
      'Are you sure you want to end this task? Your earnings will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Task',
          style: 'destructive',
          onPress: async () => {
            await endTunnel();
          },
        },
      ]
    );
  };
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  // If not in active mode, just render children
  if (appMode !== 'ACTIVE') {
    return <>{children}</>;
  }
  
  // Format earnings for display
  const earningsDisplay = (currentSessionEarnings / 100).toFixed(2);
  
  return (
    <>
      {/* Render children in background */}
      <View style={styles.background}>{children}</View>
      
      {/* Full-screen tunnel overlay */}
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          // Prevent modal dismissal
          Alert.alert(
            'Task In Progress',
            'You must complete or cancel the current task before closing.',
            [{ text: 'OK' }]
          );
        }}
      >
        <View style={styles.container}>
          {/* Green earnings bar at top */}
          <View style={styles.earningsBar}>
            <View style={styles.earningsContent}>
              <View>
                <Text style={styles.earningsLabel}>Current Earnings</Text>
                <Text style={styles.earningsAmount}>${earningsDisplay}</Text>
              </View>
              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>Time</Text>
                <Text style={styles.timerText}>{elapsedTime}</Text>
              </View>
            </View>
          </View>
          
          {/* Task content area */}
          <View style={styles.contentArea}>
            {isPaused ? (
              // Paused overlay
              <View style={styles.pausedOverlay}>
                <View style={styles.pausedCard}>
                  <Text style={styles.pausedTitle}>⏸️ Session Paused</Text>
                  <Text style={styles.pausedText}>
                    Your timer is paused because the app is in the background.
                  </Text>
                  <Text style={styles.pausedText}>
                    Return to the app to resume earning.
                  </Text>
                </View>
              </View>
            ) : (
              // Active task content
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{activeTask?.name}</Text>
                <Text style={styles.taskDescription}>
                  {activeTask?.description}
                </Text>
                
                <View style={styles.taskInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Pay Rate:</Text>
                    <Text style={styles.infoValue}>
                      ${((activeTask?.payRate || 0) / 100).toFixed(2)}/min
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Max Duration:</Text>
                    <Text style={styles.infoValue}>
                      {activeTask?.maxDuration} minutes
                    </Text>
                  </View>
                </View>
                
                {/* Task-specific content would go here */}
                <View style={styles.taskWorkArea}>
                  <Text style={styles.placeholderText}>
                    Task content will be rendered here based on task type
                    (survey, training, etc.)
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Bottom action bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEndTask}
              disabled={isPaused}
            >
              <Text style={styles.endButtonText}>End Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  earningsBar: {
    backgroundColor: '#10b981', // Green
    paddingTop: 50, // Account for status bar
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 4,
  },
  earningsAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
  timerLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 4,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  contentArea: {
    flex: 1,
  },
  pausedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pausedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
  },
  pausedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  pausedText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  taskContent: {
    flex: 1,
    padding: 20,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  taskInfo: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  taskWorkArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionBar: {
    padding: 20,
    paddingBottom: 34, // Account for home indicator on iOS
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  endButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Wrap your root navigator with the ActiveTaskTunnel component:
 * 
 * ```tsx
 * function App() {
 *   return (
 *     <ActiveTaskTunnel>
 *       <RootNavigator />
 *     </ActiveTaskTunnel>
 *   );
 * }
 * ```
 * 
 * The tunnel will automatically activate when the user starts a paid task
 * and will overlay the entire app until the task is completed.
 */
