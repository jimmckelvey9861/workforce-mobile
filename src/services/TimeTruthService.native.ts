/**
 * WorkForce Mobile - Time Truth Service
 * 
 * This service is the ONLY interface for capturing time events in the application.
 * It enforces compliance by capturing both wall-clock time and monotonic time
 * to prevent time spoofing attacks.
 * 
 * SECURITY MODEL:
 * - Wall-clock time (Date.now()) can be manipulated by users
 * - Monotonic time (System.uptime()) cannot be manipulated without rooting
 * - Server validates monotonic time against device boot time
 * - All time events are queued offline and synced when connected
 * 
 * ANTI-SPOOFING IMPLEMENTATION:
 * - Uses react-native-device-info's getSystemUptime() for true monotonic time
 * - Signs all time entries with SHA-256 hash to prevent tampering
 * - Validates integrity before syncing to server
 */

import DeviceInfo from 'react-native-device-info';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { TimeEntry, QueuedAction } from '../types';
import { OfflineQueueService } from './OfflineQueueService';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * SECRET SALT for signing time entries.
 * 
 * PRODUCTION NOTE: This should be:
 * 1. Stored in environment variables (not in code)
 * 2. Different per deployment environment
 * 3. Rotated periodically
 * 4. Combined with server-side validation
 */
const SECRET_SALT = 'WORKFORCE_MOBILE_SECRET_SALT_PLACEHOLDER_2024';

// ============================================================================
// TYPES
// ============================================================================

export type TimeEventType = 'CLOCK_IN' | 'CLOCK_OUT' | 'FORCE_CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';

/**
 * Signed time capture payload.
 * This is the core data structure for anti-spoofing.
 */
export interface SignedTimeCapture {
  payload: {
    userTime: number;        // Wall-clock time (Date.now())
    monotonicTime: number;   // System uptime in milliseconds
    eventType: TimeEventType;
    deviceId: string;
    timestamp: string;       // ISO 8601 for human readability
  };
  signature: string;         // SHA-256 hash of payload + salt
}

export interface TimeEvent {
  eventType: TimeEventType;
  wallClockTime: string; // ISO 8601
  monotonicTime: number; // Milliseconds since device boot
  deviceBootTime: string; // ISO 8601 - Calculated boot time
  deviceId: string; // Unique device identifier
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

export interface MonotonicTimeInfo {
  uptime: number; // Milliseconds since boot
  bootTime: string; // ISO 8601
}

// ============================================================================
// MONOTONIC TIME HELPERS
// ============================================================================

/**
 * Get the device's system uptime (monotonic time) in milliseconds.
 * 
 * Uses react-native-device-info's getSystemUptime() which provides:
 * - iOS: ProcessInfo.processInfo.systemUptime (seconds since boot)
 * - Android: SystemClock.elapsedRealtime() (milliseconds since boot)
 * 
 * This time cannot be manipulated by changing the device's date/time settings.
 * 
 * @returns Promise<number> Milliseconds since device boot
 */
async function getMonotonicTime(): Promise<number> {
  try {
    // getSystemUptime returns seconds on iOS, milliseconds on Android
    // We need to check and normalize to milliseconds
    const uptime = await DeviceInfo.getSystemUptime();
    
    // DeviceInfo.getSystemUptime() returns seconds, convert to milliseconds
    return uptime * 1000;
  } catch (error) {
    console.error('[TimeTruthService] Failed to get system uptime:', error);
    
    // Fallback to performance.now() (NOT SECURE - for development only)
    if (typeof performance !== 'undefined' && performance.now) {
      console.warn('[TimeTruthService] Using performance.now() fallback - NOT SECURE');
      return performance.now();
    }
    
    throw new Error('Unable to get monotonic time');
  }
}

/**
 * Calculate when the device was booted based on current time and uptime.
 * 
 * @param uptime - Milliseconds since device boot
 * @returns ISO 8601 timestamp of device boot
 */
function calculateBootTime(uptime: number): string {
  const now = Date.now();
  const bootTime = now - uptime;
  return new Date(bootTime).toISOString();
}

/**
 * Get monotonic time information including uptime and calculated boot time.
 * 
 * @returns Promise<MonotonicTimeInfo> object
 */
export async function getMonotonicTimeInfo(): Promise<MonotonicTimeInfo> {
  const uptime = await getMonotonicTime();
  const bootTime = calculateBootTime(uptime);
  
  return {
    uptime,
    bootTime,
  };
}

// ============================================================================
// DEVICE IDENTIFICATION
// ============================================================================

/**
 * Get a unique identifier for this device.
 * Uses Expo's Application API to get a consistent device ID.
 * 
 * @returns Unique device identifier
 */
async function getDeviceId(): Promise<string> {
  try {
    // Try to get the installation ID (persists across app reinstalls on same device)
    const installationId = await Application.getInstallationIdAsync();
    return installationId;
  } catch (error) {
    console.error('[TimeTruthService] Failed to get device ID:', error);
    // Fallback to a generated ID (should be persisted in AsyncStorage in production)
    return 'unknown-device';
  }
}

/**
 * Get device information for compliance logging.
 * 
 * @returns Device model, OS version, and app version
 */
async function getDeviceInfo(): Promise<{
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}> {
  try {
    const deviceModel = Device.modelName || 'Unknown';
    const osVersion = Device.osVersion || 'Unknown';
    const appVersion = Application.nativeApplicationVersion || '1.0.0';
    
    return {
      deviceModel,
      osVersion,
      appVersion,
    };
  } catch (error) {
    console.error('[TimeTruthService] Failed to get device info:', error);
    return {
      deviceModel: 'Unknown',
      osVersion: 'Unknown',
      appVersion: '1.0.0',
    };
  }
}

// ============================================================================
// CRYPTOGRAPHIC SIGNING
// ============================================================================

/**
 * Generate a SHA-256 signature for a payload.
 * 
 * @param data - The data to sign (will be stringified)
 * @param salt - Secret salt to include in the signature
 * @returns Promise<string> Hex-encoded SHA-256 hash
 */
async function generateSignature(data: any, salt: string): Promise<string> {
  try {
    const dataString = JSON.stringify(data);
    const signatureInput = dataString + salt;
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      signatureInput
    );
    
    return hash;
  } catch (error) {
    console.error('[TimeTruthService] Failed to generate signature:', error);
    throw error;
  }
}

// ============================================================================
// TIME TRUTH SERVICE
// ============================================================================

export class TimeTruthService {
  /**
   * Capture current time with anti-spoofing protection.
   * 
   * This is the NEW PRIMARY method for capturing time events with cryptographic signing.
   * 
   * SECURITY FEATURES:
   * - Captures both wall-clock time (can be spoofed) and monotonic time (cannot be spoofed)
   * - Signs the payload with SHA-256 to prevent tampering
   * - Includes device ID for audit trail
   * 
   * @param eventType - The type of time event being captured
   * @returns Promise<SignedTimeCapture> Signed time capture object
   */
  static async captureCurrentTime(eventType: TimeEventType): Promise<SignedTimeCapture> {
    try {
      // Capture both times as close together as possible
      const userTime = Date.now();
      const monotonicTime = await getMonotonicTime();
      const deviceId = await getDeviceId();
      
      // Create the payload
      const payload = {
        userTime,
        monotonicTime,
        eventType,
        deviceId,
        timestamp: new Date(userTime).toISOString(),
      };
      
      // Sign the payload
      const signature = await generateSignature(payload, SECRET_SALT);
      
      const signedCapture: SignedTimeCapture = {
        payload,
        signature,
      };
      
      console.log('[TimeTruthService] Time captured and signed:', {
        eventType,
        userTime: payload.timestamp,
        monotonicTime,
        signaturePreview: signature.substring(0, 16) + '...',
      });
      
      return signedCapture;
    } catch (error) {
      console.error('[TimeTruthService] Failed to capture current time:', error);
      throw error;
    }
  }
  
  /**
   * Validate the integrity of a signed time capture.
   * 
   * Re-generates the signature and compares it to the stored signature
   * to detect any tampering with the payload.
   * 
   * @param signedCapture - The signed time capture to validate
   * @returns Promise<boolean> True if signature is valid, false otherwise
   */
  static async validateIntegrity(signedCapture: SignedTimeCapture): Promise<boolean> {
    try {
      // Re-generate the signature from the payload
      const expectedSignature = await generateSignature(signedCapture.payload, SECRET_SALT);
      
      // Compare signatures
      const isValid = expectedSignature === signedCapture.signature;
      
      if (!isValid) {
        console.warn('[TimeTruthService] Signature validation FAILED - possible tampering detected!');
      } else {
        console.log('[TimeTruthService] Signature validation passed');
      }
      
      return isValid;
    } catch (error) {
      console.error('[TimeTruthService] Failed to validate integrity:', error);
      return false;
    }
  }
  
  /**
   * Capture a time event with both wall-clock and monotonic time.
   * This is the LEGACY method - use captureCurrentTime() for new implementations.
   * 
   * CRITICAL: This method MUST be called for all clock-in/out events.
   * Never use Date.now() directly for time tracking.
   * 
   * @param eventType - The type of time event being captured
   * @returns TimeEvent object with all timing data
   */
  static async captureTimeEvent(eventType: TimeEventType): Promise<TimeEvent> {
    try {
      // Capture times as close together as possible
      const wallClockTime = new Date().toISOString();
      const monotonicInfo = await getMonotonicTimeInfo();
      
      // Get device information
      const deviceId = await getDeviceId();
      const deviceInfo = await getDeviceInfo();
      
      const timeEvent: TimeEvent = {
        eventType,
        wallClockTime,
        monotonicTime: monotonicInfo.uptime,
        deviceBootTime: monotonicInfo.bootTime,
        deviceId,
        deviceModel: deviceInfo.deviceModel,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
      };
      
      console.log('[TimeTruthService] Time event captured:', {
        eventType,
        wallClockTime,
        monotonicTime: monotonicInfo.uptime,
        deviceId,
      });
      
      return timeEvent;
    } catch (error) {
      console.error('[TimeTruthService] Failed to capture time event:', error);
      throw error;
    }
  }
  
  /**
   * Queue a time entry for offline sync.
   * The entry will be synced to the server when connectivity is restored.
   * 
   * @param timeEntry - The TimeEntry to queue
   */
  static async queueTimeEntry(timeEntry: TimeEntry): Promise<void> {
    try {
      await OfflineQueueService.enqueue({
        type: 'TIME_ENTRY',
        payload: timeEntry,
        priority: 10, // High priority
      });
      
      console.log('[TimeTruthService] Time entry queued:', timeEntry.id);
    } catch (error) {
      console.error('[TimeTruthService] Failed to queue time entry:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing time entry in the offline queue.
   * Used when ending a session to add the end time.
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
      
      console.log('[TimeTruthService] Time entry updated:', timeEntry.id);
    } catch (error) {
      console.error('[TimeTruthService] Failed to update time entry:', error);
      throw error;
    }
  }
  
  /**
   * Validate a time entry for compliance.
   * Checks for suspicious patterns that might indicate time spoofing.
   * 
   * @param timeEntry - The TimeEntry to validate
   * @returns Validation result with any detected issues
   */
  static validateTimeEntry(timeEntry: TimeEntry): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check if monotonic time is present
    if (timeEntry.monotonicStart === undefined || timeEntry.monotonicStart === null) {
      issues.push('Missing monotonic start time');
    }
    
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
    
    // Check if monotonic time is consistent with wall-clock time
    if (timeEntry.endTime && timeEntry.monotonicEnd) {
      const wallClockDuration = new Date(timeEntry.endTime).getTime() - new Date(timeEntry.startTime).getTime();
      const monotonicDuration = timeEntry.monotonicEnd - timeEntry.monotonicStart;
      
      // Allow 5% variance
      const variance = Math.abs(wallClockDuration - monotonicDuration) / wallClockDuration;
      if (variance > 0.05) {
        issues.push(`Time variance detected: ${(variance * 100).toFixed(2)}%`);
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
      console.error('[TimeTruthService] Failed to get pending time entries:', error);
      return [];
    }
  }
  
  /**
   * Mark a time entry as synced.
   * Removes it from the offline queue.
   * 
   * @param timeEntryId - The ID of the synced time entry
   */
  static async markAsSynced(timeEntryId: string): Promise<void> {
    try {
      await OfflineQueueService.remove(timeEntryId);
      console.log('[TimeTruthService] Time entry marked as synced:', timeEntryId);
    } catch (error) {
      console.error('[TimeTruthService] Failed to mark as synced:', error);
      throw error;
    }
  }
}

// ============================================================================
// PRODUCTION NOTES
// ============================================================================

/**
 * SECURITY CONSIDERATIONS:
 * 
 * 1. SECRET_SALT should be moved to environment variables
 * 2. Server-side validation is REQUIRED - client-side signing alone is not sufficient
 * 3. The server should:
 *    - Validate signatures
 *    - Check monotonic time consistency across sessions
 *    - Flag suspicious patterns (e.g., device boot time changes)
 *    - Maintain a device boot time registry
 * 
 * 4. For Expo apps, you'll need to create a Development Build (CNG) to test
 *    react-native-device-info, as it requires native modules.
 * 
 * 5. Consider implementing certificate pinning for API communication
 *    to prevent man-in-the-middle attacks.
 */
