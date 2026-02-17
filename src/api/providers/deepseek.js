/**
 * Chrome Copilot - DeepSeek Provider
 * 
 * This module handles communication with the DeepSeek API.
 * DeepSeek API is compatible with OpenAI ChatCompletion format.
 */

/**
 * DeepSeek API provider
 */
export class DeepSeekProvider {
  /**
   * Default API endpoint
   */
  static get DEFAULT_ENDPOINT() {
    return 'https://api.deepseek.com/v1/chat/completions';
  }

  /**
   * Default model
   */
  static get DEFAULT_MODEL() {
    return 'deepseek-chat';
  }

  /**
   * Maximum tokens allowed for this provider
   */
  static get MAX_TOKENS() {
    return 4096;
  }

  /**
   * Call DeepSeek API
   * @param {string} apiKey - DeepSeek API key
   * @param {string} prompt - Prompt text
   * @param {string} model - Model name
   * @param {Object} options - Additional options
   * @returns {Promise<string>} API response text
   */
  static async call(apiKey, prompt, model = this.DEFAULT_MODEL, options = {}) {
    // Validate inputs
    this.validateInputs(apiKey, prompt, model);
    
    // Prepare request
    const endpoint = options.endpoint || this.DEFAULT_ENDPOINT;
    const maxTokens = Math.min(options.maxTokens || 1000, this.MAX_TOKENS);
    const temperature = this.clamp(options.temperature || 0.7, 0, 2);
    
    const requestBody = {
      model: model,
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
      temperature: temperature,
      top_p: options.topP || 1,
      frequency_penalty: options.frequencyPenalty || 0,
      presence_penalty: options.presencePenalty || 0,
      stream: false
    };
    
    // Add optional parameters
    if (options.stop) {
      requestBody.stop = Array.isArray(options.stop) ? options.stop : [options.stop];
    }
    
    if (options.responseFormat) {
      requestBody.response_format = options.responseFormat;
    }
    
    // Make API request
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // Parse response
      const data = await response.json();
      
      // Handle errors
      if (!response.ok) {
        throw this.handleApiError(response.status, data);
      }
      
      // Extract response text
      const responseText = data.choices?.[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('No response text received from DeepSeek');
      }
      
      return responseText;
      
    } catch (error) {
      // Enhance network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Validate API inputs
   */
  static validateInputs(apiKey, prompt, model) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid DeepSeek API key');
    }
    
    // DeepSeek API keys typically start with 'sk-'
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid DeepSeek API key format. API keys should start with "sk-"');
    }
    
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt');
    }
    
    if (!model || typeof model !== 'string') {
      throw new Error('Invalid model');
    }
    
    // Validate prompt length (rough token estimate)
    const estimatedTokens = prompt.length / 4;
    if (estimatedTokens > this.MAX_TOKENS) {
      throw new Error(`Prompt too long. Estimated tokens: ${Math.round(estimatedTokens)}, max: ${this.MAX_TOKENS}`);
    }
  }

  /**
   * Handle API errors
   */
  static handleApiError(statusCode, errorData) {
    const errorCode = errorData?.error?.code || statusCode;
    const errorMessage = errorData?.error?.message || 'Unknown error';
    
    switch (errorCode) {
      case 401:
        return new Error('Invalid API key. Please check your DeepSeek API key.');
      
      case 429:
        return new Error('Rate limit exceeded. Please wait a moment and try again.');
      
      case 500:
      case 502:
      case 503:
      case 504:
        return new Error('DeepSeek API is temporarily unavailable. Please try again later.');
      
      case 'insufficient_quota':
        return new Error('Insufficient quota. Please check your DeepSeek account billing.');
      
      case 'billing_not_active':
        return new Error('Billing not active. Please set up billing in your DeepSeek account.');
      
      default:
        return new Error(`DeepSeek API error: ${errorMessage} (code: ${errorCode})`);
    }
  }

  /**
   * Clamp a value between min and max
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Estimate token count for text
   * @param {string} text - Text to estimate tokens for
   * @returns {number} Estimated token count
   */
  static estimateTokens(text) {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Get available DeepSeek models
   * @returns {Array} List of available models
   */
  static getAvailableModels() {
    return [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'General purpose chat model' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Optimized for programming tasks' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: 'Enhanced reasoning capabilities' }
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
   * Test connection to DeepSeek API
   * @param {string} apiKey - DeepSeek API key
   * @param {string} model - Model to test
   * @returns {Promise<Object>} Test result
   */
  static async testConnection(apiKey, model = this.DEFAULT_MODEL) {
    try {
      const testPrompt = 'Respond with "Test successful" only.';
      const response = await this.call(apiKey, testPrompt, model, { maxTokens: 10 });
      
      return {
        success: true,
        message: 'Connection successful',
        response: response.trim(),
        model: model
      };
      
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }
}