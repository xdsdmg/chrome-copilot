# Development Task: Chrome Copilot Browser Assistant

## 2. Project Overview
Chrome Copilot is a Chrome browser extension that provides AI-powered text explanation and analysis capabilities. The extension enables users to select text on any webpage, access a context menu option, and receive AI-generated explanations using configured LLM models and prompts. This tool aims to enhance productivity and learning by providing instant explanations for selected text content.

## 3. Overall Requirements

### 3.1 Core Features

**User Features:**
1. **Text Selection & Context Menu Integration**
   - **Input**: User selects text on any webpage
   - **Processing**: Extension detects text selection and adds "Chrome Copilot" option to right-click context menu
   - **Output**: Context menu appears with Chrome Copilot option when text is selected

2. **AI Text Processing**
   - **Input**: User clicks "Chrome Copilot" context menu item
   - **Processing**: Extension captures selected text, applies configured prompt template, sends to LLM API
   - **Output**: AI-generated explanation displayed to user

3. **Configuration Management**
   - **Input**: User accesses extension settings
   - **Processing**: User configures LLM provider, API key, model, prompt templates, display preferences
   - **Output**: Settings saved securely and applied to all future requests

4. **Result Display & History**
   - **Input**: AI response received from LLM API
   - **Processing**: Format response, apply markdown styling, store in history
   - **Output**: Formatted result displayed in popup/side panel, optionally copied to clipboard

**System Features:**
5. **Secure Storage**
   - **Input**: API keys and sensitive configuration data
   - **Processing**: Encrypt and store in Chrome secure storage
   - **Output**: Data persisted securely across browser sessions

6. **Error Handling & Recovery**
   - **Input**: Network errors, API failures, invalid configurations
   - **Processing**: Graceful error messages, retry logic, fallback behaviors
   - **Output**: User-friendly error messages, system continues functioning

### 3.2 Non-Functional Requirements

**Performance:**
- Context menu should appear within 100ms of text selection
- AI response display within 3 seconds for typical requests (excluding LLM API latency)
- Content script should not impact page performance (>60fps maintained)
- Memory usage under 50MB for extension components

**Security:**
- API keys stored in Chrome storage.local with encryption
- No sensitive data logged to console or external services
- Content Security Policy enforced in manifest
- All user inputs sanitized before processing

**Reliability:**
- 99.9% availability for extension core functionality
- Graceful degradation when LLM API is unavailable
- Automatic recovery from service worker crashes
- Configuration data persisted across browser updates

**Maintainability:**
- Follow ESLint and Prettier coding standards
- Comprehensive logging for debugging (development only)
- Modular architecture with clear separation of concerns
- JSDoc comments for all public APIs

**Compatibility:**
- Chrome browser version 88+ (Manifest V3 support)
- Compatible with ChromeOS, Windows, macOS, Linux
- Support for standard web pages and common web apps

## 4. Technology Stack

### 4.1 Core Technologies
- **Chrome Extension APIs**: Manifest V3, Service Workers, Context Menus, Storage API, Tabs API
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **LLM Integration**: REST API calls to OpenAI (v1/chat/completions), Anthropic (v1/messages)
- **Storage**: Chrome Storage API (sync for config, local for sensitive data), IndexedDB for history
- **Build Tools**: npm scripts, optional Webpack for production optimization
- **Testing**: Jest for unit tests, Chrome DevTools for manual testing

### 4.2 Development Tools
- **Version Control**: Git with conventional commits
- **Package Manager**: npm or pnpm
- **Code Quality**: ESLint, Prettier
- **Documentation**: JSDoc, Markdown
- **CI/CD**: GitHub Actions (optional)
- **Debugging**: Chrome DevTools, Extension Developer Mode

## 5. System Architecture

### 5.1 High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Browser                            │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   Webpage  │  │  Content   │  │       Popup          │  │
│  │   (DOM)    │◄─┤   Script   │◄─┤    (UI Interface)    │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
│         │               │                    │              │
│         ▼               ▼                    ▼              │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ Context    │  │ Background │  │     Options Page     │  │
│  │   Menu     │─►│   Service  │─►│   (Configuration)    │  │
│  └────────────┘  │   Worker   │  └──────────────────────┘  │
│                  └────────────┘              │              │
│                         │                    │              │
│                         ▼                    ▼              │
│                  ┌────────────┐      ┌──────────────┐      │
│                  │   Storage  │      │    LLM API   │      │
│                  │   (Chrome  │      │   (External  │      │
│                  │   Storage) │      │    Service)  │      │
│                  └────────────┘      └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User selects text → Content script detects selection
2. Right-click → Context menu appears with Chrome Copilot option
3. Click option → Background service worker receives event
4. Service worker → Captures text, retrieves configuration
5. Configuration + Text → Sent to LLM API
6. LLM Response → Processed and displayed to user
7. Result → Stored in history for future reference

### 5.2 Module Breakdown
1. **Extension Core**: Manifest configuration, permissions, basic structure
2. **Context Menu System**: Text selection detection, context menu handling
3. **Configuration Manager**: User settings, API key management, storage
4. **LLM Integration Layer**: API communication with LLM providers
5. **User Interface Components**: Popup, options page, result display
6. **Result Display System**: Response formatting, notifications, history
7. **Utility Functions**: Shared helpers for validation, sanitization, logging

## 6. Module Structure

### 6.1 Project Directory Structure
```
chrome-copilot/
├── manifest.json                    # Extension manifest (V3)
├── icons/                           # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── src/
│   ├── core/                        # Module 1: Extension Core
│   │   └── constants.js
│   ├── background/                  # Module 2: Context Menu System
│   │   ├── background.js
│   │   └── context-menu.js
│   ├── content/                     # Module 2: Content Scripts
│   │   └── content.js
│   ├── config/                      # Module 3: Configuration Management
│   │   ├── storage.js
│   │   ├── options.html
│   │   └── options.js
│   ├── api/                         # Module 4: LLM Integration Layer
│   │   ├── api.js
│   │   ├── providers/
│   │   │   ├── openai.js
│   │   │   ├── anthropic.js
│   │   │   └── custom.js
│   │   └── prompts.js
│   ├── ui/                          # Module 5: User Interface Components
│   │   ├── popup.html
│   │   ├── popup.js
│   │   ├── components/
│   │   │   ├── status-indicator.js
│   │   │   ├── history-list.js
│   │   │   └── quick-settings.js
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   ├── display/                     # Module 6: Result Display System
│   │   ├── display.js
│   │   ├── notification.js
│   │   ├── sidepanel.html
│   │   └── sidepanel.js
│   └── utils/                       # Module 7: Utility Functions
│       ├── validation.js
│       ├── sanitize.js
│       ├── logger.js
│       └── debounce.js
├── styles/                          # Shared Styles
│   ├── main.css
│   ├── popup.css
│   └── options.css
├── assets/                          # Static Assets
│   ├── fonts/
│   └── images/
├── tests/                           # Test Files
│   ├── unit/
│   │   ├── api.test.js
│   │   ├── storage.test.js
│   │   └── utils.test.js
│   └── integration/
│       └── extension.test.js
├── docs/                            # Documentation
│   ├── api.md
│   ├── setup.md
│   └── architecture.md
├── .gitignore
├── package.json
├── README.md
└── task.md
```

### 6.2 Module Details

#### Module 1: Extension Core

##### Module Goal
Establish the foundation of the Chrome extension with proper manifest configuration, permissions, and basic structure to ensure the extension loads correctly in Chrome browser.

##### Module Directory
- Root level: `manifest.json`, `icons/`, `_locales/`
- `src/core/constants.js`

##### Data Design
- **Data Models**: Default configuration structure, permission definitions
- **Storage**: Chrome manifest defines storage permissions, no module-specific storage

##### Interface Definitions
- **External Interfaces**: Chrome Extension Manifest (JSON format)
- **Manifest Interface**:
  - **Purpose**: Define extension properties, permissions, and resources
  - **Request Method**: N/A (static configuration)
  - **Request Parameters**: See manifest.json specification
  - **Response Format**: N/A
  - **Processing Logic**: Chrome reads manifest on extension load

##### Configuration Items
- `manifest_version`: 3 (required)
- `name`: "Chrome Copilot" (required)
- `version`: "1.0.0" (required)
- `permissions`: ["contextMenus", "storage", "activeTab", "scripting"]
- `host_permissions`: ["https://api.openai.com/*", "https://api.anthropic.com/*"]

#### Module 2: Context Menu System

##### Module Goal
Enable text selection detection and context menu integration to provide seamless user access to Chrome Copilot functionality.

##### Module Directory
- `src/background/background.js`
- `src/background/context-menu.js`
- `src/content/content.js`

##### Data Design
- **Data Models**: 
  ```javascript
  interface SelectionData {
    text: string;
    context: {
      title: string;
      url: string;
      timestamp: string;
    };
  }
  ```
- **Storage**: Temporary storage in `chrome.storage.local` for current selection

##### Interface Definitions

**Background Script Interface**:
- **Name**: `contextMenuHandler`
- **Purpose**: Handle context menu creation and click events
- **Request Method**: Chrome `contextMenus.onClicked` event
- **Request Parameters**: `info` (contains `selectionText`, `menuItemId`), `tab` (current tab)
- **Response Format**: Sends message to content script for enhanced selection
- **Processing Logic**: 
  1. Create context menu on extension install
  2. Listen for menu clicks
  3. Send message to content script
  4. Process enhanced selection data

**Content Script Interface**:
- **Name**: `selectionProcessor`
- **Purpose**: Detect text selection and provide enhanced context
- **Request Method**: Chrome `runtime.onMessage` listener
- **Request Parameters**: `message` with `action: "processSelection"` and `selection` text
- **Response Format**: `{ enhancedSelection: SelectionData }`
- **Processing Logic**:
  1. Listen for messages from background
  2. Enhance selection with page context
  3. Send response back

##### Page/UI Description
- No direct UI, integrates with browser's native context menu
- Adds "Chrome Copilot" option when text is selected

#### Module 3: Configuration Management

##### Module Goal
Manage user settings, API keys, and preferences with secure storage and validation.

##### Module Directory
- `src/config/storage.js`
- `src/config/options.html`
- `src/config/options.js`

##### Data Design
- **Data Models**:
  ```javascript
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
  ```
- **Storage**: `chrome.storage.sync` for config, `chrome.storage.local` for API keys

##### Interface Definitions

**Storage Interface**:
- **Name**: `Storage`
- **Purpose**: Provide CRUD operations for configuration data
- **Methods**:
  - `saveConfig(config: UserConfig): Promise<void>`
  - `loadConfig(): Promise<UserConfig>`
  - `saveApiKey(provider: string, apiKey: string): Promise<void>`
  - `getApiKey(provider: string): Promise<string>`
  - `saveToHistory(entry: HistoryEntry): Promise<void>`
  - `getHistory(): Promise<HistoryEntry[]>`

##### Page/UI Description
**Options Page (`options.html`)**:
- Layout: Three sections (LLM Configuration, Prompt Templates, Display Settings)
- Data displayed: Current configuration values loaded from storage
- Interfaces called: `Storage.loadConfig()` on load, `Storage.saveConfig()` on save

**Configuration Items**:
1. LLM Provider: Dropdown (OpenAI, Anthropic, Custom)
2. API Key: Password input field
3. Model: Dropdown (provider-specific models)
4. API Endpoint: URL input
5. Default Prompt: Textarea with variables `{text}`, `{context}`
6. Custom Prompts: JSON textarea for custom templates
7. Theme: Dropdown (Light, Dark, System)
8. Display Location: Dropdown (Popup, Side Panel, Notification)
9. Auto-copy: Checkbox
10. Save History: Checkbox
11. Max History Items: Number input (default: 50)

#### Module 4: LLM Integration Layer

##### Module Goal
Provide abstraction layer for communicating with various LLM APIs with support for multiple providers and prompt templating.

##### Module Directory
- `src/api/api.js`
- `src/api/prompts.js`
- `src/api/providers/openai.js`
- `src/api/providers/anthropic.js`
- `src/api/providers/custom.js`

##### Data Design
- **Data Models**:
  ```javascript
  interface LLMRequest {
    text: string;
    context: SelectionContext;
    options?: {
      promptTemplate?: string;
      maxTokens?: number;
      temperature?: number;
    };
  }

  interface LLMResponse {
    text: string;
    provider: string;
    model: string;
    timestamp: string;
  }
  ```
- **Storage**: No persistent storage, uses configuration from Module 3

##### Interface Definitions

**Main API Interface**:
- **Name**: `LLMAPI`
- **Purpose**: Process text using configured LLM provider
- **Method**: `processText(text: string, context: SelectionContext, options?: Object): Promise<string>`
- **Request Parameters**: 
  - `text`: Selected text to process (required)
  - `context`: Page context data (required)
  - `options`: Additional options like custom prompt template
- **Response Format**: Processed text from LLM
- **Processing Logic**:
  1. Load configuration and API key
  2. Apply prompt template with variables
  3. Call appropriate provider based on configuration
  4. Handle errors and retries
  5. Return processed text

**Provider Interfaces**:
- **OpenAI Provider**: `callOpenAI(apiKey, prompt, model, options)`
- **Anthropic Provider**: `callAnthropic(apiKey, prompt, model, options)`
- **Custom Provider**: `callCustomAPI(endpoint, apiKey, prompt, options)`

##### Configuration Items
- Provider-specific API endpoints
- Model lists per provider
- Default request parameters (maxTokens, temperature)

#### Module 5: User Interface Components

##### Module Goal
Provide user-facing interfaces for quick access, configuration, and status display.

##### Module Directory
- `src/ui/popup.html`
- `src/ui/popup.js`
- `src/ui/components/status-indicator.js`
- `src/ui/components/history-list.js`
- `src/ui/components/quick-settings.js`
- `src/ui/themes/light.css`
- `src/ui/themes/dark.css`

##### Data Design
- **Data Models**: UI state, component props
- **Storage**: Uses configuration from Module 3, no independent storage

##### Interface Definitions

**Popup Interface**:
- **Name**: `PopupController`
- **Purpose**: Manage popup UI state and interactions
- **Methods**:
  - `updateStatus(): Promise<void>` - Update connection status display
  - `loadQuickSettings(): Promise<void>` - Load quick settings dropdowns
  - `loadHistory(): Promise<void>` - Load recent query history
  - `showResult(result: string, metadata: Object): void` - Display LLM result
  - `showError(message: string): void` - Display error message

**Component Interfaces**:
- **StatusIndicator**: `update(status: 'connected' | 'disconnected', provider: string)`
- **HistoryList**: `loadItems(items: HistoryEntry[])`, `onItemClick(callback)`
- **QuickSettings**: `updateSettings(config: UserConfig)`, `onChange(callback)`

##### Page/UI Description
**Popup Page (`popup.html`)**:
- Header: Extension name and connection status indicator
- Main Area: Three views (config, result, loading, error)
  - Config View: Quick settings, history list
  - Result View: Formatted LLM response with copy/clear buttons
  - Loading View: Spinner and "Processing..." message
  - Error View: Error message and retry button
- Footer: "Test with Current Selection" button

**Data Sources**:
- Connection status: `Storage.getApiKey()`
- Quick settings: `Storage.loadConfig()`
- History: `Storage.getHistory()`
- Test selection: `chrome.tabs.sendMessage()` to content script

#### Module 6: Result Display System

##### Module Goal
Format and display LLM responses to users through various channels (popup, notifications, side panel).

##### Module Directory
- `src/display/display.js`
- `src/display/notification.js`
- `src/display/sidepanel.html`
- `src/display/sidepanel.js`

##### Data Design
- **Data Models**:
  ```javascript
  interface DisplayResult {
    content: string;
    metadata: {
      text: string;
      context: SelectionContext;
      timestamp: string;
    };
    format: 'markdown' | 'plaintext';
  }
  ```
- **Storage**: History stored via Module 3's Storage interface

##### Interface Definitions

**Display Interface**:
- **Name**: `Display`
- **Purpose**: Handle result formatting and presentation
- **Methods**:
  - `showInPopup(result: string, metadata: Object): void` - Display in popup
  - `formatResult(text: string): string` - Convert markdown to HTML
  - `copyToClipboard(text: string): Promise<void>` - Copy to clipboard
  - `showNotification(message: string): void` - Show desktop notification
  - `showError(message: string): void` - Display error

**Notification Interface**:
- **Name**: `NotificationManager`
- **Purpose**: Manage desktop notifications
- **Methods**: `show(title: string, body: string, icon?: string): void`

##### Page/UI Description
**Side Panel (`sidepanel.html`)**:
- Alternative display location for larger results
- Features: Full-width display, persistent across pages, searchable history
- Data: Receives results via `chrome.runtime.sendMessage()`

#### Module 7: Utility & Helper Functions

##### Module Goal
Provide shared utility functions for validation, sanitization, logging, and common operations across all modules.

##### Module Directory
- `src/utils/validation.js`
- `src/utils/sanitize.js`
- `src/utils/logger.js`
- `src/utils/debounce.js`

##### Data Design
- **Data Models**: Utility function parameters and return types
- **Storage**: No independent storage

##### Interface Definitions

**Validation Interface**:
- **Name**: `Validation`
- **Methods**:
  - `validateApiKey(provider: string, key: string): boolean`
  - `isValidUrl(url: string): boolean`
  - `validateConfig(config: UserConfig): string[]` (returns error messages)

**Sanitization Interface**:
- **Name**: `Sanitize`
- **Methods**:
  - `sanitizeText(text: string): string` - Remove excessive whitespace, limit length
  - `sanitizeHtml(html: string): string` - Remove potentially dangerous HTML

**Logger Interface**:
- **Name**: `Logger`
- **Methods**: `debug(), info(), warn(), error()` with conditional execution in dev mode

**Debounce Interface**:
- **Name**: `debounce`
- **Method**: `debounce(func: Function, wait: number): Function` - Prevent rapid-fire calls

### 6.3 Module Dependencies
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

**External Dependencies**:
- OpenAI API: Used by LLM Integration Layer
- Anthropic API: Used by LLM Integration Layer
- Chrome Extension APIs: Used by all modules
- Browser Notifications API: Used by Result Display System

## 7. Data Design

### Global Data Structures
```javascript
// Shared across multiple modules
interface SelectionContext {
  title: string;
  url: string;
  timestamp: string;
}

interface UserConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  model: string;
  endpoint: string;
  apiKey?: string; // stored separately for security
  defaultPrompt: string;
  customPrompts: Array<{name: string, template: string}>;
  theme: 'light' | 'dark' | 'system';
  displayLocation: 'popup' | 'sidepanel' | 'notification';
  autoCopy: boolean;
  saveHistory: boolean;
  maxHistoryItems: number;
}

interface HistoryEntry {
  id: number;
  text: string;
  result: string;
  context: SelectionContext;
  timestamp: string;
  provider: string;
  model: string;
}
```

### Storage Strategy
- **Configuration**: `chrome.storage.sync` - syncs across user's Chrome instances
- **API Keys**: `chrome.storage.local` - local only, more secure
- **History**: `chrome.storage.local` with IndexedDB fallback for large datasets
- **Temporary Data**: `chrome.storage.session` for current session data

### Caching Strategy
- **API Responses**: Cache for 5 minutes for identical prompts to reduce API calls
- **Configuration**: Cache in memory after first load, invalidate on save
- **History**: LRU cache for quick access to recent items

## 8. Interface Specifications

### General Conventions
- **Error Handling**: All async functions return promises, errors thrown as Error objects
- **Message Format**: Chrome message passing uses `{action: string, data: any}` format
- **API Versioning**: LLM API versions specified in configuration
- **Authentication**: API keys passed in Authorization headers

### Interface List
1. **Chrome Context Menu API**: Native browser API for context menu integration
2. **Storage Interface**: `saveConfig`, `loadConfig`, `saveApiKey`, `getApiKey`, `saveToHistory`, `getHistory`
3. **LLM API Interface**: `processText(text, context, options)`
4. **Display Interface**: `showInPopup`, `formatResult`, `copyToClipboard`, `showNotification`
5. **Popup Interface**: `updateStatus`, `loadQuickSettings`, `loadHistory`, `showResult`, `showError`
6. **Utility Interfaces**: Validation, Sanitization, Logger, Debounce

## 9. Implementation Order

### Phase 1: MVP (Minimum Viable Product)
**Priority: High**
1. Module 1: Extension Core - Basic manifest and structure
2. Module 2: Context Menu System - Text selection and context menu
3. Module 5: User Interface Components - Basic popup with status display
4. Module 3: Configuration Management - Simple settings storage
5. Module 4: LLM Integration Layer - Single provider (OpenAI) support

### Phase 2: Enhanced Features
**Priority: Medium**
6. Module 7: Utility Functions - Comprehensive validation and sanitization
7. Module 6: Result Display System - Advanced formatting and notifications
8. Module 4: LLM Integration Layer - Multiple provider support
9. Module 3: Configuration Management - Enhanced UI and validation

### Phase 3: Polish & Optimization
**Priority: Low**
10. Module 6: Result Display System - Side panel implementation
11. Module 5: User Interface Components - Theme support, improved UX
12. All Modules: Performance optimization, comprehensive testing

## 10. Development Workflow

### Branching Strategy
- **Main Branch**: Production-ready code
- **Develop Branch**: Integration branch for features
- **Feature Branches**: `feature/description` for new features
- **Hotfix Branches**: `hotfix/description` for critical fixes

### Commit Convention
Follow Conventional Commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or fixes
- `chore:` Maintenance tasks

### Code Review Process
- **Reviewers**: At least one other developer
- **Checklist**: 
  - Code follows style guidelines
  - Tests added/updated
  - Documentation updated
  - No security issues
  - Performance considered
  - Error handling implemented

### CI/CD Pipeline
1. **On Push**: Run linting, unit tests
2. **On PR**: Run integration tests, build verification
3. **On Merge to Main**: Automatic build to dist/, create release tag
4. **Manual Step**: Upload to Chrome Web Store for distribution

## 11. Testing Methods

### Unit Testing
- **Framework**: Jest
- **Coverage Target**: 80% minimum
- **Modules to Test**: 
  - `src/api/` - LLM API integration (mocked)
  - `src/config/storage.js` - Storage operations
  - `src/utils/` - Utility functions
  - `src/display/display.js` - Formatting logic

### Integration Testing
- **Setup**: Load extension in test Chrome instance
- **Test Scenarios**:
  - Text selection → context menu appearance
  - Configuration save/load
  - Full flow: selection → API call → result display
- **Tools**: Chrome DevTools Protocol via Puppeteer

### End-to-End Testing
- **Framework**: Playwright
- **Critical Scenarios**:
  1. Install extension, configure API key
  2. Select text, use context menu
  3. Verify result appears
  4. Test error handling (invalid API key)
  5. Test configuration changes

### Manual Testing
- **Areas Requiring Manual Verification**:
  - Context menu integration across different websites
  - UI responsiveness at different screen sizes
  - Theme switching behavior
  - Notification permissions handling

### Performance Testing
- **Tools**: Chrome Lighthouse, Chrome Performance Panel
- **Metrics**:
  - Extension load time
  - Context menu response time
  - Memory usage over time
  - Content script impact on page performance

## 12. Compilation and Deployment

### Build Process
```bash
# Development build
npm run dev

# Production build  
npm run build

# Clean build
npm run clean
```

**Build Output**: `dist/` folder containing:
- `manifest.json`
- `icons/` directory
- `src/` directory (processed if using bundler)
- `styles/` directory
- Any assets

### Deployment Architecture
- **Extension Distribution**: Chrome Web Store
- **Backend Services**: None required (client-only extension)
- **Configuration Storage**: Chrome Sync Storage (Google infrastructure)
- **API Dependencies**: External LLM APIs (OpenAI, Anthropic)

### Deployment Steps
1. **Development**:
   - Run `npm run build`
   - Load unpacked extension from `dist/` in Chrome
   - Test functionality

2. **Staging**:
   - Package extension: `zip -r chrome-copilot.zip dist/`
   - Upload to Chrome Web Store Developer Dashboard as draft
   - Internal testing with trusted testers

3. **Production**:
   - Submit for review in Chrome Web Store
   - Upon approval, publish to store
   - Monitor user feedback and error reports

### Rollback Plan
1. **Extension Rollback**:
   - Revert to previous version in Chrome Web Store
   - Chrome will auto-update users to previous version
   - Notify users of issue and expected resolution time

2. **Configuration Migration**:
   - Backward compatibility maintained in storage schema
   - Version field in configuration to handle migrations

## 13. Deliverables

### Documentation List
1. **API Documentation** (`docs/api.md`): Module interfaces and usage
2. **Setup Guide** (`docs/setup.md`): Installation and configuration instructions
3. **Architecture Document** (`docs/architecture.md`): System design and decisions
4. **User Guide** (`docs/user-guide.md`): End-user instructions
5. **Developer Guide** (`docs/developer.md`): Contribution guidelines

### Test Report
- Unit test coverage report (≥80%)
- Integration test results
- E2E test scenarios executed
- Performance test metrics
- Manual testing checklist completion

### Code Artifacts
- Complete source code in repository
- Production build in `dist/` directory
- Packaged extension (`.zip` file)
- Chrome Web Store listing materials (screenshots, descriptions)

### Monitoring & Maintenance
- Error logging implementation
- Usage analytics (opt-in)
- Update schedule for dependency updates
- Security vulnerability monitoring plan