/**
 * Appeals data migrations
 * - Version history for appeals_store localStorage key
 * - Each migration transforms data from v(n) to v(n+1)
 */

import { Migration } from '../utils/migration';

export const APPEALS_CURRENT_VERSION = 1;

export const APPEALS_MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema',
    migrate: (data) => {
      // No changes needed - this is the baseline
      return data;
    }
  }
  // Future migrations go here...
];
