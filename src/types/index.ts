/**
 * WorkForce Mobile - Core Type Definitions
 * 
 * These types define the data models for the Offline-First, Compliance-Driven
 * time tracking application.
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export type UserRole = 'EMPLOYEE' | 'MANAGER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  currentBalance: number; // Current earnings balance in cents
  employeeId?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SHIFT & SCHEDULING
// ============================================================================

export interface Shift {
  id: string;
  userId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  breakMinutes: number;
  isTradeable: boolean;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  locationId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftTrade {
  id: string;
  originalShiftId: string;
  requestingUserId: string;
  targetUserId?: string; // null if open to marketplace
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  expiresAt: string;
}

// ============================================================================
// TIME TRACKING & COMPLIANCE
// ============================================================================

export type TimeEntryType = 'STANDARD' | 'REMOTE_TASK';

/**
 * TimeEntry represents a work session with compliance-verified timestamps.
 * 
 * CRITICAL: monotonicStart and monotonicEnd are captured from device uptime
 * to prevent time spoofing. These values are validated server-side against
 * the device's reported boot time.
 */
export interface TimeEntry {
  id: string; // Local UUID, replaced by server ID on sync
  userId: string;
  startTime: string; // ISO 8601 - User's wall clock time
  endTime: string | null; // ISO 8601 - null if session is active
  type: TimeEntryType;
  
  // Monotonic time values (milliseconds since device boot)
  monotonicStart: number; // System.uptime() at clock-in
  monotonicEnd: number | null; // System.uptime() at clock-out
  
  // Compliance metadata
  deviceBootTime: string; // ISO 8601 - When device was last booted
  deviceId: string; // Unique device identifier
  
  // Sync state
  isSynced: boolean;
  syncAttempts: number;
  lastSyncAttempt: string | null;
  
  // Optional associations
  shiftId?: string;
  remoteTaskId?: string;
  locationLat?: number;
  locationLng?: number;
  locationAccuracy?: number;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// REMOTE TASKS (Paid Activities)
// ============================================================================

export interface RemoteTask {
  id: string;
  name: string;
  description: string;
  type: 'SURVEY' | 'TRAINING' | 'CERTIFICATION' | 'OTHER';
  payRate: number; // Cents per minute
  maxDuration: number; // Maximum allowed minutes
  estimatedDuration: number; // Expected completion time
  isActive: boolean;
  requiredRole?: UserRole;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteTaskCompletion {
  id: string;
  remoteTaskId: string;
  userId: string;
  timeEntryId: string;
  durationMinutes: number;
  earningsInCents: number;
  completedAt: string;
  isSynced: boolean;
}

// ============================================================================
// WALLET & EARNINGS
// ============================================================================

export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Cents (positive for earnings, negative for deductions)
  type: 'SHIFT_EARNINGS' | 'REMOTE_TASK' | 'BONUS' | 'ADJUSTMENT' | 'PAYOUT';
  description: string;
  timeEntryId?: string;
  remoteTaskId?: string;
  createdAt: string;
}

export interface PayStub {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number; // Cents
  netPay: number; // Cents
  hoursWorked: number;
  deductions: Deduction[];
  paidAt: string | null;
  createdAt: string;
}

export interface Deduction {
  type: 'TAX' | 'INSURANCE' | 'RETIREMENT' | 'OTHER';
  description: string;
  amount: number; // Cents
}

// ============================================================================
// LOCATION & COMPLIANCE
// ============================================================================

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // Geofence radius
  isActive: boolean;
  companyId: string;
}

export interface ComplianceViolation {
  id: string;
  userId: string;
  type: 'TIME_SPOOFING' | 'LOCATION_MISMATCH' | 'UNAUTHORIZED_BACKGROUND' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  metadata: Record<string, any>;
  resolvedAt: string | null;
  createdAt: string;
}

// ============================================================================
// OFFLINE QUEUE
// ============================================================================

export interface QueuedAction {
  id: string; // Local UUID
  type: 'TIME_ENTRY' | 'LOCATION_UPDATE' | 'TASK_COMPLETION' | 'OTHER';
  payload: any;
  priority: number; // Higher = more urgent
  attempts: number;
  maxAttempts: number;
  lastAttempt: string | null;
  createdAt: string;
}

// ============================================================================
// APP STATE
// ============================================================================

export type AppMode = 'PASSIVE' | 'ACTIVE';

export interface AppSession {
  mode: AppMode;
  startedAt: string | null;
  currentTask: RemoteTask | null;
  currentTimeEntry: TimeEntry | null;
  isPaused: boolean;
  pausedAt: string | null;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncResponse {
  syncedCount: number;
  failedCount: number;
  conflicts: any[];
  serverTime: string;
}
