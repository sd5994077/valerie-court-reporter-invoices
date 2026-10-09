/**
 * Centralized formatting utilities for the application
 */

/**
 * Format a number as USD currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format calendar dates without shifting their day in the user's timezone.
 * Timestamp values continue to use local time.
 */
export const formatDate = (dateString: string): string => {
  const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    // Date-only strings are parsed as UTC; format in UTC to preserve the entered day.
    ...(isCalendarDate ? { timeZone: 'UTC' } : {})
  });
};

/**
 * Fix floating point precision for money calculations
 */
export const roundToTwoDecimals = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};
