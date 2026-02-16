/**
 * Status Indicator Component
 * 
 * Manages the connection status indicator in the popup header.
 */

import { Storage } from '../../config/storage.js';

export class StatusIndicator {
  /**
   * Create a new status indicator
   * @param {HTMLElement} element - The container element for the status indicator
   */
  constructor(element) {
    this.element = element;
    this.statusDot = element.querySelector('.status-dot');
    this.statusText = element.querySelector('.status-text');
    
    if (!this.statusDot || !this.statusText) {
      console.warn('Status indicator sub-elements not found. Creating defaults.');
      this.createDefaultElements();
    }
  }
  
  /**
   * Create default elements if they don't exist
   */
  createDefaultElements() {
    if (!this.statusDot) {
      this.statusDot = document.createElement('span');
      this.statusDot.className = 'status-dot';
      this.element.appendChild(this.statusDot);
    }
    
    if (!this.statusText) {
      this.statusText = document.createElement('span');
      this.statusText.className = 'status-text';
      this.element.appendChild(this.statusText);
    }
  }
  
  /**
   * Update the status indicator based on current configuration
   */
  async update() {
    try {
      const config = await Storage.loadConfig();
      const apiKey = await Storage.getApiKey(config.provider);
      
      if (apiKey) {
        this.setConnected(config.provider);
      } else {
        this.setDisconnected('API key not configured');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      this.setError('Error checking status');
    }
  }
  
  /**
   * Set status to connected
   * @param {string} provider - The provider name (e.g., 'OpenAI')
   */
  setConnected(provider) {
    this.element.className = 'status-indicator status-connected';
    this.statusText.textContent = `Connected to ${provider}`;
    this.statusDot.style.backgroundColor = 'var(--color-success)';
  }
  
  /**
   * Set status to disconnected
   * @param {string} message - The status message to display
   */
  setDisconnected(message) {
    this.element.className = 'status-indicator status-disconnected';
    this.statusText.textContent = message;
    this.statusDot.style.backgroundColor = 'var(--color-danger)';
  }
  
  /**
   * Set status to connecting/loading
   * @param {string} message - The status message to display
   */
  setConnecting(message = 'Connecting...') {
    this.element.className = 'status-indicator status-connecting';
    this.statusText.textContent = message;
    this.statusDot.style.backgroundColor = 'var(--color-warning)';
  }
  
  /**
   * Set status to error
   * @param {string} message - The status message to display
   */
  setError(message) {
    this.element.className = 'status-indicator status-error';
    this.statusText.textContent = message;
    this.statusDot.style.backgroundColor = 'var(--color-danger)';
  }
  
  /**
   * Set custom status
   * @param {string} status - Status class ('connected', 'disconnected', 'connecting', 'error')
   * @param {string} message - Status message
   * @param {string} color - CSS color for the dot
   */
  setCustom(status, message, color) {
    this.element.className = `status-indicator status-${status}`;
    this.statusText.textContent = message;
    this.statusDot.style.backgroundColor = color;
  }
  
  /**
   * Get the current status
   * @returns {string} Current status class
   */
  getCurrentStatus() {
    if (this.element.classList.contains('status-connected')) return 'connected';
    if (this.element.classList.contains('status-disconnected')) return 'disconnected';
    if (this.element.classList.contains('status-connecting')) return 'connecting';
    if (this.element.classList.contains('status-error')) return 'error';
    return 'unknown';
  }
  
  /**
   * Add click event listener to the status indicator
   * @param {Function} callback - Function to call when clicked
   */
  onClick(callback) {
    this.element.addEventListener('click', callback);
  }
  
  /**
   * Remove click event listener
   * @param {Function} callback - Function to remove
   */
  offClick(callback) {
    this.element.removeEventListener('click', callback);
  }
}

/**
 * Create a status indicator and attach it to the specified element
 * @param {string|HTMLElement} element - Element ID or HTMLElement
 * @returns {StatusIndicator} Initialized status indicator
 */
export function createStatusIndicator(element) {
  const el = typeof element === 'string' 
    ? document.getElementById(element)
    : element;
  
  if (!el) {
    throw new Error(`Status indicator element not found: ${element}`);
  }
  
  return new StatusIndicator(el);
}