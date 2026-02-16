/**
 * Notification Manager
 * 
 * Handles desktop notifications for Chrome Copilot, including permission management,
 * notification display, and click handling.
 */

import { Storage } from '../config/storage.js';

export class NotificationManager {
  /**
   * Create a new notification manager
   */
  constructor() {
    this.notificationIdCounter = 0;
    this.activeNotifications = new Map();
    this.init();
  }
  
  /**
   * Initialize the notification manager
   */
  async init() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Desktop notifications are not supported in this browser');
      return;
    }
    
    // Listen for notification clicks
    if ('chrome' in window && 'notifications' in chrome) {
      // Chrome extension notifications API (more features)
      chrome.notifications.onClicked.addListener(this.handleNotificationClick.bind(this));
      chrome.notifications.onClosed.addListener(this.handleNotificationClosed.bind(this));
      chrome.notifications.onButtonClicked.addListener(this.handleNotificationButtonClicked.bind(this));
    } else {
      // Standard Web Notifications API
      // Note: Standard API doesn't provide IDs for event handlers, so we track them manually
    }
  }
  
  /**
   * Show a desktop notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Notification options
   * @returns {Promise<string>} Notification ID
   */
  async show(title, message, options = {}) {
    try {
      // Check if notifications are enabled in settings
      const config = await Storage.loadConfig();
      if (!config.showNotifications && !options.force) {
        console.debug('Notifications disabled in settings');
        return null;
      }
      
      // Request permission if needed
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Notification permission denied');
        return null;
      }
      
      // Prepare notification options
      const notificationOptions = this.prepareNotificationOptions(title, message, options);
      
      let notificationId;
      
      // Use Chrome extension notifications API if available (more features)
      if ('chrome' in window && 'notifications' in chrome) {
        notificationId = await this.showChromeNotification(notificationOptions);
      } else {
        // Fall back to standard Web Notifications API
        notificationId = this.showWebNotification(notificationOptions);
      }
      
      // Store the notification
      if (notificationId) {
        this.activeNotifications.set(notificationId, {
          title,
          message,
          options,
          timestamp: Date.now()
        });
        
        // Auto-remove from active notifications after a while
        setTimeout(() => {
          this.activeNotifications.delete(notificationId);
        }, 30000); // 30 seconds
      }
      
      return notificationId;
      
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }
  
  /**
   * Show a result notification (for AI responses)
   * @param {string} result - AI response text
   * @param {Object} metadata - Query metadata
   * @returns {Promise<string>} Notification ID
   */
  async showResultNotification(result, metadata) {
    const title = 'Chrome Copilot Result';
    
    // Truncate the result for notification
    const maxLength = 200;
    const truncatedResult = result.length > maxLength 
      ? result.substring(0, maxLength) + '...'
      : result;
    
    // Prepare buttons
    const buttons = [
      { title: 'Copy', iconUrl: '/icons/icon16.png' },
      { title: 'Open', iconUrl: '/icons/icon16.png' }
    ];
    
    return this.show(title, truncatedResult, {
      type: 'result',
      buttons,
      metadata,
      requireInteraction: true,
      iconUrl: '/icons/icon128.png',
      priority: 1
    });
  }
  
  /**
   * Show an error notification
   * @param {string} errorMessage - Error message
   * @param {Object} errorDetails - Additional error details
   * @returns {Promise<string>} Notification ID
   */
  async showErrorNotification(errorMessage, errorDetails = {}) {
    const title = 'Chrome Copilot Error';
    
    return this.show(title, errorMessage, {
      type: 'error',
      iconUrl: '/icons/icon128.png',
      requireInteraction: true,
      priority: 2,
      errorDetails
    });
  }
  
  /**
   * Show a progress notification
   * @param {string} message - Progress message
   * @param {number} progress - Progress percentage (0-100)
   * @returns {Promise<string>} Notification ID
   */
  async showProgressNotification(message, progress = 0) {
    const notificationId = `progress_${Date.now()}`;
    
    // Chrome extension notifications support progress bars
    if ('chrome' in window && 'notifications' in chrome) {
      try {
        await chrome.notifications.create(notificationId, {
          type: 'progress',
          iconUrl: '/icons/icon128.png',
          title: 'Chrome Copilot',
          message,
          progress,
          requireInteraction: false,
          priority: 0
        });
        
        this.activeNotifications.set(notificationId, {
          type: 'progress',
          message,
          progress,
          timestamp: Date.now()
        });
        
        return notificationId;
      } catch (error) {
        console.error('Error showing progress notification:', error);
      }
    }
    
    // Fallback: show regular notification
    return this.show('Chrome Copilot', message, {
      type: 'progress',
      progress
    });
  }
  
  /**
   * Update a progress notification
   * @param {string} notificationId - Notification ID to update
   * @param {string} message - New message
   * @param {number} progress - New progress percentage
   * @returns {Promise<boolean>} Success status
   */
  async updateProgressNotification(notificationId, message, progress) {
    if ('chrome' in window && 'notifications' in chrome) {
      try {
        await chrome.notifications.update(notificationId, {
          message,
          progress
        });
        
        // Update in active notifications
        const notification = this.activeNotifications.get(notificationId);
        if (notification) {
          notification.message = message;
          notification.progress = progress;
          notification.timestamp = Date.now();
        }
        
        return true;
      } catch (error) {
        console.error('Error updating progress notification:', error);
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Close a notification
   * @param {string} notificationId - Notification ID to close
   */
  async close(notificationId) {
    if ('chrome' in window && 'notifications' in chrome) {
      try {
        await chrome.notifications.clear(notificationId);
      } catch (error) {
        console.error('Error closing notification:', error);
      }
    }
    
    // Remove from active notifications
    this.activeNotifications.delete(notificationId);
  }
  
  /**
   * Close all active notifications
   */
  async closeAll() {
    if ('chrome' in window && 'notifications' in chrome) {
      try {
        await chrome.notifications.getAll((notifications) => {
          Object.keys(notifications || {}).forEach(notificationId => {
            chrome.notifications.clear(notificationId);
          });
        });
      } catch (error) {
        console.error('Error closing all notifications:', error);
      }
    }
    
    this.activeNotifications.clear();
  }
  
  /**
   * Check if notifications are supported
   * @returns {boolean} True if notifications are supported
   */
  isSupported() {
    return 'Notification' in window || ('chrome' in window && 'notifications' in chrome);
  }
  
  /**
   * Check current permission status
   * @returns {string} Permission status ('granted', 'denied', 'default')
   */
  getPermissionStatus() {
    if ('chrome' in window && 'notifications' in chrome) {
      // Chrome extension notifications always have permission
      return 'granted';
    }
    
    return Notification.permission;
  }
  
  /**
   * Request notification permission
   * @returns {Promise<boolean>} True if permission granted
   */
  async requestPermission() {
    if ('chrome' in window && 'notifications' in chrome) {
      // Chrome extension notifications don't require explicit permission
      return true;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.warn('Notification permission previously denied');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  /**
   * Handle notification click
   * @param {string} notificationId - Clicked notification ID
   */
  handleNotificationClick(notificationId) {
    const notification = this.activeNotifications.get(notificationId);
    if (!notification) return;
    
    console.log('Notification clicked:', notificationId, notification);
    
    // Handle based on notification type
    switch (notification.options?.type) {
      case 'result':
        // Open popup with result
        chrome.runtime.openOptionsPage();
        break;
        
      case 'error':
        // Open settings page
        chrome.runtime.openOptionsPage();
        break;
    }
    
    // Close the notification
    this.close(notificationId);
  }
  
  /**
   * Handle notification closed
   * @param {string} notificationId - Closed notification ID
   * @param {boolean} byUser - Whether closed by user
   */
  handleNotificationClosed(notificationId, byUser) {
    console.log(`Notification ${notificationId} closed by ${byUser ? 'user' : 'system'}`);
    this.activeNotifications.delete(notificationId);
  }
  
  /**
   * Handle notification button click
   * @param {string} notificationId - Notification ID
   * @param {number} buttonIndex - Index of clicked button
   */
  handleNotificationButtonClicked(notificationId, buttonIndex) {
    const notification = this.activeNotifications.get(notificationId);
    if (!notification) return;
    
    console.log(`Notification ${notificationId} button ${buttonIndex} clicked`);
    
    // Handle button actions
    if (notification.options?.type === 'result') {
      switch (buttonIndex) {
        case 0: // Copy button
          if (notification.message) {
            navigator.clipboard.writeText(notification.message).catch(console.error);
          }
          break;
          
        case 1: // Open button
          chrome.runtime.openOptionsPage();
          break;
      }
    }
    
    this.close(notificationId);
  }
  
  /**
   * Prepare notification options
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   * @returns {Object} Prepared options
   */
  prepareNotificationOptions(title, message, options) {
    const defaultOptions = {
      iconUrl: '/icons/icon128.png',
      type: 'basic',
      priority: 0,
      requireInteraction: false,
      silent: false
    };
    
    return { ...defaultOptions, ...options, title, message };
  }
  
  /**
   * Show notification using Chrome extension API
   * @param {Object} options - Notification options
   * @returns {Promise<string>} Notification ID
   */
  async showChromeNotification(options) {
    const notificationId = `chrome_copilot_${Date.now()}_${this.notificationIdCounter++}`;
    
    try {
      await chrome.notifications.create(notificationId, options);
      return notificationId;
    } catch (error) {
      console.error('Error creating Chrome notification:', error);
      throw error;
    }
  }
  
  /**
   * Show notification using Web Notifications API
   * @param {Object} options - Notification options
   * @returns {string} Notification ID
   */
  showWebNotification(options) {
    const notificationId = `web_${Date.now()}_${this.notificationIdCounter++}`;
    
    try {
      const notification = new Notification(options.title, {
        body: options.message,
        icon: options.iconUrl,
        requireInteraction: options.requireInteraction,
        silent: options.silent
      });
      
      // Track this notification
      notification._id = notificationId;
      
      // Add click handler
      notification.onclick = () => {
        this.handleNotificationClick(notificationId);
        notification.close();
      };
      
      // Add close handler
      notification.onclose = () => {
        this.handleNotificationClosed(notificationId, true);
      };
      
      // Auto-close after 10 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }
      
      return notificationId;
    } catch (error) {
      console.error('Error creating web notification:', error);
      throw error;
    }
  }
  
  /**
   * Get active notifications
   * @returns {Map<string, Object>} Active notifications
   */
  getActiveNotifications() {
    return new Map(this.activeNotifications);
  }
}

// Create singleton instance
export const notificationManager = new NotificationManager();