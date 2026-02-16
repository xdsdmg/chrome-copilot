/**
 * Chrome Copilot - Popup Controller
 * 
 * This file handles the popup UI interactions, state management,
 * and communication with background script and other modules.
 */

import { Storage } from '../config/storage.js';
import { LLMAPI } from '../api/api.js';
import { Display } from '../display/display.js';
import { 
  ACTION_TYPES, 
  PROVIDERS, 
  ERROR_MESSAGES,
  DEFAULT_CONFIG 
} from '../core/constants.js';

/**
 * Main popup controller class
 */
class PopupController {
  constructor() {
    this.currentView = 'config';
    this.currentResult = null;
    this.currentError = null;
    this.isProcessing = false;
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => this.init());
  }
  
  /**
   * Initialize popup
   */
  async init() {
    try {
      // Get current state from background script
      await this.loadCurrentState();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Update UI based on current state
      await this.updateStatus();
      await this.loadQuickSettings();
      await this.loadHistory();
      
      // Show appropriate view based on state
      this.determineInitialView();
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showError('Failed to load extension data. Please try again.');
    }
  }
  
  /**
   * Load current state from background script storage
   */
  async loadCurrentState() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: ACTION_TYPES.GET_SELECTION
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      this.currentResult = response.lastResult || null;
      this.currentError = response.lastError || null;
      this.isProcessing = response.processing || false;
      
    } catch (error) {
      console.debug('Could not load current state:', error);
      // Continue with default state
    }
  }
  
  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Navigation and actions
    document.getElementById('openSettings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    document.getElementById('openSettingsFromError').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    document.getElementById('testSelection').addEventListener('click', () => {
      this.testWithCurrentSelection();
    });
    
    document.getElementById('retryBtn').addEventListener('click', () => {
      this.retryLastAction();
    });
    
    // Result actions
    document.getElementById('copyResult').addEventListener('click', () => {
      this.copyResultToClipboard();
    });
    
    document.getElementById('clearResult').addEventListener('click', () => {
      this.clearResult();
    });
    
    // History actions
    document.getElementById('clearHistory').addEventListener('click', () => {
      this.clearHistory();
    });
    
    document.getElementById('viewAllHistory').addEventListener('click', (e) => {
      e.preventDefault();
      // TODO: Implement history view
      this.showError('History view not implemented yet');
    });
    
    document.getElementById('reportIssue').addEventListener('click', (e) => {
      e.preventDefault();
      this.reportIssue();
    });
    
    // Quick settings changes
    document.getElementById('quickModel').addEventListener('change', (e) => {
      this.updateQuickSetting('model', e.target.value);
    });
    
    document.getElementById('quickPrompt').addEventListener('change', (e) => {
      this.updateQuickSetting('defaultPrompt', e.target.value);
    });
  }
  
  /**
   * Update connection status display
   */
  async updateStatus() {
    try {
      const config = await Storage.loadConfig();
      const apiKey = await Storage.getApiKey(config.provider);
      
      const statusIndicator = document.getElementById('statusIndicator');
      const statusText = document.getElementById('statusText');
      
      if (apiKey) {
        statusIndicator.classList.add('connected');
        statusIndicator.classList.remove('disconnected');
        statusText.textContent = `Connected to ${config.provider}`;
      } else {
        statusIndicator.classList.add('disconnected');
        statusIndicator.classList.remove('connected');
        statusText.textContent = 'API key not configured';
      }
      
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }
  
  /**
   * Load quick settings dropdowns
   */
  async loadQuickSettings() {
    try {
      const config = await Storage.loadConfig();
      
      // Load model dropdown
      await this.populateModelDropdown(config);
      
      // Load prompt template dropdown
      await this.populatePromptDropdown(config);
      
    } catch (error) {
      console.error('Error loading quick settings:', error);
    }
  }
  
  /**
   * Populate model dropdown based on selected provider
   */
  async populateModelDropdown(config) {
    const modelSelect = document.getElementById('quickModel');
    modelSelect.innerHTML = '';
    
    const provider = PROVIDERS.find(p => p.value === config.provider);
    if (!provider) {
      const option = document.createElement('option');
      option.value = config.model || DEFAULT_CONFIG.model;
      option.textContent = config.model || DEFAULT_CONFIG.model;
      modelSelect.appendChild(option);
      return;
    }
    
    provider.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      option.selected = model === config.model;
      modelSelect.appendChild(option);
    });
  }
  
  /**
   * Populate prompt template dropdown
   */
  async populatePromptDropdown(config) {
    const promptSelect = document.getElementById('quickPrompt');
    promptSelect.innerHTML = '';
    
    // Add default prompt
    const defaultOption = document.createElement('option');
    defaultOption.value = 'default';
    defaultOption.textContent = 'Default Prompt';
    defaultOption.selected = true;
    promptSelect.appendChild(defaultOption);
    
    // Add custom prompts
    if (config.customPrompts && config.customPrompts.length > 0) {
      config.customPrompts.forEach(prompt => {
        const option = document.createElement('option');
        option.value = prompt.template;
        option.textContent = prompt.name;
        promptSelect.appendChild(option);
      });
    }
  }
  
  /**
   * Load recent query history
   */
  async loadHistory() {
    try {
      const history = await Storage.getHistory();
      const historyList = document.getElementById('historyList');
      
      // Clear existing items except empty state
      const existingItems = historyList.querySelectorAll('.history-item');
      existingItems.forEach(item => item.remove());
      
      // Remove empty state if we have items
      const emptyState = historyList.querySelector('.empty-state');
      if (history.length > 0 && emptyState) {
        emptyState.remove();
      }
      
      // Add history items (limit to 5)
      history.slice(0, 5).forEach(item => {
        const historyItem = this.createHistoryItem(item);
        historyList.appendChild(historyItem);
      });
      
      // Add empty state back if no items
      if (history.length === 0 && !emptyState) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
          <p>No recent queries yet.</p>
          <p>Select text and right-click to get started!</p>
        `;
        historyList.appendChild(emptyState);
      }
      
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }
  
  /**
   * Create a history item element
   */
  createHistoryItem(item) {
    const element = document.createElement('div');
    element.className = 'history-item';
    element.innerHTML = `
      <div class="history-content">
        <div class="history-text">${this.truncateText(item.text, 60)}</div>
        <div class="history-meta">
          <span class="history-time">${this.formatTime(item.timestamp)}</span>
          <span class="history-provider">${item.provider}</span>
        </div>
      </div>
      <button class="history-action" data-id="${item.id}">
        <span class="action-icon">↻</span>
      </button>
    `;
    
    // Add click handler to re-run the query
    const actionBtn = element.querySelector('.history-action');
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.reRunQuery(item);
    });
    
    // Add click handler to view result
    element.addEventListener('click', () => {
      this.showHistoryResult(item);
    });
    
    return element;
  }
  
  /**
   * Test extension with current page selection
   */
  async testWithCurrentSelection() {
    try {
      this.showLoading('Getting current selection...');
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Ask content script for current selection
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: ACTION_TYPES.GET_SELECTION
      });
      
      if (!response?.selection) {
        this.showError(ERROR_MESSAGES.NO_SELECTION);
        return;
      }
      
      // Process the selection
      await this.processSelection(response.selection, {
        title: tab.title,
        url: tab.url,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error testing with current selection:', error);
      
      if (error.message?.includes('Could not establish connection')) {
        this.showError('Cannot access current page. Try refreshing the page.');
      } else {
        this.showError(error.message || ERROR_MESSAGES.API_ERROR);
      }
    }
  }
  
  /**
   * Process text selection
   */
  async processSelection(text, context) {
    try {
      this.showLoading('Processing with AI...');
      
      const config = await Storage.loadConfig();
      const result = await LLMAPI.processText(text, context, {
        promptTemplate: config.defaultPrompt
      });
      
      this.showResult(result, { text, context });
      
    } catch (error) {
      console.error('Error processing selection:', error);
      this.showError(error.message || ERROR_MESSAGES.API_ERROR);
    }
  }
  
  /**
   * Show result in popup
   */
  showResult(result, metadata) {
    this.currentView = 'result';
    this.currentResult = { result, metadata };
    this.currentError = null;
    
    // Update UI
    this.showView('result');
    
    // Format and display result
    const resultElement = document.getElementById('lastResult');
    resultElement.innerHTML = Display.formatResult(result);
    
    // Show metadata
    const metadataElement = document.getElementById('resultMetadata');
    metadataElement.innerHTML = `
      <div class="metadata-item">
        <strong>Source:</strong> ${metadata.context.title || 'Unknown'}
      </div>
      <div class="metadata-item">
        <strong>Time:</strong> ${new Date(metadata.context.timestamp).toLocaleTimeString()}
      </div>
    `;
    
    // Auto-copy if enabled
    const config = Storage.loadConfig().then(config => {
      if (config.autoCopy) {
        Display.copyToClipboard(result);
      }
    }).catch(console.error);
  }
  
  /**
   * Show error message
   */
  showError(message) {
    this.currentView = 'error';
    this.currentError = message;
    
    this.showView('error');
    
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
  }
  
  /**
   * Show loading state
   */
  showLoading(message = 'Processing...') {
    this.currentView = 'loading';
    this.isProcessing = true;
    
    this.showView('loading');
    
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
      loadingText.textContent = message;
    }
  }
  
  /**
   * Show specific view
   */
  showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.add('hidden');
    });
    
    // Show requested view
    const viewElement = document.getElementById(`${viewName}View`);
    if (viewElement) {
      viewElement.classList.remove('hidden');
    }
  }
  
  /**
   * Determine which view to show initially
   */
  determineInitialView() {
    if (this.isProcessing) {
      this.showView('loading');
    } else if (this.currentError) {
      this.showError(this.currentError);
    } else if (this.currentResult) {
      this.showResult(this.currentResult.result, this.currentResult.metadata);
    } else {
      this.showView('config');
    }
  }
  
  /**
   * Helper methods
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
  
  async updateQuickSetting(key, value) {
    try {
      const config = await Storage.loadConfig();
      config[key] = value;
      await Storage.saveConfig(config);
    } catch (error) {
      console.error('Error updating quick setting:', error);
    }
  }
  
  async copyResultToClipboard() {
    if (!this.currentResult) return;
    
    try {
      await Display.copyToClipboard(this.currentResult.result);
      // Show success feedback
      const copyBtn = document.getElementById('copyResult');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showError('Failed to copy to clipboard');
    }
  }
  
  clearResult() {
    this.currentResult = null;
    this.showView('config');
  }
  
  async clearHistory() {
    try {
      await Storage.saveToHistory([]); // Clear history
      await this.loadHistory(); // Refresh display
    } catch (error) {
      console.error('Error clearing history:', error);
      this.showError('Failed to clear history');
    }
  }
  
  retryLastAction() {
    // For now, just go back to config view
    this.showView('config');
  }
  
  reRunQuery(historyItem) {
    this.processSelection(historyItem.text, historyItem.context);
  }
  
  showHistoryResult(historyItem) {
    this.showResult(historyItem.result, {
      text: historyItem.text,
      context: historyItem.context
    });
  }
  
  reportIssue() {
    const url = 'https://github.com/yourusername/chrome-copilot/issues';
    chrome.tabs.create({ url });
  }
}

// Initialize popup controller when script loads
const popupController = new PopupController();