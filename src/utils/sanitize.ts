/**
 * Input sanitization utilities
 * - Prevents XSS attacks
 * - Normalizes user input
 * - Validates formats
 */

import { roundToTwoDecimals } from './formatters';

/**
 * Sanitize general text input
 * - Removes dangerous HTML/script tags
 * - Trims whitespace
 * - Limits length
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  if (!input) return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potentially dangerous patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Sanitize email address
 * - Trims whitespace
 * - Converts to lowercase
 * - Basic format validation
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  return email
    .trim()
    .toLowerCase()
    .slice(0, 254); // Max email length per RFC
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize phone number
 * - Removes non-digits (except +)
 * - Validates E.164 format
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Keep only digits and +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Validate E.164 phone format
 */
export function isValidPhone(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Sanitize currency input
 * - Removes non-numeric characters
 * - Rounds to 2 decimal places
 * - Ensures non-negative
 */
export function sanitizeCurrency(value: string | number): number {
  if (typeof value === 'number') {
    return roundToTwoDecimals(Math.max(0, value));
  }
  
  if (!value) return 0;
  
  // Remove everything except digits and decimal point
  const cleaned = value.toString().replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  const sanitized = parts.length > 1 
    ? `${parts[0]}.${parts[1]}` 
    : parts[0];
  
  const num = parseFloat(sanitized) || 0;
  return roundToTwoDecimals(Math.max(0, num));
}

/**
 * Sanitize integer input
 * - Removes non-digits
 * - Ensures non-negative
 */
export function sanitizeInteger(value: string | number, min = 0, max?: number): number {
  const num = typeof value === 'number' 
    ? value 
    : parseInt(value.toString().replace(/[^0-9]/g, ''), 10) || 0;
  
  let result = Math.max(min, num);
  if (max !== undefined) {
    result = Math.min(max, result);
  }
  
  return result;
}

/**
 * Sanitize invoice number
 * - Removes special characters except dash
 * - Uppercase
 * - Limited length
 */
export function sanitizeInvoiceNumber(invoiceNumber: string): string {
  if (!invoiceNumber) return '';
  
  return invoiceNumber
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 50);
}

/**
 * Sanitize filename for downloads
 * - Removes dangerous characters
 * - Preserves extension
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'file';
  
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/[<>:"|?*]/g, '')
    .replace(/\.\./g, '')
    .trim()
    .slice(0, 255);
}

/**
 * Sanitize county name
 */
export function sanitizeCounty(county: string): string {
  if (!county) return '';
  
  return sanitizeText(county, 100);
}

/**
 * Sanitize date input (ISO format)
 */
export function sanitizeDate(date: string): string {
  if (!date) return '';
  
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '';
    
    return parsed.toISOString().split('T')[0];
  } catch {
    return '';
  }
}
