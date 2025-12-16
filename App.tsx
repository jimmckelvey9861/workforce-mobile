/**
 * WorkForce Mobile - Main Application Entry Point
 * 
 * This is the root component that:
 * 1. Wraps the app with the ActiveTaskTunnel for compliance enforcement
 * 2. Provides the navigation structure based on user authentication
 * 3. Manages AppState changes to pause/resume active sessions
 * 4. Renders the ActiveTunnelModal on top of all navigation
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { ActiveTaskTunnel } from './src/components/tunnel/ActiveTaskTunnel';
import { ActiveTunnelModal } from './src/components/compliance/ActiveTunnelModal';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useComplianceStore } from './src/store/complianceStore';
import { useUserStore } from './src/store/userStore';

export default function App() {
  const { pauseSession, resumeSession, appMode } = useComplianceStore();
  const { user, isLoading, setUser, setLoading } = useUserStore();
  
  // ========================================================================
  // AUTHENTICATION CHECK
  // ========================================================================
  
  useEffect(() => {
    // TODO: Check for stored authentication token
    // TODO: Validate token with backend
    // TODO: Load user data
    
    // For now, simulate loading
    const checkAuth = async () => {
      try {
        // Simulate auth check
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // TODO: Replace with actual auth logic
        // setUser(authenticatedUser);
        
        setLoading(false);
      } catch (error) {
        console.error('[App] Auth check failed:', error);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [setLoading]);
  
  // ========================================================================
  // APP STATE MONITORING FOR COMPLIANCE
  // ========================================================================
  
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        // Only handle state changes if in active mode
        if (appMode === 'ACTIVE') {
          if (nextAppState.match(/inactive|background/)) {
            console.log('[App] App backgrounded - pausing compliance session');
            pauseSession();
          } else if (nextAppState === 'active') {
            console.log('[App] App foregrounded - resuming compliance session');
            resumeSession();
          }
        }
      }
    );
    
    return () => {
      subscription.remove();
    };
  }, [appMode, pauseSession, resumeSession]);
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <>
      <StatusBar style="auto" />
      <ActiveTaskTunnel>
        <RootNavigator user={user} isLoading={isLoading} />
      </ActiveTaskTunnel>
      {/* Active Tunnel Modal - sits above all navigation */}
      <ActiveTunnelModal />
    </>
  );
}
