/**
 * Chrome Copilot - Content Script
 * 
 * This script runs on web pages and handles text selection detection,
 * enhanced context collection, and communication with the background script.
 */

import { ACTION_TYPES } from '../core/constants.js';

/**
 * Listen for messages from the background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case ACTION_TYPES.PROCESS_SELECTION:
      // Enhance selection with page context
      const enhancedSelection = enhanceSelection(message.selection);
      sendResponse({ enhancedSelection });
      break;
      
    case ACTION_TYPES.GET_SELECTION:
      // Get current selection from page
      const currentSelection = getCurrentSelection();
      sendResponse({ selection: currentSelection });
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
  
  return true; // Keep message channel open for async response
});

/**
 * Enhance basic text selection with page context
 * @param {string} text - Selected text
 * @returns {Object} Enhanced selection data with context
 */
function enhanceSelection(text) {
  return {
    text: text.trim(),
    context: {
      title: document.title,
      url: window.location.href,
      hostname: window.location.hostname,
      timestamp: new Date().toISOString(),
      language: document.documentElement.lang || 'en'
    }
  };
}

/**
 * Get current text selection from the page
 * @returns {string|null} Selected text or null
 */
function getCurrentSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    return null;
  }
  
  const text = selection.toString().trim();
  return text || null;
}

/**
 * Track selection changes and notify background script
 */
let lastSelection = '';
let selectionChangeTimeout = null;

document.addEventListener('selectionchange', () => {
  const currentSelection = getCurrentSelection();
  
  // Only notify if selection actually changed
  if (currentSelection !== lastSelection) {
    lastSelection = currentSelection;
    
    // Debounce selection change notifications
    if (selectionChangeTimeout) {
      clearTimeout(selectionChangeTimeout);
    }
    
    selectionChangeTimeout = setTimeout(() => {
      chrome.runtime.sendMessage({
        action: ACTION_TYPES.SELECTION_UPDATED,
        hasSelection: !!currentSelection,
        selectionLength: currentSelection ? currentSelection.length : 0
      }).catch(error => {
        // Ignore errors when background script isn't ready
        console.debug('Failed to send selection update:', error);
      });
    }, 100); // Debounce for 100ms
  }
});

/**
 * Initialize content script
 */
(function init() {
  console.debug('Chrome Copilot content script loaded');
  
  // Notify background script that content script is ready
  chrome.runtime.sendMessage({
    action: 'contentScriptReady',
    url: window.location.href
  }).catch(() => {
    // Ignore errors - background script might not be ready yet
  });
})();