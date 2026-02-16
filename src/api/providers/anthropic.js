/**
 * Chrome Copilot - Anthropic Provider
 * 
 * This module handles communication with the Anthropic Claude API.
 */

/**
 * Anthropic API provider
 */
export class AnthropicProvider {
  /**
   * Default API endpoint
   */
  static get DEFAULT_ENDPOINT() {
    return 'https://api.anthropic.com/v1/messages';
  }

  /**
   * Default model
   */
  static get DEFAULT_MODEL() {
    return 'claude-3-haiku-20240307';
  }

  /**
   * Maximum tokens allowed for this provider
   */
  static get MAX_TOKENS() {
    return 4096;
  }

  /**
   * API version header required by Anthropic
   */
  static get ANTHROPIC_VERSION() {
    return '2023-06-01';
  }

  /**
   * Call Anthropic API
   * @param {string} apiKey - Anthropic API key
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
    const temperature = this.clamp(options.temperature || 0.7, 0, 1);
    
    const requestBody = {
      model: model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: temperature,
      system: options.systemPrompt || 'You are a helpful assistant that provides clear, accurate, and concise explanations.'
    };
    
    // Add optional parameters
    if (options.topP !== undefined) {
      requestBody.top_p = this.clamp(options.topP, 0, 1);
    }
    
    if (options.topK !== undefined) {
      requestBody.top_k = Math.max(1, Math.min(options.topK, 100));
    }
    
    // Make API request
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': this.ANTHROPIC_VERSION,
          'anthropic-beta': 'messages-2023-12-15'
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
      const responseText = data.content?.[0]?.text;
      
      if (!responseText) {
        throw new Error('No response text received from Anthropic');
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
      throw new Error('Invalid Anthropic API key');
    }
    
    if (!apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Anthropic API key format. API keys should start with "sk-ant-"');
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
    const errorType = errorData?.type || 'unknown_error';
    const errorMessage = errorData?.error?.message || errorData?.message || 'Unknown error';
    
    switch (errorType) {
      case 'authentication_error':
      case 'invalid_api_key':
        return new Error('Invalid API key. Please check your Anthropic API key.');
      
      case 'rate_limit_error':
        return new Error('Rate limit exceeded. Please wait a moment and try again.');
      
      case 'api_error':
      case 'overloaded_error':
        return new Error('Anthropic API is temporarily unavailable. Please try again later.');
      
      case 'payment_required':
        return new Error('Payment required. Please check your Anthropic account billing.');
      
      case 'invalid_request_error':
        if (errorMessage.includes('max_tokens')) {
          return new Error(`Request too long. Maximum tokens: ${this.MAX_TOKENS}`);
        }
        return new Error(`Invalid request: ${errorMessage}`);
      
      default:
        // Check status code for additional context
        switch (statusCode) {
          case 401:
            return new Error('Invalid API key. Please check your Anthropic API key.');
          
          case 429:
            return new Error('Rate limit exceeded. Please wait a moment and try again.');
          
          case 500:
          case 502:
          case 503:
          case 504:
            return new Error('Anthropic API is temporarily unavailable. Please try again later.');
          
          default:
            return new Error(`Anthropic API error: ${errorMessage} (type: ${errorType})`);
        }
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
   * Get available Anthropic models
   * @returns {Array} List of available models
   */
  static getAvailableModels() {
    return [
      { 
        id: 'claude-3-opus-20240229', 
        name: 'Claude 3 Opus', 
        description: 'Most powerful model for highly complex tasks'
      },
      { 
        id: 'claude-3-sonnet-20240229', 
        name: 'Claude 3 Sonnet', 
        description: 'Ideal balance of intelligence and speed'
      },
      { 
        id: 'claude-3-haiku-20240307', 
        name: 'Claude 3 Haiku', 
        description: 'Fastest and most compact model'
      }
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
   * Test connection to Anthropic API
   * @param {string} apiKey - Anthropic API key
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

  /**
   * Get system prompt suggestions
   * @returns {Array} Suggested system prompts
   */
  static getSystemPromptSuggestions() {
    return [
      {
        name: 'Helpful Assistant',
        prompt: 'You are a helpful assistant that provides clear, accurate, and concise explanations.'
      },
      {
        name: 'Technical Expert',
        prompt: 'You are a technical expert who explains complex concepts in simple terms.'
      },
      {
        name: 'Language Tutor',
        prompt: 'You are a language tutor who helps users understand and analyze text.'
      },
      {
        name: 'Research Assistant',
        prompt: 'You are a research assistant who provides detailed analysis and insights.'
      }
    ];
  }
}