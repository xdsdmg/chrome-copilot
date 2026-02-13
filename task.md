# Chrome Copilot Chrome Extension Development Task

## Project Overview
Build a Chrome browser extension named "Chrome Copilot" in the current directory `~/workarea/code/chrome-copilot`.

## Core Functionality
The extension should enable users to:
1. Select text in Chrome browser
2. Right-click to access context menu
3. See "Chrome Copilot" option in the context menu
4. Click the option to process the selected text
5. Use configured LLM model and prompt to explain/analyze the selected text

## Technical Requirements

### 1. Extension Structure
- Manifest V3 (Chrome extension standard)
- Background service worker for context menu handling
- Content scripts for text selection detection
- Popup/Options page for configuration
- Storage API for user settings

### 2. Context Menu Integration
- Register context menu item for text selection
- Menu should only appear when text is selected
- Menu item: "Chrome Copilot" with appropriate icon
- Handle menu click events

### 3. Text Processing Flow
1. User selects text on any webpage
2. Right-click → "Chrome Copilot"
3. Extension captures selected text
4. Send to configured LLM API endpoint
5. Display results to user (popup/notification/side panel)

### 4. LLM Configuration
- User-configurable API endpoint (OpenAI, Anthropic, etc.)
- Customizable prompt templates
- API key management (secure storage)
- Model selection options

### 5. User Interface
- Configuration page for API settings
- Prompt template editor
- History/log of previous explanations
- Result display interface

## Implementation Steps

### Phase 1: Basic Extension Setup
1. Create manifest.json with V3 specifications
2. Set up basic extension structure
3. Add icons and assets
4. Test extension loading in Chrome

### Phase 2: Context Menu Integration
1. Register context menu in background script
2. Implement text selection detection
3. Handle menu click events
4. Capture selected text

### Phase 3: LLM Integration
1. Create configuration interface
2. Implement API communication
3. Add secure storage for API keys
4. Create prompt template system

### Phase 4: User Experience
1. Design result display
2. Add error handling
3. Implement loading states
4. Add user preferences

### Phase 5: Polish & Testing
1. Add keyboard shortcuts
2. Implement text selection across iframes
3. Add rate limiting
4. Test on various websites
5. Add error recovery

## Files to Create

### Required Files:
1. `manifest.json` - Extension manifest
2. `background.js` - Service worker for context menu
3. `content.js` - Content script for text selection
4. `popup.html` + `popup.js` - Configuration popup
5. `options.html` + `options.js` - Settings page
6. `styles.css` - Common styles
7. `icons/` - Extension icons in multiple sizes

### Optional Files:
8. `utils.js` - Utility functions
9. `api.js` - LLM API communication
10. `storage.js` - Data storage helpers
11. `prompts.js` - Default prompt templates

## Development Notes

### Security Considerations:
- Never hardcode API keys
- Use Chrome's secure storage
- Validate all user inputs
- Sanitize HTML content

### Performance Considerations:
- Minimize content script impact
- Cache API responses when appropriate
- Use efficient text processing
- Implement request queuing

### User Experience:
- Clear loading indicators
- Informative error messages
- Keyboard shortcuts (Ctrl+Shift+C)
- Result persistence option

## Testing Checklist
- [ ] Extension loads without errors
- [ ] Context menu appears only when text is selected
- [ ] Text selection is captured correctly
- [ ] API configuration saves properly
- [ ] LLM requests work with valid API key
- [ ] Results display correctly
- [ ] Works across different websites
- [ ] Handles network errors gracefully
- [ ] Respects user privacy settings

## Next Steps
1. Start with manifest.json and basic structure
2. Implement context menu functionality
3. Add configuration interface
4. Integrate with LLM API
5. Polish user experience
6. Test thoroughly