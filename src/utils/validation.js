/**
 * Validation Utilities
 * 
 * Provides validation functions for user inputs, configuration, and API data.
 */

import { PROVIDERS, DEFAULT_CONFIG } from '../core/constants.js';

export class Validation {
  /**
   * Validate API key format (basic checks)
   * @param {string} provider - Provider name ('openai', 'anthropic', 'deepseek', 'custom')
   * @param {string} apiKey - API key to validate
   * @returns {boolean} True if API key appears valid
   */
  static validateApiKey(provider, apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Remove whitespace
    const trimmedKey = apiKey.trim();
    if (trimmedKey.length === 0) {
      return false;
    }
    
    // Provider-specific validation
    switch (provider) {
      case 'openai':
        // OpenAI keys typically start with 'sk-' and are 51 characters
        return trimmedKey.startsWith('sk-') && trimmedKey.length >= 48;
        
      case 'anthropic':
        // Anthropic keys typically start with 'sk-ant-' and are longer
        return trimmedKey.startsWith('sk-ant-') && trimmedKey.length >= 40;
        
      case 'deepseek':
        return trimmedKey.length >= 10;
        
      case 'custom':
        // Custom API keys - minimal validation
        return trimmedKey.length >= 1;
        
      default:
        // Unknown provider
        return false;
    }
  }
  
  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL appears valid
   */
  static isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  /**
   * Validate user configuration
   * @param {Object} config - Configuration object to validate
   * @returns {Array<string>} Array of error messages (empty if valid)
   */
  static validateConfig(config) {
    const errors = [];
    
    if (!config || typeof config !== 'object') {
      return ['Configuration is invalid or missing'];
    }
    
    // Validate provider
    if (!config.provider) {
      errors.push('Provider is required');
    } else if (!PROVIDERS.some(p => p.value === config.provider)) {
      errors.push(`Invalid provider: ${config.provider}`);
    }
    
    // Validate model
    if (!config.model) {
      errors.push('Model is required');
    }
    
    // Validate endpoint for custom provider
    if (config.provider === 'custom') {
      if (!config.endpoint) {
        errors.push('API endpoint is required for custom provider');
      } else if (!this.isValidUrl(config.endpoint)) {
        errors.push('Invalid API endpoint URL');
      }
    }
    
    // Validate default prompt
    if (!config.defaultPrompt || typeof config.defaultPrompt !== 'string') {
      errors.push('Default prompt is required');
    } else if (config.defaultPrompt.trim().length === 0) {
      errors.push('Default prompt cannot be empty');
    }
    
    // Validate custom prompts
    if (config.customPrompts && Array.isArray(config.customPrompts)) {
      config.customPrompts.forEach((prompt, index) => {
        if (!prompt.name || prompt.name.trim().length === 0) {
          errors.push(`Custom prompt ${index + 1}: Name is required`);
        }
        
        if (!prompt.template || prompt.template.trim().length === 0) {
          errors.push(`Custom prompt ${index + 1}: Template is required`);
        }
      });
    }
    
    // Validate theme
    if (config.theme && !['light', 'dark', 'system'].includes(config.theme)) {
      errors.push('Invalid theme selection');
    }
    
    // Validate display location
    if (config.displayLocation && !['popup', 'sidepanel', 'notification'].includes(config.displayLocation)) {
      errors.push('Invalid display location');
    }
    
    // Validate max history items
    if (config.maxHistoryItems !== undefined) {
      const maxItems = Number(config.maxHistoryItems);
      if (isNaN(maxItems) || maxItems < 1 || maxItems > 1000) {
        errors.push('Maximum history items must be between 1 and 1000');
      }
    }
    
    return errors;
  }
  
  /**
   * Validate text selection
   * @param {string} text - Selected text
   * @returns {Object} Validation result { isValid: boolean, error?: string }
   */
  static validateSelection(text) {
    if (!text || typeof text !== 'string') {
      return { isValid: false, error: 'No text selected' };
    }
    
    const trimmed = text.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Selected text is empty' };
    }
    
    if (trimmed.length > 10000) {
      return { isValid: false, error: 'Selected text is too long (max 10,000 characters)' };
    }
    
    return { isValid: true };
  }
  
  /**
   * Validate prompt template
   * @param {string} template - Prompt template
   * @returns {Object} Validation result { isValid: boolean, error?: string }
   */
  static validatePromptTemplate(template) {
    if (!template || typeof template !== 'string') {
      return { isValid: false, error: 'Prompt template is required' };
    }
    
    const trimmed = template.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Prompt template cannot be empty' };
    }
    
    if (trimmed.length > 10000) {
      return { isValid: false, error: 'Prompt template is too long (max 10,000 characters)' };
    }
    
    // Check for required variables
    if (!trimmed.includes('{text}')) {
      return { isValid: false, error: 'Prompt template must include {text} variable' };
    }
    
    return { isValid: true };
  }
  
  /**
   * Validate model selection for provider
   * @param {string} provider - Provider name
   * @param {string} model - Model name
   * @returns {boolean} True if model is valid for provider
   */
  static validateModel(provider, model) {
    const providerConfig = PROVIDERS.find(p => p.value === provider);
    if (!providerConfig) {
      return false;
    }
    
    // Custom provider accepts any model
    if (provider === 'custom') {
      return model && model.trim().length > 0;
    }
    
    return providerConfig.models.includes(model);
  }
  
  /**
   * Validate history entry
   * @param {Object} entry - History entry
   * @returns {boolean} True if entry is valid
   */
  static validateHistoryEntry(entry) {
    if (!entry || typeof entry !== 'object') {
      return false;
    }
    
    const requiredFields = ['text', 'result', 'timestamp'];
    for (const field of requiredFields) {
      if (!entry[field]) {
        return false;
      }
    }
    
    // Validate timestamp format
    try {
      const date = new Date(entry.timestamp);
      if (isNaN(date.getTime())) {
        return false;
      }
    } catch {
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate email address (basic check)
   * @param {string} email - Email address
   * @returns {boolean} True if email appears valid
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate numeric range
   * @param {number} value - Value to validate
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {boolean} True if value is within range
   */
  static isInRange(value, min, max) {
    const num = Number(value);
    if (isNaN(num)) {
      return false;
    }
    
    return num >= min && num <= max;
  }
  
  /**
   * Validate that object has all required properties
   * @param {Object} obj - Object to validate
   * @param {Array<string>} requiredProps - Required property names
   * @returns {Array<string>} Missing property names (empty if all present)
   */
  static validateRequiredProperties(obj, requiredProps) {
    if (!obj || typeof obj !== 'object') {
      return requiredProps;
    }
    
    return requiredProps.filter(prop => !(prop in obj));
  }
  
  /**
   * Validate JSON string
   * @param {string} jsonString - JSON string to validate
   * @returns {Object} Result { isValid: boolean, parsed?: any, error?: string }
   */
  static validateJson(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      return { isValid: false, error: 'Invalid JSON string' };
    }
    
    try {
      const parsed = JSON.parse(jsonString);
      return { isValid: true, parsed };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }
  
  /**
   * Validate file type
   * @param {File} file - File object
   * @param {Array<string>} allowedTypes - Allowed MIME types
   * @returns {boolean} True if file type is allowed
   */
  static validateFileType(file, allowedTypes) {
    if (!file || !file.type) {
      return false;
    }
    
    return allowedTypes.includes(file.type);
  }
  
  /**
   * Validate file size
   * @param {File} file - File object
   * @param {number} maxSizeBytes - Maximum size in bytes
   * @returns {boolean} True if file size is within limit
   */
  static validateFileSize(file, maxSizeBytes) {
    if (!file || !file.size) {
      return false;
    }
    
    return file.size <= maxSizeBytes;
  }
}

// Convenience functions for common validations
export const validate = {
  /**
   * Validate API key
   */
  apiKey: (provider, key) => Validation.validateApiKey(provider, key),
  
  /**
   * Validate URL
   */
  url: (url) => Validation.isValidUrl(url),
  
  /**
   * Validate configuration
   */
  config: (config) => Validation.validateConfig(config),
  
  /**
   * Validate text selection
   */
  selection: (text) => Validation.validateSelection(text),
  
  /**
   * Validate prompt template
   */
  prompt: (template) => Validation.validatePromptTemplate(template),
  
  /**
   * Validate model
   */
  model: (provider, model) => Validation.validateModel(provider, model),
  
  /**
   * Validate email
   */
  email: (email) => Validation.isValidEmail(email),
  
  /**
   * Validate JSON
   */
  json: (jsonString) => Validation.validateJson(jsonString)
};