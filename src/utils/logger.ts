/**
 * Centralized logging utility
 * - Logs everything in development
 * - Only logs warnings/errors in production
 * - Adds consistent prefixes for filtering
 * - Prevents production console spam
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isDebug = typeof window !== 'undefined' && 
                    (window as any).__DEBUG_MODE === true;
  
  private shouldLog(level: LogLevel): boolean {
    // Always log errors and warnings
    if (level === 'error' || level === 'warn') return true;
    
    // In development, log everything
    if (this.isDevelopment) return true;
    
    // In production, only if debug mode explicitly enabled
    return this.isDebug;
  }
  
  /**
   * Debug logging - only in development
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
  
  /**
   * Info logging - only in development
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
  
  /**
   * Warning logging - always logged
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
  
  /**
   * Error logging - always logged
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
  
  /**
   * Enable debug mode in production (run in browser console)
   * Usage: window.__ENABLE_DEBUG__()
   */
  enableDebug(): void {
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG_MODE = true;
      console.log('🐛 Debug mode enabled');
    }
  }
  
  /**
   * Disable debug mode
   */
  disableDebug(): void {
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG_MODE = false;
      console.log('✅ Debug mode disabled');
    }
  }
}

export const logger = new Logger();

// Expose debug toggle to window for production debugging
if (typeof window !== 'undefined') {
  (window as any).__ENABLE_DEBUG__ = () => logger.enableDebug();
  (window as any).__DISABLE_DEBUG__ = () => logger.disableDebug();
}
