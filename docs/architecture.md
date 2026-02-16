# Chrome Copilot - Architecture Document

## Overview
Chrome Copilot is a Chrome browser extension that provides AI-powered text explanation capabilities through a right-click context menu integration. This document describes the system architecture, design decisions, and implementation details.

## System Architecture

### High-Level Architecture Diagram

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

### Data Flow
1. **User selects text** → Content script detects selection
2. **Right-click** → Context menu appears with Chrome Copilot option
3. **Click option** → Background service worker receives event
4. **Service worker** → Captures text, retrieves configuration
5. **Configuration + Text** → Sent to LLM API
6. **LLM Response** → Processed and displayed to user
7. **Result** → Stored in history for future reference

## Technology Stack

### Core Technologies
- **Chrome Extension APIs**: Manifest V3, Service Workers, Context Menus, Storage API, Tabs API
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+ modules)
- **LLM Integration**: REST API calls to:
  - OpenAI (`https://api.openai.com/v1/chat/completions`)
  - Anthropic (`https://api.anthropic.com/v1/messages`)
  - Custom API endpoints
- **Storage**: Chrome Storage API (sync for config, local for sensitive data)
- **Build Process**: No external bundler required (native ES6 modules)

### Development Tools
- **Version Control**: Git
- **Code Quality**: ESLint-compatible patterns (though no explicit linting configured)
- **Documentation**: Markdown, JSDoc-style comments
- **Testing**: Manual testing via Chrome DevTools

## Module Architecture

### Module 1: Extension Core
**Purpose**: Foundation with manifest configuration and constants.

#### Components
- `manifest.json` - Extension configuration (Manifest V3)
- `src/core/constants.js` - Default configuration, providers, error messages

#### Key Design Decisions
1. **Manifest V3**: Chosen for modern Chrome compatibility and service worker benefits
2. **ES6 Modules**: Used throughout for better code organization
3. **Permission Strategy**: Minimal required permissions with clear justification

### Module 2: Context Menu System
**Purpose**: Text selection detection and context menu integration.

#### Components
- `src/background/background.js` - Service worker with context menu handling
- `src/content/content.js` - Content script for text selection detection

#### Data Flow
```
Webpage Selection → Content Script → Background Worker → LLM API
     ↓                    ↓               ↓               ↓
  DOM Event         enhanceSelection   processText    API Call
```

#### Key Design Decisions
1. **Service Worker**: Persistent background processing without background page overhead
2. **Content Script Isolation**: Runs in webpage context for accurate text selection
3. **Debounced Selection Events**: Prevents excessive message passing

### Module 3: Configuration Management
**Purpose**: Secure storage and management of user settings.

#### Components
- `src/config/storage.js` - Storage manager with CRUD operations
- `src/config/options.html` - Configuration UI
- `src/config/options.js` - Options page controller

#### Storage Strategy
| Data Type | Storage Location | Sync Across Devices | Security Level |
|-----------|-----------------|---------------------|----------------|
| Configuration | `chrome.storage.sync` | Yes | Medium |
| API Keys | `chrome.storage.local` | No | High |
| History | `chrome.storage.local` | No | Medium |
| Temporary Data | Memory/Session | No | Low |

#### Key Design Decisions
1. **Separate API Key Storage**: More secure local storage for sensitive data
2. **Configuration Versioning**: Supports future migration paths
3. **Export/Import**: User-controlled data portability

### Module 4: LLM Integration Layer
**Purpose**: Abstraction layer for multiple LLM providers.

#### Components
- `src/api/api.js` - Main API interface with provider abstraction
- `src/api/prompts.js` - Prompt template system
- `src/api/providers/` - Provider-specific implementations

#### Provider Architecture
```
LLMAPI.processText()
        │
        ├───► OpenAIProvider.call()
        │         └──► fetch(api.openai.com)
        │
        ├───► AnthropicProvider.call()
        │         └──► fetch(api.anthropic.com)
        │
        └───► CustomProvider.call()
                  └──► fetch(config.endpoint)
```

#### Key Design Decisions
1. **Provider Abstraction**: Uniform interface for different LLM APIs
2. **Prompt Templating**: Flexible variable substitution system
3. **Error Handling**: Consistent error patterns across providers
4. **Request Optimization**: Configurable timeouts and retry logic

### Module 5: User Interface Components
**Purpose**: User-facing interfaces for interaction and status.

#### Components
- `src/ui/popup.html` - Popup interface markup
- `src/ui/popup.js` - Popup controller with state management
- `src/ui/components/` - Reusable UI components
- `src/ui/themes/` - Theme CSS files

#### UI Architecture
```
PopupController
    ├── StatusIndicator (connection status)
    ├── HistoryList (recent queries)
    ├── QuickSettings (dropdown config)
    └── ViewManager (config/result/loading/error views)
```

#### Key Design Decisions
1. **Component-based UI**: Modular, reusable components
2. **Theme System**: Light/dark/system theme support
3. **Responsive Design**: Works across different popup sizes
4. **State Management**: Local storage for UI state persistence

### Module 6: Result Display System
**Purpose**: Formatting and presentation of LLM responses.

#### Components
- `src/display/display.js` - Result formatting and presentation
- `src/display/notification.js` - Desktop notification manager
- `src/display/sidepanel.html` - Side panel interface
- `src/display/sidepanel.js` - Side panel controller

#### Display Options
1. **Popup**: Immediate feedback in extension popup
2. **Side Panel**: Persistent display for longer content
3. **Notification**: Non-intrusive brief summaries

#### Key Design Decisions
1. **Markdown-like Formatting**: User-friendly text formatting
2. **Multiple Display Channels**: User choice based on context
3. **Clipboard Integration**: Easy result copying
4. **Accessibility**: Semantic HTML and ARIA labels

### Module 7: Utility Functions
**Purpose**: Shared helper functions across modules.

#### Components
- `src/utils/validation.js` - Input validation utilities
- `src/utils/sanitize.js` - Text sanitization functions
- `src/utils/logger.js` - Structured logging system
- `src/utils/debounce.js` - Debounce and throttle utilities

#### Key Design Decisions
1. **Functional Utilities**: Pure functions for reliability
2. **Security Focus**: Input sanitization and validation
3. **Development Support**: Conditional logging for debugging
4. **Performance**: Debouncing for frequent events

## Data Design

### Core Data Structures

#### User Configuration
```javascript
{
  provider: 'openai' | 'anthropic' | 'custom',
  model: 'gpt-3.5-turbo' | 'claude-3-haiku' | 'custom',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  defaultPrompt: 'Explain the following text...',
  customPrompts: [
    { name: 'Summarize', template: 'Summarize this text: {text}' }
  ],
  theme: 'light' | 'dark' | 'system',
  displayLocation: 'popup' | 'sidepanel' | 'notification',
  autoCopy: false,
  saveHistory: true,
  maxHistoryItems: 50
}
```

#### Selection Context
```javascript
{
  text: 'Selected text content',
  context: {
    title: 'Webpage title',
    url: 'https://example.com/page',
    hostname: 'example.com',
    timestamp: '2026-02-16T12:00:00Z',
    language: 'en'
  }
}
```

#### History Entry
```javascript
{
  id: 1645000000000,
  timestamp: '2026-02-16T12:00:00Z',
  text: 'Original selected text',
  result: 'AI-generated explanation',
  context: { /* Selection context */ },
  provider: 'openai',
  model: 'gpt-3.5-turbo'
}
```

### Storage Schema

#### Configuration Storage (`chrome.storage.sync`)
```javascript
{
  "config": {
    "version": "1.0",
    "data": { /* UserConfig object */ }
  }
}
```

#### API Key Storage (`chrome.storage.local`)
```javascript
{
  "apiKey_openai": "sk-...",
  "apiKey_anthropic": "sk-ant-...",
  "apiKey_custom": "custom-key-..."
}
```

#### History Storage (`chrome.storage.local`)
```javascript
{
  "history": [
    { /* HistoryEntry 1 */ },
    { /* HistoryEntry 2 */ },
    // ... up to maxHistoryItems
  ]
}
```

### Data Flow Patterns

#### Configuration Flow
```
User Input → Validation → Storage → Memory Cache → API Usage
    ↓           ↓           ↓           ↓           ↓
 Options    sanitize()   saveConfig()  cache     processText()
   UI      validate()                 invalidate
```

#### Text Processing Flow
```
Selection → Enhancement → Prompt → API Call → Format → Display
    ↓           ↓           ↓         ↓         ↓        ↓
Content     addContext()  template   fetch()   markdown  popup/
Script                    apply()              to HTML   notification
```

## Communication Patterns

### Chrome Message Passing

#### Content Script ↔ Background Script
```javascript
// Background to Content
chrome.tabs.sendMessage(tabId, {
  action: 'processSelection',
  selection: text
});

// Content to Background  
chrome.runtime.sendMessage({
  action: 'selectionUpdated',
  hasSelection: true
});
```

#### Popup ↔ Background Script
```javascript
// Popup requests data
chrome.runtime.sendMessage({
  action: 'getSelection'
}, (response) => {
  // Update UI with response
});

// Background notifies popup
chrome.runtime.sendMessage({
  action: 'showResult',
  result: 'AI response'
});
```

#### Options Page ↔ Storage
```javascript
// Direct storage access
const config = await Storage.loadConfig();
await Storage.saveConfig(updatedConfig);
```

### Event-Driven Architecture

#### Service Worker Events
```javascript
chrome.runtime.onInstalled.addListener(() => {
  // Initialize context menu
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Handle menu clicks
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle internal messages
});
```

#### Content Script Events
```javascript
document.addEventListener('selectionchange', () => {
  // Debounced selection tracking
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle requests from background
});
```

## Security Architecture

### Data Security

#### API Key Protection
1. **Storage**: `chrome.storage.local` (not synced to cloud)
2. **Transmission**: HTTPS only to configured endpoints
3. **Display**: Masked in UI (•••••)
4. **Export**: Redacted in data exports

#### Input Sanitization
- **Text Input**: Truncated to reasonable limits
- **HTML Content**: Stripped of dangerous tags/attributes
- **URL Validation**: Verified before use in prompts
- **Prompt Injection**: Basic prevention through template escaping

#### Permission Model
- **Least Privilege**: Only necessary permissions requested
- **User Control**: Clear permission justifications
- **Transparency**: All host permissions documented

### Privacy Considerations

#### Data Collection
- **No Telemetry**: No automatic data collection
- **Local Storage**: History and config stored locally
- **Optional Export**: User controls data export
- **Clear Data**: Easy reset functionality

#### External Communications
- **API Calls Only**: Communication only with configured LLM endpoints
- **No Tracking**: No analytics or tracking services
- **HTTPS Enforcement**: All external calls use HTTPS

## Performance Considerations

### Resource Management

#### Memory Usage
- **Service Worker**: Lightweight, event-driven
- **Content Script**: Minimal DOM interaction
- **Popup UI**: Unloaded when not visible
- **History Limits**: Configurable item limits

#### Network Optimization
- **Request Debouncing**: Prevents rapid-fire API calls
- **Response Caching**: Optional future enhancement
- **Connection Pooling**: Reuses HTTP connections
- **Timeout Handling**: Configurable request timeouts

### Performance Targets

#### Responsiveness
- **Context Menu**: < 100ms after text selection
- **Popup Load**: < 500ms from click
- **API Response**: < 30s timeout (configurable)
- **UI Updates**: 60fps maintained

#### Resource Limits
- **Memory**: < 50MB for extension components
- **Storage**: < 100MB for history (configurable)
- **Network**: < 10MB per request (text limit)
- **CPU**: Minimal impact on page performance

## Scalability and Extensibility

### Module Extensibility

#### Adding New LLM Providers
1. Create provider file in `src/api/providers/`
2. Implement `call(apiKey, prompt, model, options)` method
3. Add to `PROVIDERS` array in constants.js
4. Add case in `LLMAPI.processText()` switch

#### Adding New UI Themes
1. Create CSS file in `src/ui/themes/`
2. Define CSS variables for colors
3. Add to `THEMES` array in constants.js
4. Theme auto-detects based on system preference

#### Adding New Display Locations
1. Implement display method in `Display` class
2. Add to `DISPLAY_LOCATIONS` in constants.js
3. Update configuration validation
4. Add UI control in options page

### Configuration Evolution

#### Versioning Strategy
- **Major Version**: Breaking changes to storage schema
- **Minor Version**: New features, backward compatible
- **Patch Version**: Bug fixes only

#### Migration Paths
```javascript
// Example migration logic
async function migrateConfig(oldConfig) {
  if (oldConfig.version === '1.0') {
    // Add new fields with defaults
    return {
      ...oldConfig,
      version: '1.1',
      newField: 'defaultValue'
    };
  }
}
```

## Deployment Architecture

### Build Process
```
Source Files → Manifest Validation → Directory Structure → Package
     ↓               ↓                    ↓                  ↓
   ES6         permission check      icon validation      zip file
 modules      version validation    file organization   for store
```

### Distribution Channels

#### Chrome Web Store (Primary)
- **Audience**: General users
- **Update Mechanism**: Automatic via Chrome
- **Review Process**: Google approval required
- **Distribution**: Worldwide availability

#### Unpacked Extension (Development)
- **Audience**: Developers, testers
- **Update Mechanism**: Manual reload
- **Use Cases**: Testing, debugging, customization
- **Limitations**: Developer mode required

#### Enterprise Deployment
- **Method**: Group Policy or administrative installation
- **Configuration**: Pre-configured settings
- **Management**: Centralized update control

### Update Strategy

#### Seamless Updates
1. **Background Updates**: Chrome auto-updates from Web Store
2. **Configuration Preservation**: User settings maintained
3. **Graceful Degradation**: Old config compatible with new code
4. **User Notification**: Update notes in changelog

#### Rollback Plan
1. **Emergency Rollback**: Revert to previous version in Web Store
2. **Data Recovery**: Backup before major updates
3. **User Communication**: Clear update notifications

## Monitoring and Maintenance

### Error Tracking

#### Client-Side Logging
```javascript
// Structured logging (development only)
Logger.error('API call failed', {
  provider: config.provider,
  error: error.message,
  timestamp: new Date().toISOString()
});
```

#### User Error Reports
- **Error Messages**: User-friendly descriptions
- **Recovery Options**: Retry, check settings, report issue
- **Technical Details**: Available in console for debugging

### Performance Monitoring

#### Key Metrics
- **API Response Times**: Track LLM provider performance
- **Error Rates**: Monitor failure frequencies
- **User Engagement**: Usage patterns (opt-in analytics)
- **Storage Usage**: Monitor quota utilization

#### Health Checks
1. **API Connectivity**: Regular connection tests
2. **Storage Integrity**: Configuration validation
3. **Permission Status**: Verify required permissions
4. **Update Availability**: Check for new versions

## Future Considerations

### Planned Enhancements

#### Short Term (Next Release)
1. **Response Caching**: Reduce API calls for repeated queries
2. **Batch Processing**: Handle multiple selections
3. **Keyboard Shortcuts**: Quick access without context menu

#### Medium Term
1. **Local LLM Support**: Integration with Ollama, LM Studio
2. **Advanced Prompting**: Chain-of-thought, few-shot examples
3. **Plugin System**: Third-party extensions for specialized tasks

#### Long Term
1. **Cross-browser Support**: Firefox, Edge compatibility
2. **Collaborative Features**: Shared prompts and results
3. **Advanced Analytics**: Insights into usage patterns

### Technical Debt

#### Areas for Improvement
1. **Testing Coverage**: Comprehensive unit and integration tests
2. **Build Automation**: Webpack/rollup for production optimization
3. **Internationalization**: Multi-language support
4. **Accessibility**: Enhanced screen reader support

#### Refactoring Opportunities
1. **State Management**: More robust state handling
2. **Error Recovery**: Improved failure resilience
3. **Code Splitting**: Lazy loading for larger features

---

## Conclusion

Chrome Copilot follows a modular, extensible architecture designed for reliability, security, and user experience. The separation of concerns across seven modules allows for independent development and testing while maintaining a cohesive user experience.

The architecture emphasizes:
- **Security**: Through secure storage and input validation
- **Performance**: With efficient resource management
- **Extensibility**: Via clear interfaces and abstraction layers
- **Maintainability**: Through consistent patterns and documentation

This architectural foundation supports both current functionality and future enhancements as the extension evolves.

---

*Architecture Version: 1.0*  
*Last Updated: February 2026*  
*Based on Implementation: Chrome Copilot v1.0.0*