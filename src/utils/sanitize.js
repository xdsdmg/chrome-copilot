/**
 * Sanitization Utilities
 * 
 * Provides functions for sanitizing user inputs and text content to prevent
 * security issues and ensure consistent formatting.
 */

export class Sanitize {
  /**
   * Sanitize text input (remove excessive whitespace, limit length)
   * @param {string} text - Text to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized text
   */
  static sanitizeText(text, options = {}) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    const {
      maxLength = 10000,
      trim = true,
      collapseWhitespace = true,
      removeControlChars = true,
      escapeHtml = false
    } = options;
    
    let result = text;
    
    // Remove control characters (except newlines, tabs, etc.)
    if (removeControlChars) {
      // Keep common whitespace characters: \n, \r, \t, space
      result = result.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
    
    // Collapse multiple whitespace characters into single space
    if (collapseWhitespace) {
      result = result.replace(/\s+/g, ' ');
    }
    
    // Trim leading/trailing whitespace
    if (trim) {
      result = result.trim();
    }
    
    // Limit length
    if (result.length > maxLength) {
      result = result.substring(0, maxLength);
    }
    
    // Escape HTML entities if needed
    if (escapeHtml) {
      result = this.escapeHtml(result);
    }
    
    return result;
  }
  
  /**
   * Sanitize HTML content (remove potentially dangerous tags/attributes)
   * @param {string} html - HTML to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized HTML
   */
  static sanitizeHtml(html, options = {}) {
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    const {
      allowedTags = ['b', 'i', 'em', 'strong', 'code', 'pre', 'br', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a'],
      allowedAttributes = {
        'a': ['href', 'title', 'target', 'rel']
      },
      maxLength = 50000
    } = options;
    
    // Create a temporary div to parse HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Limit total length
    if (div.textContent.length > maxLength) {
      return 'Content too large';
    }
    
    // Walk the DOM tree and remove disallowed elements/attributes
    const walk = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Remove disallowed elements
        if (!allowedTags.includes(tagName)) {
          node.parentNode?.removeChild(node);
          return;
        }
        
        // Remove disallowed attributes
        const allowedAttrs = allowedAttributes[tagName] || [];
        for (const attr of Array.from(node.attributes)) {
          if (!allowedAttrs.includes(attr.name.toLowerCase())) {
            node.removeAttribute(attr.name);
          }
        }
        
        // Sanitize specific attributes
        if (tagName === 'a' && node.hasAttribute('href')) {
          const href = node.getAttribute('href');
          // Ensure URL is safe
          if (!this.isSafeUrl(href)) {
            node.removeAttribute('href');
          } else {
            // Ensure target="_blank" has rel="noopener noreferrer"
            if (node.getAttribute('target') === '_blank') {
              node.setAttribute('rel', 'noopener noreferrer');
            }
          }
        }
        
        // Continue walking child nodes
        for (const child of Array.from(node.childNodes)) {
          walk(child);
        }
      }
    };
    
    // Start walking from the div's children
    for (const child of Array.from(div.childNodes)) {
      walk(child);
    }
    
    return div.innerHTML;
  }
  
  /**
   * Sanitize URL (ensure it's safe for use in links)
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL or empty string if unsafe
   */
  static sanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }
    
    // Trim and remove control characters
    let result = url.trim().replace(/[\x00-\x1F\x7F]/g, '');
    
    // Ensure URL has a protocol
    if (!result.startsWith('http://') && !result.startsWith('https://')) {
      result = 'https://' + result;
    }
    
    // Validate URL format
    try {
      const parsed = new URL(result);
      
      // Allow only http/https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }
      
      // Additional safety checks
      if (this.isSafeUrl(result)) {
        return result;
      }
    } catch {
      // Invalid URL
    }
    
    return '';
  }
  
  /**
   * Sanitize JSON input (parse and re-stringify to ensure validity)
   * @param {string} jsonString - JSON string to sanitize
   * @param {Object} defaultValue - Default value if parsing fails
   * @returns {any} Sanitized JSON object or defaultValue
   */
  static sanitizeJson(jsonString, defaultValue = {}) {
    if (!jsonString || typeof jsonString !== 'string') {
      return defaultValue;
    }
    
    try {
      const parsed = JSON.parse(jsonString);
      
      // Remove any properties that might be problematic
      return this.sanitizeObject(parsed);
    } catch {
      return defaultValue;
    }
  }
  
  /**
   * Sanitize object (remove functions, circular references, etc.)
   * @param {any} obj - Object to sanitize
   * @param {number} maxDepth - Maximum recursion depth
   * @returns {any} Sanitized object
   */
  static sanitizeObject(obj, maxDepth = 10) {
    const seen = new WeakSet();
    
    const sanitize = (value, depth) => {
      if (depth > maxDepth) {
        return null;
      }
      
      // Handle null and undefined
      if (value === null || value === undefined) {
        return value;
      }
      
      // Handle primitives
      if (typeof value !== 'object' && typeof value !== 'function') {
        return value;
      }
      
      // Handle functions (remove them)
      if (typeof value === 'function') {
        return undefined;
      }
      
      // Handle circular references
      if (seen.has(value)) {
        return null;
      }
      
      seen.add(value);
      
      // Handle arrays
      if (Array.isArray(value)) {
        const result = [];
        for (const item of value) {
          const sanitized = sanitize(item, depth + 1);
          if (sanitized !== undefined) {
            result.push(sanitized);
          }
        }
        seen.delete(value);
        return result;
      }
      
      // Handle plain objects
      const result = {};
      for (const [key, val] of Object.entries(value)) {
        // Skip keys that start with __ (internal properties)
        if (key.startsWith('__')) {
          continue;
        }
        
        const sanitized = sanitize(val, depth + 1);
        if (sanitized !== undefined) {
          result[key] = sanitized;
        }
      }
      seen.delete(value);
      return result;
    };
    
    return sanitize(obj, 0);
  }
  
  /**
   * Escape HTML entities
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '`': '&#096;'
    };
    
    return text.replace(/[&<>"'`]/g, char => escapeMap[char] || char);
  }
  
  /**
   * Unescape HTML entities
   * @param {string} text - Text to unescape
   * @returns {string} Unescaped text
   */
  static unescapeHtml(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    const unescapeMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&#096;': '`'
    };
    
    return text.replace(/&(amp|lt|gt|quot|#039|#096);/g, entity => unescapeMap[entity] || entity);
  }
  
  /**
   * Sanitize filename (remove dangerous characters)
   * @param {string} filename - Filename to sanitize
   * @returns {string} Sanitized filename
   */
  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return 'file';
    }
    
    // Remove control characters and reserved characters
    let result = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    
    // Trim dots and spaces
    result = result.replace(/^\.+|\.+$/g, '');
    result = result.trim();
    
    // Limit length
    if (result.length > 255) {
      const extIndex = result.lastIndexOf('.');
      if (extIndex > 0) {
        const name = result.substring(0, Math.min(extIndex, 240));
        const ext = result.substring(extIndex);
        result = name + ext;
      } else {
        result = result.substring(0, 255);
      }
    }
    
    return result || 'file';
  }
  
  /**
   * Sanitize CSS (basic protection against injection)
   * @param {string} css - CSS to sanitize
   * @returns {string} Sanitized CSS
   */
  static sanitizeCss(css) {
    if (!css || typeof css !== 'string') {
      return '';
    }
    
    // Remove dangerous patterns
    let result = css
      .replace(/expression\(/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/@import/gi, '')
      .replace(/url\(/gi, '')
      .replace(/[\x00-\x1F\x7F]/g, '');
    
    // Limit length
    if (result.length > 10000) {
      result = result.substring(0, 10000);
    }
    
    return result;
  }
  
  /**
   * Check if URL is safe (prevents javascript:, data:, etc.)
   * @param {string} url - URL to check
   * @returns {boolean} True if URL is safe
   */
  static isSafeUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    try {
      const parsed = new URL(url);
      
      // Block dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
      if (dangerousProtocols.includes(parsed.protocol.toLowerCase())) {
        return false;
      }
      
      // Allow only http/https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      
      // Additional checks could be added here
      // (e.g., block certain domains, check for XSS patterns)
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Remove duplicate whitespace and normalize line endings
   * @param {string} text - Text to normalize
   * @returns {string} Normalized text
   */
  static normalizeWhitespace(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/\r\n/g, '\n')  // Windows to Unix
      .replace(/\r/g, '\n')     // Mac to Unix
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .replace(/[ \t]+/g, ' ')  // Collapse spaces/tabs
      .trim();
  }
  
  /**
   * Limit string length with ellipsis
   * @param {string} text - Text to limit
   * @param {number} maxLength - Maximum length
   * @param {string} ellipsis - Ellipsis string (default: '...')
   * @returns {string} Limited text
   */
  static limitLength(text, maxLength = 100, ellipsis = '...') {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    if (text.length <= maxLength) {
      return text;
    }
    
    const limit = maxLength - ellipsis.length;
    if (limit <= 0) {
      return ellipsis.substring(0, maxLength);
    }
    
    return text.substring(0, limit) + ellipsis;
  }
}

// Convenience functions for common sanitization tasks
export const sanitize = {
  /**
   * Sanitize text
   */
  text: (text, options) => Sanitize.sanitizeText(text, options),
  
  /**
   * Sanitize HTML
   */
  html: (html, options) => Sanitize.sanitizeHtml(html, options),
  
  /**
   * Sanitize URL
   */
  url: (url) => Sanitize.sanitizeUrl(url),
  
  /**
   * Sanitize JSON
   */
  json: (jsonString, defaultValue) => Sanitize.sanitizeJson(jsonString, defaultValue),
  
  /**
   * Escape HTML
   */
  escape: (text) => Sanitize.escapeHtml(text),
  
  /**
   * Unescape HTML
   */
  unescape: (text) => Sanitize.unescapeHtml(text),
  
  /**
   * Sanitize filename
   */
  filename: (filename) => Sanitize.sanitizeFilename(filename),
  
  /**
   * Normalize whitespace
   */
  whitespace: (text) => Sanitize.normalizeWhitespace(text),
  
  /**
   * Limit length
   */
  limit: (text, maxLength, ellipsis) => Sanitize.limitLength(text, maxLength, ellipsis)
};