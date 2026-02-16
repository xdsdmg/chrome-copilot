/**
 * Side Panel Controller
 * 
 * Handles the side panel interface for Chrome Copilot, providing
 * an alternative display location for results and history.
 */

import { Storage } from '../config/storage.js';
import { Display } from './display.js';
import { logger } from '../utils/logger.js';

export class SidePanelController {
  constructor() {
    this.currentView = 'results';
    this.history = [];
    this.filteredHistory = [];
    this.searchQuery = '';
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => this.init());
  }
  
  /**
   * Initialize side panel
   */
  async init() {
    try {
      // Apply theme
      await Display.initTheme();
      
      // Load history
      await this.loadHistory();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Listen for new results
      this.setupMessageListeners();
      
      // Update UI
      this.updateView();
      this.updateFooter();
      
      logger.info('Side panel initialized');
    } catch (error) {
      logger.error('Failed to initialize side panel:', error);
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // View toggle buttons
    document.getElementById('viewResults').addEventListener('click', () => {
      this.switchView('results');
    });
    
    document.getElementById('viewHistory').addEventListener('click', () => {
      this.switchView('history');
    });
    
    document.getElementById('viewSettings').addEventListener('click', () => {
      this.switchView('settings');
    });
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.filterHistory();
      this.updateView();
    });
    
    // Action buttons
    document.getElementById('closePanel').addEventListener('click', () => {
      window.close();
    });
    
    document.getElementById('refreshPanel').addEventListener('click', () => {
      this.refresh();
    });
    
    document.getElementById('openOptions').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    document.getElementById('clearAll').addEventListener('click', () => {
      this.clearAllResults();
    });
    
    document.getElementById('exportData').addEventListener('click', () => {
      this.exportData();
    });
  }
  
  /**
   * Set up message listeners for communication with other parts of the extension
   */
  setupMessageListeners() {
    // Listen for new results
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'newResult') {
        this.handleNewResult(message.data);
      } else if (message.action === 'showResult') {
        this.showResult(message.result, message.metadata);
      }
      
      // Return true to indicate we want to send a response asynchronously
      return true;
    });
    
    // Request any pending results
    this.requestPendingResults();
  }
  
  /**
   * Request any results that might have been generated before side panel opened
   */
  async requestPendingResults() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getPendingResults'
      });
      
      if (response && response.results) {
        response.results.forEach(result => {
          this.handleNewResult(result);
        });
      }
    } catch (error) {
      // No pending results or communication error
      logger.debug('No pending results found');
    }
  }
  
  /**
   * Switch between views
   */
  switchView(viewName) {
    this.currentView = viewName;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeButton = document.getElementById(`view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    
    // Show/hide views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.add('hidden');
    });
    
    const activeView = document.getElementById(`${viewName}View`);
    if (activeView) {
      activeView.classList.remove('hidden');
    }
    
    // Load data for the view
    if (viewName === 'history') {
      this.loadHistory();
    }
  }
  
  /**
   * Update the current view
   */
  updateView() {
    switch (this.currentView) {
      case 'results':
        this.updateResultsView();
        break;
        
      case 'history':
        this.updateHistoryView();
        break;
        
      case 'settings':
        // Settings view is static for now
        break;
    }
  }
  
  /**
   * Update results view with latest results
   */
  updateResultsView() {
    const container = document.querySelector('#resultsView .result-history');
    if (!container) return;
    
    // Clear existing results
    container.innerHTML = '';
    
    // Show filtered history (most recent first)
    const resultsToShow = this.filteredHistory.slice(0, 20);
    
    if (resultsToShow.length === 0) {
      // Show empty state
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${this.searchQuery ? '🔍' : '📚'}</div>
          <h3>${this.searchQuery ? 'No matching results' : 'No results yet'}</h3>
          <p>${this.searchQuery ? 'Try a different search term' : 'Select text on any page and use the context menu to get AI explanations.'}</p>
        </div>
      `;
      return;
    }
    
    // Add result items
    resultsToShow.forEach(item => {
      const resultElement = this.createResultElement(item);
      container.appendChild(resultElement);
    });
  }
  
  /**
   * Update history view
   */
  updateHistoryView() {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    // Clear existing items
    container.innerHTML = '';
    
    if (this.filteredHistory.length === 0) {
      // Show empty state
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${this.searchQuery ? '🔍' : '🕒'}</div>
          <h3>${this.searchQuery ? 'No matching history' : 'No history yet'}</h3>
          <p>${this.searchQuery ? 'Try a different search term' : 'Your query history will appear here.'}</p>
        </div>
      `;
      return;
    }
    
    // Add history items
    this.filteredHistory.forEach(item => {
      const historyElement = this.createHistoryElement(item);
      container.appendChild(historyElement);
    });
  }
  
  /**
   * Update footer information
   */
  updateFooter() {
    const resultCount = document.getElementById('resultCount');
    const lastUpdated = document.getElementById('lastUpdated');
    
    if (resultCount) {
      const total = this.history.length;
      const filtered = this.filteredHistory.length;
      
      if (this.searchQuery && filtered !== total) {
        resultCount.textContent = `${filtered} of ${total} results`;
      } else {
        resultCount.textContent = `${total} result${total !== 1 ? 's' : ''}`;
      }
    }
    
    if (lastUpdated) {
      if (this.history.length > 0) {
        const latest = this.history[0];
        const timeStr = this.formatTime(latest.timestamp);
        lastUpdated.textContent = `Updated ${timeStr}`;
      } else {
        lastUpdated.textContent = 'Just now';
      }
    }
  }
  
  /**
   * Create a result element for display
   */
  createResultElement(item) {
    const element = document.createElement('div');
    element.className = 'history-item-large';
    
    const timeStr = this.formatTime(item.timestamp);
    const textPreview = this.truncateText(item.text, 150);
    const resultPreview = this.truncateText(item.result, 300);
    
    element.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-meta">
          <span class="meta-time">${timeStr}</span>
          <span class="meta-provider">${item.provider || 'Unknown'}</span>
          <span class="meta-model">${item.model || 'Unknown'}</span>
        </div>
        <div class="history-item-actions">
          <button class="btn btn-small btn-text copy-btn" title="Copy result">
            <span class="btn-icon">📋</span>
          </button>
          <button class="btn btn-small btn-text delete-btn" title="Delete">
            <span class="btn-icon">🗑️</span>
          </button>
        </div>
      </div>
      <div class="history-item-content">
        <div class="history-item-text">
          <strong>Query:</strong> ${this.escapeHtml(textPreview)}
        </div>
        <div class="history-item-result markdown-content">
          ${Display.formatResult(resultPreview)}
        </div>
      </div>
    `;
    
    // Add event listeners
    const copyBtn = element.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await Display.copyToClipboard(item.result);
          copyBtn.innerHTML = '<span class="btn-icon">✓</span>';
          setTimeout(() => {
            copyBtn.innerHTML = '<span class="btn-icon">📋</span>';
          }, 2000);
        } catch (error) {
          logger.error('Failed to copy result:', error);
        }
      });
    }
    
    const deleteBtn = element.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteHistoryItem(item.id);
      });
    }
    
    // Click on the result to show full view
    element.addEventListener('click', (e) => {
      // Don't trigger if clicking buttons
      if (!e.target.closest('.history-item-actions')) {
        this.showFullResult(item);
      }
    });
    
    return element;
  }
  
  /**
   * Create a history element (simplified)
   */
  createHistoryElement(item) {
    const element = document.createElement('div');
    element.className = 'history-item-large';
    
    const timeStr = this.formatTime(item.timestamp);
    const textPreview = this.truncateText(item.text, 100);
    
    element.innerHTML = `
      <div class="history-item-header">
        <div class="history-item-meta">
          <span class="meta-time">${timeStr}</span>
          <span class="meta-provider">${item.provider || 'Unknown'}</span>
        </div>
        <div class="history-item-actions">
          <button class="btn btn-small btn-text re-run-btn" title="Re-run query">
            <span class="btn-icon">↻</span>
          </button>
        </div>
      </div>
      <div class="history-item-content">
        <div class="history-item-text">
          ${this.escapeHtml(textPreview)}
        </div>
      </div>
    `;
    
    // Add event listeners
    const reRunBtn = element.querySelector('.re-run-btn');
    if (reRunBtn) {
      reRunBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.reRunQuery(item);
      });
    }
    
    element.addEventListener('click', () => {
      this.showFullResult(item);
    });
    
    return element;
  }
  
  /**
   * Show full result in side panel
   */
  showFullResult(item) {
    // For now, just switch to results view and highlight this item
    // In a more advanced implementation, we could show a detailed view
    this.switchView('results');
    
    // Scroll to the result
    setTimeout(() => {
      const elements = document.querySelectorAll('.history-item-large');
      elements.forEach(el => {
        if (el.textContent.includes(item.text.substring(0, 50))) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          el.style.boxShadow = '0 0 0 2px var(--color-primary)';
          setTimeout(() => {
            el.style.boxShadow = '';
          }, 2000);
        }
      });
    }, 100);
  }
  
  /**
   * Show a new result
   */
  showResult(result, metadata) {
    const item = {
      id: Date.now(),
      text: metadata?.text || '',
      result,
      context: metadata?.context || {},
      provider: metadata?.provider || 'unknown',
      model: metadata?.model || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    this.history.unshift(item);
    this.filterHistory();
    this.updateView();
    this.updateFooter();
  }
  
  /**
   * Handle new result from message
   */
  handleNewResult(data) {
    this.showResult(data.result, data.metadata);
  }
  
  /**
   * Load history from storage
   */
  async loadHistory() {
    try {
      this.history = await Storage.getHistory();
      this.filterHistory();
      this.updateView();
      this.updateFooter();
    } catch (error) {
      logger.error('Failed to load history:', error);
    }
  }
  
  /**
   * Filter history based on search query
   */
  filterHistory() {
    if (!this.searchQuery) {
      this.filteredHistory = [...this.history];
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredHistory = this.history.filter(item => {
      return item.text.toLowerCase().includes(query) ||
             item.result.toLowerCase().includes(query) ||
             item.provider?.toLowerCase().includes(query) ||
             item.model?.toLowerCase().includes(query);
    });
  }
  
  /**
   * Delete a history item
   */
  async deleteHistoryItem(id) {
    try {
      this.history = this.history.filter(item => item.id !== id);
      await Storage.saveToHistory(this.history);
      this.filterHistory();
      this.updateView();
      this.updateFooter();
    } catch (error) {
      logger.error('Failed to delete history item:', error);
    }
  }
  
  /**
   * Clear all results
   */
  async clearAllResults() {
    if (!confirm('Are you sure you want to clear all results? This cannot be undone.')) {
      return;
    }
    
    try {
      this.history = [];
      await Storage.saveToHistory([]);
      this.filterHistory();
      this.updateView();
      this.updateFooter();
    } catch (error) {
      logger.error('Failed to clear results:', error);
    }
  }
  
  /**
   * Export data
   */
  async exportData() {
    try {
      const data = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        history: this.history
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chrome-copilot-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to export data:', error);
    }
  }
  
  /**
   * Re-run a query
   */
  reRunQuery(item) {
    // Send message to background script to re-run the query
    chrome.runtime.sendMessage({
      action: 'reRunQuery',
      data: item
    }).catch(error => {
      logger.error('Failed to send re-run message:', error);
    });
  }
  
  /**
   * Refresh the side panel
   */
  async refresh() {
    await this.loadHistory();
    this.updateView();
    this.updateFooter();
  }
  
  /**
   * Format timestamp for display
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
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize side panel controller when script loads
const sidePanelController = new SidePanelController();