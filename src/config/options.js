/**
 * Chrome Copilot - Options Page Controller
 * 
 * This file handles the options page UI and configuration management.
 */

import { Storage } from './storage.js';
import { LLMAPI } from '../api/api.js';
import { 
  PROVIDERS, 
  THEMES, 
  DISPLAY_LOCATIONS,
  DEFAULT_CONFIG 
} from '../core/constants.js';

/**
 * Options page controller class
 */
class OptionsController {
  constructor() {
    this.currentConfig = null;
    this.unsavedChanges = false;
    this.customPrompts = [];
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => this.init());
    
    // Warn about unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });
  }
  
  /**
   * Initialize options page
   */
  async init() {
    try {
      // Load current configuration
      await this.loadConfiguration();
      
      // Set up UI components
      this.setupNavigation();
      this.setupFormElements();
      this.setupEventListeners();
      
      // Update UI with loaded config
      await this.updateUI();
      
      // Load storage usage info
      await this.updateStorageInfo();
      
    } catch (error) {
      console.error('Failed to initialize options page:', error);
      this.showStatus('Failed to load configuration. Please refresh the page.', 'error');
    }
  }
  
  /**
   * Load configuration from storage
   */
  async loadConfiguration() {
    this.currentConfig = await Storage.loadConfig();
    this.customPrompts = [...(this.currentConfig.customPrompts || [])];
    this.unsavedChanges = false;
  }
  
  /**
   * Set up sidebar navigation
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.settings-section');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Get target section
        const sectionId = link.dataset.section;
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Show target section
        sections.forEach(section => {
          section.classList.add('hidden');
        });
        
        const targetSection = document.getElementById(`${sectionId}Section`);
        if (targetSection) {
          targetSection.classList.remove('hidden');
        }
      });
    });
  }
  
  /**
   * Set up form elements and inputs
   */
  setupFormElements() {
    // Provider dropdown change handler
    const providerSelect = document.getElementById('provider');
    providerSelect.addEventListener('change', async () => {
      this.updateModelOptions();
      this.toggleEndpointField();
      await this.loadApiKey();
      this.markUnsavedChanges();
    });
    
    // API key visibility toggle
    const toggleBtn = document.getElementById('toggleApiKey');
    const apiKeyInput = document.getElementById('apiKey');
    toggleBtn.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleBtn.innerHTML = '👁️‍🗨️ Hide';
      } else {
        apiKeyInput.type = 'password';
        toggleBtn.innerHTML = '👁️ Show';
      }
    });
    
    // History limit range display
    const historyRange = document.getElementById('maxHistoryItems');
    const historyValue = document.getElementById('historyValue');
    historyRange.addEventListener('input', () => {
      historyValue.textContent = historyRange.value;
      this.markUnsavedChanges();
    });
    
    // Import file handler
    const importFile = document.getElementById('importFile');
    const importBtn = document.getElementById('importData');
    importFile.addEventListener('change', () => {
      importBtn.disabled = !importFile.files.length;
    });
  }
  
  /**
   * Set up event listeners for buttons and actions
   */
  setupEventListeners() {
    // Save button
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveConfiguration();
    });
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Reset all settings to default values?')) {
        this.resetToDefaults();
      }
    });
    
    // Close button
    document.getElementById('closeBtn').addEventListener('click', () => {
      window.close();
    });
    
    // Test connection button
    document.getElementById('testConnection').addEventListener('click', () => {
      this.testConnection();
    });
    
    // API key help link
    document.getElementById('apiKeyHelp').addEventListener('click', (e) => {
      e.preventDefault();
      this.showApiKeyHelp();
    });
    
    // Add prompt template button
    document.getElementById('addPrompt').addEventListener('click', () => {
      this.addCustomPrompt();
    });
    
    // Export data button
    document.getElementById('exportData').addEventListener('click', () => {
      this.exportData();
    });
    
    // Import data button
    document.getElementById('importData').addEventListener('click', () => {
      this.importData();
    });
    
    // Clear history button
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
      this.clearHistory();
    });
    
    // Clear all data button
    document.getElementById('clearAllData').addEventListener('click', () => {
      this.clearAllData();
    });
    
    // About page links
    document.getElementById('viewDocumentation').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/yourusername/chrome-copilot#readme' });
    });
    
    // Form input listeners for change detection
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
      input.addEventListener('change', () => this.markUnsavedChanges());
      input.addEventListener('input', () => this.markUnsavedChanges());
    });
  }
  
  /**
   * Update UI with current configuration
   */
  async updateUI() {
    if (!this.currentConfig) return;
    
    // Provider selection
    const providerSelect = document.getElementById('provider');
    providerSelect.value = this.currentConfig.provider || DEFAULT_CONFIG.provider;
    
    // Model selection (will be populated by updateModelOptions)
    await this.updateModelOptions();
    
    // API endpoint
    const endpointInput = document.getElementById('endpoint');
    endpointInput.value = this.currentConfig.endpoint || DEFAULT_CONFIG.endpoint;
    this.toggleEndpointField();
    
    // Default prompt
    const defaultPrompt = document.getElementById('defaultPrompt');
    defaultPrompt.value = this.currentConfig.defaultPrompt || DEFAULT_CONFIG.defaultPrompt;
    
    // Custom prompts
    this.customPrompts = [...(this.currentConfig.customPrompts || DEFAULT_CONFIG.customPrompts)];
    this.updateCustomPromptsUI();
    
    // Theme
    const themeSelect = document.getElementById('theme');
    themeSelect.value = this.currentConfig.theme || DEFAULT_CONFIG.theme;
    
    // Display location
    const displaySelect = document.getElementById('displayLocation');
    displaySelect.value = this.currentConfig.displayLocation || DEFAULT_CONFIG.displayLocation;
    
    // Checkboxes
    document.getElementById('autoCopy').checked = this.currentConfig.autoCopy || DEFAULT_CONFIG.autoCopy;
    document.getElementById('saveHistory').checked = this.currentConfig.saveHistory || DEFAULT_CONFIG.saveHistory;
    document.getElementById('showNotifications').checked = this.currentConfig.showNotifications || false;
    
    // History limit
    const historyRange = document.getElementById('maxHistoryItems');
    const historyValue = document.getElementById('historyValue');
    const maxItems = this.currentConfig.maxHistoryItems || DEFAULT_CONFIG.maxHistoryItems;
    historyRange.value = maxItems;
    historyValue.textContent = maxItems;
    
    // Load API key for current provider
    await this.loadApiKey();
    
    // Clear unsaved changes flag
    this.unsavedChanges = false;
  }
  
  /**
   * Update model dropdown based on selected provider
   */
  async updateModelOptions() {
    const providerSelect = document.getElementById('provider');
    const modelSelect = document.getElementById('model');
    const modelHint = document.getElementById('modelHint');
    
    const provider = providerSelect.value;
    const providerInfo = PROVIDERS.find(p => p.value === provider);
    
    // Clear existing options
    modelSelect.innerHTML = '';
    
    if (providerInfo) {
      // Add provider's models
      providerInfo.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });
      
      // Set selected model
      const currentModel = this.currentConfig?.model || DEFAULT_CONFIG.model;
      modelSelect.value = currentModel;
      
      // Update hint
      modelHint.textContent = `${providerInfo.label} models available`;
    } else {
      // Custom provider
      const option = document.createElement('option');
      option.value = 'custom';
      option.textContent = 'Custom Model';
      modelSelect.appendChild(option);
      modelSelect.value = 'custom';
      modelHint.textContent = 'Custom API endpoint';
    }
  }
  
  /**
   * Toggle API endpoint field visibility
   */
  toggleEndpointField() {
    const providerSelect = document.getElementById('provider');
    const endpointGroup = document.getElementById('endpointGroup');
    
    if (providerSelect.value === 'custom') {
      endpointGroup.classList.remove('hidden');
    } else {
      endpointGroup.classList.add('hidden');
    }
  }
  
  /**
   * Load API key for current provider
   */
  async loadApiKey() {
    const providerSelect = document.getElementById('provider');
    const apiKeyInput = document.getElementById('apiKey');
    const apiKeyHint = document.getElementById('apiKeyHint');
    
    const apiKey = await Storage.getApiKey(providerSelect.value);
    apiKeyInput.value = apiKey || '';
    
    if (apiKeyHint) {
      if (!apiKey) {
        apiKeyHint.textContent = `No API key configured for ${providerSelect.options[providerSelect.selectedIndex].text}. Please enter your API key.`;
        apiKeyHint.style.color = 'var(--color-warning)';
      } else {
        apiKeyHint.textContent = 'API key configured. Click the eye icon to view.';
        apiKeyHint.style.color = 'var(--color-success)';
      }
    }
  }
  
  /**
   * Update custom prompts UI
   */
  updateCustomPromptsUI() {
    const container = document.getElementById('customPromptsContainer');
    container.innerHTML = '';
    
    if (this.customPrompts.length === 0) {
      container.innerHTML = `
        <div class="empty-prompts">
          <p>No custom prompts yet. Add your first template!</p>
        </div>
      `;
      return;
    }
    
    this.customPrompts.forEach((prompt, index) => {
      const promptElement = this.createPromptElement(prompt, index);
      container.appendChild(promptElement);
    });
  }
  
  /**
   * Create a custom prompt UI element
   */
  createPromptElement(prompt, index) {
    const element = document.createElement('div');
    element.className = 'prompt-item';
    element.innerHTML = `
      <div class="prompt-header">
        <input type="text" class="prompt-name" value="${this.escapeHtml(prompt.name)}" 
               placeholder="Template Name" data-index="${index}">
        <button type="button" class="btn btn-small btn-danger delete-prompt" data-index="${index}">
          🗑️ Delete
        </button>
      </div>
      <textarea class="prompt-template" rows="3" data-index="${index}"
                placeholder="Enter prompt template with {text} variable">${this.escapeHtml(prompt.template)}</textarea>
    `;
    
    // Add event listeners
    const nameInput = element.querySelector('.prompt-name');
    const templateInput = element.querySelector('.prompt-template');
    const deleteBtn = element.querySelector('.delete-prompt');
    
    nameInput.addEventListener('input', () => {
      this.updateCustomPrompt(index, 'name', nameInput.value);
      this.markUnsavedChanges();
    });
    
    templateInput.addEventListener('input', () => {
      this.updateCustomPrompt(index, 'template', templateInput.value);
      this.markUnsavedChanges();
    });
    
    deleteBtn.addEventListener('click', () => {
      this.deleteCustomPrompt(index);
    });
    
    return element;
  }
  
  /**
   * Add a new custom prompt
   */
  addCustomPrompt() {
    const newPrompt = {
      name: `New Template ${this.customPrompts.length + 1}`,
      template: 'Explain this text: {text}'
    };
    
    this.customPrompts.push(newPrompt);
    this.updateCustomPromptsUI();
    this.markUnsavedChanges();
  }
  
  /**
   * Update a custom prompt
   */
  updateCustomPrompt(index, field, value) {
    if (this.customPrompts[index]) {
      this.customPrompts[index][field] = value;
    }
  }
  
  /**
   * Delete a custom prompt
   */
  deleteCustomPrompt(index) {
    if (confirm('Delete this prompt template?')) {
      this.customPrompts.splice(index, 1);
      this.updateCustomPromptsUI();
      this.markUnsavedChanges();
    }
  }
  
  /**
   * Save configuration to storage
   */
  async saveConfiguration() {
    try {
      // Collect form values
      const provider = document.getElementById('provider').value;
      const apiKey = document.getElementById('apiKey').value.trim();
      const model = document.getElementById('model').value;
      const endpoint = document.getElementById('endpoint').value.trim();
      const defaultPrompt = document.getElementById('defaultPrompt').value.trim();
      const theme = document.getElementById('theme').value;
      const displayLocation = document.getElementById('displayLocation').value;
      const autoCopy = document.getElementById('autoCopy').checked;
      const saveHistory = document.getElementById('saveHistory').checked;
      const showNotifications = document.getElementById('showNotifications').checked;
      const maxHistoryItems = parseInt(document.getElementById('maxHistoryItems').value);
      
      // Validate required fields
      if (!provider) {
        throw new Error('Please select an LLM provider');
      }
      
      if (!apiKey && provider !== 'custom') {
        throw new Error('API key is required for this provider');
      }
      
      if (!model) {
        throw new Error('Please select a model');
      }
      
      if (provider === 'custom' && !endpoint) {
        throw new Error('API endpoint is required for custom provider');
      }
      
      // Build config object
      const config = {
        provider,
        model,
        endpoint: provider === 'custom' ? endpoint : (endpoint || DEFAULT_CONFIG.endpoint),
        defaultPrompt: defaultPrompt || DEFAULT_CONFIG.defaultPrompt,
        customPrompts: this.customPrompts,
        theme,
        displayLocation,
        autoCopy,
        saveHistory,
        showNotifications,
        maxHistoryItems
      };
      
      // Save API key separately
      if (apiKey) {
        await Storage.saveApiKey(provider, apiKey);
      }
      
      // Save configuration
      await Storage.saveConfig(config);
      
      // Update current config
      this.currentConfig = config;
      this.unsavedChanges = false;
      
      // Show success message
      this.showStatus('Settings saved successfully!', 'success');
      
      // Update extension status
      chrome.runtime.sendMessage({ action: 'updateStatus' });
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      this.showStatus(`Failed to save settings: ${error.message}`, 'error');
    }
  }
  
  /**
   * Reset configuration to defaults
   */
  async resetToDefaults() {
    try {
      // Clear all data
      await Storage.clearAllData();
      
      // Reload configuration (will load defaults)
      await this.loadConfiguration();
      
      // Update UI
      await this.updateUI();
      
      // Show success message
      this.showStatus('Settings reset to defaults', 'success');
      
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      this.showStatus('Failed to reset settings', 'error');
    }
  }
  
  /**
   * Test connection to LLM API
   */
  async testConnection() {
    try {
      const testBtn = document.getElementById('testConnection');
      const testResult = document.getElementById('testResult');
      
      testBtn.disabled = true;
      testBtn.innerHTML = '<span class="btn-icon">⏳</span> Testing...';
      testResult.classList.add('hidden');
      
      const provider = document.getElementById('provider').value;
      const apiKey = document.getElementById('apiKey').value.trim();
      const model = document.getElementById('model').value;
      const endpoint = document.getElementById('endpoint').value.trim();
      
      if (!apiKey) {
        throw new Error('Please enter an API key first');
      }
      
      const result = await LLMAPI.testConnection(provider, apiKey, model, endpoint);
      
      if (result.success) {
        testResult.innerHTML = `
          <div class="test-success">
            <strong>✓ Connection successful!</strong>
            <p>API responded: "${this.escapeHtml(result.response?.trim() || 'OK')}"</p>
          </div>
        `;
      } else {
        testResult.innerHTML = `
          <div class="test-error">
            <strong>✗ Connection failed</strong>
            <p>${this.escapeHtml(result.message)}</p>
            <p>Please check your API key and configuration.</p>
          </div>
        `;
      }
      testResult.classList.remove('hidden');
      
    } catch (error) {
      console.error('Connection test failed:', error);
      
      const testResult = document.getElementById('testResult');
      testResult.innerHTML = `
        <div class="test-error">
          <strong>✗ Connection failed</strong>
          <p>${this.escapeHtml(error.message)}</p>
        </div>
      `;
      testResult.classList.remove('hidden');
      
    } finally {
      const testBtn = document.getElementById('testConnection');
      testBtn.disabled = false;
      testBtn.innerHTML = '<span class="btn-icon">🔍</span> Test Connection';
    }
  }
  
  /**
   * Show API key help
   */
  showApiKeyHelp() {
    const provider = document.getElementById('provider').value;
    let helpUrl = '';
    
    switch (provider) {
      case 'openai':
        helpUrl = 'https://platform.openai.com/api-keys';
        break;
      case 'anthropic':
        helpUrl = 'https://console.anthropic.com/settings/keys';
        break;
      case 'deepseek':
        helpUrl = 'https://platform.deepseek.com/api-keys';
        break;
      default:
        helpUrl = 'https://github.com/yourusername/chrome-copilot#api-key-setup';
    }
    
    chrome.tabs.create({ url: helpUrl });
  }
  
  /**
   * Export all data
   */
  async exportData() {
    try {
      const data = await Storage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chrome-copilot-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      this.showStatus('Data exported successfully', 'success');
      
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showStatus('Failed to export data', 'error');
    }
  }
  
  /**
   * Import data from file
   */
  async importData() {
    const fileInput = document.getElementById('importFile');
    
    if (!fileInput.files.length) {
      this.showStatus('Please select a file to import', 'error');
      return;
    }
    
    try {
      const file = fileInput.files[0];
      const text = await file.text();
      
      if (confirm('This will overwrite your current settings. Continue?')) {
        await Storage.importData(text);
        
        // Reload configuration
        await this.loadConfiguration();
        await this.updateUI();
        
        this.showStatus('Data imported successfully', 'success');
        
        // Clear file input
        fileInput.value = '';
        document.getElementById('importData').disabled = true;
      }
      
    } catch (error) {
      console.error('Error importing data:', error);
      this.showStatus(`Failed to import data: ${error.message}`, 'error');
    }
  }
  
  /**
   * Clear history
   */
  async clearHistory() {
    if (confirm('Clear all query history? This cannot be undone.')) {
      try {
        await Storage.clearHistory();
        this.showStatus('History cleared', 'success');
      } catch (error) {
        console.error('Error clearing history:', error);
        this.showStatus('Failed to clear history', 'error');
      }
    }
  }
  
  /**
   * Clear all data
   */
  async clearAllData() {
    if (confirm('Clear ALL extension data including settings and history? This cannot be undone.')) {
      try {
        await Storage.clearAllData();
        
        // Reload configuration
        await this.loadConfiguration();
        await this.updateUI();
        
        this.showStatus('All data cleared', 'success');
      } catch (error) {
        console.error('Error clearing all data:', error);
        this.showStatus('Failed to clear data', 'error');
      }
    }
  }
  
  /**
   * Update storage usage information
   */
  async updateStorageInfo() {
    try {
      const usage = await Storage.getStorageUsage();
      const storageInfo = document.getElementById('storageInfo');
      
      const syncPercent = Math.round(usage.sync.percent);
      const localPercent = Math.round(usage.local.percent);
      
      storageInfo.innerHTML = `
        Storage: ${syncPercent}% sync, ${localPercent}% local
      `;
      
    } catch (error) {
      console.error('Error updating storage info:', error);
    }
  }
  
  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    
    statusElement.textContent = message;
    statusElement.className = `status-message status-${type}`;
    statusElement.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusElement.classList.add('hidden');
    }, 5000);
  }
  
  /**
   * Mark that there are unsaved changes
   */
  markUnsavedChanges() {
    this.unsavedChanges = true;
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerHTML = '<span class="btn-icon">💾</span> Save Changes*';
  }
  
  /**
   * Helper: Escape HTML for safe insertion
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize options controller when script loads
const optionsController = new OptionsController();