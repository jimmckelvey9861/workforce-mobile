/**
 * WorkForce Mobile - Compliance Store
 * 
 * This Zustand store manages the global "Pay State" and enforces the
 * Active/Passive mode transition. It is the single source of truth for
 * whether the user is currently earning money.
 * 
 * CRITICAL COMPLIANCE RULES:
 * 1. Only ONE active session at a time
 * 2. Active mode MUST lock navigation (Tunnel UI)
 * 3. App backgrounding MUST pause the timer
 * 4. All time events MUST be captured with monotonic time
 */

import { create } from 'zustand';
import { AppMode, RemoteTask, TimeEntry, AppSession } from '../types';
import { TimeTruthService } from '../services/TimeTruthService';
import { v4 as uuidv4 } from 'uuid';

interface ComplianceState {
  // ========================================================================
  // STATE
  // ========================================================================
  
  /** Current application mode: PASSIVE (viewing only) or ACTIVE (earning) */
  appMode: AppMode;
  
  /** Current session earnings in cents */
  currentSessionEarnings: number;
  
  /** The active remote task being performed (null if not in active mode) */
  activeTask: RemoteTask | null;
  
  /** The current time entry being recorded (null if not clocked in) */
  currentTimeEntry: TimeEntry | null;
  
  /** Whether the timer is paused (due to app backgrounding) */
  isPaused: boolean;
  
  /** When the timer was paused (ISO 8601) */
  pausedAt: string | null;
  
  /** Total accumulated pause duration in milliseconds */
  totalPauseDuration: number;
  
  /** Session start time (ISO 8601) */
  sessionStartTime: string | null;
  
  /** Monotonic start time (milliseconds since boot) */
  monotonicSessionStart: number | null;
  
  // ========================================================================
  // ACTIONS
  // ========================================================================
  
  /**
   * Start a paid tunnel session for a remote task.
   * This transitions the app to ACTIVE mode and locks navigation.
   * 
   * @param task - The remote task to perform
   * @param userId - The current user's ID
   * @returns The created TimeEntry or null if failed
   */
  startTunnel: (task: RemoteTask, userId: string) => Promise<TimeEntry | null>;
  
  /**
   * End the current tunnel session.
   * This transitions the app back to PASSIVE mode and unlocks navigation.
   * 
   * @returns The completed TimeEntry or null if failed
   */
  endTunnel: () => Promise<TimeEntry | null>;
  
  /**
   * Pause the current session (called when app goes to background).
   * The timer stops but the session remains active.
   */
  pauseSession: () => void;
  
  /**
   * Resume the current session (called when app returns to foreground).
   * The timer resumes from where it was paused.
   */
  resumeSession: () => void;
  
  /**
   * Calculate current earnings based on elapsed time and pay rate.
   * This is called periodically to update the UI.
   */
  updateEarnings: () => void;
  
  /**
   * Force-end the session (emergency use only).
   * This should be used if the app crashes or encounters an error.
   */
  forceEndSession: () => Promise<void>;
  
  /**
   * Reset the store to initial state.
   */
  reset: () => void;
}

/**
 * INTERACTION WITH REACT NATIVE AppState:
 * 
 * This store MUST be connected to React Native's AppState API in the root
 * component (App.tsx). When AppState changes:
 * 
 * - 'active' -> 'background' or 'inactive': Call pauseSession()
 * - 'background' or 'inactive' -> 'active': Call resumeSession()
 * 
 * This ensures that users cannot earn money while the app is backgrounded,
 * which is a critical compliance requirement.
 * 
 * Example integration:
 * 
 * ```typescript
 * useEffect(() => {
 *   const subscription = AppState.addEventListener('change', (nextAppState) => {
 *     if (nextAppState.match(/inactive|background/)) {
 *       complianceStore.getState().pauseSession();
 *     } else if (nextAppState === 'active') {
 *       complianceStore.getState().resumeSession();
 *     }
 *   });
 *   return () => subscription.remove();
 * }, []);
 * ```
 */

export const useComplianceStore = create<ComplianceState>((set, get) => ({
  // ========================================================================
  // INITIAL STATE
  // ========================================================================
  
  appMode: 'PASSIVE',
  currentSessionEarnings: 0,
  activeTask: null,
  currentTimeEntry: null,
  isPaused: false,
  pausedAt: null,
  totalPauseDuration: 0,
  sessionStartTime: null,
  monotonicSessionStart: null,
  
  // ========================================================================
  // ACTION IMPLEMENTATIONS
  // ========================================================================
  
  startTunnel: async (task: RemoteTask, userId: string) => {
    const state = get();
    
    // Prevent starting a new session if one is already active
    if (state.appMode === 'ACTIVE' || state.currentTimeEntry) {
      console.error('[ComplianceStore] Cannot start tunnel: session already active');
      return null;
    }
    
    try {
      // Capture time event with monotonic time
      const timeEvent = await TimeTruthService.captureTimeEvent('CLOCK_IN');
      
      // Create the time entry
      const timeEntry: TimeEntry = {
        id: uuidv4(),
        userId,
        startTime: timeEvent.wallClockTime,
        endTime: null,
        type: 'REMOTE_TASK',
        monotonicStart: timeEvent.monotonicTime,
        monotonicEnd: null,
        deviceBootTime: timeEvent.deviceBootTime,
        deviceId: timeEvent.deviceId,
        isSynced: false,
        syncAttempts: 0,
        lastSyncAttempt: null,
        remoteTaskId: task.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Queue the time entry for offline sync
      await TimeTruthService.queueTimeEntry(timeEntry);
      
      // Update state
      set({
        appMode: 'ACTIVE',
        activeTask: task,
        currentTimeEntry: timeEntry,
        currentSessionEarnings: 0,
        sessionStartTime: timeEvent.wallClockTime,
        monotonicSessionStart: timeEvent.monotonicTime,
        isPaused: false,
        pausedAt: null,
        totalPauseDuration: 0,
      });
      
      console.log('[ComplianceStore] Tunnel started:', {
        taskId: task.id,
        taskName: task.name,
        payRate: task.payRate,
        startTime: timeEvent.wallClockTime,
      });
      
      return timeEntry;
    } catch (error) {
      console.error('[ComplianceStore] Failed to start tunnel:', error);
      return null;
    }
  },
  
  endTunnel: async () => {
    const state = get();
    
    if (state.appMode !== 'ACTIVE' || !state.currentTimeEntry || !state.activeTask) {
      console.error('[ComplianceStore] Cannot end tunnel: no active session');
      return null;
    }
    
    try {
      // Capture end time event
      const timeEvent = await TimeTruthService.captureTimeEvent('CLOCK_OUT');
      
      // Calculate final earnings
      const elapsedMs = timeEvent.monotonicTime - state.monotonicSessionStart!;
      const elapsedMinutes = (elapsedMs - state.totalPauseDuration) / 60000;
      const earnings = Math.floor(elapsedMinutes * state.activeTask.payRate);
      
      // Update the time entry
      const completedEntry: TimeEntry = {
        ...state.currentTimeEntry,
        endTime: timeEvent.wallClockTime,
        monotonicEnd: timeEvent.monotonicTime,
        updatedAt: new Date().toISOString(),
      };
      
      // Update in offline queue
      await TimeTruthService.updateTimeEntry(completedEntry);
      
      // Reset to passive mode
      set({
        appMode: 'PASSIVE',
        activeTask: null,
        currentTimeEntry: null,
        currentSessionEarnings: earnings,
        isPaused: false,
        pausedAt: null,
        totalPauseDuration: 0,
        sessionStartTime: null,
        monotonicSessionStart: null,
      });
      
      console.log('[ComplianceStore] Tunnel ended:', {
        duration: elapsedMinutes.toFixed(2),
        earnings: earnings / 100,
        timeEntryId: completedEntry.id,
      });
      
      return completedEntry;
    } catch (error) {
      console.error('[ComplianceStore] Failed to end tunnel:', error);
      return null;
    }
  },
  
  pauseSession: () => {
    const state = get();
    
    if (state.appMode !== 'ACTIVE' || state.isPaused) {
      return;
    }
    
    set({
      isPaused: true,
      pausedAt: new Date().toISOString(),
    });
    
    console.log('[ComplianceStore] Session paused (app backgrounded)');
  },
  
  resumeSession: () => {
    const state = get();
    
    if (state.appMode !== 'ACTIVE' || !state.isPaused || !state.pausedAt) {
      return;
    }
    
    // Calculate pause duration
    const pauseDuration = Date.now() - new Date(state.pausedAt).getTime();
    
    set({
      isPaused: false,
      pausedAt: null,
      totalPauseDuration: state.totalPauseDuration + pauseDuration,
    });
    
    console.log('[ComplianceStore] Session resumed:', {
      pauseDuration: (pauseDuration / 1000).toFixed(2) + 's',
      totalPauseDuration: ((state.totalPauseDuration + pauseDuration) / 1000).toFixed(2) + 's',
    });
  },
  
  updateEarnings: () => {
    const state = get();
    
    if (state.appMode !== 'ACTIVE' || !state.activeTask || !state.monotonicSessionStart || state.isPaused) {
      return;
    }
    
    // Calculate elapsed time (excluding pauses)
    const now = Date.now();
    const sessionStart = new Date(state.sessionStartTime!).getTime();
    const elapsedMs = now - sessionStart - state.totalPauseDuration;
    const elapsedMinutes = elapsedMs / 60000;
    
    // Calculate earnings
    const earnings = Math.floor(elapsedMinutes * state.activeTask.payRate);
    
    set({ currentSessionEarnings: earnings });
  },
  
  forceEndSession: async () => {
    const state = get();
    
    console.warn('[ComplianceStore] Force-ending session');
    
    if (state.currentTimeEntry) {
      try {
        const timeEvent = await TimeTruthService.captureTimeEvent('FORCE_CLOCK_OUT');
        
        const completedEntry: TimeEntry = {
          ...state.currentTimeEntry,
          endTime: timeEvent.wallClockTime,
          monotonicEnd: timeEvent.monotonicTime,
          updatedAt: new Date().toISOString(),
        };
        
        await TimeTruthService.updateTimeEntry(completedEntry);
      } catch (error) {
        console.error('[ComplianceStore] Failed to force-end session:', error);
      }
    }
    
    get().reset();
  },
  
  reset: () => {
    set({
      appMode: 'PASSIVE',
      currentSessionEarnings: 0,
      activeTask: null,
      currentTimeEntry: null,
      isPaused: false,
      pausedAt: null,
      totalPauseDuration: 0,
      sessionStartTime: null,
      monotonicSessionStart: null,
    });
    
    console.log('[ComplianceStore] Store reset');
  },
}));

/**
 * Selector hooks for common state access patterns
 */
export const useIsActive = () => useComplianceStore((state) => state.appMode === 'ACTIVE');
export const useCurrentEarnings = () => useComplianceStore((state) => state.currentSessionEarnings);
export const useActiveTask = () => useComplianceStore((state) => state.activeTask);
export const useIsPaused = () => useComplianceStore((state) => state.isPaused);
