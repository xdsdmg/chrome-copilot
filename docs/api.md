# Chrome Copilot - API Documentation

## Overview
This document describes the public APIs and interfaces for the Chrome Copilot browser extension. The extension provides AI-powered text explanation capabilities through a modular architecture.

## Core Interfaces

### Storage Interface (`src/config/storage.js`)
The Storage class provides secure data persistence for configuration, API keys, and history.

#### Methods

##### `saveConfig(config: Object): Promise<void>`
Saves user configuration to Chrome storage.
- **Parameters**:
  - `config`: User configuration object (see `UserConfig` interface)
- **Returns**: Promise that resolves when configuration is saved
- **Storage Location**: `chrome.storage.sync`
- **Error Handling**: Throws error on storage failure

##### `loadConfig(): Promise<UserConfig>`
Loads user configuration from Chrome storage.
- **Returns**: Promise resolving to UserConfig object
- **Default Values**: Returns DEFAULT_CONFIG from constants.js if no config exists
- **Error Handling**: Returns default config on error

##### `saveApiKey(provider: string, apiKey: string): Promise<void>`
Securely saves API key for a specific provider.
- **Parameters**:
  - `provider`: LLM provider name ('openai', 'anthropic', 'custom')
  - `apiKey`: API key string
- **Storage Location**: `chrome.storage.local` (more secure)
- **Error Handling**: Throws error on invalid input or storage failure

##### `getApiKey(provider: string): Promise<string|null>`
Retrieves API key for a specific provider.
- **Parameters**:
  - `provider`: LLM provider name
- **Returns**: API key string or null if not found
- **Error Handling**: Returns null on error

##### `saveToHistory(entry: HistoryEntry): Promise<void>`
Saves a query entry to history storage.
- **Parameters**:
  - `entry`: History entry object containing text, result, context, provider, model
- **Storage Location**: `chrome.storage.local`
- **Auto-pruning**: Respects `maxHistoryItems` configuration
- **Error Handling**: Throws error on storage failure

##### `getHistory(): Promise<Array<HistoryEntry>>`
Retrieves all history entries.
- **Returns**: Array of history entries sorted by timestamp (newest first)
- **Error Handling**: Returns empty array on error

##### `clearHistory(): Promise<void>`
Clears all history entries.
- **Returns**: Promise that resolves when history is cleared
- **Error Handling**: Throws error on storage failure

##### `exportData(): Promise<string>`
Exports all extension data as JSON string.
- **Returns**: JSON string containing config, history, and storage data
- **Security**: API keys are redacted in export
- **Error Handling**: Throws error on export failure

##### `importData(jsonData: string): Promise<void>`
Imports data from JSON string.
- **Parameters**:
  - `jsonData`: JSON string containing extension data
- **Validation**: Checks for required fields and version
- **Error Handling**: Throws error on invalid data or import failure

#### Data Types

```javascript
// User configuration interface
interface UserConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  model: string;
  endpoint: string;
  defaultPrompt: string;
  customPrompts: Array<{name: string, template: string}>;
  theme: 'light' | 'dark' | 'system';
  displayLocation: 'popup' | 'sidepanel' | 'notification';
  autoCopy: boolean;
  saveHistory: boolean;
  maxHistoryItems: number;
}

// History entry interface
interface HistoryEntry {
  id: number;
  timestamp: string;
  text: string;
  result: string;
  context: {
    title: string;
    url: string;
    hostname?: string;
    language?: string;
  };
  provider: string;
  model: string;
}
```

### LLM API Interface (`src/api/api.js`)
The LLMAPI class provides a unified interface for communicating with various LLM providers.

#### Methods

##### `processText(text: string, context: Object, options?: Object): Promise<string>`
Processes text using configured LLM provider.
- **Parameters**:
  - `text`: Selected text to process (required)
  - `context`: Page context data containing title, URL, timestamp (required)
  - `options`: Additional options (optional)
    - `promptTemplate`: Custom prompt template (defaults to config.defaultPrompt)
    - `maxTokens`: Maximum tokens in response (default: 1000)
    - `temperature`: Response temperature (default: 0.7)
- **Returns**: Promise resolving to processed text from LLM
- **Processing Steps**:
  1. Validates inputs
  2. Loads configuration and API key
  3. Applies prompt template with variables
  4. Calls appropriate provider based on configuration
  5. Validates and returns response
- **Error Handling**: Throws descriptive errors for API failures, invalid config, or network issues

#### Provider Architecture
The LLMAPI class delegates to provider-specific implementations:

##### OpenAI Provider (`src/api/providers/openai.js`)
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Models Supported**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`, `gpt-3.5-turbo-instruct`
- **Authentication**: Bearer token in Authorization header
- **Request Format**: OpenAI ChatCompletion API format

##### Anthropic Provider (`src/api/providers/anthropic.js`)
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Models Supported**: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
- **Authentication**: `x-api-key` header
- **Request Format**: Anthropic Messages API format

##### Custom Provider (`src/api/providers/custom.js`)
- **Endpoint**: Configurable via settings
- **Models Supported**: `custom` (configurable)
- **Authentication**: Configurable (Bearer token or API key header)
- **Request Format**: Configurable JSON format

### Display Interface (`src/display/display.js`)
The Display class handles result formatting and presentation across different display locations.

#### Methods

##### `formatResult(text: string): string`
Formats LLM response text with markdown-like styling.
- **Parameters**:
  - `text`: Raw LLM response text
- **Returns**: HTML-formatted string with applied styling
- **Supported Formatting**:
  - Line breaks → `<br>` tags
  - `**bold**` → `<strong>` tags
  - `*italic*` → `<em>` tags
  - `` `code` `` → `<code>` tags
  - Headers (`#`, `##`, `###`) → `<h2>`, `<h3>`, `<h4>` tags
  - Lists (`-`, `*`, `1.`) → `<ul>`, `<ol>`, `<li>` tags
  - Blockquotes (`>`) → `<blockquote>` tags
  - Links (`[text](url)`) → `<a>` tags

##### `copyToClipboard(text: string): Promise<void>`
Copies text to system clipboard.
- **Parameters**:
  - `text`: Text to copy
- **Returns**: Promise that resolves when copy is complete
- **Fallback**: Uses document.execCommand() if Clipboard API unavailable
- **Error Handling**: Throws error on copy failure

##### `showNotification(title: string, body: string, options?: Object): Promise<void>`
Shows desktop notification.
- **Parameters**:
  - `title`: Notification title
  - `body`: Notification body text
  - `options`: Additional options (icon, badge, etc.)
- **Permission Handling**: Requests permission if not already granted
- **Auto-close**: Notifications auto-close after 10 seconds
- **Error Handling**: Silently fails if notifications not supported/permitted

##### `showError(message: string, options?: Object): Promise<void>`
Displays error message in configured display location.
- **Parameters**:
  - `message`: Error message text
  - `options`: Display options
- **Location**: Uses configured displayLocation from settings
- **Fallback**: Defaults to popup display
- **Error Handling**: Graceful degradation if primary display fails

##### `applyTheme(theme: string): void`
Applies theme to the current document.
- **Parameters**:
  - `theme`: Theme name ('light', 'dark', 'system')
- **System Theme**: Automatically detects system preference when theme='system'
- **CSS Classes**: Adds `theme-light` or `theme-dark` class to body
- **Data Attribute**: Sets `data-theme` attribute on documentElement

##### `initTheme(): Promise<void>`
Initializes theme based on user configuration.
- **Returns**: Promise that resolves when theme is applied
- **Event Listener**: Listens for system theme changes when theme='system'
- **Error Handling**: Falls back to default theme on error

### Popup Interface (`src/ui/popup.js`)
The PopupController class manages the popup UI state and interactions.

#### Methods

##### `updateStatus(): Promise<void>`
Updates connection status display in popup.
- **Checks**: Verifies API key configuration
- **UI Updates**: Updates status indicator and text
- **Badge Updates**: Updates extension badge based on status

##### `loadQuickSettings(): Promise<void>`
Loads quick settings dropdowns in popup.
- **Data Sources**: Loads models and prompts from configuration
- **UI Updates**: Populates dropdown selections
- **Event Listeners**: Sets up change handlers

##### `loadHistory(): Promise<void>`
Loads recent query history in popup.
- **Data Source**: `Storage.getHistory()`
- **UI Updates**: Populates history list with formatted entries
- **Pagination**: Shows limited number of recent items

##### `showResult(result: string, metadata: Object): void`
Displays LLM result in popup.
- **Parameters**:
  - `result`: LLM response text
  - `metadata`: Result metadata (source, timestamp, provider, model)
- **UI Updates**: Switches to result view, formats content
- **Copy Functionality**: Enables copy-to-clipboard button

##### `showError(message: string): void`
Displays error message in popup.
- **Parameters**:
  - `message`: Error message text
- **UI Updates**: Switches to error view, shows message and retry options

### Utility Interfaces

#### Validation (`src/utils/validation.js`)
```javascript
// Validates API key format
validateApiKey(provider: string, key: string): boolean

// Validates URL format
isValidUrl(url: string): boolean

// Validates user configuration
validateConfig(config: UserConfig): string[] // returns error messages

// Validates prompt template
validatePromptTemplate(template: string): boolean
```

#### Sanitization (`src/utils/sanitize.js`)
```javascript
// Sanitizes text input
sanitizeText(text: string): string

// Sanitizes HTML content
sanitizeHtml(html: string): string

// Limits text length
truncateText(text: string, maxLength: number): string
```

#### Logger (`src/utils/logger.js`)
```javascript
// Logging methods (development only)
debug(message: string, data?: any): void
info(message: string, data?: any): void
warn(message: string, data?: any): void
error(message: string, data?: any): void
```

#### Debounce (`src/utils/debounce.js`)
```javascript
// Creates debounced function
debounce(func: Function, wait: number): Function

// Creates throttled function
throttle(func: Function, limit: number): Function
```

## Message Passing API

### Chrome Runtime Messages
The extension uses Chrome's message passing API for communication between components.

#### Message Structure
```javascript
{
  action: string,      // Action type (see ACTION_TYPES in constants.js)
  data: any,           // Message payload
  response?: any       // Response data (for replies)
}
```

#### Action Types (`src/core/constants.js`)
```javascript
export const ACTION_TYPES = {
  PROCESS_SELECTION: 'processSelection',
  SELECTION_UPDATED: 'selectionUpdated',
  GET_SELECTION: 'getSelection',
  SHOW_RESULT: 'showResult',
  SHOW_ERROR: 'showError',
  UPDATE_STATUS: 'updateStatus'
};
```

#### Common Message Patterns

##### Content Script → Background Script
```javascript
// Selection updated notification
chrome.runtime.sendMessage({
  action: ACTION_TYPES.SELECTION_UPDATED,
  hasSelection: true,
  selectionLength: selectedText.length
});

// Enhanced selection response
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === ACTION_TYPES.PROCESS_SELECTION) {
    const enhancedSelection = enhanceSelection(message.selection);
    sendResponse({ enhancedSelection });
  }
});
```

##### Background Script → Content Script
```javascript
// Request enhanced selection
const response = await chrome.tabs.sendMessage(tab.id, {
  action: ACTION_TYPES.PROCESS_SELECTION,
  selection: info.selectionText
});
```

##### Popup ↔ Background Script
```javascript
// Get current state
chrome.runtime.sendMessage({
  action: ACTION_TYPES.GET_SELECTION
}, (response) => {
  // Handle response
});

// Update status
chrome.runtime.sendMessage({
  action: ACTION_TYPES.UPDATE_STATUS
});
```

## Error Codes and Messages

### Standard Error Messages (`src/core/constants.js`)
```javascript
export const ERROR_MESSAGES = {
  NO_API_KEY: 'API key not configured. Please set up your API key in extension settings.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  API_ERROR: 'API error. Please check your API key and configuration.',
  NO_SELECTION: 'No text selected. Please select some text first.',
  INVALID_CONFIG: 'Invalid configuration. Please check your settings.'
};
```

### Error Handling Patterns
All async methods follow consistent error handling:
1. Throw `Error` objects with descriptive messages
2. Catch errors at appropriate boundaries
3. Convert to user-friendly messages when displayed
4. Log technical details to console (development only)

## Configuration Variables

### Default Configuration (`src/core/constants.js`)
```javascript
export const DEFAULT_CONFIG = {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  defaultPrompt: `Explain the following text in simple terms: {text}\n\nContext:\n- Source: {context.title}\n- URL: {context.url}\n- Time: {context.timestamp}`,
  customPrompts: [
    { name: 'Summarize', template: 'Summarize this text: {text}' },
    { name: 'Translate to English', template: 'Translate to English: {text}' },
    { name: 'Explain like I\'m 5', template: 'Explain this like I\'m 5 years old: {text}' }
  ],
  theme: 'system',
  displayLocation: 'popup',
  autoCopy: false,
  saveHistory: true,
  maxHistoryItems: 50
};
```

### Available Providers
```javascript
export const PROVIDERS = [
  {
    value: 'openai',
    label: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-instruct']
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
  },
  {
    value: 'custom',
    label: 'Custom API',
    models: ['custom']
  }
];
```

## Extension Points

### Adding New LLM Providers
1. Create new provider file in `src/api/providers/`
2. Implement `call(apiKey, prompt, model, options)` method
3. Add provider to `PROVIDERS` array in constants.js
4. Add case in `LLMAPI.processText()` switch statement

### Custom Prompt Templates
- Use `{text}` variable for selected text
- Use `{context.title}`, `{context.url}`, `{context.timestamp}` for context
- Templates support multi-line formatting

### Theme Customization
- Add theme CSS file in `src/ui/themes/`
- Update `THEMES` array in constants.js
- Theme CSS should define CSS variables for colors

## Version Information

### Extension Manifest
- **Manifest Version**: 3
- **Minimum Chrome Version**: 88
- **Permissions**: contextMenus, storage, activeTab, scripting, sidePanel
- **Host Permissions**: https://api.openai.com/*, https://api.anthropic.com/*

### Storage Schema Version
- **Config Version**: 1.0
- **History Schema**: 1.0
- **Backward Compatibility**: Maintained through version field

---

*Last Updated: Based on implementation completed February 2026*