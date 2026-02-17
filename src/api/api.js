/**
 * Chrome Copilot - LLM API Integration Layer
 * 
 * This module provides a unified interface for communicating with various
 * LLM providers (OpenAI, Anthropic, custom) with support for prompt templating,
 * error handling, and response processing.
 */

import { Storage } from '../config/storage.js';
import { applyPromptTemplate } from './prompts.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { DeepSeekProvider } from './providers/deepseek.js';
import { CustomProvider } from './providers/custom.js';

/**
 * Main LLM API interface
 */
export class LLMAPI {
  /**
   * Process text using configured LLM provider
   * @param {string} text - Text to process
   * @param {Object} context - Page context data
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Processed text from LLM
   */
  static async processText(text, context, options = {}) {
    try {
      // Validate inputs
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input');
      }
      
      if (!context || typeof context !== 'object') {
        throw new Error('Invalid context data');
      }
      
      // Load configuration
      const config = await Storage.loadConfig();
      const provider = config.provider || 'openai';
      const model = config.model || 'gpt-3.5-turbo';
      
      // Get API key
      const apiKey = await Storage.getApiKey(provider);
      if (!apiKey) {
        throw new Error('API key not configured. Please set up your API key in extension settings.');
      }
      
      // Apply prompt template
      const promptTemplate = options.promptTemplate || config.defaultPrompt;
      const prompt = applyPromptTemplate(promptTemplate, { text, context });
      
      // Prepare request options
      const requestOptions = {
        maxTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        ...options
      };
      
      // Call appropriate provider
      let result;
      switch (provider) {
        case 'openai':
          result = await OpenAIProvider.call(
            apiKey,
            prompt,
            model,
            requestOptions
          );
          break;
          
        case 'anthropic':
          result = await AnthropicProvider.call(
            apiKey,
            prompt,
            model,
            requestOptions
          );
          break;
          
        case 'deepseek':
          result = await DeepSeekProvider.call(
            apiKey,
            prompt,
            model,
            requestOptions
          );
          break;
          
        case 'custom':
          result = await CustomProvider.call(
            config.endpoint,
            apiKey,
            prompt,
            model,
            requestOptions
          );
          break;
          
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // Validate response
      if (!result || typeof result !== 'string') {
        throw new Error('Invalid response from LLM API');
      }
      
      // Cache response (optional future enhancement)
      // await this.cacheResponse(text, context, prompt, result, provider, model);
      
      return result.trim();
      
    } catch (error) {
      console.error('LLM API processing error:', error);
      
      // Enhance error message for common issues
      let enhancedError = error.message;
      
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        enhancedError = 'Authentication failed. Please check your API key.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        enhancedError = 'Network error. Please check your connection.';
      } else if (error.message.includes('rate limit')) {
        enhancedError = 'Rate limit exceeded. Please try again later.';
      } else if (error.message.includes('quota') || error.message.includes('credit')) {
        enhancedError = 'API quota exceeded. Please check your account balance.';
      }
      
      throw new Error(enhancedError);
    }
  }
  
  /**
   * Test connection to LLM API
   * @param {string} provider - LLM provider
   * @param {string} apiKey - API key
   * @param {string} model - Model name
   * @param {string} endpoint - API endpoint (for custom provider)
   * @returns {Promise<Object>} Test result with status and message
   */
  static async testConnection(provider, apiKey, model, endpoint) {
    try {
      if (!provider || !apiKey) {
        throw new Error('Provider and API key are required');
      }
      
      const testPrompt = 'Respond with "Test successful" only.';
      let result;
      
      switch (provider) {
        case 'openai':
          result = await OpenAIProvider.call(
            apiKey,
            testPrompt,
            model || 'gpt-3.5-turbo',
            { maxTokens: 10 }
          );
          break;
          
        case 'anthropic':
          result = await AnthropicProvider.call(
            apiKey,
            testPrompt,
            model || 'claude-3-haiku-20240307',
            { maxTokens: 10 }
          );
          break;
          
        case 'deepseek':
          result = await DeepSeekProvider.call(
            apiKey,
            testPrompt,
            model || 'deepseek-chat',
            { maxTokens: 10 }
          );
          break;
          
        case 'custom':
          if (!endpoint) {
            throw new Error('Endpoint is required for custom provider');
          }
          result = await CustomProvider.call(
            endpoint,
            apiKey,
            testPrompt,
            model || 'custom',
            { maxTokens: 10 }
          );
          break;
          
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      return {
        success: true,
        message: `Connection successful: ${result.trim()}`,
        response: result
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
   * Get available models for a provider
   * @param {string} provider - LLM provider
   * @returns {Promise<Array>} List of available models
   */
  static async getAvailableModels(provider) {
    // For now, return static lists
    // In the future, this could make API calls to fetch available models
    switch (provider) {
      case 'openai':
        return [
          'gpt-4',
          'gpt-4-turbo',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-instruct'
        ];
        
      case 'anthropic':
        return [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ];
        
      case 'deepseek':
        return [
          'deepseek-chat',
          'deepseek-coder',
          'deepseek-reasoner'
        ];
        
      case 'custom':
        return ['custom'];
        
      default:
        return [];
    }
  }
  
  /**
   * Get provider capabilities
   * @param {string} provider - LLM provider
   * @returns {Object} Provider capabilities
   */
  static getProviderCapabilities(provider) {
    const capabilities = {
      openai: {
        name: 'OpenAI',
        supportsStreaming: true,
        maxTokens: 4096,
        supportsImages: true,
        pricing: 'Per token',
        website: 'https://openai.com'
      },
      anthropic: {
        name: 'Anthropic',
        supportsStreaming: true,
        maxTokens: 4096,
        supportsImages: true,
        pricing: 'Per token',
        website: 'https://anthropic.com'
      },
      deepseek: {
        name: 'DeepSeek',
        supportsStreaming: true,
        maxTokens: 4096,
        supportsImages: false,
        pricing: 'Per token',
        website: 'https://deepseek.com'
      },
      custom: {
        name: 'Custom API',
        supportsStreaming: false,
        maxTokens: null,
        supportsImages: false,
        pricing: 'Varies',
        website: null
      }
    };
    
    return capabilities[provider] || {
      name: 'Unknown',
      supportsStreaming: false,
      maxTokens: null,
      supportsImages: false,
      pricing: 'Unknown',
      website: null
    };
  }
  
  /**
   * Estimate cost for a request
   * @param {string} provider - LLM provider
   * @param {string} model - Model name
   * @param {number} inputTokens - Number of input tokens
   * @param {number} outputTokens - Number of output tokens
   * @returns {number|null} Estimated cost in USD, or null if unknown
   */
  static estimateCost(provider, model, inputTokens, outputTokens) {
    // Rough pricing estimates (per 1000 tokens)
    const pricing = {
      openai: {
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-4-turbo': { input: 0.01, output: 0.03 },
        'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
        'gpt-3.5-turbo-instruct': { input: 0.0015, output: 0.002 }
      },
      anthropic: {
        'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
        'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
        'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
      },
      deepseek: {
        'deepseek-chat': { input: 0.0014, output: 0.0028 },
        'deepseek-coder': { input: 0.0014, output: 0.0028 },
        'deepseek-reasoner': { input: 0.0014, output: 0.0028 }
      }
    };
    
    const providerPricing = pricing[provider];
    if (!providerPricing) return null;
    
    const modelPricing = providerPricing[model];
    if (!modelPricing) return null;
    
    const inputCost = (inputTokens / 1000) * modelPricing.input;
    const outputCost = (outputTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }
  
  /**
   * Cache API response (future enhancement)
   */
  static async cacheResponse(text, context, prompt, result, provider, model) {
    // This could be implemented to cache responses and reduce API calls
    // For now, it's a placeholder for future optimization
    console.debug('Caching response (not implemented yet)');
  }
  
  /**
   * Get cached response if available (future enhancement)
   */
  static async getCachedResponse(text, context, prompt, provider, model) {
    // Placeholder for caching implementation
    return null;
  }
}