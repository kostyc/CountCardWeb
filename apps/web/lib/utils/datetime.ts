/**
 * Date and Time Utilities
 * 
 * Provides utilities for date/time formatting, timezone conversion, and timestamp handling.
 * All timestamps are stored in UTC and converted to user's local timezone for display.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Type guard to check if value is a Firestore Timestamp
 */
export function isTimestamp(value: Date | Timestamp | any): value is Timestamp {
  return value instanceof Timestamp || (value?.toDate && typeof value.toDate === 'function');
}

/**
 * Type guard to check if value is a JavaScript Date
 */
export function isDate(value: Date | Timestamp | any): value is Date {
  return value instanceof Date && !isTimestamp(value);
}

/**
 * Convert Firestore Timestamp or Date to JavaScript Date
 * @param date - Date, Timestamp, or date string
 * @returns JavaScript Date object
 */
export function toDate(date: Date | Timestamp | any): Date {
  if (!date) {
    return new Date();
  }
  if (date instanceof Date) {
    return date;
  }
  if (isTimestamp(date)) {
    return date.toDate();
  }
  return new Date(date);
}

/**
 * Convert Date or Timestamp to Firestore Timestamp
 * @param date - Date, Timestamp, or date string
 * @returns Firestore Timestamp object
 */
export function toTimestamp(date: Date | Timestamp | any): Timestamp {
  if (!date) {
    return Timestamp.now();
  }
  if (isTimestamp(date)) {
    return date;
  }
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  return Timestamp.fromDate(new Date(date));
}

/**
 * Safely get time value (milliseconds since epoch) from Date or Timestamp
 * @param date - Date, Timestamp, or date string
 * @returns Number of milliseconds since epoch
 */
export function getTimeSafe(date: Date | Timestamp | any): number {
  if (!date) {
    return 0;
  }
  if (date instanceof Date) {
    return date.getTime();
  }
  if (isTimestamp(date)) {
    return date.toDate().getTime();
  }
  return new Date(date).getTime();
}

/**
 * Format date for display with timezone information
 * @param date - Date, Timestamp, or date string
 * @param options - Formatting options
 * @returns Formatted date string with timezone
 */
export function formatDateTime(
  date: Date | Timestamp | any,
  options: {
    includeTime?: boolean;
    includeTimezone?: boolean;
    includeSeconds?: boolean;
    format?: 'short' | 'medium' | 'long' | 'full';
  } = {}
): string {
  if (!date) return 'N/A';

  const d = toDate(date);
  const {
    includeTime = true,
    includeTimezone = true,
    includeSeconds = false,
    format = 'medium',
  } = options;

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : format === 'long' ? 'long' : 'short',
    day: 'numeric',
  };

  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
    if (includeSeconds) {
      formatOptions.second = '2-digit';
    }
  }

  if (includeTimezone) {
    formatOptions.timeZoneName = 'short';
  }

  return d.toLocaleString('en-US', formatOptions);
}

/**
 * Format date for display (short format without timezone)
 * @param date - Date, Timestamp, or date string
 * @returns Formatted date string
 */
export function formatDate(date: Date | Timestamp | any): string {
  return formatDateTime(date, { includeTimezone: false });
}

/**
 * Format date and time for display (with timezone)
 * @param date - Date, Timestamp, or date string
 * @returns Formatted date and time string with timezone
 */
export function formatDateTimeWithTimezone(date: Date | Timestamp | any): string {
  return formatDateTime(date, { includeTimezone: true });
}

/**
 * Format date only (no time)
 * @param date - Date, Timestamp, or date string
 * @returns Formatted date string
 */
export function formatDateOnly(date: Date | Timestamp | any): string {
  return formatDateTime(date, { includeTime: false, includeTimezone: false });
}

/**
 * Format time only
 * @param date - Date, Timestamp, or date string
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted time string
 */
export function formatTimeOnly(
  date: Date | Timestamp | any,
  includeSeconds = false
): string {
  if (!date) return 'N/A';
  const d = toDate(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  });
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 * @param date - Date, Timestamp, or date string
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | Timestamp | any): string {
  if (!date) return 'N/A';

  const d = toDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Get user's local timezone
 * @returns Timezone string (e.g., "America/New_York")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get timezone abbreviation (e.g., "EST", "PST")
 * @param date - Date to get timezone for
 * @returns Timezone abbreviation
 */
export function getTimezoneAbbreviation(date: Date | Timestamp | any): string {
  if (!date) return '';
  const d = toDate(date);
  const timeZoneName = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
  })
    .formatToParts(d)
    .find((part) => part.type === 'timeZoneName');
  return timeZoneName?.value || '';
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | Timestamp | any): boolean {
  if (!date) return false;
  const d = toDate(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isPast(date: Date | Timestamp | any): boolean {
  if (!date) return false;
  const d = toDate(date);
  return d.getTime() < new Date().getTime();
}

/**
 * Check if date is in the future
 * @param date - Date to check
 * @returns True if date is in the future
 */
export function isFuture(date: Date | Timestamp | any): boolean {
  if (!date) return false;
  const d = toDate(date);
  return d.getTime() > new Date().getTime();
}

/**
 * Get start of day in UTC
 * @param date - Date to get start of day for
 * @returns Start of day Date object
 */
export function getStartOfDayUTC(date: Date | Timestamp | any): Date {
  const d = toDate(date);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return start;
}

/**
 * Get end of day in UTC
 * @param date - Date to get end of day for
 * @returns End of day Date object
 */
export function getEndOfDayUTC(date: Date | Timestamp | any): Date {
  const d = toDate(date);
  const end = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)
  );
  return end;
}
