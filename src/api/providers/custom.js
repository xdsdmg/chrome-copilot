/**
 * Chrome Copilot - Custom API Provider
 * 
 * This module handles communication with custom LLM APIs.
 * Supports flexible configuration for different API formats.
 */

export class CustomProvider {
  /**
   * Default API endpoint (user must configure)
   */
  static get DEFAULT_ENDPOINT() {
    return '';
  }

  /**
   * Default model (user must configure)
   */
  static get DEFAULT_MODEL() {
    return 'custom';
  }

  /**
   * Maximum tokens allowed (configurable via options)
   */
  static get MAX_TOKENS() {
    return 4096;
  }

  /**
   * Call custom API
   * @param {string} apiKey - API key (optional, depending on API)
   * @param {string} prompt - Prompt text
   * @param {string} model - Model name
   * @param {Object} options - Additional options
   * @returns {Promise<string>} API response text
   */
  static async call(apiKey, prompt, model = this.DEFAULT_MODEL, options = {}) {
    // Validate inputs
    this.validateInputs(apiKey, prompt, model, options);
    
    // Get configuration from options
    const endpoint = options.endpoint || this.DEFAULT_ENDPOINT;
    const maxTokens = Math.min(options.maxTokens || 1000, this.MAX_TOKENS);
    const temperature = this.clamp(options.temperature || 0.7, 0, 2);
    
    // Prepare request based on API type
    const requestConfig = this.prepareRequest(apiKey, prompt, model, {
      endpoint,
      maxTokens,
      temperature,
      ...options
    });
    
    // Make API request
    try {
      const response = await fetch(requestConfig.url, requestConfig.fetchOptions);
      
      // Parse response
      const responseData = await this.parseResponse(response, options);
      
      // Extract response text based on configured path
      const responseText = this.extractResponseText(responseData, options);
      
      if (!responseText && responseText !== '') {
        throw new Error('No response text received from custom API');
      }
      
      return responseText;
      
    } catch (error) {
      // Enhance network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and API endpoint.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Validate API inputs
   */
  static validateInputs(apiKey, prompt, model, options) {
    // Endpoint is required
    const endpoint = options.endpoint || this.DEFAULT_ENDPOINT;
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('API endpoint is required for custom provider');
    }
    
    if (!this.isValidUrl(endpoint)) {
      throw new Error('Invalid API endpoint URL');
    }
    
    // Prompt validation
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt');
    }
    
    // Model validation (custom provider may accept any model)
    if (!model || typeof model !== 'string') {
      throw new Error('Invalid model');
    }
    
    // Validate prompt length (rough token estimate)
    const estimatedTokens = prompt.length / 4;
    const maxTokens = options.maxTokens || this.MAX_TOKENS;
    if (estimatedTokens > maxTokens) {
      throw new Error(`Prompt too long. Estimated tokens: ${Math.round(estimatedTokens)}, max: ${maxTokens}`);
    }
  }

  /**
   * Prepare request configuration
   */
  static prepareRequest(apiKey, prompt, model, options) {
    const {
      endpoint,
      maxTokens,
      temperature,
      apiType = 'openai', // 'openai', 'anthropic', 'generic'
      customHeaders = {},
      requestBodyTemplate = null,
      requestBodyMapping = null
    } = options;
    
    let requestBody;
    let headers;
    
    // Use custom request body template if provided
    if (requestBodyTemplate && typeof requestBodyTemplate === 'object') {
      requestBody = this.applyTemplate(requestBodyTemplate, {
        prompt,
        model,
        maxTokens,
        temperature,
        apiKey
      });
    } else if (requestBodyMapping && typeof requestBodyMapping === 'object') {
      // Use mapping to construct request body
      requestBody = this.mapRequestBody(requestBodyMapping, {
        prompt,
        model,
        maxTokens,
        temperature,
        apiKey
      });
    } else {
      // Default to API type based templates
      requestBody = this.getDefaultRequestBody(apiType, prompt, model, {
        maxTokens,
        temperature,
        apiKey
      });
    }
    
    // Prepare headers
    headers = this.prepareHeaders(apiKey, apiType, customHeaders);
    
    return {
      url: endpoint,
      fetchOptions: {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }
    };
  }

  /**
   * Get default request body based on API type
   */
  static getDefaultRequestBody(apiType, prompt, model, options) {
    const { maxTokens, temperature, apiKey } = options;
    
    switch (apiType) {
      case 'openai':
        return {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides clear, accurate, and concise explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature,
          stream: false
        };
        
      case 'anthropic':
        return {
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature,
          stream: false
        };
        
      case 'generic':
      default:
        return {
          model,
          prompt,
          max_tokens: maxTokens,
          temperature
        };
    }
  }

  /**
   * Prepare headers for the request
   */
  static prepareHeaders(apiKey, apiType, customHeaders) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };
    
    // Add authorization header if API key is provided
    if (apiKey) {
      switch (apiType) {
        case 'openai':
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
          
        case 'anthropic':
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
          break;
          
        default:
          headers['Authorization'] = `Bearer ${apiKey}`;
          break;
      }
    }
    
    return headers;
  }

  /**
   * Parse response based on configuration
   */
  static async parseResponse(response, options) {
    const { responseType = 'json' } = options;
    
    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response, responseType);
      throw this.handleApiError(response.status, errorData, options);
    }
    
    switch (responseType) {
      case 'json':
        return await response.json();
        
      case 'text':
        return await response.text();
        
      case 'blob':
        return await response.blob();
        
      default:
        throw new Error(`Unsupported response type: ${responseType}`);
    }
  }

  /**
   * Parse error response
   */
  static async parseErrorResponse(response, responseType) {
    try {
      switch (responseType) {
        case 'json':
          return await response.json();
          
        case 'text':
          return await response.text();
          
        default:
          return { status: response.status, statusText: response.statusText };
      }
    } catch {
      return { status: response.status, statusText: response.statusText };
    }
  }

  /**
   * Extract response text from parsed data
   */
  static extractResponseText(responseData, options) {
    const { responsePath = '' } = options;
    
    // If response path is specified, use it
    if (responsePath) {
      return this.getValueByPath(responseData, responsePath);
    }
    
    // Try to auto-detect common response formats
    return this.autoDetectResponseText(responseData);
  }

  /**
   * Auto-detect response text in common API formats
   */
  static autoDetectResponseText(data) {
    if (typeof data === 'string') {
      return data;
    }
    
    if (typeof data !== 'object' || data === null) {
      return String(data);
    }
    
    // Try OpenAI format
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    
    // Try Anthropic format
    if (data.content?.[0]?.text) {
      return data.content[0].text;
    }
    
    // Try generic completion format
    if (data.text) {
      return data.text;
    }
    
    if (data.response) {
      return data.response;
    }
    
    if (data.result) {
      return data.result;
    }
    
    if (data.output) {
      return data.output;
    }
    
    if (data.message) {
      return data.message;
    }
    
    // If none found, try to stringify the first string value found
    const firstString = this.findFirstStringValue(data);
    if (firstString !== null) {
      return firstString;
    }
    
    // Last resort: stringify the entire response
    return JSON.stringify(data, null, 2);
  }

  /**
   * Find first string value in an object (recursive)
   */
  static findFirstStringValue(obj, visited = new Set()) {
    if (visited.has(obj)) {
      return null;
    }
    visited.add(obj);
    
    if (typeof obj === 'string') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = this.findFirstStringValue(item, visited);
        if (result !== null) {
          return result;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const result = this.findFirstStringValue(obj[key], visited);
          if (result !== null) {
            return result;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Get value by dot notation path
   */
  static getValueByPath(obj, path) {
    if (!path || typeof path !== 'string') {
      return obj;
    }
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      
      if (Array.isArray(current) && /^\d+$/.test(part)) {
        current = current[parseInt(part, 10)];
      } else {
        current = current[part];
      }
    }
    
    return current;
  }

  /**
   * Apply template to create request body
   */
  static applyTemplate(template, values) {
    const result = JSON.parse(JSON.stringify(template));
    
    const replaceValues = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // Replace placeholders like {{prompt}}, {{model}}, etc.
          obj[key] = obj[key].replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
            return values[placeholder] !== undefined ? values[placeholder] : match;
          });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          replaceValues(obj[key]);
        }
      }
    };
    
    replaceValues(result);
    return result;
  }

  /**
   * Map values to request body using mapping object
   */
  static mapRequestBody(mapping, values) {
    const result = {};
    
    for (const [targetKey, sourceKey] of Object.entries(mapping)) {
      if (sourceKey in values) {
        result[targetKey] = values[sourceKey];
      } else if (sourceKey.startsWith('literal:')) {
        result[targetKey] = sourceKey.substring(8);
      }
    }
    
    return result;
  }

  /**
   * Handle API errors
   */
  static handleApiError(statusCode, errorData, options) {
    const errorCode = errorData?.error?.code || statusCode;
    const errorMessage = errorData?.error?.message || errorData?.message || 'Unknown error';
    
    // Custom error handling configuration
    const errorMapping = options.errorMapping || {};
    
    if (errorMapping[statusCode]) {
      return new Error(errorMapping[statusCode]);
    }
    
    if (errorMapping[errorCode]) {
      return new Error(errorMapping[errorCode]);
    }
    
    switch (statusCode) {
      case 400:
        return new Error('Bad request. Please check your API configuration.');
        
      case 401:
      case 403:
        return new Error('Authentication failed. Please check your API key.');
        
      case 404:
        return new Error('API endpoint not found. Please check the URL.');
        
      case 429:
        return new Error('Rate limit exceeded. Please wait a moment and try again.');
        
      case 500:
      case 502:
      case 503:
      case 504:
        return new Error('API service is temporarily unavailable. Please try again later.');
        
      default:
        return new Error(`Custom API error: ${errorMessage} (code: ${statusCode})`);
    }
  }

  /**
   * Check if URL is valid
   */
  static isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Clamp a value between min and max
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Get available models for custom provider
   * @returns {Array} List of available models
   */
  static getAvailableModels() {
    return [
      { id: 'custom', name: 'Custom Model', description: 'User-defined model' }
    ];
  }

  /**
   * Get model info
   * @param {string} modelId - Model identifier
   * @returns {Object|null} Model information
   */
  static getModelInfo(modelId) {
    const models = this.getAvailableModels();
    return models.find(model => model.id === modelId) || null;
  }

  /**
   * Test connection to custom API
   * @param {string} apiKey - API key
   * @param {string} model - Model to test
   * @param {Object} options - Additional options (must include endpoint)
   * @returns {Promise<Object>} Test result
   */
  static async testConnection(apiKey, model = this.DEFAULT_MODEL, options = {}) {
    try {
      if (!options.endpoint) {
        throw new Error('Endpoint is required for testing custom API connection');
      }
      
      const testPrompt = 'Respond with "Test successful" only.';
      const testOptions = {
        maxTokens: 10,
        ...options
      };
      
      const response = await this.call(apiKey, testPrompt, model, testOptions);
      const trimmedResponse = response.trim();
      
      return {
        success: true,
        message: 'Connection successful',
        response: trimmedResponse,
        model: model,
        endpoint: options.endpoint
      };
      
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error,
        endpoint: options.endpoint
      };
    }
  }

  /**
   * Validate custom API configuration
   * @param {Object} config - Configuration object
   * @returns {Array<string>} Array of error messages (empty if valid)
   */
  static validateConfiguration(config) {
    const errors = [];
    
    if (!config.endpoint) {
      errors.push('API endpoint is required');
    } else if (!this.isValidUrl(config.endpoint)) {
      errors.push('Invalid API endpoint URL');
    }
    
    if (config.apiType && !['openai', 'anthropic', 'generic'].includes(config.apiType)) {
      errors.push('Invalid API type. Must be "openai", "anthropic", or "generic"');
    }
    
    if (config.maxTokens && (isNaN(config.maxTokens) || config.maxTokens < 1 || config.maxTokens > 100000)) {
      errors.push('Max tokens must be between 1 and 100,000');
    }
    
    if (config.temperature && (isNaN(config.temperature) || config.temperature < 0 || config.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }
    
    return errors;
  }
}