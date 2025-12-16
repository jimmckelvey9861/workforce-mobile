/**
 * WorkForce Mobile - Offline Queue Service
 * 
 * This service manages the offline queue for actions that need to be synced
 * to the server. It uses Expo SQLite for persistent storage.
 * 
 * QUEUE STRATEGY:
 * - Actions are stored in SQLite with priority levels
 * - High-priority actions (time entries) are synced first
 * - Failed syncs are retried with exponential backoff
 * - Queue is processed automatically when connectivity is restored
 */

import * as SQLite from 'expo-sqlite';
import { QueuedAction } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SignedTimeCapture } from './TimeTruthService';

// ============================================================================
// DATABASE SETUP
// ============================================================================

const DB_NAME = 'workforce_offline.db';
const TABLE_NAME = 'offline_queue';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the SQLite database and create tables if needed.
 */
async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }
  
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Create the offline queue table with anti-spoofing columns
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        last_attempt TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        monotonic_timestamp REAL,
        signature TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_priority ON ${TABLE_NAME}(priority DESC, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_type ON ${TABLE_NAME}(type);
    `);
    
    // Run migrations to add new columns to existing tables
    await runMigrations(db);
    
    console.log('[OfflineQueueService] Database initialized');
    return db;
  } catch (error) {
    console.error('[OfflineQueueService] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Run database migrations to add new columns if they don't exist.
 * This ensures backward compatibility with existing databases.
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check if monotonic_timestamp column exists
    const tableInfo = await database.getAllAsync(`PRAGMA table_info(${TABLE_NAME})`);
    const columns = tableInfo.map((col: any) => col.name);
    
    // Add monotonic_timestamp column if it doesn't exist
    if (!columns.includes('monotonic_timestamp')) {
      console.log('[OfflineQueueService] Adding monotonic_timestamp column...');
      await database.execAsync(`
        ALTER TABLE ${TABLE_NAME} ADD COLUMN monotonic_timestamp REAL;
      `);
    }
    
    // Add signature column if it doesn't exist
    if (!columns.includes('signature')) {
      console.log('[OfflineQueueService] Adding signature column...');
      await database.execAsync(`
        ALTER TABLE ${TABLE_NAME} ADD COLUMN signature TEXT;
      `);
    }
    
    console.log('[OfflineQueueService] Migrations completed');
  } catch (error) {
    console.error('[OfflineQueueService] Migration failed:', error);
    // Don't throw - allow the app to continue with existing schema
  }
}

/**
 * Get the database instance, initializing if needed.
 */
async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return await initDatabase();
  }
  return db;
}

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

export class OfflineQueueService {
  /**
   * Add a new action to the offline queue.
   * 
   * @param action - Partial QueuedAction (id and timestamps will be auto-generated)
   * @returns The created QueuedAction with generated ID
   */
  static async enqueue(action: Omit<QueuedAction, 'id' | 'attempts' | 'lastAttempt' | 'createdAt'>): Promise<QueuedAction> {
    try {
      const database = await getDatabase();
      
      const queuedAction: QueuedAction = {
        id: uuidv4(),
        type: action.type,
        payload: action.payload,
        priority: action.priority,
        attempts: 0,
        maxAttempts: action.maxAttempts || 5,
        lastAttempt: null,
        createdAt: new Date().toISOString(),
      };
      
      await database.runAsync(
        `INSERT INTO ${TABLE_NAME} (id, type, payload, priority, attempts, max_attempts, last_attempt, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          queuedAction.id,
          queuedAction.type,
          JSON.stringify(queuedAction.payload),
          queuedAction.priority,
          queuedAction.attempts,
          queuedAction.maxAttempts,
          queuedAction.lastAttempt,
          queuedAction.createdAt,
          queuedAction.createdAt,
        ]
      );
      
      console.log('[OfflineQueueService] Action enqueued:', {
        id: queuedAction.id,
        type: queuedAction.type,
        priority: queuedAction.priority,
      });
      
      return queuedAction;
    } catch (error) {
      console.error('[OfflineQueueService] Failed to enqueue action:', error);
      throw error;
    }
  }
  
  /**
   * Enqueue a signed time capture with anti-spoofing protection.
   * 
   * This method stores the signed time capture with its monotonic timestamp
   * and cryptographic signature for secure offline storage.
   * 
   * @param signedCapture - The signed time capture from TimeTruthService
   * @param priority - Priority level (default: 10 for high priority)
   * @returns The created QueuedAction with generated ID
   */
  static async enqueueSignedTimeCapture(
    signedCapture: SignedTimeCapture,
    priority: number = 10
  ): Promise<QueuedAction> {
    try {
      const database = await getDatabase();
      
      const queuedAction: QueuedAction = {
        id: uuidv4(),
        type: 'SIGNED_TIME_CAPTURE',
        payload: signedCapture,
        priority,
        attempts: 0,
        maxAttempts: 5,
        lastAttempt: null,
        createdAt: new Date().toISOString(),
      };
      
      // Insert with anti-spoofing columns
      await database.runAsync(
        `INSERT INTO ${TABLE_NAME} (
          id, type, payload, priority, attempts, max_attempts, 
          last_attempt, created_at, updated_at, monotonic_timestamp, signature
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          queuedAction.id,
          queuedAction.type,
          JSON.stringify(queuedAction.payload),
          queuedAction.priority,
          queuedAction.attempts,
          queuedAction.maxAttempts,
          queuedAction.lastAttempt,
          queuedAction.createdAt,
          queuedAction.createdAt,
          signedCapture.payload.monotonicTime,
          signedCapture.signature,
        ]
      );
      
      console.log('[OfflineQueueService] Signed time capture enqueued:', {
        id: queuedAction.id,
        eventType: signedCapture.payload.eventType,
        monotonicTime: signedCapture.payload.monotonicTime,
        signaturePreview: signedCapture.signature.substring(0, 16) + '...',
      });
      
      return queuedAction;
    } catch (error) {
      console.error('[OfflineQueueService] Failed to enqueue signed time capture:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing action in the queue.
   * Used when modifying a time entry before it's synced.
   * 
   * @param id - The ID of the action to update
   * @param updates - Partial action data to update
   */
  static async update(
    id: string,
    updates: Partial<Omit<QueuedAction, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const database = await getDatabase();
      
      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      if (updates.type !== undefined) {
        updateFields.push('type = ?');
        updateValues.push(updates.type);
      }
      
      if (updates.payload !== undefined) {
        updateFields.push('payload = ?');
        updateValues.push(JSON.stringify(updates.payload));
      }
      
      if (updates.priority !== undefined) {
        updateFields.push('priority = ?');
        updateValues.push(updates.priority);
      }
      
      if (updates.attempts !== undefined) {
        updateFields.push('attempts = ?');
        updateValues.push(updates.attempts);
      }
      
      if (updates.maxAttempts !== undefined) {
        updateFields.push('max_attempts = ?');
        updateValues.push(updates.maxAttempts);
      }
      
      if (updates.lastAttempt !== undefined) {
        updateFields.push('last_attempt = ?');
        updateValues.push(updates.lastAttempt);
      }
      
      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      
      updateValues.push(id);
      
      await database.runAsync(
        `UPDATE ${TABLE_NAME} SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      console.log('[OfflineQueueService] Action updated:', id);
    } catch (error) {
      console.error('[OfflineQueueService] Failed to update action:', error);
      throw error;
    }
  }
  
  /**
   * Remove an action from the queue.
   * Called after successful sync.
   * 
   * @param id - The ID of the action to remove
   */
  static async remove(id: string): Promise<void> {
    try {
      const database = await getDatabase();
      
      await database.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
      
      console.log('[OfflineQueueService] Action removed:', id);
    } catch (error) {
      console.error('[OfflineQueueService] Failed to remove action:', error);
      throw error;
    }
  }
  
  /**
   * Get all actions in the queue, ordered by priority and creation time.
   * 
   * @param limit - Maximum number of actions to return
   * @returns Array of QueuedAction objects
   */
  static async getQueue(limit?: number): Promise<QueuedAction[]> {
    try {
      const database = await getDatabase();
      
      const query = `
        SELECT * FROM ${TABLE_NAME}
        ORDER BY priority DESC, created_at ASC
        ${limit ? `LIMIT ${limit}` : ''}
      `;
      
      const rows = await database.getAllAsync(query);
      
      const actions: QueuedAction[] = rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        payload: JSON.parse(row.payload),
        priority: row.priority,
        attempts: row.attempts,
        maxAttempts: row.max_attempts,
        lastAttempt: row.last_attempt,
        createdAt: row.created_at,
      }));
      
      return actions;
    } catch (error) {
      console.error('[OfflineQueueService] Failed to get queue:', error);
      return [];
    }
  }
  
  /**
   * Get actions by type.
   * 
   * @param type - The action type to filter by
   * @returns Array of QueuedAction objects
   */
  static async getByType(type: string): Promise<QueuedAction[]> {
    try {
      const database = await getDatabase();
      
      const rows = await database.getAllAsync(
        `SELECT * FROM ${TABLE_NAME} WHERE type = ? ORDER BY priority DESC, created_at ASC`,
        [type]
      );
      
      const actions: QueuedAction[] = rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        payload: JSON.parse(row.payload),
        priority: row.priority,
        attempts: row.attempts,
        maxAttempts: row.max_attempts,
        lastAttempt: row.last_attempt,
        createdAt: row.created_at,
      }));
      
      return actions;
    } catch (error) {
      console.error('[OfflineQueueService] Failed to get actions by type:', error);
      return [];
    }
  }
  
  /**
   * Get the count of pending actions in the queue.
   * 
   * @returns Number of pending actions
   */
  static async getCount(): Promise<number> {
    try {
      const database = await getDatabase();
      
      const result = await database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAME}`
      );
      
      return result?.count || 0;
    } catch (error) {
      console.error('[OfflineQueueService] Failed to get count:', error);
      return 0;
    }
  }
  
  /**
   * Increment the attempt counter for an action.
   * Called when a sync attempt fails.
   * 
   * @param id - The ID of the action
   */
  static async incrementAttempts(id: string): Promise<void> {
    try {
      const database = await getDatabase();
      
      await database.runAsync(
        `UPDATE ${TABLE_NAME} 
         SET attempts = attempts + 1, 
             last_attempt = ?,
             updated_at = ?
         WHERE id = ?`,
        [new Date().toISOString(), new Date().toISOString(), id]
      );
      
      console.log('[OfflineQueueService] Attempt incremented:', id);
    } catch (error) {
      console.error('[OfflineQueueService] Failed to increment attempts:', error);
      throw error;
    }
  }
  
  /**
   * Remove actions that have exceeded their max attempts.
   * These are considered permanently failed.
   * 
   * @returns Number of actions removed
   */
  static async removeFailedActions(): Promise<number> {
    try {
      const database = await getDatabase();
      
      const result = await database.runAsync(
        `DELETE FROM ${TABLE_NAME} WHERE attempts >= max_attempts`
      );
      
      const deletedCount = result.changes;
      
      if (deletedCount > 0) {
        console.warn('[OfflineQueueService] Removed failed actions:', deletedCount);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('[OfflineQueueService] Failed to remove failed actions:', error);
      return 0;
    }
  }
  
  /**
   * Clear the entire queue.
   * WARNING: This will delete all pending actions.
   */
  static async clearQueue(): Promise<void> {
    try {
      const database = await getDatabase();
      
      await database.runAsync(`DELETE FROM ${TABLE_NAME}`);
      
      console.warn('[OfflineQueueService] Queue cleared');
    } catch (error) {
      console.error('[OfflineQueueService] Failed to clear queue:', error);
      throw error;
    }
  }
  
  /**
   * Get statistics about the queue.
   * 
   * @returns Queue statistics
   */
  static async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byPriority: Record<number, number>;
    failedCount: number;
  }> {
    try {
      const database = await getDatabase();
      
      const total = await this.getCount();
      
      const typeRows = await database.getAllAsync<{ type: string; count: number }>(
        `SELECT type, COUNT(*) as count FROM ${TABLE_NAME} GROUP BY type`
      );
      
      const priorityRows = await database.getAllAsync<{ priority: number; count: number }>(
        `SELECT priority, COUNT(*) as count FROM ${TABLE_NAME} GROUP BY priority`
      );
      
      const failedResult = await database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE attempts >= max_attempts`
      );
      
      const byType: Record<string, number> = {};
      typeRows.forEach(row => {
        byType[row.type] = row.count;
      });
      
      const byPriority: Record<number, number> = {};
      priorityRows.forEach(row => {
        byPriority[row.priority] = row.count;
      });
      
      return {
        total,
        byType,
        byPriority,
        failedCount: failedResult?.count || 0,
      };
    } catch (error) {
      console.error('[OfflineQueueService] Failed to get stats:', error);
      return {
        total: 0,
        byType: {},
        byPriority: {},
        failedCount: 0,
      };
    }
  }
}
