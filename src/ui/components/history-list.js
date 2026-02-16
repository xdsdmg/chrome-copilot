/**
 * History List Component
 * 
 * Manages the display and interaction with query history.
 */

import { Storage } from '../../config/storage.js';

export class HistoryList {
  /**
   * Create a new history list
   * @param {HTMLElement} element - The container element for the history list
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      maxItems: 5,
      emptyMessage: 'No recent queries yet.',
      subMessage: 'Select text and right-click to get started!',
      showProvider: true,
      showTimestamp: true,
      clickable: true,
      ...options
    };
    
    this.items = [];
    this.onItemClick = null;
    this.onItemReRun = null;
    
    // Initialize the list
    this.init();
  }
  
  /**
   * Initialize the history list
   */
  init() {
    this.renderEmptyState();
  }
  
  /**
   * Load and display history from storage
   */
  async load() {
    try {
      this.items = await Storage.getHistory();
      this.render();
    } catch (error) {
      console.error('Error loading history:', error);
      this.renderError('Failed to load history');
    }
  }
  
  /**
   * Render the history list
   */
  render() {
    // Clear the element
    this.element.innerHTML = '';
    
    if (this.items.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    // Limit items based on maxItems option
    const itemsToShow = this.items.slice(0, this.options.maxItems);
    
    // Create list container
    const listContainer = document.createElement('div');
    listContainer.className = 'history-list-container';
    
    // Add each history item
    itemsToShow.forEach(item => {
      const itemElement = this.createHistoryItem(item);
      listContainer.appendChild(itemElement);
    });
    
    this.element.appendChild(listContainer);
  }
  
  /**
   * Create a history item element
   * @param {Object} item - History item data
   * @returns {HTMLElement} History item element
   */
  createHistoryItem(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'history-item';
    itemElement.dataset.id = item.id;
    
    // Format timestamp
    const timeText = this.formatTime(item.timestamp);
    
    // Create HTML structure
    itemElement.innerHTML = `
      <div class="history-item-content">
        <div class="history-text">${this.truncateText(item.text, 80)}</div>
        <div class="history-meta">
          ${this.options.showTimestamp ? `<span class="history-timestamp">${timeText}</span>` : ''}
          ${this.options.showProvider ? `<span class="history-provider">${item.provider}</span>` : ''}
        </div>
      </div>
      <button class="history-action-btn" title="Re-run this query">
        <span class="action-icon">↻</span>
      </button>
    `;
    
    // Add click handlers
    if (this.options.clickable) {
      itemElement.addEventListener('click', (e) => {
        // Don't trigger if clicking the re-run button
        if (!e.target.closest('.history-action-btn')) {
          this.handleItemClick(item);
        }
      });
    }
    
    // Add re-run button handler
    const reRunBtn = itemElement.querySelector('.history-action-btn');
    reRunBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleReRun(item);
    });
    
    return itemElement;
  }
  
  /**
   * Render empty state
   */
  renderEmptyState() {
    this.element.innerHTML = `
      <div class="empty-state">
        <p>${this.options.emptyMessage}</p>
        <p>${this.options.subMessage}</p>
      </div>
    `;
  }
  
  /**
   * Render error state
   * @param {string} message - Error message
   */
  renderError(message) {
    this.element.innerHTML = `
      <div class="error-state">
        <p>⚠️ ${message}</p>
      </div>
    `;
  }
  
  /**
   * Add a new item to the history
   * @param {Object} item - History item to add
   */
  async addItem(item) {
    try {
      await Storage.saveToHistory(item);
      await this.load(); // Reload to update display
    } catch (error) {
      console.error('Error adding history item:', error);
    }
  }
  
  /**
   * Clear all history
   */
  async clear() {
    try {
      await Storage.saveToHistory([]); // Clear history
      await this.load(); // Reload to update display
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }
  
  /**
   * Handle item click
   * @param {Object} item - Clicked history item
   */
  handleItemClick(item) {
    if (this.onItemClick) {
      this.onItemClick(item);
    }
  }
  
  /**
   * Handle re-run button click
   * @param {Object} item - History item to re-run
   */
  handleReRun(item) {
    if (this.onItemReRun) {
      this.onItemReRun(item);
    }
  }
  
  /**
   * Set item click callback
   * @param {Function} callback - Function to call when item is clicked
   */
  setOnItemClick(callback) {
    this.onItemClick = callback;
  }
  
  /**
   * Set re-run callback
   * @param {Function} callback - Function to call when re-run button is clicked
   */
  setOnItemReRun(callback) {
    this.onItemReRun = callback;
  }
  
  /**
   * Update component options
   * @param {Object} newOptions - New options to merge
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.render();
  }
  
  /**
   * Get current history items
   * @returns {Array} Current history items
   */
  getItems() {
    return [...this.items];
  }
  
  /**
   * Format timestamp for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
  
  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

/**
 * Create a history list and attach it to the specified element
 * @param {string|HTMLElement} element - Element ID or HTMLElement
 * @param {Object} options - Configuration options
 * @returns {HistoryList} Initialized history list
 */
export function createHistoryList(element, options = {}) {
  const el = typeof element === 'string' 
    ? document.getElementById(element)
    : element;
  
  if (!el) {
    throw new Error(`History list element not found: ${element}`);
  }
  
  return new HistoryList(el, options);
}