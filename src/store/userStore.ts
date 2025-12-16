/**
 * WorkForce Mobile - User Store
 * 
 * This Zustand store manages the current user's state, including their
 * wallet balance and authentication status.
 */

import { create } from 'zustand';
import { User } from '../types';

interface UserState {
  // ========================================================================
  // STATE
  // ========================================================================
  
  /** Current authenticated user (null if not logged in) */
  user: User | null;
  
  /** Whether the app is loading user data */
  isLoading: boolean;
  
  // ========================================================================
  // ACTIONS
  // ========================================================================
  
  /**
   * Set the current user.
   * Called after successful authentication or data refresh.
   */
  setUser: (user: User | null) => void;
  
  /**
   * Update the user's wallet balance.
   * This adds the specified amount (in cents) to the current balance.
   * 
   * @param amount - Amount in cents to add (can be negative for deductions)
   */
  addToBalance: (amount: number) => void;
  
  /**
   * Set the loading state.
   */
  setLoading: (isLoading: boolean) => void;
  
  /**
   * Clear user data (logout).
   */
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  // ========================================================================
  // INITIAL STATE
  // ========================================================================
  
  user: null,
  isLoading: true,
  
  // ========================================================================
  // ACTION IMPLEMENTATIONS
  // ========================================================================
  
  setUser: (user) => {
    set({ user, isLoading: false });
  },
  
  addToBalance: (amount) => {
    set((state) => {
      if (!state.user) {
        console.error('[UserStore] Cannot add to balance: no user logged in');
        return state;
      }
      
      const previousBalance = state.user.currentBalance;
      const newBalance = previousBalance + amount;
      
      console.log(`[UserStore] Adding $${(amount / 100).toFixed(2)} to balance. New total: $${(newBalance / 100).toFixed(2)}`);
      console.log('[UserStore] Balance details:', {
        previousCents: previousBalance,
        addedCents: amount,
        newCents: newBalance,
        previousDollars: (previousBalance / 100).toFixed(2),
        addedDollars: (amount / 100).toFixed(2),
        newDollars: (newBalance / 100).toFixed(2),
      });
      
      return {
        user: {
          ...state.user,
          currentBalance: newBalance,
        },
      };
    });
  },
  
  setLoading: (isLoading) => {
    set({ isLoading });
  },
  
  logout: () => {
    set({ user: null, isLoading: false });
    console.log('[UserStore] User logged out');
  },
}));

/**
 * Selector hooks for common access patterns
 */
export const useCurrentUser = () => useUserStore((state) => state.user);
export const useUserBalance = () => useUserStore((state) => state.user?.currentBalance || 0);
export const useIsLoggedIn = () => useUserStore((state) => state.user !== null);

