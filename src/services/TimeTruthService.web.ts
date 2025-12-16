/**
 * WorkForce Mobile - Time Truth Service (WEB VERSION)
 * 
 * This is the WEB implementation of the Time Truth Service.
 * 
 * IMPORTANT: This version does NOT provide anti-spoofing protection!
 * - No monotonic time (not available in browsers)
 * - No cryptographic signing (simplified for web)
 * - Uses Date.now() for all timestamps
 * 
 * This is suitable for:
 * - Development and testing
 * - Internal tools where security is less critical
 * - Rapid prototyping
 * 
 * For production time-tracking with security requirements,
 * use the native mobile apps with the full anti-spoofing implementation.
 */

import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { TimeEntry, QueuedAction } from '../types';
import { OfflineQueueService } from './OfflineQueueService';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Web signature placeholder.
 * This is NOT a real cryptographic signature.
 */
const WEB_SIGNATURE = 'WEB_UNVERIFIED_SIGNATURE';

// ============================================================================
// TYPES
// ============================================================================

export type TimeEventType = 'CLOCK_IN' | 'CLOCK_OUT' | 'FORCE_CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';

/**
 * Signed time capture payload (Web version).
 * Note: This does NOT provide real security on web.
 */
export interface SignedTimeCapture {
  payload: {
    userTime: number;        // Wall-clock time (Date.now())
    monotonicTime: number;   // Same as userTime on web (no monotonic time available)
    eventType: TimeEventType;
    deviceId: string;
    timestamp: string;       // ISO 8601 for human readability
  };
  signature: string;         // Always "WEB_UNVERIFIED_SIGNATURE"
}

export interface TimeEvent {
  eventType: TimeEventType;
  wallClockTime: string; // ISO 8601
  monotonicTime: number; // Same as wall clock on web
  deviceBootTime: string; // Not available on web
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

export interface MonotonicTimeInfo {
  uptime: number; // Not available on web, returns 0
  bootTime: string; // Not available on web
}

// ============================================================================
// WEB TIME HELPERS
// ============================================================================

/**
 * Get the current time (web version).
 * Since browsers don't provide system uptime, we just return Date.now().
 * 
 * @returns Current timestamp in milliseconds
 */
async function getMonotonicTime(): Promise<number> {
  // Web doesn't have monotonic time, so we use Date.now()
  return Date.now();
}

/**
 * Calculate boot time (web version).
 * Not applicable on web, returns current time.
 * 
 * @param uptime - Ignored on web
 * @returns Current ISO 8601 timestamp
 */
function calculateBootTime(uptime: number): string {
  return new Date().toISOString();
}

/**
 * Get monotonic time information (web version).
 * Returns current time since we don't have real monotonic time.
 * 
 * @returns MonotonicTimeInfo object with current time
 */
export async function getMonotonicTimeInfo(): Promise<MonotonicTimeInfo> {
  const now = Date.now();
  
  return {
    uptime: 0, // Not available on web
    bootTime: new Date().toISOString(),
  };
}

// ============================================================================
// DEVICE IDENTIFICATION
// ============================================================================

/**
 * Get a unique identifier for this browser session.
 * 
 * @returns Browser session identifier
 */
async function getDeviceId(): Promise<string> {
  try {
    // Try to get a persistent ID from localStorage
    let deviceId = localStorage.getItem('workforce_device_id');
    
    if (!deviceId) {
      // Generate a new ID and store it
      deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('workforce_device_id', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('[TimeTruthService.web] Failed to get device ID:', error);
    return 'web_unknown';
  }
}

/**
 * Get browser information.
 * 
 * @returns Browser model, OS version, and app version
 */
async function getDeviceInfo(): Promise<{
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}> {
  try {
    const userAgent = navigator.userAgent;
    const deviceModel = 'Web Browser';
    const osVersion = userAgent;
    const appVersion = '1.0.0-web';
    
    return {
      deviceModel,
      osVersion,
      appVersion,
    };
  } catch (error) {
    console.error('[TimeTruthService.web] Failed to get device info:', error);
    return {
      deviceModel: 'Web Browser',
      osVersion: 'Unknown',
      appVersion: '1.0.0-web',
    };
  }
}

// ============================================================================
// TIME TRUTH SERVICE (WEB VERSION)
// ============================================================================

export class TimeTruthService {
  /**
   * Capture current time (web version).
   * 
   * WARNING: This does NOT provide anti-spoofing protection!
   * - Uses Date.now() for all timestamps
   * - No real cryptographic signature
   * - Suitable for development/testing only
   * 
   * @param eventType - The type of time event being captured
   * @returns Promise<SignedTimeCapture> Simplified time capture object
   */
  static async captureCurrentTime(eventType: TimeEventType): Promise<SignedTimeCapture> {
    try {
      // Capture current time
      const userTime = Date.now();
      const monotonicTime = userTime; // Same on web
      const deviceId = await getDeviceId();
      
      // Create the payload
      const payload = {
        userTime,
        monotonicTime,
        eventType,
        deviceId,
        timestamp: new Date(userTime).toISOString(),
      };
      
      // Return with web signature
      const signedCapture: SignedTimeCapture = {
        payload,
        signature: WEB_SIGNATURE,
      };
      
      console.log('[TimeTruthService.web] Time captured (NO SECURITY):', {
        eventType,
        userTime: payload.timestamp,
        signature: WEB_SIGNATURE,
      });
      
      return signedCapture;
    } catch (error) {
      console.error('[TimeTruthService.web] Failed to capture current time:', error);
      throw error;
    }
  }
  
  /**
   * Validate the integrity of a signed time capture (web version).
   * 
   * WARNING: This always returns true since we don't have real signatures on web.
   * 
   * @param signedCapture - The signed time capture to validate
   * @returns Promise<boolean> Always true on web
   */
  static async validateIntegrity(signedCapture: SignedTimeCapture): Promise<boolean> {
    // On web, we don't have real signatures, so we just check if it exists
    const isValid = signedCapture.signature === WEB_SIGNATURE;
    
    if (!isValid) {
      console.warn('[TimeTruthService.web] Invalid signature (expected WEB_UNVERIFIED_SIGNATURE)');
    }
    
    return isValid;
  }
  
  /**
   * Capture a time event (web version - legacy method).
   * 
   * @param eventType - The type of time event being captured
   * @returns TimeEvent object with all timing data
   */
  static async captureTimeEvent(eventType: TimeEventType): Promise<TimeEvent> {
    try {
      const wallClockTime = new Date().toISOString();
      const monotonicInfo = await getMonotonicTimeInfo();
      
      const deviceId = await getDeviceId();
      const deviceInfo = await getDeviceInfo();
      
      const timeEvent: TimeEvent = {
        eventType,
        wallClockTime,
        monotonicTime: Date.now(),
        deviceBootTime: monotonicInfo.bootTime,
        deviceId,
        deviceModel: deviceInfo.deviceModel,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
      };
      
      console.log('[TimeTruthService.web] Time event captured:', {
        eventType,
        wallClockTime,
        deviceId,
      });
      
      return timeEvent;
    } catch (error) {
      console.error('[TimeTruthService.web] Failed to capture time event:', error);
      throw error;
    }
  }
  
  /**
   * Queue a time entry for offline sync.
   * 
   * @param timeEntry - The TimeEntry to queue
   */
  static async queueTimeEntry(timeEntry: TimeEntry): Promise<void> {
    try {
      await OfflineQueueService.enqueue({
        type: 'TIME_ENTRY',
        payload: timeEntry,
        priority: 10,
      });
      
      console.log('[TimeTruthService.web] Time entry queued:', timeEntry.id);
    } catch (error) {
      console.error('[TimeTruthService.web] Failed to queue time entry:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing time entry in the offline queue.
   * 
   * @param timeEntry - The updated TimeEntry
   */
  static async updateTimeEntry(timeEntry: TimeEntry): Promise<void> {
    try {
      await OfflineQueueService.update(timeEntry.id, {
        type: 'TIME_ENTRY',
        payload: timeEntry,
        priority: 10,
      });
      
      console.log('[TimeTruthService.web] Time entry updated:', timeEntry.id);
    } catch (error) {
      console.error('[TimeTruthService.web] Failed to update time entry:', error);
      throw error;
    }
  }
  
  /**
   * Validate a time entry for compliance.
   * 
   * @param timeEntry - The TimeEntry to validate
   * @returns Validation result with any detected issues
   */
  static validateTimeEntry(timeEntry: TimeEntry): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check if end time is before start time
    if (timeEntry.endTime) {
      const start = new Date(timeEntry.startTime).getTime();
      const end = new Date(timeEntry.endTime).getTime();
      
      if (end < start) {
        issues.push('End time is before start time');
      }
      
      // Check if duration is suspiciously long (>24 hours)
      const durationHours = (end - start) / (1000 * 60 * 60);
      if (durationHours > 24) {
        issues.push(`Duration is suspiciously long: ${durationHours.toFixed(2)} hours`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }
  
  /**
   * Get all pending time entries that haven't been synced.
   * 
   * @returns Array of pending TimeEntry objects
   */
  static async getPendingTimeEntries(): Promise<TimeEntry[]> {
    try {
      const queue = await OfflineQueueService.getQueue();
      
      const timeEntries = queue
        .filter(action => action.type === 'TIME_ENTRY')
        .map(action => action.payload as TimeEntry);
      
      return timeEntries;
    } catch (error) {
      console.error('[TimeTruthService.web] Failed to get pending time entries:', error);
      return [];
    }
  }
  
  /**
   * Mark a time entry as synced.
   * 
   * @param timeEntryId - The ID of the synced time entry
   */
  static async markAsSynced(timeEntryId: string): Promise<void> {
    try {
      await OfflineQueueService.remove(timeEntryId);
      console.log('[TimeTruthService.web] Time entry marked as synced:', timeEntryId);
    } catch (error) {
      console.error('[TimeTruthService.web] Failed to mark as synced:', error);
      throw error;
    }
  }
}

// ============================================================================
// WEB PLATFORM NOTES
// ============================================================================

/**
 * WEB PLATFORM LIMITATIONS:
 * 
 * 1. No Monotonic Time: Browsers don't provide access to system uptime
 * 2. No Cryptographic Signing: Simplified for web development
 * 3. No Device Root Detection: Not applicable on web
 * 4. LocalStorage for Device ID: Can be cleared by user
 * 
 * SECURITY IMPLICATIONS:
 * - Time can be manipulated by changing system clock
 * - No tamper protection
 * - Suitable for internal tools or development only
 * 
 * For production time-tracking with security requirements,
 * deploy native mobile apps with the full anti-spoofing implementation.
 */
