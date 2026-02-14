# Chrome Copilot Chrome Extension Development Task

## Project Overview
Build a Chrome browser extension named "Chrome Copilot" in the current directory `~/workarea/code/chrome-copilot`.

## Project Directory Structure

```
chrome-copilot/
├── manifest.json                    # Module 1: Extension Core
├── icons/                           # Module 1: Extension Core
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── _locales/                        # Module 1: Extension Core (optional)
│   └── en/
│       └── messages.json
├── src/
│   ├── core/                        # Module 1: Extension Core
│   │   └── constants.js
│   ├── background/                  # Module 2: Context Menu System
│   │   ├── background.js
│   │   └── context-menu.js
│   ├── content/                     # Module 2: Context Menu System
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
├── package.json                     # Build Configuration
├── README.md
└── task.md                          # This file
```

## Module Implementation Locations

### Module 1: Extension Core (Foundation)
**Directory**: Root level and `src/core/`
**Files**:
- `manifest.json` - Root level
- `icons/` - Root level
- `_locales/` - Root level (optional)
- `src/core/constants.js` - Core constants and defaults

### Module 2: Context Menu System
**Directory**: `src/background/` and `src/content/`
**Files**:
- `src/background/background.js` - Main service worker
- `src/background/context-menu.js` - Context menu specific logic
- `src/content/content.js` - Content script for text selection

### Module 3: Configuration Management
**Directory**: `src/config/`
**Files**:
- `src/config/storage.js` - Data storage utilities
- `src/config/options.html` - Settings page UI
- `src/config/options.js` - Settings page logic

### Module 4: LLM Integration Layer
**Directory**: `src/api/`
**Files**:
- `src/api/api.js` - Main API interface
- `src/api/providers/openai.js` - OpenAI provider implementation
- `src/api/providers/anthropic.js` - Anthropic provider implementation
- `src/api/providers/custom.js` - Custom API provider
- `src/api/prompts.js` - Prompt template management

### Module 5: User Interface Components
**Directory**: `src/ui/`
**Files**:
- `src/ui/popup.html` - Extension popup UI
- `src/ui/popup.js` - Popup interaction logic
- `src/ui/components/status-indicator.js` - Status indicator component
- `src/ui/components/history-list.js` - History list component
- `src/ui/components/quick-settings.js` - Quick settings component
- `src/ui/themes/light.css` - Light theme styles
- `src/ui/themes/dark.css` - Dark theme styles

### Module 6: Result Display System
**Directory**: `src/display/`
**Files**:
- `src/display/display.js` - Result rendering logic
- `src/display/notification.js` - Desktop notification system
- `src/display/sidepanel.html` - Side panel interface
- `src/display/sidepanel.js` - Side panel logic

### Module 7: Utility & Helper Functions
**Directory**: `src/utils/`
**Files**:
- `src/utils/validation.js` - Input validation utilities
- `src/utils/sanitize.js` - Text sanitization
- `src/utils/logger.js` - Logging system
- `src/utils/debounce.js` - Debounce utility

## File Path References in Manifest

Update `manifest.json` to reflect the new directory structure:

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
    "service_worker": "src/background/background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "src/ui/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "src/config/options.html",
  "web_accessible_resources": [
    {
      "resources": ["styles/*.css", "assets/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

## Build Configuration (package.json)

```json
{
  "name": "chrome-copilot",
  "version": "1.0.0",
  "description": "AI-powered text explanation Chrome extension",
  "scripts": {
    "build": "mkdir -p dist && cp -r icons/ dist/ && cp -r _locales/ dist/ 2>/dev/null || true && cp manifest.json dist/ && cp -r src/ dist/src/ && cp -r styles/ dist/styles/ && cp -r assets/ dist/assets/ 2>/dev/null || true",
    "dev": "npm run build && echo 'Extension built to dist/ folder. Load unpacked extension from dist/'",
    "lint": "eslint src/",
    "test": "jest tests/",
    "clean": "rm -rf dist/"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "prettier": "^3.0.0"
  }
}
```

## Technology Stack

### Core Technologies
- **Chrome Extension APIs**: Manifest V3, Service Workers, Context Menus, Storage API
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Build Tools**: Simple shell script build, optional webpack for production
- **LLM Integration**: REST API calls to OpenAI/Anthropic/etc. endpoints
- **Storage**: Chrome Storage API (sync/local), IndexedDB for larger data

### Development Tools
- **Testing**: Chrome DevTools, Extension Developer Mode, Jest
- **Version Control**: Git
- **Code Quality**: ESLint, Prettier
- **Documentation**: JSDoc comments, Markdown docs

## Modular Architecture

### Module 1: Extension Core (Foundation)
**Purpose**: Basic extension setup and manifest configuration
**Location**: Root level and `src/core/`

**Files**:
- `manifest.json` - Extension manifest with V3 specifications
- `icons/` - Extension icons (16x16, 48x48, 128x128 PNG)
- `_locales/` - Internationalization support (optional)
- `src/core/constants.js` - Application constants and defaults

**Key Functions**:
- Define extension permissions
- Configure service worker
- Register content scripts
- Set up extension icons

### Module 2: Context Menu System
**Purpose**: Handle text selection and context menu interactions
**Location**: `src/background/` and `src/content/`

**Files**:
- `src/background/background.js` - Service worker for context menu registration
- `src/background/context-menu.js` - Context menu specific logic
- `src/content/content.js` - Content script for text selection detection

**Key Functions**:
- Register context menu item on extension install
- Show menu only when text is selected
- Capture selected text on menu click
- Communicate between content script and background

### Module 3: Configuration Management
**Purpose**: Manage user settings and preferences
**Location**: `src/config/`

**Files**:
- `src/config/options.html` - Settings page UI
- `src/config/options.js` - Settings page logic
- `src/config/storage.js` - Data storage utilities

**Key Functions**:
- API key management (secure storage)
- LLM endpoint configuration
- Model selection
- Prompt template management
- Theme preferences

### Module 4: LLM Integration Layer
**Purpose**: Communicate with LLM APIs
**Location**: `src/api/`

**Files**:
- `src/api/api.js` - LLM API communication layer
- `src/api/prompts.js` - Prompt template management
- `src/api/providers/openai.js` - OpenAI provider implementation
- `src/api/providers/anthropic.js` - Anthropic provider implementation
- `src/api/providers/custom.js` - Custom API provider

**Key Functions**:
- Make authenticated API requests
- Handle different LLM providers (OpenAI, Anthropic, etc.)
- Manage prompt templates
- Process and sanitize responses
- Error handling and retry logic

### Module 5: User Interface Components
**Purpose**: Provide user-facing interfaces
**Location**: `src/ui/`

**Files**:
- `src/ui/popup.html` - Extension popup UI
- `src/ui/popup.js` - Popup interaction logic
- `src/ui/components/status-indicator.js` - Status indicator component
- `src/ui/components/history-list.js` - History list component
- `src/ui/components/quick-settings.js` - Quick settings component
- `src/ui/themes/light.css` - Light theme styles
- `src/ui/themes/dark.css` - Dark theme styles

**Key Functions**:
- Quick configuration via popup
- Result display interface
- Loading states and progress indicators
- Error message display
- History view of previous explanations

### Module 6: Result Display System
**Purpose**: Show LLM responses to users
**Location**: `src/display/`

**Files**:
- `src/display/display.js` - Result rendering logic
- `src/display/notification.js` - Desktop notification system (optional)
- `src/display/sidepanel.html` + `src/display/sidepanel.js` - Side panel interface (optional)

**Key Functions**:
- Format LLM responses (markdown support)
- Copy to clipboard functionality
- Save results locally
- Share results (optional)

### Module 7: Utility & Helper Functions
**Purpose**: Shared utilities across modules
**Location**: `src/utils/`

**Files**:
- `src/utils/validation.js` - Input validation utilities
- `src/utils/sanitize.js` - Text sanitization
- `src/utils/logger.js` - Logging system (development only)
- `src/utils/debounce.js` - Debounce utility

**Key Functions**:
- Text sanitization
- URL validation
- API response parsing
- Error formatting

## Module Dependencies
```
Extension Core (root + src/core/)
    ↓
Context Menu System (src/background/ + src/content/) → Configuration Management (src/config/)
    ↓                                                    ↓
LLM Integration Layer (src/api/) ←───────────────────────┘
    ↓
Result Display System (src/display/)
    ↑
User Interface Components (src/ui/)
    ↑
Utility Functions (src/utils/)
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

## Development Workflow

### Step 1: Create Directory Structure
```bash
mkdir -p chrome-copilot/{icons,src/{core,background,content,config,api/{providers},ui/{components,themes},display,utils},styles,assets/{fonts,images},tests/{unit,integration},docs}
```

### Step 2: Implement Module 1 (Extension Core)
1. Create `manifest.json` in root
2. Create placeholder icons in `icons/`
3. Create `src/core/constants.js`

### Step 3: Implement Module 2 (Context Menu System)
1. Create `src/background/background.js`
2. Create `src/content/content.js`

### Step 4: Implement Module 5 (UI Components)
1. Create `src/ui/popup.html` and `src/ui/popup.js`
2. Create basic styles in `styles/`

### Step 5: Implement Remaining Modules
Continue with Modules 3, 4, 6, 7 in order

## File Import/Export Patterns

### Module Exports Example (`src/api/api.js`):
```javascript
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { applyPromptTemplate } from './prompts.js';

export const LLMAPI = {
  processText,
  // ... other functions
};

export { OpenAIProvider, AnthropicProvider };
```

### Module Imports Example (`src/ui/popup.js`):
```javascript
import { LLMAPI } from '../api/api.js';
import { Storage } from '../config/storage.js';
import { showInPopup } from '../display/display.js';
```

## Testing Strategy

### Unit Tests Location: `tests/unit/`
- `api.test.js` - Test LLM API integration
- `storage.test.js` - Test configuration storage
- `utils.test.js` - Test utility functions

### Integration Tests Location: `tests/integration/`
- `extension.test.js` - Test full extension workflow

## Build and Deployment

### Development Build:
```bash
npm run dev
```
Load unpacked extension from `dist/` folder in Chrome

### Production Build:
```bash
npm run build
```
Zip the `dist/` folder for Chrome Web Store submission

## Next Steps

1. **Create the directory structure** using the provided commands
2. **Start with Module 1**: Create `manifest.json` and basic files
3. **Follow the implementation order**: Modules 1 → 2 → 5 → 3 → 4 → 7 → 6
4. **Test each module** before moving to the next
5. **Build and load** the extension in Chrome for testing

Each module is now clearly located in its own directory, making it easy for AI Code Agents to work on specific parts of the project independently.