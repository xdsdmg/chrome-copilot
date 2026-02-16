/**
 * Display Module
 * 
 * Handles formatting and presentation of LLM responses, clipboard operations,
 * and coordination with different display locations (popup, side panel, notifications).
 */

import { Storage } from '../config/storage.js';
import { DEFAULT_CONFIG } from '../core/constants.js';

export class Display {
  /**
   * Show result in the popup window
   * @param {string} result - The LLM response text
   * @param {Object} metadata - Metadata about the query
   * @returns {Promise<void>}
   */
  static async showInPopup(result, metadata) {
    try {
      // Store the result in temporary storage for popup to pick up
      await chrome.storage.local.set({
        lastResult: result,
        lastResultMetadata: metadata,
        lastError: null
      });
      
      // Notify popup to update
      await this.sendMessageToPopup({ action: 'showResult', result, metadata });
      
    } catch (error) {
      console.error('Error showing result in popup:', error);
    }
  }
  
  /**
   * Format LLM response for display
   * @param {string} text - Raw LLM response text
   * @returns {string} HTML-formatted text
   */
  static formatResult(text) {
    if (!text) return '';
    
    // Basic markdown-like formatting
    let html = text;
    
    // Convert line breaks to <br>
    html = html.replace(/\n/g, '<br>');
    
    // Convert **bold** to <strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert `code` to <code>
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert lists starting with - or *
    html = html.replace(/^[*-]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Convert numbered lists (1., 2., etc.)
    html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
    
    // Convert headings (## Heading -> <h3>Heading</h3>)
    html = html.replace(/^###\s+(.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^##\s+(.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#\s+(.*)$/gm, '<h2>$1</h2>');
    
    // Convert blockquotes (> quote)
    html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');
    
    // Convert links [text](url) to <a> tags
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Wrap the whole content in a markdown container
    html = `<div class="markdown-content">${html}</div>`;
    
    return html;
  }
  
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<void>}
   */
  static async copyToClipboard(text) {
    try {
      // Use the Clipboard API if available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = 0;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      console.log('Text copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw new Error('Failed to copy to clipboard');
    }
  }
  
  /**
   * Show desktop notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {Object} options - Additional notification options
   * @returns {Promise<void>}
   */
  static async showNotification(title, body, options = {}) {
    try {
      // Check if notifications are supported and permitted
      if (!('Notification' in window)) {
        console.warn('Desktop notifications not supported');
        return;
      }
      
      // Request permission if not already granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Notification permission denied');
          return;
        }
      }
      
      if (Notification.permission === 'granted') {
        const notificationOptions = {
          icon: '/icons/icon128.png',
          badge: '/icons/icon48.png',
          ...options
        };
        
        const notification = new Notification(title, {
          body,
          ...notificationOptions
        });
        
        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        // Auto-close after 10 seconds
        setTimeout(() => {
          notification.close();
        }, 10000);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
  
  /**
   * Show error message in appropriate display location
   * @param {string} message - Error message
   * @param {Object} options - Display options
   * @returns {Promise<void>}
   */
  static async showError(message, options = {}) {
    try {
      const config = await Storage.loadConfig();
      const displayLocation = config.displayLocation || DEFAULT_CONFIG.displayLocation;
      
      switch (displayLocation) {
        case 'notification':
          await this.showNotification('Chrome Copilot Error', message, {
            icon: '/icons/icon128.png',
            requireInteraction: true
          });
          break;
          
        case 'sidepanel':
          // TODO: Implement side panel error display
          console.error('Side panel error display not yet implemented:', message);
          await this.showInPopup(message, { isError: true });
          break;
          
        case 'popup':
        default:
          await this.showInPopup(message, { isError: true });
          break;
      }
    } catch (error) {
      console.error('Error displaying error:', error);
    }
  }
  
  /**
   * Get the preferred display location from configuration
   * @returns {Promise<string>} Display location ('popup', 'sidepanel', 'notification')
   */
  static async getDisplayLocation() {
    try {
      const config = await Storage.loadConfig();
      return config.displayLocation || DEFAULT_CONFIG.displayLocation;
    } catch (error) {
      console.error('Error getting display location:', error);
      return DEFAULT_CONFIG.displayLocation;
    }
  }
  
  /**
   * Send message to popup window
   * @param {Object} message - Message to send
   * @returns {Promise<void>}
   */
  static async sendMessageToPopup(message) {
    try {
      // Get the popup window if it's open
      const views = chrome.extension.getViews({ type: 'popup' });
      if (views.length > 0) {
        // Popup is open, we can send a message directly
        chrome.runtime.sendMessage(message);
      }
    } catch (error) {
      console.debug('Popup not open or message failed:', error);
    }
  }
  
  /**
   * Format metadata for display
   * @param {Object} metadata - Query metadata
   * @returns {string} Formatted HTML string
   */
  static formatMetadata(metadata) {
    if (!metadata) return '';
    
    const { context, provider, model, timestamp } = metadata;
    const items = [];
    
    if (context?.title) {
      items.push(`<div class="metadata-item"><strong>Source:</strong> ${context.title}</div>`);
    }
    
    if (context?.url) {
      items.push(`<div class="metadata-item"><strong>URL:</strong> <a href="${context.url}" target="_blank">${this.truncateUrl(context.url)}</a></div>`);
    }
    
    if (provider) {
      items.push(`<div class="metadata-item"><strong>Provider:</strong> ${provider}</div>`);
    }
    
    if (model) {
      items.push(`<div class="metadata-item"><strong>Model:</strong> ${model}</div>`);
    }
    
    if (timestamp) {
      const date = new Date(timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString();
      items.push(`<div class="metadata-item"><strong>Time:</strong> ${dateStr} ${timeStr}</div>`);
    }
    
    if (items.length === 0) return '';
    
    return `<div class="result-metadata">${items.join('')}</div>`;
  }
  
  /**
   * Truncate URL for display
   * @param {string} url - Full URL
   * @param {number} maxLength - Maximum length (default: 50)
   * @returns {string} Truncated URL
   */
  static truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    
    // Keep the beginning and end of the URL
    const start = url.substring(0, maxLength / 2);
    const end = url.substring(url.length - maxLength / 2);
    return `${start}...${end}`;
  }
  
  /**
   * Apply theme to the display
   * @param {string} theme - Theme name ('light', 'dark', 'system')
   */
  static applyTheme(theme) {
    // Remove existing theme attributes
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('theme-light', 'theme-dark');
    
    // Determine actual theme (handle 'system')
    let actualTheme = theme;
    if (theme === 'system') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', actualTheme);
    document.body.classList.add(`theme-${actualTheme}`);
    
    // Store theme preference
    chrome.storage.local.set({ currentTheme: actualTheme });
  }
  
  /**
   * Initialize theme based on user configuration
   * @returns {Promise<void>}
   */
  static async initTheme() {
    try {
      const config = await Storage.loadConfig();
      const theme = config.theme || DEFAULT_CONFIG.theme;
      this.applyTheme(theme);
      
      // Listen for system theme changes
      if (theme === 'system') {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          this.applyTheme('system');
        });
      }
    } catch (error) {
      console.error('Error initializing theme:', error);
      this.applyTheme(DEFAULT_CONFIG.theme);
    }
  }
  
  /**
   * Create a result element with formatted content
   * @param {string} result - LLM response
   * @param {Object} metadata - Query metadata
   * @returns {HTMLElement} Result element
   */
  static createResultElement(result, metadata) {
    const container = document.createElement('div');
    container.className = 'result-container';
    
    const resultHtml = this.formatResult(result);
    const metadataHtml = this.formatMetadata(metadata);
    
    container.innerHTML = `
      <div class="result-content">${resultHtml}</div>
      ${metadataHtml}
      <div class="result-actions">
        <button class="btn btn-secondary copy-btn">
          <span class="btn-icon">📋</span> Copy
        </button>
        <button class="btn btn-secondary close-btn">
          <span class="btn-icon">×</span> Close
        </button>
      </div>
    `;
    
    // Add event listeners
    const copyBtn = container.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await this.copyToClipboard(result);
          copyBtn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = '<span class="btn-icon">📋</span> Copy';
          }, 2000);
        } catch (error) {
          console.error('Copy failed:', error);
        }
      });
    }
    
    const closeBtn = container.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        container.remove();
      });
    }
    
    return container;
  }
}

// Initialize theme when module loads (for popup and options pages)
if (typeof document !== 'undefined') {
  Display.initTheme().catch(console.error);
}