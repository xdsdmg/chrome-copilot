/**
 * Chrome Copilot - Prompt Template Management
 * 
 * This module handles prompt template processing, variable substitution,
 * and template validation.
 */

/**
 * Apply prompt template with variable substitution
 * @param {string} template - Prompt template string
 * @param {Object} variables - Variables to substitute
 * @returns {string} Processed prompt
 */
export function applyPromptTemplate(template, variables) {
  if (!template || typeof template !== 'string') {
    throw new Error('Invalid prompt template');
  }
  
  if (!variables || typeof variables !== 'object') {
    throw new Error('Invalid variables object');
  }
  
  // Extract text and context for convenience
  const { text = '', context = {} } = variables;
  
  // Define available variables and their values
  const variableMap = {
    // Text variables
    '{text}': text,
    '{selected_text}': text,
    '{selection}': text,
    
    // Context variables
    '{context}': formatContext(context),
    '{context.title}': context.title || '',
    '{context.url}': context.url || '',
    '{context.hostname}': context.hostname || '',
    '{context.timestamp}': context.timestamp || new Date().toISOString(),
    '{context.language}': context.language || 'en',
    
    // Shortcuts for common context fields
    '{title}': context.title || '',
    '{url}': context.url || '',
    '{time}': context.timestamp || new Date().toISOString(),
    '{date}': formatDate(context.timestamp),
    '{language}': context.language || 'en',
    
    // System variables
    '{timestamp}': new Date().toISOString(),
    '{date_iso}': new Date().toISOString().split('T')[0],
    '{time_iso}': new Date().toISOString().split('T')[1].split('.')[0]
  };
  
  // Add dynamic context variables (any key in context object)
  Object.entries(context).forEach(([key, value]) => {
    if (typeof value === 'string') {
      variableMap[`{context.${key}}`] = value;
      variableMap[`{${key}}`] = value;
    }
  });
  
  // Replace variables in template
  let processed = template;
  
  // First pass: replace all known variables
  Object.entries(variableMap).forEach(([variable, value]) => {
    const regex = new RegExp(escapeRegExp(variable), 'g');
    processed = processed.replace(regex, value);
  });
  
  // Second pass: handle any remaining {variable} patterns
  // This allows for custom variables that might be added in the future
  processed = processed.replace(/\{(\w+)\}/g, (match, varName) => {
    // Check if it's a nested context variable
    if (varName.startsWith('context.')) {
      const nestedKey = varName.substring(8);
      return context[nestedKey] || match;
    }
    
    // Check if it's a direct context property
    if (context[varName] !== undefined) {
      return context[varName];
    }
    
    // Return the original match if variable not found
    return match;
  });
  
  // Clean up: remove any empty lines and trim
  processed = processed
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  return processed;
}

/**
 * Format context object for display in prompt
 * @param {Object} context - Context data
 * @returns {string} Formatted context string
 */
function formatContext(context) {
  if (!context || typeof context !== 'object') {
    return 'No context available';
  }
  
  const parts = [];
  
  if (context.title) {
    parts.push(`Title: ${context.title}`);
  }
  
  if (context.url) {
    parts.push(`URL: ${context.url}`);
  }
  
  if (context.hostname) {
    parts.push(`Website: ${context.hostname}`);
  }
  
  if (context.timestamp) {
    parts.push(`Time: ${formatDate(context.timestamp)}`);
  }
  
  if (context.language) {
    parts.push(`Language: ${context.language}`);
  }
  
  return parts.join('\n');
}

/**
 * Format timestamp as readable date
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date
 */
function formatDate(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp || 'Unknown time';
  }
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate prompt template
 * @param {string} template - Prompt template to validate
 * @returns {Array} Array of validation errors, empty if valid
 */
export function validatePromptTemplate(template) {
  const errors = [];
  
  if (typeof template !== 'string') {
    errors.push('Prompt template must be a string');
    return errors;
  }
  
  if (template.trim().length === 0) {
    errors.push('Prompt template cannot be empty');
  }
  
  if (template.length > 10000) {
    errors.push('Prompt template is too long (max 10000 characters)');
  }
  
  // Check for required variables
  if (!template.includes('{text}') && !template.includes('{selected_text}')) {
    errors.push('Prompt template should include {text} variable');
  }
  
  // Check for potentially malicious content
  const dangerousPatterns = [
    /<\s*script\s*>.*?<\s*\/\s*script\s*>/gi,
    /javascript\s*:/gi,
    /data\s*:/gi,
    /vbscript\s*:/gi
  ];
  
  dangerousPatterns.forEach(pattern => {
    if (pattern.test(template)) {
      errors.push('Prompt template contains potentially dangerous content');
    }
  });
  
  return errors;
}

/**
 * Extract variables from template
 * @param {string} template - Prompt template
 * @returns {Array} Array of variable names found in template
 */
export function extractVariables(template) {
  if (!template || typeof template !== 'string') {
    return [];
  }
  
  const variablePattern = /\{([^{}]+)\}/g;
  const matches = template.match(variablePattern) || [];
  
  // Extract variable names and remove duplicates
  const variables = matches.map(match => match.slice(1, -1));
  return [...new Set(variables)];
}

/**
 * Create a default prompt template
 * @param {string} type - Type of prompt template
 * @returns {string} Default template
 */
export function getDefaultTemplate(type = 'explain') {
  const templates = {
    explain: `Explain the following text in simple terms: {text}

Context:
- Source: {context.title}
- URL: {context.url}
- Time: {context.timestamp}`,

    summarize: `Summarize the following text concisely: {text}

Focus on the main points and key information.`,

    translate: `Translate the following text to English: {text}

If the text is already in English, just return it as-is.`,

    simplify: `Simplify this text so a 12-year-old can understand it: {text}

Use simple language and avoid technical terms.`,

    analyze: `Analyze the following text and provide insights: {text}

Consider:
1. Main topic and key points
2. Tone and style
3. Potential biases or assumptions
4. Overall quality and clarity`
  };
  
  return templates[type] || templates.explain;
}

/**
 * Get all available template types
 * @returns {Array} Array of template type objects
 */
export function getTemplateTypes() {
  return [
    { id: 'explain', name: 'Explain', description: 'Explain text in simple terms' },
    { id: 'summarize', name: 'Summarize', description: 'Create a concise summary' },
    { id: 'translate', name: 'Translate', description: 'Translate to English' },
    { id: 'simplify', name: 'Simplify', description: 'Simplify for younger audiences' },
    { id: 'analyze', name: 'Analyze', description: 'Provide detailed analysis' }
  ];
}

// Make escapeRegExp available for testing
applyPromptTemplate.escapeRegExp = escapeRegExp;