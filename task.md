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
- Working manifest.json
- Extension loads in Chrome
- Basic icons displayed

### Module 2 Outputs:
- Context menu appears on text selection
- Selected text captured correctly
- Menu click triggers background script

### Module 3 Outputs:
- Settings page accessible via extension options
- API key saves to Chrome storage
- Configuration persists across sessions

### Module 4 Outputs:
- API calls to configured LLM endpoint
- Prompt templates applied to selected text
- Error handling for network issues

### Module 5 Outputs:
- Popup displays current configuration
- Quick settings adjustment
- Status indicators

### Module 6 Outputs:
- LLM responses displayed to user
- Copy/save functionality
- Clean formatting

## Testing Strategy per Module

### Module 1 Tests:
- Extension loads without errors
- Permissions correctly defined
- Icons display properly

### Module 2 Tests:
- Context menu appears only with text selection
- Selected text captured accurately
- Cross-origin text selection works

### Module 3 Tests:
- Settings save and load correctly
- API key stored securely
- Input validation works

### Module 4 Tests:
- API calls succeed with valid credentials
- Error handling for invalid responses
- Prompt templates apply correctly

### Module 5 Tests:
- Popup opens and displays current settings
- Quick configuration changes take effect
- UI is responsive

### Module 6 Tests:
- Results display with proper formatting
- Copy functionality works
- Large responses handled gracefully

## Development Guidelines

### Code Standards:
- Use ES6+ features (const/let, arrow functions, template literals)
- Follow Chrome Extension best practices
- Add JSDoc comments for public functions
- Keep modules loosely coupled

### Security:
- Never log API keys
- Validate all external inputs
- Use Content Security Policy in manifest
- Sanitize HTML content before display

### Performance:
- Minimize content script injection
- Cache API responses when appropriate
- Use efficient DOM manipulation
- Implement request debouncing

## Module Completion Checklist

Each module should be independently testable. A module is complete when:
- [ ] All specified files created
- [ ] Core functions implemented
- [ ] Module interfaces defined
- [ ] Basic error handling included
- [ ] Tested in Chrome DevTools
- [ ] Documentation comments added

## Next Module to Implement: Module 1 (Extension Core)
Start with the foundation - create manifest.json and basic extension structure.