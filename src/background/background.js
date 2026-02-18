/**
 * Chrome Copilot - Background Service Worker
 * 
 * This file handles extension lifecycle events, context menu registration,
 * and communication between content scripts and other extension components.
 */

import { ACTION_TYPES } from '../core/constants.js';
import { Storage } from '../config/storage.js';
import { LLMAPI } from '../api/api.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Chrome Copilot extension installed');
  
  chrome.contextMenus.create({
    id: 'chrome-copilot',
    title: 'Chrome Copilot',
    contexts: ['selection'],
    visible: true
  });
  
  Storage.loadConfig().then(config => {
    if (!config) {
      Storage.saveConfig({}).catch(console.error);
    }
  }).catch(console.error);
  
  updateExtensionStatus();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Chrome Copilot extension started');
  updateExtensionStatus();
});

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'chrome-copilot' && info.selectionText) {
    try {
      // Send message to content script to get enhanced selection with context
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: ACTION_TYPES.PROCESS_SELECTION,
        selection: info.selectionText
      });
      
      const selectionData = response?.enhancedSelection || {
        text: info.selectionText,
        context: {
          title: tab.title || 'Unknown page',
          url: tab.url || 'unknown',
          timestamp: new Date().toISOString()
        }
      };
      
      // Process the selected text with LLM
      await processSelection(selectionData, tab);
      
    } catch (error) {
      console.error('Error processing context menu click:', error);
      
      // Fallback: process with basic info
      const selectionData = {
        text: info.selectionText,
        context: {
          title: tab.title || 'Unknown page',
          url: tab.url || 'unknown',
          timestamp: new Date().toISOString()
        }
      };
      
      await processSelection(selectionData, tab);
    }
  }
});

/**
 * Process selected text with LLM and display result
 * @param {Object} selectionData - Text and context data
 * @param {chrome.tabs.Tab} tab - Current tab
 */
async function processSelection(selectionData, tab) {
  try {
    // Store selection temporarily for popup access
    await chrome.storage.local.set({ 
      lastSelection: selectionData,
      processing: true 
    });
    
    // Get configuration
    const config = await Storage.loadConfig();
    const apiKey = await Storage.getApiKey(config.provider);
    
    if (!apiKey) {
      const providerLabel = config.provider.charAt(0).toUpperCase() + config.provider.slice(1);
      throw new Error(`${providerLabel} API key not configured. Please open extension settings and add your API key.`);
    }
    
    // Process text with LLM
    const result = await LLMAPI.processText(
      selectionData.text,
      selectionData.context,
      { promptTemplate: config.defaultPrompt }
    );
    
    // Store result and update state
    await chrome.storage.local.set({ 
      lastResult: {
        text: selectionData.text,
        result: result,
        context: selectionData.context,
        timestamp: new Date().toISOString()
      },
      processing: false,
      lastError: null
    });
    
    // Save to history if enabled
    if (config.saveHistory) {
      await Storage.saveToHistory({
        text: selectionData.text,
        result: result,
        context: selectionData.context,
        provider: config.provider,
        model: config.model
      });
    }
    
    // Display result based on configured location
    await displayResult(result, selectionData, config.displayLocation, tab);
    
  } catch (error) {
    console.error('Error processing selection:', error);
    
    // Create detailed error message
    let errorMessage = error.message;
    if (error.message.includes('API key not configured')) {
      errorMessage = error.message;
    } else if (error.message.includes('Invalid API key') || error.message.includes('authentication')) {
      errorMessage = 'Invalid API key. Please check your API key in extension settings.';
    } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.message.includes('Rate limit')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    }
    
    await chrome.storage.local.set({ 
      lastError: errorMessage,
      processing: false,
      lastResult: null
    });
    
    // Show error in popup
    try {
      await chrome.action.openPopup();
    } catch (popupError) {
      console.error('Could not open popup:', popupError);
    }
  }
}

/**
 * Display result based on configured location
 * @param {string} result - LLM response text
 * @param {Object} metadata - Selection metadata
 * @param {string} displayLocation - Where to show result
 * @param {chrome.tabs.Tab} tab - Current tab
 */
async function displayResult(result, metadata, displayLocation, tab) {
  switch (displayLocation) {
    case 'popup':
      // Open popup to show result
      await chrome.action.openPopup();
      break;
      
    case 'notification':
      // Show desktop notification
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Chrome Copilot',
          message: result.substring(0, 100) + (result.length > 100 ? '...' : '')
        });
      } else {
        // Fallback to popup if notifications not available
        await chrome.action.openPopup();
      }
      break;
      
    case 'sidepanel':
      // TODO: Implement side panel display
      // For now, fallback to popup
      await chrome.action.openPopup();
      break;
      
    default:
      await chrome.action.openPopup();
  }
}

/**
 * Handle messages from other parts of the extension
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case ACTION_TYPES.GET_SELECTION:
      chrome.storage.local.get(['lastSelection', 'lastResult', 'lastError', 'processing'])
        .then(data => sendResponse(data))
        .catch(error => {
          console.error('Error getting selection:', error);
          sendResponse({ error: error.message });
        });
      return true;
      
    case ACTION_TYPES.UPDATE_STATUS:
      updateExtensionStatus();
      sendResponse({ success: true });
      return false;
      
    default:
      sendResponse({ error: 'Unknown action' });
      return false;
  }
});

/**
 * Update extension badge based on status
 */
async function updateExtensionStatus() {
  try {
    const config = await Storage.loadConfig();
    const apiKey = await Storage.getApiKey(config.provider);
    
    if (apiKey) {
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    } else {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#f44336' });
    }
  } catch (error) {
    console.error('Error updating extension status:', error);
  }
}

// Initialize extension status on load
updateExtensionStatus();