/**
 * Safe localStorage wrapper with error handling and validation
 * - Gracefully handles JSON parse errors
 * - Validates data structure before returning
 * - Backs up corrupt data for debugging
 * - Handles quota exceeded errors
 * - Supports data versioning
 */

import { logger } from './logger';

export interface StorageOptions<T> {
  key: string;
  defaultValue: T;
  validator?: (data: any) => boolean;
  version?: number;
}

/**
 * Safely get data from localStorage with error handling
 */
export function safeGetFromStorage<T>(options: StorageOptions<T>): T {
  const { key, defaultValue, validator, version } = options;
  
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    
    const parsed = JSON.parse(raw);
    
    // Check version if specified and unwrap data
    let dataToReturn = parsed;
    if (version !== undefined) {
      if (parsed._version !== version) {
        logger.warn(`Storage: ${key} version mismatch (expected ${version}, got ${parsed._version || 'none'})`);
        return defaultValue;
      }
      // Unwrap versioned data
      dataToReturn = parsed.data || parsed;
    }
    
    // Validate structure if validator provided (validate UNWRAPPED data)
    if (validator && !validator(dataToReturn)) {
      logger.error(`Storage: ${key} failed validation`);
      return defaultValue;
    }
    
    // Return the unwrapped data
    return dataToReturn;
  } catch (error) {
    logger.error(`Storage: Error loading ${key}:`, error);
    
    // Backup corrupt data for investigation
    try {
      const corrupt = localStorage.getItem(key);
      if (corrupt) {
        const backupKey = `${key}_corrupt_${Date.now()}`;
        localStorage.setItem(backupKey, corrupt);
        logger.info(`Storage: Backed up corrupt data to ${backupKey}`);
      }
    } catch (backupError) {
      // Silent fail on backup
    }
    
    return defaultValue;
  }
}

/**
 * Safely save data to localStorage with error handling
 */
export function safeSetToStorage(
  key: string,
  data: any,
  version?: number
): boolean {
  try {
    const dataToStore = version !== undefined 
      ? { _version: version, data }
      : data;
    
    localStorage.setItem(key, JSON.stringify(dataToStore));
    return true;
  } catch (error) {
    logger.error(`Storage: Error saving ${key}:`, error);
    
    // Check if quota exceeded
    if (error instanceof DOMException) {
      if (error.name === 'QuotaExceededError') {
        logger.error('Storage: Quota exceeded - localStorage is full');
        
        // Show user-friendly error
        if (typeof window !== 'undefined') {
          alert('Storage quota exceeded. Please clear some old invoices or archived appeals.');
        }
      }
    }
    
    return false;
  }
}

/**
 * Remove item from localStorage safely
 */
export function safeRemoveFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error(`Storage: Error removing ${key}:`, error);
    return false;
  }
}

/**
 * Clear all localStorage safely
 */
export function safeClearStorage(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    logger.error('Storage: Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Get all keys from localStorage
 */
export function getStorageKeys(): string[] {
  try {
    return Object.keys(localStorage);
  } catch (error) {
    logger.error('Storage: Error getting keys:', error);
    return [];
  }
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): {
  used: number;
  available: number;
  percentage: number;
} {
  try {
    let used = 0;
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (item) {
        // Calculate size in bytes (approximate)
        used += item.length + key.length;
      }
    }
    
    // Most browsers have 5-10MB limit, we'll assume 5MB
    const available = 5 * 1024 * 1024; // 5MB in bytes
    const percentage = (used / available) * 100;
    
    return {
      used,
      available,
      percentage: Math.round(percentage * 100) / 100
    };
  } catch (error) {
    logger.error('Storage: Error getting storage info:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}
