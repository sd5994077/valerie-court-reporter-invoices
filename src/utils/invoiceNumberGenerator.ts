/**
 * Invoice number generation utilities
 * Industry-standard approach: sequential, unique, never reused
 */

import { safeGetFromStorage } from './storage';
import { INVOICE_CURRENT_VERSION } from '../config/invoiceMigrations';

/**
 * Generate next available invoice number for the current year
 * Uses industry-standard approach: max existing number + 1
 * 
 * Format: INV-YYYY-####
 * Example: INV-2026-0001
 * 
 * Notes:
 * - Numbers are never reused (even after deletion)
 * - Gaps in sequence are acceptable (industry standard)
 * - Each year starts from 0001
 */
export function generateNextInvoiceNumber(): string {
  const year = new Date().getFullYear();
  
  // Load all finalized invoices
  const invoices = safeGetFromStorage({
    key: 'finalizedInvoices',
    defaultValue: [],
    validator: (data) => Array.isArray(data),
    version: INVOICE_CURRENT_VERSION
  });
  
  // Find all invoice numbers for this year
  const prefix = `INV-${year}-`;
  const numbersThisYear = invoices
    .map((inv: any) => inv.invoiceNumber)
    .filter((num: string) => num && num.startsWith(prefix))
    .map((num: string) => {
      // Extract the number part (e.g., "INV-2026-0042" -> 42)
      const match = num.match(/INV-\d{4}-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
  
  // Find the highest number used this year
  const maxNumber = numbersThisYear.length > 0 
    ? Math.max(...numbersThisYear) 
    : 0;
  
  // Next number is max + 1
  const nextNumber = maxNumber + 1;
  
  // Format with leading zeros (4 digits)
  const formattedNumber = String(nextNumber).padStart(4, '0');
  
  return `${prefix}${formattedNumber}`;
}

/**
 * Get a preview of what the next invoice number will be
 * Same logic as generateNextInvoiceNumber, but doesn't "reserve" it
 */
export function getNextInvoiceNumberPreview(): string {
  return generateNextInvoiceNumber();
}

/**
 * Validate invoice number format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  const pattern = /^INV-\d{4}-\d{4}$/;
  return pattern.test(invoiceNumber);
}

/**
 * Extract year from invoice number
 */
export function getInvoiceYear(invoiceNumber: string): number | null {
  const match = invoiceNumber.match(/^INV-(\d{4})-\d{4}$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract sequence number from invoice number
 */
export function getInvoiceSequence(invoiceNumber: string): number | null {
  const match = invoiceNumber.match(/^INV-\d{4}-(\d{4})$/);
  return match ? parseInt(match[1], 10) : null;
}
