/**
 * Quick Settings Component
 * 
 * Manages the quick settings dropdowns in the popup for model and prompt selection.
 */

import { Storage } from '../../config/storage.js';
import { PROVIDERS, DEFAULT_CONFIG } from '../../core/constants.js';

export class QuickSettings {
  /**
   * Create a new quick settings component
   * @param {Object} elements - Object containing element references
   * @param {HTMLElement} elements.modelSelect - Model dropdown element
   * @param {HTMLElement} elements.promptSelect - Prompt template dropdown element
   * @param {Object} options - Configuration options
   */
  constructor(elements, options = {}) {
    this.modelSelect = elements.modelSelect;
    this.promptSelect = elements.promptSelect;
    
    this.options = {
      showModel: true,
      showPrompts: true,
      includeDefaultPrompt: true,
      autoSave: true,
      ...options
    };
    
    this.config = null;
    this.onChange = null;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the quick settings component
   */
  async init() {
    try {
      // Load current configuration
      this.config = await Storage.loadConfig();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Populate dropdowns
      await this.populateModelDropdown();
      await this.populatePromptDropdown();
      
    } catch (error) {
      console.error('Error initializing quick settings:', error);
    }
  }
  
  /**
   * Set up event listeners for dropdowns
   */
  setupEventListeners() {
    if (this.modelSelect) {
      this.modelSelect.addEventListener('change', (e) => {
        this.handleModelChange(e.target.value);
      });
    }
    
    if (this.promptSelect) {
      this.promptSelect.addEventListener('change', (e) => {
        this.handlePromptChange(e.target.value);
      });
    }
  }
  
  /**
   * Populate the model dropdown based on current provider
   */
  async populateModelDropdown() {
    if (!this.modelSelect || !this.options.showModel) return;
    
    try {
      const config = this.config || await Storage.loadConfig();
      const provider = PROVIDERS.find(p => p.value === config.provider);
      
      // Clear existing options
      this.modelSelect.innerHTML = '';
      
      if (!provider) {
        // Provider not found, show current model
        const option = document.createElement('option');
        option.value = config.model || DEFAULT_CONFIG.model;
        option.textContent = config.model || DEFAULT_CONFIG.model;
        option.selected = true;
        this.modelSelect.appendChild(option);
        return;
      }
      
      // Add provider models
      provider.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        option.selected = model === config.model;
        this.modelSelect.appendChild(option);
      });
      
    } catch (error) {
      console.error('Error populating model dropdown:', error);
      
      // Add error option
      this.modelSelect.innerHTML = '';
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Error loading models';
      this.modelSelect.appendChild(option);
    }
  }
  
  /**
   * Populate the prompt template dropdown
   */
  async populatePromptDropdown() {
    if (!this.promptSelect || !this.options.showPrompts) return;
    
    try {
      const config = this.config || await Storage.loadConfig();
      
      // Clear existing options
      this.promptSelect.innerHTML = '';
      
      // Add default prompt option
      if (this.options.includeDefaultPrompt) {
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = 'Default Prompt';
        defaultOption.selected = true;
        this.promptSelect.appendChild(defaultOption);
      }
      
      // Add custom prompts
      if (config.customPrompts && config.customPrompts.length > 0) {
        config.customPrompts.forEach(prompt => {
          const option = document.createElement('option');
          option.value = prompt.template;
          option.textContent = prompt.name;
          this.promptSelect.appendChild(option);
        });
      }
      
    } catch (error) {
      console.error('Error populating prompt dropdown:', error);
      
      // Add error option
      this.promptSelect.innerHTML = '';
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Error loading prompts';
      this.promptSelect.appendChild(option);
    }
  }
  
  /**
   * Handle model selection change
   * @param {string} model - Selected model
   */
  async handleModelChange(model) {
    try {
      if (this.options.autoSave) {
        const config = await Storage.loadConfig();
        config.model = model;
        await Storage.saveConfig(config);
        this.config = config;
      }
      
      if (this.onChange) {
        this.onChange({ type: 'model', value: model });
      }
    } catch (error) {
      console.error('Error saving model change:', error);
    }
  }
  
  /**
   * Handle prompt selection change
   * @param {string} prompt - Selected prompt template
   */
  async handlePromptChange(prompt) {
    try {
      if (prompt === 'default') {
        // Use default prompt from config
        const config = await Storage.loadConfig();
        prompt = config.defaultPrompt;
      }
      
      if (this.options.autoSave) {
        // For quick settings, we might not want to save prompt selection
        // as it's a temporary choice. We could save a "last used prompt" preference.
        // For now, we'll just emit the change event.
      }
      
      if (this.onChange) {
        this.onChange({ type: 'prompt', value: prompt });
      }
    } catch (error) {
      console.error('Error handling prompt change:', error);
    }
  }
  
  /**
   * Update the component with new configuration
   * @param {Object} config - New configuration
   */
  async update(config) {
    this.config = config;
    
    // Update dropdowns
    await this.populateModelDropdown();
    await this.populatePromptDropdown();
  }
  
  /**
   * Refresh the component from storage
   */
  async refresh() {
    try {
      this.config = await Storage.loadConfig();
      await this.populateModelDropdown();
      await this.populatePromptDropdown();
    } catch (error) {
      console.error('Error refreshing quick settings:', error);
    }
  }
  
  /**
   * Get the currently selected model
   * @returns {string} Selected model
   */
  getSelectedModel() {
    if (!this.modelSelect) return null;
    return this.modelSelect.value;
  }
  
  /**
   * Get the currently selected prompt template
   * @returns {string} Selected prompt template
   */
  getSelectedPrompt() {
    if (!this.promptSelect) return null;
    
    const selectedValue = this.promptSelect.value;
    if (selectedValue === 'default') {
      return this.config?.defaultPrompt || DEFAULT_CONFIG.defaultPrompt;
    }
    
    return selectedValue;
  }
  
  /**
   * Set the selected model
   * @param {string} model - Model to select
   */
  setSelectedModel(model) {
    if (!this.modelSelect) return;
    
    for (let option of this.modelSelect.options) {
      if (option.value === model) {
        option.selected = true;
        break;
      }
    }
    
    // Trigger change event
    this.modelSelect.dispatchEvent(new Event('change'));
  }
  
  /**
   * Set the selected prompt template
   * @param {string} prompt - Prompt template to select
   */
  setSelectedPrompt(prompt) {
    if (!this.promptSelect) return;
    
    // Check if this is the default prompt
    const config = this.config || DEFAULT_CONFIG;
    if (prompt === config.defaultPrompt) {
      this.promptSelect.value = 'default';
      this.promptSelect.dispatchEvent(new Event('change'));
      return;
    }
    
    // Check custom prompts
    for (let option of this.promptSelect.options) {
      if (option.value === prompt) {
        option.selected = true;
        this.promptSelect.dispatchEvent(new Event('change'));
        return;
      }
    }
    
    // Prompt not found in dropdown
    console.warn('Prompt not found in dropdown:', prompt);
  }
  
  /**
   * Set change callback
   * @param {Function} callback - Function to call when settings change
   */
  setOnChange(callback) {
    this.onChange = callback;
  }
  
  /**
   * Enable or disable the component
   * @param {boolean} enabled - Whether to enable the component
   */
  setEnabled(enabled) {
    if (this.modelSelect) {
      this.modelSelect.disabled = !enabled;
    }
    
    if (this.promptSelect) {
      this.promptSelect.disabled = !enabled;
    }
  }
}

/**
 * Create a quick settings component
 * @param {Object} elementIds - Object containing element IDs
 * @param {string} elementIds.modelSelect - ID of model dropdown element
 * @param {string} elementIds.promptSelect - ID of prompt dropdown element
 * @param {Object} options - Configuration options
 * @returns {QuickSettings} Initialized quick settings component
 */
export function createQuickSettings(elementIds, options = {}) {
  const elements = {};
  
  if (elementIds.modelSelect) {
    elements.modelSelect = document.getElementById(elementIds.modelSelect);
  }
  
  if (elementIds.promptSelect) {
    elements.promptSelect = document.getElementById(elementIds.promptSelect);
  }
  
  return new QuickSettings(elements, options);
}