/**
 * Chrome Copilot - Application Constants
 * 
 * This file contains default configuration values and constants used throughout the extension.
 */

/**
 * Default configuration for Chrome Copilot
 * @type {import('../config/storage.js').UserConfig}
 */
export const DEFAULT_CONFIG = {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  defaultPrompt: `Explain the following text in simple terms: {text}

Context:
- Source: {context.title}
- URL: {context.url}
- Time: {context.timestamp}`,
  customPrompts: [
    { name: 'Summarize', template: 'Summarize this text: {text}' },
    { name: 'Translate to English', template: 'Translate to English: {text}' },
    { name: 'Explain like I\'m 5', template: 'Explain this like I\'m 5 years old: {text}' }
  ],
  theme: 'system',
  displayLocation: 'popup',
  autoCopy: false,
  saveHistory: true,
  maxHistoryItems: 50
};

/**
 * Supported LLM providers
 * @type {Array<{value: string, label: string, models: string[]}>}
 */
export const PROVIDERS = [
  {
    value: 'openai',
    label: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-instruct']
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner']
  },
  {
    value: 'custom',
    label: 'Custom API',
    models: ['custom']
  }
];

/**
 * Available themes
 * @type {Array<{value: string, label: string}>}
 */
export const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
];

/**
 * Display locations for results
 * @type {Array<{value: string, label: string}>}
 */
export const DISPLAY_LOCATIONS = [
  { value: 'popup', label: 'Popup' },
  { value: 'sidepanel', label: 'Side Panel' },
  { value: 'notification', label: 'Notification' }
];

/**
 * Extension action types for messaging
 * @type {Object}
 */
export const ACTION_TYPES = {
  PROCESS_SELECTION: 'processSelection',
  SELECTION_UPDATED: 'selectionUpdated',
  GET_SELECTION: 'getSelection',
  SHOW_RESULT: 'showResult',
  SHOW_ERROR: 'showError',
  UPDATE_STATUS: 'updateStatus'
};

/**
 * Error messages
 * @type {Object}
 */
export const ERROR_MESSAGES = {
  NO_API_KEY: 'API key not configured. Please set up your API key in extension settings.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  API_ERROR: 'API error. Please check your API key and configuration.',
  NO_SELECTION: 'No text selected. Please select some text first.',
  INVALID_CONFIG: 'Invalid configuration. Please check your settings.'
};

/**
 * Storage keys
 * @type {Object}
 */
export const STORAGE_KEYS = {
  CONFIG: 'config',
  HISTORY: 'history'
};

/**
 * Extension IDs and names
 * @type {Object}
 */
export const EXTENSION_INFO = {
  NAME: 'Chrome Copilot',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered text explanation tool'
};