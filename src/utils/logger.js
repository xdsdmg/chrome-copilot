/**
 * Logger Utility
 * 
 * Provides structured logging with different levels (debug, info, warn, error)
 * and conditional execution based on environment (development/production).
 */

export class Logger {
  /**
   * Create a new logger instance
   * @param {Object} options - Logger options
   */
  constructor(options = {}) {
    this.options = {
      name: 'ChromeCopilot',
      level: 'info', // debug, info, warn, error
      enabled: true,
      timestamp: true,
      colors: true,
      ...options
    };
    
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    this.colorMap = {
      debug: '#888',
      info: '#2277ff',
      warn: '#ffaa00',
      error: '#ff2200',
      reset: '#000'
    };
    
    // Check if we're in development mode
    this.isDevelopment = this.checkDevelopmentMode();
  }
  
  /**
   * Check if we're in development mode
   * @returns {boolean} True if in development mode
   */
  checkDevelopmentMode() {
    try {
      // Check for Chrome extension development mode
      if (chrome.runtime && chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest();
        // Development extensions often have version like "0.0.1" or "1.0.0"
        // We'll consider it development if we're not in production environment
        return !('update_url' in manifest);
      }
      
      // Check for Node.js environment
      if (typeof process !== 'undefined' && process.env) {
        return process.env.NODE_ENV === 'development';
      }
      
      // Default to development for safety
      return true;
    } catch {
      // If we can't determine, assume development
      return true;
    }
  }
  
  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  debug(message, data = null) {
    this.log('debug', message, data);
  }
  
  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  info(message, data = null) {
    this.log('info', message, data);
  }
  
  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  warn(message, data = null) {
    this.log('warn', message, data);
  }
  
  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  error(message, data = null) {
    this.log('error', message, data);
  }
  
  /**
   * Internal log method
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  log(level, message, data = null) {
    // Check if logging is enabled
    if (!this.options.enabled) {
      return;
    }
    
    // Check log level
    if (this.levels[level] < this.levels[this.options.level]) {
      return;
    }
    
    // In production, skip debug logs unless explicitly enabled
    if (!this.isDevelopment && level === 'debug') {
      return;
    }
    
    // Prepare log entry
    const entry = this.prepareLogEntry(level, message, data);
    
    // Output to console
    this.outputToConsole(level, entry);
    
    // Optionally send to remote logging service
    if (this.options.remote && level === 'error') {
      this.sendToRemote(entry);
    }
  }
  
  /**
   * Prepare a log entry object
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @returns {Object} Log entry
   */
  prepareLogEntry(level, message, data) {
    const entry = {
      level,
      message: String(message),
      timestamp: new Date().toISOString(),
      logger: this.options.name
    };
    
    // Add data if provided
    if (data !== null && data !== undefined) {
      if (data instanceof Error) {
        entry.error = {
          name: data.name,
          message: data.message,
          stack: data.stack
        };
        
        // Add additional error properties
        if (data.code) entry.error.code = data.code;
        if (data.status) entry.error.status = data.status;
        if (data.url) entry.error.url = data.url;
      } else if (typeof data === 'object') {
        entry.data = this.sanitizeData(data);
      } else {
        entry.data = data;
      }
    }
    
    // Add context if available
    if (this.options.context) {
      entry.context = this.options.context;
    }
    
    return entry;
  }
  
  /**
   * Sanitize data for logging (remove sensitive information)
   * @param {any} data - Data to sanitize
   * @returns {any} Sanitized data
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sensitiveKeys = [
      'apiKey', 'password', 'token', 'secret', 'auth',
      'key', 'credential', 'private', 'ssh'
    ];
    
    const sanitize = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => 
          typeof item === 'object' ? sanitize(item) : item
        );
      }
      
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // Check if key contains sensitive information
        const isSensitive = sensitiveKeys.some(sensitive => 
          lowerKey.includes(sensitive)
        );
        
        if (isSensitive) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitize(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };
    
    return sanitize(data);
  }
  
  /**
   * Output log entry to console
   * @param {string} level - Log level
   * @param {Object} entry - Log entry
   */
  outputToConsole(level, entry) {
    const { timestamp, message, data } = entry;
    const prefix = `[${this.options.name}]`;
    const timeStr = this.options.timestamp ? `[${new Date(timestamp).toLocaleTimeString()}]` : '';
    const levelStr = `[${level.toUpperCase()}]`;
    
    // Prepare the message parts
    const messageParts = [prefix, timeStr, levelStr, message].filter(Boolean);
    const formattedMessage = messageParts.join(' ');
    
    // Choose console method based on level
    const consoleMethod = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    }[level] || console.log;
    
    // Output with styling if colors enabled
    if (this.options.colors && this.isDevelopment) {
      const color = this.colorMap[level] || this.colorMap.reset;
      const styles = [
        `color: ${color}`,
        'font-weight: bold'
      ].join(';');
      
      consoleMethod(`%c${formattedMessage}`, styles);
      if (data) {
        consoleMethod(data);
      }
    } else {
      consoleMethod(formattedMessage);
      if (data) {
        consoleMethod(data);
      }
    }
  }
  
  /**
   * Send log entry to remote logging service
   * @param {Object} entry - Log entry
   */
  sendToRemote(entry) {
    // This is a placeholder for remote logging integration
    // In a real implementation, this would send logs to a service like Sentry, LogRocket, etc.
    
    if (!this.options.remote || !this.options.remote.endpoint) {
      return;
    }
    
    // Example remote logging implementation
    try {
      fetch(this.options.remote.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      }).catch(() => {
        // Silently fail - we don't want logging errors to break the app
      });
    } catch {
      // Ignore errors
    }
  }
  
  /**
   * Create a child logger with additional context
   * @param {Object} context - Additional context for the child logger
   * @returns {Logger} Child logger instance
   */
  child(context) {
    return new Logger({
      ...this.options,
      context: {
        ...this.options.context,
        ...context
      }
    });
  }
  
  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.options.level = level;
    }
  }
  
  /**
   * Enable or disable logging
   * @param {boolean} enabled - Whether logging is enabled
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
  }
  
  /**
   * Measure execution time of a function
   * @param {string} label - Measurement label
   * @param {Function} fn - Function to measure
   * @returns {any} Function result
   */
  async measure(label, fn) {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.debug(`${label} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
  
  /**
   * Create a scoped logger for a specific module
   * @param {string} moduleName - Module name
   * @returns {Logger} Scoped logger
   */
  static forModule(moduleName) {
    return new Logger({ name: `ChromeCopilot:${moduleName}` });
  }
}

// Create default logger instance
export const logger = new Logger();

// Convenience functions for quick logging
export const log = {
  debug: (message, data) => logger.debug(message, data),
  info: (message, data) => logger.info(message, data),
  warn: (message, data) => logger.warn(message, data),
  error: (message, data) => logger.error(message, data),
  
  // Measure execution time
  measure: (label, fn) => logger.measure(label, fn),
  
  // Create module-specific logger
  forModule: (moduleName) => Logger.forModule(moduleName)
};

// Export individual functions for tree-shaking
export const debug = (message, data) => logger.debug(message, data);
export const info = (message, data) => logger.info(message, data);
export const warn = (message, data) => logger.warn(message, data);
export const error = (message, data) => logger.error(message, data);