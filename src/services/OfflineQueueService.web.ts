/**
 * WorkForce Mobile - Offline Queue Service (WEB VERSION)
 * 
 * This is the WEB implementation of the Offline Queue Service.
 * Uses AsyncStorage (localStorage) instead of SQLite for simpler web storage.
 * 
 * DIFFERENCES FROM NATIVE:
 * - Uses AsyncStorage (localStorage wrapper) instead of SQLite
 * - Stores queue as JSON array instead of SQL table
 * - No complex indexing or migrations
 * - Simpler, faster for web development
 * 
 * LIMITATIONS:
 * - LocalStorage has size limits (~5-10MB depending on browser)
 * - No SQL querying capabilities
 * - Can be cleared by user
 * - Not suitable for large queues
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueuedAction } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SignedTimeCapture } from './TimeTruthService';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const QUEUE_STORAGE_KEY = '@workforce_offline_queue';
const STATS_STORAGE_KEY = '@workforce_queue_stats';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load the queue from AsyncStorage.
 * 
 * @returns Array of QueuedAction objects
 */
async function loadQueue(): Promise<QueuedAction[]> {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    
    if (!queueJson) {
      return [];
    }
    
    const queue: QueuedAction[] = JSON.parse(queueJson);
    return queue;
  } catch (error) {
    console.error('[OfflineQueueService.web] Failed to load queue:', error);
    return [];
  }
}

/**
 * Save the queue to AsyncStorage.
 * 
 * @param queue - Array of QueuedAction objects to save
 */
async function saveQueue(queue: QueuedAction[]): Promise<void> {
  try {
    const queueJson = JSON.stringify(queue);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, queueJson);
    
    console.log('[OfflineQueueService.web] Queue saved:', queue.length, 'items');
  } catch (error) {
    console.error('[OfflineQueueService.web] Failed to save queue:', error);
    throw error;
  }
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
      const queue = await loadQueue();
      
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
      
      queue.push(queuedAction);
      await saveQueue(queue);
      
      console.log('[OfflineQueueService.web] Action enqueued:', {
        id: queuedAction.id,
        type: queuedAction.type,
        priority: queuedAction.priority,
      });
      
      return queuedAction;
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to enqueue action:', error);
      throw error;
    }
  }
  
  /**
   * Enqueue a signed time capture with anti-spoofing protection.
   * 
   * Note: On web, this doesn't provide real security, but maintains API compatibility.
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
      const queue = await loadQueue();
      
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
      
      queue.push(queuedAction);
      await saveQueue(queue);
      
      console.log('[OfflineQueueService.web] Signed time capture enqueued:', {
        id: queuedAction.id,
        eventType: signedCapture.payload.eventType,
        signature: signedCapture.signature,
      });
      
      return queuedAction;
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to enqueue signed time capture:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing action in the queue.
   * 
   * @param id - The ID of the action to update
   * @param updates - Partial action data to update
   */
  static async update(
    id: string,
    updates: Partial<Omit<QueuedAction, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const queue = await loadQueue();
      const index = queue.findIndex(action => action.id === id);
      
      if (index === -1) {
        throw new Error(`Action with id ${id} not found`);
      }
      
      // Update the action
      queue[index] = {
        ...queue[index],
        ...updates,
      };
      
      await saveQueue(queue);
      
      console.log('[OfflineQueueService.web] Action updated:', id);
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to update action:', error);
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
      const queue = await loadQueue();
      const filteredQueue = queue.filter(action => action.id !== id);
      
      await saveQueue(filteredQueue);
      
      console.log('[OfflineQueueService.web] Action removed:', id);
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to remove action:', error);
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
      const queue = await loadQueue();
      
      // Sort by priority (descending) and then by creation time (ascending)
      const sortedQueue = queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      if (limit) {
        return sortedQueue.slice(0, limit);
      }
      
      return sortedQueue;
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to get queue:', error);
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
      const queue = await loadQueue();
      
      const filteredQueue = queue.filter(action => action.type === type);
      
      // Sort by priority and creation time
      return filteredQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to get actions by type:', error);
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
      const queue = await loadQueue();
      return queue.length;
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to get count:', error);
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
      const queue = await loadQueue();
      const index = queue.findIndex(action => action.id === id);
      
      if (index === -1) {
        throw new Error(`Action with id ${id} not found`);
      }
      
      queue[index].attempts += 1;
      queue[index].lastAttempt = new Date().toISOString();
      
      await saveQueue(queue);
      
      console.log('[OfflineQueueService.web] Attempt incremented:', id);
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to increment attempts:', error);
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
      const queue = await loadQueue();
      const failedActions = queue.filter(action => action.attempts >= action.maxAttempts);
      const remainingQueue = queue.filter(action => action.attempts < action.maxAttempts);
      
      await saveQueue(remainingQueue);
      
      const deletedCount = failedActions.length;
      
      if (deletedCount > 0) {
        console.warn('[OfflineQueueService.web] Removed failed actions:', deletedCount);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to remove failed actions:', error);
      return 0;
    }
  }
  
  /**
   * Clear the entire queue.
   * WARNING: This will delete all pending actions.
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
      console.warn('[OfflineQueueService.web] Queue cleared');
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to clear queue:', error);
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
      const queue = await loadQueue();
      
      const total = queue.length;
      
      const byType: Record<string, number> = {};
      const byPriority: Record<number, number> = {};
      let failedCount = 0;
      
      queue.forEach(action => {
        // Count by type
        byType[action.type] = (byType[action.type] || 0) + 1;
        
        // Count by priority
        byPriority[action.priority] = (byPriority[action.priority] || 0) + 1;
        
        // Count failed
        if (action.attempts >= action.maxAttempts) {
          failedCount++;
        }
      });
      
      return {
        total,
        byType,
        byPriority,
        failedCount,
      };
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to get stats:', error);
      return {
        total: 0,
        byType: {},
        byPriority: {},
        failedCount: 0,
      };
    }
  }
  
  /**
   * Add a new action to the queue (alias for enqueue).
   * Provided for API compatibility.
   * 
   * @param action - Partial QueuedAction
   * @returns The created QueuedAction
   */
  static async addToQueue(action: Omit<QueuedAction, 'id' | 'attempts' | 'lastAttempt' | 'createdAt'>): Promise<QueuedAction> {
    return this.enqueue(action);
  }
  
  /**
   * Sync the queue to the server.
   * This is a placeholder - implement actual sync logic as needed.
   * 
   * @returns Number of actions synced
   */
  static async syncQueue(): Promise<number> {
    try {
      const queue = await this.getQueue();
      
      if (queue.length === 0) {
        console.log('[OfflineQueueService.web] No actions to sync');
        return 0;
      }
      
      console.log('[OfflineQueueService.web] Syncing', queue.length, 'actions...');
      
      // TODO: Implement actual sync logic
      // For now, this is a placeholder that doesn't actually sync
      
      console.warn('[OfflineQueueService.web] Sync not implemented - actions remain in queue');
      
      return 0;
    } catch (error) {
      console.error('[OfflineQueueService.web] Failed to sync queue:', error);
      return 0;
    }
  }
}

// ============================================================================
// WEB PLATFORM NOTES
// ============================================================================

/**
 * WEB STORAGE LIMITATIONS:
 * 
 * 1. Size Limits: LocalStorage typically has 5-10MB limit
 * 2. Synchronous API: AsyncStorage wraps localStorage which is synchronous
 * 3. No Transactions: No ACID guarantees like SQLite
 * 4. User Clearable: Users can clear browser data
 * 5. No Indexing: Linear search for queries
 * 
 * BEST PRACTICES:
 * - Keep queue size small (< 1000 items)
 * - Sync frequently to avoid large queues
 * - Handle storage quota errors gracefully
 * - Don't store sensitive data without encryption
 * 
 * For production with large queues or complex queries,
 * consider using IndexedDB or a web-based database.
 */
