/**
 * Data migration system for localStorage
 * - Handles schema changes gracefully
 * - Preserves user data during updates
 * - Applies migrations in sequence
 * - Logs migration process
 */

import { logger } from './logger';
import { safeGetFromStorage, safeSetToStorage } from './storage';

export interface Migration {
  version: number;
  description: string;
  migrate: (data: any) => any;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migrationsApplied: string[];
  error?: string;
}

/**
 * Apply migrations to data from localStorage
 */
export function migrateData(
  storageKey: string,
  migrations: Migration[],
  currentVersion: number
): MigrationResult {
  logger.info(`Migration: Starting for ${storageKey}`);
  
  try {
    // Load raw data
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      logger.info(`Migration: No data found for ${storageKey}, skipping`);
      return {
        success: true,
        fromVersion: 0,
        toVersion: currentVersion,
        migrationsApplied: []
      };
    }
    
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      logger.error(`Migration: Invalid JSON in ${storageKey}`);
      return {
        success: false,
        fromVersion: 0,
        toVersion: currentVersion,
        migrationsApplied: [],
        error: 'Invalid JSON data'
      };
    }
    
    // Determine current data version
    const dataVersion = parsed._version || 1;
    let data = parsed._version !== undefined ? parsed.data : parsed;
    
    logger.info(`Migration: ${storageKey} is at version ${dataVersion}`);
    
    // Check if already at current version
    if (dataVersion === currentVersion) {
      logger.info(`Migration: ${storageKey} already at version ${currentVersion}`);
      return {
        success: true,
        fromVersion: dataVersion,
        toVersion: currentVersion,
        migrationsApplied: []
      };
    }
    
    // Apply migrations in sequence
    const migrationsApplied: string[] = [];
    
    for (let v = dataVersion; v < currentVersion; v++) {
      const migration = migrations.find(m => m.version === v + 1);
      
      if (!migration) {
        logger.warn(`Migration: No migration found for version ${v + 1}`);
        continue;
      }
      
      logger.info(`Migration: Applying "${migration.description}" (v${v} -> v${v + 1})`);
      
      try {
        data = migration.migrate(data);
        migrationsApplied.push(migration.description);
      } catch (error) {
        logger.error(`Migration: Failed at version ${v + 1}:`, error);
        return {
          success: false,
          fromVersion: dataVersion,
          toVersion: v,
          migrationsApplied,
          error: `Failed at version ${v + 1}: ${error}`
        };
      }
    }
    
    // Save migrated data with new version
    const success = safeSetToStorage(storageKey, data, currentVersion);
    
    if (success) {
      logger.info(`Migration: ${storageKey} successfully migrated to version ${currentVersion}`);
      return {
        success: true,
        fromVersion: dataVersion,
        toVersion: currentVersion,
        migrationsApplied
      };
    } else {
      return {
        success: false,
        fromVersion: dataVersion,
        toVersion: currentVersion,
        migrationsApplied,
        error: 'Failed to save migrated data'
      };
    }
  } catch (error) {
    logger.error('Migration: Unexpected error:', error);
    return {
      success: false,
      fromVersion: 0,
      toVersion: currentVersion,
      migrationsApplied: [],
      error: `Unexpected error: ${error}`
    };
  }
}

/**
 * Get current data version from storage
 */
export function getDataVersion(storageKey: string): number {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return 0;
    
    const parsed = JSON.parse(raw);
    return parsed._version || 1;
  } catch {
    return 0;
  }
}

/**
 * Check if migration is needed
 */
export function needsMigration(
  storageKey: string,
  currentVersion: number
): boolean {
  const dataVersion = getDataVersion(storageKey);
  return dataVersion < currentVersion;
}
