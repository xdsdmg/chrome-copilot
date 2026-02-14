# Chrome Copilot Chrome Extension Development Task

## Project Overview
Build a Chrome browser extension named "Chrome Copilot" in the current directory `~/workarea/code/chrome-copilot`.

## Technology Stack

### Core Technologies
- **Chrome Extension APIs**: Manifest V3, Service Workers, Context Menus, Storage API
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Build Tools**: No build system required (simple extension), optional webpack for production
- **LLM Integration**: REST API calls to OpenAI/Anthropic/etc. endpoints
- **Storage**: Chrome Storage API (sync/local), IndexedDB for larger data

### Development Tools
- **Testing**: Chrome DevTools, Extension Developer Mode
- **Version Control**: Git
- **Code Quality**: ESLint, Prettier (optional)
- **Documentation**: JSDoc comments

## Modular Architecture

### Module 1: Extension Core (Foundation)
**Purpose**: Basic extension setup and manifest configuration
**Files**:
- `manifest.json` - Extension manifest with V3 specifications
- `icons/` - Extension icons (16x16, 48x48, 128x128 PNG)
- `_locales/` - Internationalization support (optional)

**Key Functions**:
- Define extension permissions
- Configure service worker
- Register content scripts
- Set up extension icons

**Manifest.json Specification**:
```json
{
  "manifest_version": 3,
  "name": "Chrome Copilot",
  "version": "1.0.0",
  "description": "AI-powered text explanation tool",
  "permissions": [
    "contextMenus",
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "options.html"
}
```

### Module 2: Context Menu System
**Purpose**: Handle text selection and context menu interactions
**Files**:
- `background.js` - Service worker for context menu registration
- `content.js` - Content script for text selection detection

**Key Functions**:
- Register context menu item on extension install
- Show menu only when text is selected
- Capture selected text on menu click
- Communicate between content script and background

**Interface Specifications**:

#### 1. Background Script Interface (`background.js`)
```javascript
// Register context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "chrome-copilot",
    title: "Chrome Copilot",
    contexts: ["selection"],
    visible: true
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "chrome-copilot" && info.selectionText) {
    // Send message to content script to get enhanced selection
    chrome.tabs.sendMessage(tab.id, {
      action: "processSelection",
      selection: info.selectionText
    }, (response) => {
      // Process the response from content script
      handleSelectedText(response?.enhancedSelection || info.selectionText);
    });
  }
});

// Function to handle selected text
async function handleSelectedText(text) {
  // Store in temporary storage for processing
  await chrome.storage.local.set({ lastSelection: text });
  // Open popup or send to LLM
  chrome.action.openPopup();
}
```

#### 2. Content Script Interface (`content.js`)
```javascript
// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processSelection") {
    // Enhance selection with context (page title, URL, etc.)
    const enhancedSelection = {
      text: message.selection,
      context: {
        title: document.title,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    };
    sendResponse({ enhancedSelection });
  }
  return true; // Keep message channel open for async response
});

// Detect text selection changes
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    // Notify background script about current selection
    chrome.runtime.sendMessage({
      action: "selectionUpdated",
      hasSelection: true
    });
  }
});
```

### Module 3: Configuration Management
**Purpose**: Manage user settings and preferences
**Files**:
- `options.html` - Settings page UI
- `options.js` - Settings page logic
- `storage.js` - Data storage utilities

**Key Functions**:
- API key management (secure storage)
- LLM endpoint configuration
- Model selection
- Prompt template management
- Theme preferences

**Configuration Items**:
1. **LLM Provider Settings**:
   - Provider: OpenAI / Anthropic / Custom
   - API Key: ******* (masked input)
   - API Endpoint: https://api.openai.com/v1/chat/completions
   - Model: gpt-4, gpt-3.5-turbo, claude-3, etc.

2. **Prompt Templates**:
   - Default prompt: "Explain the following text in simple terms: {text}"
   - Custom prompts: User-defined templates
   - Variables: {text}, {context}, {language}

3. **Display Settings**:
   - Result display location: Popup / Side Panel / Notification
   - Theme: Light / Dark / System
   - Font size: Small / Medium / Large

4. **Behavior Settings**:
   - Auto-copy results: Yes/No
   - Save history: Yes/No
   - Max history items: 50
   - Rate limiting: Requests per minute

**Storage Interface (`storage.js`)**:
```javascript
const Storage = {
  // Save configuration
  async saveConfig(config) {
    await chrome.storage.sync.set({ config });
  },

  // Load configuration
  async loadConfig() {
    const result = await chrome.storage.sync.get('config');
    return result.config || getDefaultConfig();
  },

  // Save API key securely
  async saveApiKey(provider, apiKey) {
    await chrome.storage.local.set({ [`apiKey_${provider}`]: apiKey });
  },

  // Get API key
  async getApiKey(provider) {
    const result = await chrome.storage.local.get(`apiKey_${provider}`);
    return result[`apiKey_${provider}`];
  },

  // Save prompt history
  async saveToHistory(entry) {
    const history = await this.getHistory();
    history.unshift({
      ...entry,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    // Keep only last 50 items
    if (history.length > 50) history.length = 50;
    await chrome.storage.local.set({ history });
  },

  // Get history
  async getHistory() {
    const result = await chrome.storage.local.get('history');
    return result.history || [];
  }
};
```

**Options Page Content (`options.html`)**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Chrome Copilot Settings</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Chrome Copilot Settings</h1>
    
    <section class="section">
      <h2>LLM Configuration</h2>
      
      <div class="form-group">
        <label for="provider">LLM Provider:</label>
        <select id="provider">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="custom">Custom API</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="apiKey">API Key:</label>
        <input type="password" id="apiKey" placeholder="Enter your API key">
        <small>Your API key is stored locally and never sent to our servers.</small>
      </div>
      
      <div class="form-group">
        <label for="model">Model:</label>
        <select id="model">
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3">Claude 3</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="endpoint">API Endpoint:</label>
        <input type="url" id="endpoint" value="https://api.openai.com/v1/chat/completions">
      </div>
    </section>
    
    <section class="section">
      <h2>Prompt Templates</h2>
      
      <div class="form-group">
        <label for="defaultPrompt">Default Prompt:</label>
        <textarea id="defaultPrompt" rows="4">
Explain the following text in simple terms: {text}

Context:
- Source: {context.title}
- URL: {context.url}
- Time: {context.timestamp}
        </textarea>
      </div>
      
      <div class="form-group">
        <label for="customPrompts">Custom Prompts (JSON):</label>
        <textarea id="customPrompts" rows="6" placeholder='[
  {"name": "Summarize", "template": "Summarize this text: {text}"},
  {"name": "Translate", "template": "Translate to English: {text}"}
]'></textarea>
      </div>
    </section>
    
    <section class="section">
      <h2>Display Settings</h2>
      
      <div class="form-group">
        <label for="theme">Theme:</label>
        <select id="theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="displayLocation">Result Display:</label>
        <select id="displayLocation">
          <option value="popup">Popup</option>
          <option value="sidepanel">Side Panel</option>
          <option value="notification">Notification</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" id="autoCopy">
          Auto-copy results to clipboard
        </label>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" id="saveHistory" checked>
          Save query history
        </label>
      </div>
    </section>
    
    <div class="actions">
      <button id="saveBtn" class="btn-primary">Save Settings</button>
      <button id="resetBtn" class="btn-secondary">Reset to Defaults</button>
      <button id="testBtn" class="btn-test">Test Connection</button>
    </div>
    
    <div id="status" class="status"></div>
  </div>
  
  <script src="options.js"></script>
</body>
</html>
```

### Module 4: LLM Integration Layer
**Purpose**: Communicate with LLM APIs
**Files**:
- `api.js` - LLM API communication layer
- `prompts.js` - Prompt template management
- `utils.js` - Utility functions (text processing, validation)

**Key Functions**:
- Make authenticated API requests
- Handle different LLM providers (OpenAI, Anthropic, etc.)
- Manage prompt templates
- Process and sanitize responses
- Error handling and retry logic

**API Interface (`api.js`)**:
```javascript
const LLMAPI = {
  // Main function to process text with LLM
  async processText(text, context, options = {}) {
    const config = await Storage.loadConfig();
    const apiKey = await Storage.getApiKey(config.provider);
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    // Apply prompt template
    const prompt = this.applyPromptTemplate(
      options.promptTemplate || config.defaultPrompt,
      { text, context }
    );
    
    // Make API request based on provider
    switch (config.provider) {
      case 'openai':
        return this.callOpenAI(apiKey, prompt, config.model, options);
      case 'anthropic':
        return this.callAnthropic(apiKey, prompt, config.model, options);
      case 'custom':
        return this.callCustomAPI(config.endpoint, apiKey, prompt, options);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  },

  // OpenAI API call
  async callOpenAI(apiKey, prompt, model, options) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  },

  // Anthropic API call
  async callAnthropic(apiKey, prompt, model, options) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: options.maxTokens || 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content[0]?.text || '';
  },

  // Custom API call
  async callCustomAPI(endpoint, apiKey, prompt, options) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        ...options
      })
    });
    
    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result || data.text || data.response || '';
  },

  // Apply prompt template with variables
  applyPromptTemplate(template, variables) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      if (key === 'text') return variables.text;
      if (key === 'context') return JSON.stringify(variables.context, null, 2);
      if (variables.context && variables.context[key]) {
        return variables.context[key];
      }
      return match;
    });
  }
};
```

### Module 5: User Interface Components
**Purpose**: Provide user-facing interfaces
**Files**:
- `popup.html` - Extension popup UI
- `popup.js` - Popup interaction logic
- `result.html` - Result display page (optional)
- `styles.css` - Common styles
- `components/` - Reusable UI components (optional)

**Key Functions**:
- Quick configuration via popup
- Result display interface
- Loading states and progress indicators
- Error message display
- History view of previous explanations

**Popup Page Content (`popup.html`)**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Chrome Copilot</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    .popup-container {
      width: 400px;
      min-height: 200px;
      padding: 16px;
    }
    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 8px;
    }
    .status-connected { background-color: #4CAF50; }
    .status-disconnected { background-color: #f44336; }
  </style>
</head>
<body>
  <div class="popup-container">
    <header class="popup-header">
      <h2>Chrome Copilot</h2>
      <div class="status">
        <span class="status-indicator" id="statusIndicator"></span>
        <span id="statusText">Checking connection...</span>
      </div>
    </header>
    
    <main class="popup-main">
      <div id="resultView" class="hidden">
        <h3>Last Result</h3>
        <div class="result-content" id="lastResult"></div>
        <div class="result-actions">
          <button id="copyResult" class="btn-small">Copy</button>
          <button id="clearResult" class="btn-small">Clear</button>
        </div>
      </div>
      
      <div id="configView">
        <div class="quick-config">
          <h3>Quick Settings</h3>
          <div class="form-group">
            <label for="quickModel">Model:</label>
            <select id="quickModel"></select>
          </div>
          <div class="form-group">
            <label for="quickPrompt">Prompt Template:</label>
            <select id="quickPrompt"></select>
          </div>
          <button id="openSettings" class="btn-secondary">Full Settings</button>
        </div>
        
        <div class="history-section">
          <h3>Recent Queries</h3>
          <div id="historyList" class="history-list">
            <!-- History items will be populated here -->
          </div>
        </div>
      </div>
      
      <div id="loadingView" class="hidden">
        <div class="loading-spinner"></div>
        <p>Processing your request...</p>
      </div>
      
      <div id="errorView" class="hidden">
        <div class="error-message" id="errorMessage"></div>
        <button id="retryBtn" class="btn-primary">Retry</button>
      </div>
    </main>
    
    <footer class="popup-footer">
      <button id="testSelection" class="btn-primary">
        Test with Current Selection
      </button>
      <small>Select text and right-click for quick access</small>
    </footer>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

**Popup Interface (`popup.js`)**:
```javascript
// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await updateStatus();
  await loadQuickSettings();
  await loadHistory();
  
  // Event listeners
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  document.getElementById('testSelection').addEventListener('click', async () => {
    // Get current tab and selection
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'getSelection' }, async (response) => {
      if (response?.selection) {
        await processText(response.selection);
      } else {
        showError('No text selected. Please select some text first.');
      }
    });
  });
});

// Update connection status
async function updateStatus() {
  const config = await Storage.loadConfig();
  const apiKey = await Storage.getApiKey(config.provider);
  
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  if (apiKey) {
    statusIndicator.className = 'status-indicator status-connected';
    statusText.textContent = `Connected to ${config.provider}`;
  } else {
    statusIndicator.className = 'status-indicator status-disconnected';
    statusText.textContent = 'API key not configured';
  }
}

// Load quick settings
async function loadQuickSettings() {
  const config = await Storage.loadConfig();
  
  // Populate model dropdown
  const modelSelect = document.getElementById('quickModel');
  const models = {
    openai: ['gpt-4', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
  };
  
  models[config.provider]?.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    option.selected = model === config.model;
    modelSelect.appendChild(option);
  });
}

// Load history
async function loadHistory() {
  const history = await Storage.getHistory();
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  history.slice(0, 5).forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-text">${item.text.substring(0, 50)}...</div>
      <div class="history-time">${new Date(item.timestamp).toLocaleTimeString()}</div>
    `;
    historyItem.addEventListener('click', () => {
      showResult(item.result);
    });
    historyList.appendChild(historyItem);
  });
}
```

### Module 6: Result Display System
**Purpose**: Show LLM responses to users
**Files**:
- `display.js` - Result rendering logic
- `notification.js` - Desktop notification system (optional)
- `sidepanel.html` + `sidepanel.js` - Side panel interface (optional)

**Key Functions**:
- Format LLM responses (markdown support)
- Copy to clipboard functionality
- Save results locally
- Share results (optional)

**Display Interface (`display.js`)**:
```javascript
const Display = {
  // Show result in popup
  showInPopup(result, metadata) {
    const resultElement = document.getElementById('lastResult');
    resultElement.innerHTML = this.formatResult(result);
    
    // Show result view, hide config view
    document.getElementById('resultView').classList.remove('hidden');
    document.getElementById('configView').classList.add('hidden');
    
    // Auto-copy if enabled
    const config = Storage.loadConfig();
    if (config.autoCopy) {
      this.copyToClipboard(result);
    }
    
    // Save to history
    Storage.saveToHistory({
      text: metadata.text,
      result: result,
      context: metadata.context
    });
  },

  // Format result with markdown support
  formatResult(text) {
    // Simple markdown to HTML conversion
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/^# (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h4>$1</h4>')
      .replace(/^### (.*?)$/gm, '<h5>$1</h5>');
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  },

  // Show desktop notification
  showNotification(message) {
    if (Notification.permission === 'granted') {
      new Notification('Chrome Copilot', {
        body: message,
        icon: 'icons/icon48.png'
      });
    }
  },

  // Show error
  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    document.getElementById('errorView').classList.remove('hidden');
    document.getElementById('configView').classList.add('hidden');
  }
};
```

### Module 7: Utility & Helper Functions
**Purpose**: Shared utilities across modules
**Files**:
- `constants.js` - Application constants
- `validation.js` - Input validation utilities
- `logger.js` - Logging system (development only)

**Key Functions**:
- Text sanitization
- URL validation
- API response parsing
- Error formatting

**Utility Interface (`utils.js`)**:
```javascript
const Utils = {
  // Validate API key format
  validateApiKey(provider, key) {
    if (!key || key.trim().length < 10) {
      return false;
    }
    
    switch (provider) {
      case 'openai':
        return key.startsWith('sk-') && key.length > 20;
      case 'anthropic':
        return key.startsWith('sk-ant-') && key.length > 20;
      default:
        return key.length > 10;
    }
  },

  // Sanitize text input
  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    
    // Remove excessive whitespace
    text = text.trim().replace(/\s+/g, ' ');
    
    // Limit length (safety measure)
    if (text.length > 10000) {
      text = text.substring(0, 10000) + '... [truncated]';
    }
    
    return text;
  },

  // Validate URL
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Format error message
  formatError(error) {
    if (error.message.includes('API key')) {
      return 'Please configure your API key in settings.';
    } else if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    } else if (error.message.includes('rate limit')) {
      return 'Rate limit exceeded. Please try again later.';
    } else {
      return `Error: ${error.message}`;
    }
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};
```

## Module Dependencies
```
Extension Core
    ↓
Context Menu System → Configuration Management
    ↓                    ↓
LLM Integration Layer ←─┘
    ↓
Result Display System
    ↑
User Interface Components
    ↑
Utility Functions (shared)
```

## Implementation Priority

### Phase 1: Core Modules (独立可运行)
1. **Module 1**: Extension Core - Basic manifest and structure
2. **Module 2**: Context Menu System - Text selection and menu
3. **Module 5**: User Interface Components - Basic popup

### Phase 2: Configuration & Integration
4. **Module 3**: Configuration Management - Settings page
5. **Module 4**: LLM Integration Layer - API communication
6. **Module 7**: Utility Functions - Shared helpers

### Phase 3: Enhanced Features
7. **Module 6**: Result Display System - Advanced result viewing
8. Additional features: History, Export, Keyboard shortcuts

## Module Interface Specifications

### Module 1 Outputs:
- Working manifest.json with all required permissions
- Extension loads in Chrome without errors
- Basic icons displayed in browser toolbar

### Module 2 Outputs:
- Context menu appears only when text is selected
- Selected text captured correctly with context
- Menu click triggers background script and opens popup

### Module 3 Outputs:
- Settings page with all configuration options
- API key saves securely to Chrome storage
- Configuration persists across browser sessions
- Input validation for all fields

### Module 4 Outputs:
- API calls to configured LLM endpoint with proper authentication
- Prompt templates correctly applied to selected text
- Error handling for network issues and API errors
- Support for multiple LLM providers

### Module 5 Outputs:
- Popup displays current configuration status
- Quick settings adjustment without opening full options
- History view of previous queries
- Responsive UI with loading/error states

### Module 6 Outputs:
- LLM responses displayed with proper formatting
- Copy to clipboard functionality works
- Desktop notifications for completed requests
- Clean result display with markdown support

### Module 7 Outputs:
- Input validation utilities work correctly
- Text sanitization prevents injection attacks
- Error messages are user-friendly
- Debouncing prevents excessive API calls

## Testing Strategy per Module

### Module 1 Tests:
- Extension loads without errors in Chrome
- All required permissions defined in manifest
- Icons display properly in toolbar
- Content scripts injected on page load

### Module 2 Tests:
- Context menu appears only when text is selected
- Selected text captured accurately with page context
- Cross-origin text selection works
- Menu click triggers correct background script

### Module 3 Tests:
- Settings save and load correctly from storage
- API key stored securely (not in plain text)
- Input validation prevents invalid configurations
- Theme changes apply immediately

### Module 4 Tests:
- API calls succeed with valid credentials
- Error handling for invalid API responses
- Prompt templates apply variables correctly
- Different LLM providers work as expected

### Module 5 Tests:
- Popup opens and displays current settings
- Quick configuration changes take effect
- UI is responsive and user-friendly
- History loads and displays correctly

### Module 6 Tests:
- Results display with proper markdown formatting
- Copy functionality works across browsers
- Large responses handled gracefully
- Notifications appear with correct permissions

### Module 7 Tests:
- API key validation works for different providers
- Text sanitization prevents XSS attacks
- URL validation catches invalid endpoints
- Debouncing prevents rapid-fire API calls

## Development Guidelines

### Code Standards:
- Use ES6+ features (const/let, arrow functions, template literals)
- Follow Chrome Extension best practices
- Add JSDoc comments for all public functions
- Keep modules loosely coupled with clear interfaces

### Security:
- Never log API keys or sensitive data
- Validate all external inputs before processing
- Use Content Security Policy in manifest
- Sanitize HTML content before display
- Store API keys in chrome.storage.local (not sync)

### Performance:
- Minimize content script injection impact
- Cache API responses when appropriate
- Use efficient DOM manipulation techniques
- Implement request debouncing for user input
- Lazy load non-essential components

## Module Completion Checklist

Each module should be independently testable. A module is complete when:
- [ ] All specified files created with correct structure
- [ ] Core functions implemented as per interface specifications
- [ ] Module interfaces properly defined and documented
- [ ] Basic error handling included for all operations
- [ ] Tested in Chrome DevTools with real scenarios
- [ ] JSDoc documentation comments added for public APIs
- [ ] Code follows established style guidelines
- [ ] Security considerations implemented
- [ ] Performance optimizations applied where needed

## Next Module to Implement: Module 1 (Extension Core)
Start with the foundation - create manifest.json and basic extension structure according to the specifications above.