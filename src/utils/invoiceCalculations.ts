/**
 * Centralized invoice calculation utilities
 * - Single source of truth for invoice math
 * - Consistent rounding and precision
 * - Prevents calculation drift across components
 */

import { roundToTwoDecimals } from './formatters';

export interface LineItem {
  quantity: number;
  rate: number;
}

export interface Invoice {
  lineItems: LineItem[];
}

/**
 * Calculate total for a single line item
 */
export function calculateLineItemTotal(item: LineItem): number {
  return roundToTwoDecimals(item.quantity * item.rate);
}

/**
 * Calculate grand total for entire invoice
 */
export function calculateInvoiceTotal(invoice: Invoice): number {
  const total = invoice.lineItems.reduce((sum, item) => {
    return sum + calculateLineItemTotal(item);
  }, 0);
  
  return roundToTwoDecimals(total);
}

/**
 * Calculate total for array of line items
 */
export function calculateLineItemsTotal(lineItems: LineItem[]): number {
  const total = lineItems.reduce((sum, item) => {
    return sum + calculateLineItemTotal(item);
  }, 0);
  
  return roundToTwoDecimals(total);
}

/**
 * Calculate total revenue from multiple invoices
 */
export function calculateRevenue(invoices: Invoice[]): number {
  const total = invoices.reduce((sum, invoice) => {
    return sum + calculateInvoiceTotal(invoice);
  }, 0);
  
  return roundToTwoDecimals(total);
}

/**
 * Calculate average invoice value
 */
export function calculateAverageInvoice(invoices: Invoice[]): number {
  if (invoices.length === 0) return 0;
  
  const total = calculateRevenue(invoices);
  return roundToTwoDecimals(total / invoices.length);
}

/**
 * Filter invoices by status and calculate revenue
 */
export function calculateRevenueByStatus(
  invoices: (Invoice & { status?: string })[],
  statuses: string[]
): number {
  const filtered = invoices.filter(invoice => {
    const status = (invoice.status || '').toLowerCase();
    return statuses.some(s => s.toLowerCase() === status);
  });
  
  return calculateRevenue(filtered);
}

/**
 * Group and sum revenue by a field (e.g., county)
 */
export function groupRevenueBy<T extends Invoice>(
  invoices: T[],
  getGroupKey: (invoice: T) => string
): Record<string, number> {
  const grouped: Record<string, number> = {};
  
  for (const invoice of invoices) {
    const key = getGroupKey(invoice);
    const total = calculateInvoiceTotal(invoice);
    grouped[key] = roundToTwoDecimals((grouped[key] || 0) + total);
  }
  
  return grouped;
}

/**
 * Calculate revenue percentages by group
 */
export function calculateRevenuePercentages<T extends Invoice>(
  invoices: T[],
  getGroupKey: (invoice: T) => string
): Array<{ key: string; revenue: number; percentage: number }> {
  const grouped = groupRevenueBy(invoices, getGroupKey);
  const totalRevenue = Object.values(grouped).reduce((sum, rev) => sum + rev, 0);
  
  return Object.entries(grouped)
    .map(([key, revenue]) => ({
      key,
      revenue,
      percentage: totalRevenue > 0 
        ? roundToTwoDecimals((revenue / totalRevenue) * 100) 
        : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
