/**
 * Invoice data migrations
 * - Version history for finalizedInvoices localStorage key
 * - Each migration transforms data from v(n) to v(n+1)
 */

import { Migration } from '../utils/migration';

export const INVOICE_CURRENT_VERSION = 2;

export const INVOICE_MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema',
    migrate: (data) => {
      // No changes needed - this is the baseline
      return data;
    }
  },
  {
    version: 2,
    description: 'Normalize status field (finalized -> pending)',
    migrate: (data) => {
      if (!Array.isArray(data)) return data;
      
      return data.map((invoice: any) => ({
        ...invoice,
        status: invoice.status === 'finalized' ? 'pending' : (invoice.status || 'pending')
      }));
    }
  }
  // Future migrations go here...
  // {
  //   version: 3,
  //   description: 'Add new field X',
  //   migrate: (data) => {
  //     return data.map((invoice: any) => ({ ...invoice, newField: defaultValue }));
  //   }
  // }
];
