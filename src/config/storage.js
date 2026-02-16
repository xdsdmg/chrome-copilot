/**
 * Chrome Copilot - Storage Manager
 * 
 * This module provides a unified interface for storing and retrieving
 * extension data using Chrome's storage API.
 */

import { DEFAULT_CONFIG, STORAGE_KEYS } from '../core/constants.js';

/**
 * Storage manager class
 */
export class Storage {
  /**
   * Save configuration to storage
   * @param {Object} config - Configuration object
   * @returns {Promise<void>}
   */
  static async saveConfig(config) {
    try {
      // Merge with default config to ensure all fields exist
      const completeConfig = {
        ...DEFAULT_CONFIG,
        ...config,
        // Ensure arrays are properly copied
        customPrompts: config.customPrompts || DEFAULT_CONFIG.customPrompts
      };
      
      await chrome.storage.sync.set({ [STORAGE_KEYS.CONFIG]: completeConfig });
      console.debug('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  /**
   * Load configuration from storage
   * @returns {Promise<Object>} Configuration object
   */
  static async loadConfig() {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
      const config = result[STORAGE_KEYS.CONFIG];
      
      if (!config) {
        // Return default config if none exists
        return { ...DEFAULT_CONFIG };
      }
      
      // Merge with defaults to ensure new fields are added
      return {
        ...DEFAULT_CONFIG,
        ...config,
        // Ensure arrays are properly merged
        customPrompts: config.customPrompts || DEFAULT_CONFIG.customPrompts
      };
    } catch (error) {
      console.error('Error loading configuration:', error);
      // Return default config on error
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save API key securely
   * @param {string} provider - LLM provider
   * @param {string} apiKey - API key
   * @returns {Promise<void>}
   */
  static async saveApiKey(provider, apiKey) {
    try {
      if (!provider || !apiKey) {
        throw new Error('Provider and API key are required');
      }
      
      // Store in local storage (more secure than sync)
      await chrome.storage.local.set({ 
        [`apiKey_${provider}`]: apiKey.trim() 
      });
      console.debug(`API key saved for provider: ${provider}`);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  }

  /**
   * Get API key for provider
   * @param {string} provider - LLM provider
   * @returns {Promise<string|null>} API key or null if not found
   */
  static async getApiKey(provider) {
    try {
      if (!provider) {
        return null;
      }
      
      const result = await chrome.storage.local.get(`apiKey_${provider}`);
      const apiKey = result[`apiKey_${provider}`];
      
      return apiKey || null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  /**
   * Delete API key for provider
   * @param {string} provider - LLM provider
   * @returns {Promise<void>}
   */
  static async deleteApiKey(provider) {
    try {
      await chrome.storage.local.remove(`apiKey_${provider}`);
      console.debug(`API key deleted for provider: ${provider}`);
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  }

  /**
   * Save entry to history
   * @param {Object} entry - History entry
   * @returns {Promise<void>}
   */
  static async saveToHistory(entry) {
    try {
      const config = await this.loadConfig();
      
      // Only save history if enabled
      if (!config.saveHistory) {
        return;
      }
      
      const history = await this.getHistory();
      
      // Add new entry with ID and timestamp
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...entry
      };
      
      // Add to beginning of array
      history.unshift(historyEntry);
      
      // Limit history size
      const maxItems = config.maxHistoryItems || 50;
      if (history.length > maxItems) {
        history.length = maxItems;
      }
      
      await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history });
      console.debug('Entry saved to history');
    } catch (error) {
      console.error('Error saving to history:', error);
      throw error;
    }
  }

  /**
   * Get history entries
   * @returns {Promise<Array>} Array of history entries
   */
  static async getHistory() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
      const history = result[STORAGE_KEYS.HISTORY] || [];
      
      // Ensure each entry has required fields
      return history.map(entry => ({
        id: entry.id || Date.now(),
        timestamp: entry.timestamp || new Date().toISOString(),
        text: entry.text || '',
        result: entry.result || '',
        context: entry.context || {},
        provider: entry.provider || 'unknown',
        model: entry.model || 'unknown'
      }));
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  /**
   * Clear all history entries
   * @returns {Promise<void>}
   */
  static async clearHistory() {
    try {
      await chrome.storage.local.remove(STORAGE_KEYS.HISTORY);
      console.debug('History cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }

  /**
   * Clear all extension data
   * @returns {Promise<void>}
   */
  static async clearAllData() {
    try {
      await Promise.all([
        chrome.storage.sync.clear(),
        chrome.storage.local.clear()
      ]);
      console.debug('All extension data cleared');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  /**
   * Get storage usage information
   * @returns {Promise<Object>} Storage usage stats
   */
  static async getStorageUsage() {
    try {
      const [syncBytes, localBytes] = await Promise.all([
        chrome.storage.sync.getBytesInUse(null),
        chrome.storage.local.getBytesInUse(null)
      ]);
      
      return {
        sync: {
          bytes: syncBytes,
          percent: (syncBytes / chrome.storage.sync.QUOTA_BYTES) * 100
        },
        local: {
          bytes: localBytes,
          percent: (localBytes / chrome.storage.local.QUOTA_BYTES) * 100
        }
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { sync: { bytes: 0, percent: 0 }, local: { bytes: 0, percent: 0 } };
    }
  }

  /**
   * Export all data as JSON
   * @returns {Promise<string>} JSON string of all data
   */
  static async exportData() {
    try {
      const [config, history, syncData, localData] = await Promise.all([
        this.loadConfig(),
        this.getHistory(),
        chrome.storage.sync.get(null),
        chrome.storage.local.get(null)
      ]);
      
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        config,
        history,
        syncData,
        localData: {
          ...localData,
          // Mask API keys in export
          apiKey_openai: localData.apiKey_openai ? '[REDACTED]' : undefined,
          apiKey_anthropic: localData.apiKey_anthropic ? '[REDACTED]' : undefined,
          apiKey_custom: localData.apiKey_custom ? '[REDACTED]' : undefined
        }
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import data from JSON
   * @param {string} jsonData - JSON string of data to import
   * @returns {Promise<void>}
   */
  static async importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate import data
      if (!data.version || !data.config) {
        throw new Error('Invalid import data format');
      }
      
      // Save configuration
      if (data.config) {
        await this.saveConfig(data.config);
      }
      
      // Save history
      if (data.history && Array.isArray(data.history)) {
        await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: data.history });
      }
      
      console.debug('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}