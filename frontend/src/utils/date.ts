import { format, parseISO } from 'date-fns';

/**
 * Format a date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Parse a YYYY-MM-DD string to Date
 */
export const parseDate = (dateStr: string): Date => {
  return parseISO(dateStr);
};

/**
 * Format a time slot for display (e.g., "10:00 AM - 11:00 AM")
 */
export const formatTimeSlot = (start: Date | string, end: Date | string): string => {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  
  return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
};

/**
 * Format just the time (e.g., "10:00 AM")
 */
export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
};

/**
 * Format date for display (e.g., "March 10, 2025")
 */
export const formatDisplayDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM d, yyyy');
};

/**
 * Get today's date as YYYY-MM-DD
 */
export const getTodayString = (): string => {
  return formatDate(new Date());
};
