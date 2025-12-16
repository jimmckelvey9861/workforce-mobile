/**
 * WorkForce Mobile - Availability Types
 * 
 * Type definitions for weekly availability schedules.
 * Used by the Schedule Canvas component.
 */

// Slot status: 0 = unavailable, 1 = available, 2 = preferred
export type SlotStatus = 0 | 1 | 2;

// Individual time slot (30-minute interval)
export interface TimeSlot {
  index: number; // 0-47 (48 half-hour slots per day)
  status: SlotStatus;
}

// Day of week
export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

// Schedule for one day (48 time slots)
export interface DaySchedule {
  dayOfWeek: DayOfWeek;
  slots: TimeSlot[]; // Must have exactly 48 slots
}

// Full week schedule (7 days)
export type WeeklyAvailability = DaySchedule[]; // Must have exactly 7 days

// Constants
export const SLOT_STATUS = {
  UNAVAILABLE: 0 as SlotStatus,
  AVAILABLE: 1 as SlotStatus,
  PREFERRED: 2 as SlotStatus,
} as const;

export const SLOTS_PER_DAY = 48;

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN",
];

/**
 * Helper function to create an empty schedule
 * (all slots marked as unavailable)
 */
export function createEmptySchedule(): WeeklyAvailability {
  return DAYS_OF_WEEK.map(day => ({
    dayOfWeek: day,
    slots: Array.from({ length: 48 }, (_, index) => ({
      index,
      status: SLOT_STATUS.UNAVAILABLE,
    })),
  }));
}
