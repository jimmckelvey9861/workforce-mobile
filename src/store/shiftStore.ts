/**
 * WorkForce Mobile - Shift Store
 * 
 * Manages shifts and shift trading (peer-to-peer).
 * Includes persistence with AsyncStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES
// ============================================================================

export type ShiftTradeStatus = 'NONE' | 'OFFERED' | 'ACCEPTED' | 'APPROVED';

export interface Shift {
  id: string;
  userId: string; // Current owner of the shift
  role: string; // e.g., "Server", "Bartender", "Host"
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  location: string;
  date: string; // e.g., "2024-01-15"
  
  // Trading fields
  tradeStatus: ShiftTradeStatus;
  tradeInitiatorId?: string; // Who is offering the shift
  tradeTargetUserId?: string; // Who is receiving the offer
  tradeOfferedAt?: string; // ISO 8601
  tradeAcceptedAt?: string; // ISO 8601
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface ShiftState {
  shifts: Shift[];
  
  // Actions
  addShift: (shift: Shift) => void;
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;
  deleteShift: (shiftId: string) => void;
  
  // Trading actions
  offerShift: (shiftId: string, targetUserId: string, initiatorId: string) => void;
  acceptTrade: (shiftId: string) => void;
  declineTrade: (shiftId: string) => void;
  approveTrade: (shiftId: string) => void; // Manager action
  
  // Queries
  getUserShifts: (userId: string) => Shift[];
  getTradeRequests: (userId: string) => Shift[]; // Shifts offered TO this user
  getPendingTrades: (userId: string) => Shift[]; // Shifts this user is offering
  
  // Dev/Demo
  generateMockShifts: (userId: string) => void;
  resetStore: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  shifts: [],
};

// ============================================================================
// STORE
// ============================================================================

export const useShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ========================================================================
      // BASIC ACTIONS
      // ========================================================================
      
      addShift: (shift) => {
        set((state) => ({
          shifts: [...state.shifts, shift],
        }));
        console.log('[ShiftStore] Added shift:', shift.id);
      },
      
      updateShift: (shiftId, updates) => {
        set((state) => ({
          shifts: state.shifts.map((shift) =>
            shift.id === shiftId ? { ...shift, ...updates } : shift
          ),
        }));
        console.log('[ShiftStore] Updated shift:', shiftId, updates);
      },
      
      deleteShift: (shiftId) => {
        set((state) => ({
          shifts: state.shifts.filter((shift) => shift.id !== shiftId),
        }));
        console.log('[ShiftStore] Deleted shift:', shiftId);
      },
      
      // ========================================================================
      // TRADING ACTIONS
      // ========================================================================
      
      offerShift: (shiftId, targetUserId, initiatorId) => {
        const shift = get().shifts.find((s) => s.id === shiftId);
        if (!shift) {
          console.error('[ShiftStore] Shift not found:', shiftId);
          return;
        }
        
        if (shift.userId !== initiatorId) {
          console.error('[ShiftStore] User does not own this shift');
          return;
        }
        
        get().updateShift(shiftId, {
          tradeStatus: 'OFFERED',
          tradeInitiatorId: initiatorId,
          tradeTargetUserId: targetUserId,
          tradeOfferedAt: new Date().toISOString(),
        });
        
        console.log('[ShiftStore] Shift offered:', {
          shiftId,
          from: initiatorId,
          to: targetUserId,
        });
      },
      
      acceptTrade: (shiftId) => {
        console.log('[ShiftStore] acceptTrade called:', shiftId);
        const shift = get().shifts.find((s) => s.id === shiftId);
        
        if (!shift) {
          console.error('[ShiftStore] Cannot accept trade - shift not found:', shiftId);
          console.error('[ShiftStore] Available shifts:', get().shifts.map(s => s.id));
          return;
        }
        
        if (shift.tradeStatus !== 'OFFERED') {
          console.error('[ShiftStore] Cannot accept trade - invalid state:', shift.tradeStatus);
          console.error('[ShiftStore] Shift details:', {
            id: shift.id,
            status: shift.tradeStatus,
            from: shift.tradeInitiatorId,
            to: shift.tradeTargetUserId,
          });
          return;
        }
        
        console.log('[ShiftStore] Accepting trade for shift:', {
          id: shiftId,
          role: shift.role,
          from: shift.tradeInitiatorId,
          to: shift.tradeTargetUserId,
        });
        
        get().updateShift(shiftId, {
          tradeStatus: 'ACCEPTED',
          tradeAcceptedAt: new Date().toISOString(),
        });
        
        console.log('[ShiftStore] ✓ Trade accepted successfully');
      },
      
      declineTrade: (shiftId) => {
        get().updateShift(shiftId, {
          tradeStatus: 'NONE',
          tradeInitiatorId: undefined,
          tradeTargetUserId: undefined,
          tradeOfferedAt: undefined,
        });
        
        console.log('[ShiftStore] Trade declined:', shiftId);
      },
      
      approveTrade: (shiftId) => {
        const shift = get().shifts.find((s) => s.id === shiftId);
        if (!shift || shift.tradeStatus !== 'ACCEPTED') {
          console.error('[ShiftStore] Cannot approve trade - invalid state');
          return;
        }
        
        // Transfer ownership to the target user
        get().updateShift(shiftId, {
          userId: shift.tradeTargetUserId!,
          tradeStatus: 'APPROVED',
        });
        
        console.log('[ShiftStore] Trade approved and ownership transferred');
      },
      
      // ========================================================================
      // QUERIES
      // ========================================================================
      
      getUserShifts: (userId) => {
        return get().shifts.filter((shift) => shift.userId === userId);
      },
      
      getTradeRequests: (userId) => {
        return get().shifts.filter(
          (shift) =>
            shift.tradeTargetUserId === userId &&
            shift.tradeStatus === 'OFFERED'
        );
      },
      
      getPendingTrades: (userId) => {
        return get().shifts.filter(
          (shift) =>
            shift.tradeInitiatorId === userId &&
            (shift.tradeStatus === 'OFFERED' || shift.tradeStatus === 'ACCEPTED')
        );
      },
      
      // ========================================================================
      // DEV/DEMO
      // ========================================================================
      
      generateMockShifts: (userId) => {
        const mockShifts: Shift[] = [
          {
            id: 'shift-001',
            userId,
            role: 'Server',
            startTime: '2024-12-20T09:00:00Z',
            endTime: '2024-12-20T17:00:00Z',
            location: 'Main Restaurant',
            date: '2024-12-20',
            tradeStatus: 'NONE',
          },
          {
            id: 'shift-002',
            userId,
            role: 'Bartender',
            startTime: '2024-12-21T17:00:00Z',
            endTime: '2024-12-22T01:00:00Z',
            location: 'Bar Section',
            date: '2024-12-21',
            tradeStatus: 'NONE',
          },
          {
            id: 'shift-003',
            userId,
            role: 'Host',
            startTime: '2024-12-22T10:00:00Z',
            endTime: '2024-12-22T16:00:00Z',
            location: 'Front Desk',
            date: '2024-12-22',
            tradeStatus: 'NONE',
          },
        ];
        
        set({ shifts: mockShifts });
        console.log('[ShiftStore] Generated mock shifts for user:', userId);
      },
      
      resetStore: () => {
        set(initialState);
        console.log('[ShiftStore] Store reset');
      },
    }),
    {
      name: 'workforce-shift-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

