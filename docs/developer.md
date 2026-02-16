# Chrome Copilot - Developer Guide

## Introduction

Welcome to the Chrome Copilot development community! This guide provides everything you need to start contributing to the Chrome Copilot browser extension. Whether you're fixing bugs, adding features, or customizing the extension for your needs, this guide will help you navigate the codebase.

### Project Overview
Chrome Copilot is a Chrome browser extension that adds AI-powered text explanation capabilities via right-click context menu. The extension is built with modern web technologies and follows a modular architecture.

### Contribution Areas
- **Bug Fixes**: Identify and fix issues
- **Feature Development**: Add new capabilities
- **Documentation**: Improve guides and references
- **Testing**: Add tests and improve reliability
- **Localization**: Translate for different languages
- **Performance**: Optimize speed and resource usage

## Development Environment Setup

### Prerequisites

#### Required Tools
1. **Chrome Browser**: Version 88+ (Manifest V3 support)
2. **Node.js**: Version 18+ (for development tools)
3. **Git**: Version control
4. **Code Editor**: VS Code recommended (with extensions below)

#### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "github.vscode-pull-request-github",
    "eamodio.gitlens"
  ]
}
```

### Getting the Source Code

#### Clone the Repository
```bash
git clone https://github.com/your-org/chrome-copilot.git
cd chrome-copilot
```

#### Fork and Clone (for Contributors)
```bash
# Fork on GitHub first, then:
git clone https://github.com/your-username/chrome-copilot.git
cd chrome-copilot
git remote add upstream https://github.com/original-org/chrome-copilot.git
```

### Project Structure
```
chrome-copilot/
├── manifest.json                    # Extension manifest (V3)
├── icons/                           # Extension icons
├── src/                             # Source code
│   ├── core/                        # Module 1: Extension Core
│   ├── background/                  # Module 2: Context Menu System
│   ├── content/                     # Module 2: Content Scripts
│   ├── config/                      # Module 3: Configuration Management
│   ├── api/                         # Module 4: LLM Integration Layer
│   ├── ui/                          # Module 5: User Interface Components
│   ├── display/                     # Module 6: Result Display System
│   └── utils/                       # Module 7: Utility Functions
├── styles/                          # CSS stylesheets
├── tests/                           # Test files
├── docs/                            # Documentation
└── package.json                     # Project dependencies
```

### Initial Setup

#### Install Dependencies
```bash
# If using npm (when package.json is added)
npm install

# Or if no package.json yet, install recommended tools globally
npm install -g eslint prettier
```

#### Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `chrome-copilot` directory
5. Verify extension loads without errors

#### Development Mode Tips
- Keep Chrome DevTools open (F12)
- Monitor Console for errors
- Use "Reload" button on extensions page after code changes
- Check Service Worker logs via `chrome://extensions/?id=extension-id`

## Codebase Architecture

### Module System

#### Module 1: Extension Core (`src/core/`)
- **Purpose**: Constants and manifest configuration
- **Key Files**: `constants.js`, `manifest.json`
- **Dependencies**: None (base module)

#### Module 2: Context Menu System (`src/background/`, `src/content/`)
- **Purpose**: Text selection and context menu handling
- **Key Files**: `background.js`, `content.js`
- **Dependencies**: Module 1 (constants)

#### Module 3: Configuration Management (`src/config/`)
- **Purpose**: Settings storage and management
- **Key Files**: `storage.js`, `options.js`, `options.html`
- **Dependencies**: Module 1 (constants)

#### Module 4: LLM Integration Layer (`src/api/`)
- **Purpose**: Communication with AI providers
- **Key Files**: `api.js`, `prompts.js`, `providers/*.js`
- **Dependencies**: Module 1, Module 3

#### Module 5: UI Components (`src/ui/`)
- **Purpose**: User interface and interaction
- **Key Files**: `popup.js`, `popup.html`, `components/*.js`, `themes/*.css`
- **Dependencies**: Module 1, Module 3, Module 6

#### Module 6: Result Display (`src/display/`)
- **Purpose**: Formatting and presenting results
- **Key Files**: `display.js`, `notification.js`, `sidepanel.*`
- **Dependencies**: Module 1, Module 3

#### Module 7: Utilities (`src/utils/`)
- **Purpose**: Shared helper functions
- **Key Files**: `validation.js`, `sanitize.js`, `logger.js`, `debounce.js`
- **Dependencies**: None (standalone utilities)

### Key Design Patterns

#### ES6 Modules
```javascript
// Import style
import { Storage } from '../config/storage.js';
import { DEFAULT_CONFIG } from '../core/constants.js';

// Export style
export class MyClass { /* ... */ }
export const myFunction = () => { /* ... */ };
```

#### Service Worker Pattern
```javascript
// Event-driven background script
chrome.runtime.onInstalled.addListener(() => { /* init */ });
chrome.contextMenus.onClicked.addListener((info, tab) => { /* handle */ });
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => { /* respond */ });
```

#### Message Passing
```javascript
// Content script to background
chrome.runtime.sendMessage({
  action: 'processSelection',
  selection: selectedText
});

// Background to content script
chrome.tabs.sendMessage(tabId, {
  action: 'getEnhancedSelection',
  data: payload
});
```

#### Storage Abstraction
```javascript
// Using Storage class
await Storage.saveConfig(config);
const config = await Storage.loadConfig();
const apiKey = await Storage.getApiKey('openai');
```

### Data Flow

#### User Interaction Flow
```
User selects text → content script detects → context menu appears →
user clicks option → background receives → processes with LLM →
formats result → displays to user → stores in history
```

#### Configuration Flow
```
User changes settings → options page validates → Storage.saveConfig() →
chrome.storage.sync.set() → other components reload config →
UI updates reflect changes
```

#### Error Handling Flow
```
Error occurs → caught in try-catch → logged with Logger.error() →
user-friendly message created → displayed via Display.showError() →
recovery options presented
```

## Development Workflow

### Coding Standards

#### JavaScript Style
- **ES6+ Features**: Use modern JavaScript (async/await, arrow functions)
- **Imports**: Use ES6 module syntax (no CommonJS)
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for public APIs, inline comments for complex logic

#### Example Code Structure
```javascript
/**
 * Process text using configured LLM provider
 * @param {string} text - Text to process
 * @param {Object} context - Page context data
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Processed text from LLM
 * @throws {Error} If API key not configured or network error
 */
async function processText(text, context, options = {}) {
  // Input validation
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  try {
    // Main logic
    const result = await callLLMAPI(text, context, options);
    return result;
  } catch (error) {
    // Error handling
    Logger.error('Text processing failed', { text, error });
    throw new Error(`Processing failed: ${error.message}`);
  }
}
```

#### CSS Style
- **CSS Variables**: Use for theming
- **BEM-like Naming**: `.component__element--modifier`
- **Mobile First**: Responsive design approach
- **Accessibility**: Semantic HTML, ARIA labels

### Testing Your Changes

#### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] Context menu appears on text selection
- [ ] Clicking menu item processes text
- [ ] Results display correctly (popup/side panel/notification)
- [ ] Configuration saves and loads properly
- [ ] History stores and retrieves entries
- [ ] Error handling works for various failures
- [ ] Theme switching functions correctly

#### Automated Testing (When Implemented)
```bash
# Run unit tests
npm test

# Run integration tests  
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

#### Debugging Techniques

##### Chrome DevTools
```javascript
// Debug logging (development only)
Logger.debug('Processing selection', { length: text.length });

// Console inspection
console.log('Current config:', config);
console.table(historyEntries);

// Breakpoints in DevTools Sources panel
```

##### Service Worker Debugging
1. Go to `chrome://extensions/`
2. Find Chrome Copilot
3. Click "Service Worker" link
4. Opens DevTools for background script

##### Content Script Debugging
1. Navigate to any webpage
2. Open DevTools (F12)
3. Go to Sources → Content Scripts
4. Find and debug `content.js`

### Building and Packaging

#### Development Build
```bash
# Currently: Direct file usage (no build step)
# Load unpacked extension from source directory
```

#### Production Build (Future)
```bash
# Minify and optimize
npm run build

# Create distribution package
npm run package

# Create Web Store zip
npm run dist
```

#### Version Management
- Update version in `manifest.json`
- Update version in `package.json` (when added)
- Follow semantic versioning: MAJOR.MINOR.PATCH
- Document changes in CHANGELOG.md

## Contributing Guidelines

### Issue Reporting

#### Before Reporting
1. Check existing issues for duplicates
2. Try latest version from main branch
3. Reproduce with minimal test case
4. Gather relevant information

#### Issue Template
```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Select '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Chrome Version: 
- Extension Version:
- OS: 
- LLM Provider:

## Additional Context
Screenshots, console errors, etc.
```

### Pull Request Process

#### Branch Naming
- `feature/description`: New features
- `fix/description`: Bug fixes
- `docs/description`: Documentation
- `refactor/description`: Code improvements
- `test/description`: Test additions

#### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added/updated (when applicable)
- [ ] Documentation updated
- [ ] No new linting errors
- [ ] All existing tests pass
- [ ] Manual testing completed
- [ ] Commit messages follow convention

#### Commit Message Convention
```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semi-colons, etc.
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(api): add Anthropic Claude 3 support
fix(ui): correct popup sizing on mobile
docs(readme): update installation instructions
```

### Code Review Process

#### Review Checklist
- **Functionality**: Does it work as intended?
- **Code Quality**: Follows patterns, readable, maintainable
- **Security**: No vulnerabilities introduced
- **Performance**: No regressions
- **Testing**: Adequate test coverage
- **Documentation**: Updated as needed

#### Review Etiquette
- Be constructive and specific
- Focus on code, not coder
- Suggest improvements, not just criticism
- Respond to feedback professionally
- Keep discussions focused

## Extending the Extension

### Adding New LLM Providers

#### Step 1: Create Provider File
```javascript
// src/api/providers/newprovider.js
export class NewProvider {
  static async call(apiKey, prompt, model, options = {}) {
    // Implement API call
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        ...options
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].text.trim();
  }
}
```

#### Step 2: Update Constants
```javascript
// src/core/constants.js
export const PROVIDERS = [
  // ... existing providers
  {
    value: 'newprovider',
    label: 'New Provider',
    models: ['model1', 'model2']
  }
];
```

#### Step 3: Integrate with LLMAPI
```javascript
// src/api/api.js
import { NewProvider } from './providers/newprovider.js';

// In processText method:
case 'newprovider':
  result = await NewProvider.call(apiKey, prompt, model, requestOptions);
  break;
```

#### Step 4: Update UI
- Add provider to options page dropdown
- Update validation for new provider
- Test thoroughly

### Adding New UI Components

#### Component Structure
```javascript
// src/ui/components/new-component.js
export class NewComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.init();
  }
  
  init() {
    this.render();
    this.bindEvents();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="new-component">
        <!-- Component HTML -->
      </div>
    `;
  }
  
  bindEvents() {
    // Event listeners
  }
  
  update(data) {
    // Update component with new data
  }
  
  destroy() {
    // Cleanup
  }
}
```

#### Integration
```javascript
// In popup.js or other UI files
import { NewComponent } from './components/new-component.js';

const container = document.getElementById('newComponentContainer');
const component = new NewComponent(container, options);
```

### Adding New Display Locations

#### Step 1: Implement Display Method
```javascript
// In src/display/display.js
static async showInNewLocation(result, metadata) {
  // Implementation
}
```

#### Step 2: Update Constants
```javascript
// src/core/constants.js
export const DISPLAY_LOCATIONS = [
  // ... existing locations
  { value: 'newlocation', label: 'New Location' }
];
```

#### Step 3: Update Configuration Validation
```javascript
// src/utils/validation.js
if (config.displayLocation && !['popup', 'sidepanel', 'notification', 'newlocation'].includes(config.displayLocation)) {
  errors.push('Invalid display location');
}
```

#### Step 4: Update Display Logic
```javascript
// In background.js and display.js
case 'newlocation':
  await Display.showInNewLocation(result, metadata);
  break;
```

## Testing Strategy

### Unit Testing

#### Test Structure
```javascript
// tests/unit/storage.test.js
import { Storage } from '../../src/config/storage.js';

describe('Storage', () => {
  beforeEach(() => {
    // Mock chrome.storage
  });
  
  test('saveConfig stores configuration', async () => {
    const config = { provider: 'openai' };
    await Storage.saveConfig(config);
    // Assertions
  });
  
  test('loadConfig returns default when empty', async () => {
    const config = await Storage.loadConfig();
    expect(config.provider).toBe('openai');
  });
});
```

#### Testable Components
- `src/utils/` functions (pure functions)
- `src/api/providers/` (with mocked fetch)
- `src/config/storage.js` (with mocked chrome.storage)
- `src/display/display.js` formatting functions

### Integration Testing

#### Test Setup
```javascript
// tests/integration/extension.test.js
describe('Extension Integration', () => {
  beforeAll(async () => {
    // Load extension in test browser
  });
  
  test('context menu appears on text selection', async () => {
    // Simulate text selection
    // Verify context menu
  });
  
  test('full workflow from selection to result', async () => {
    // Complete user journey test
  });
});
```

#### Test Tools
- **Puppeteer**: Browser automation
- **Jest**: Test runner and assertions
- **Chrome DevTools Protocol**: Low-level browser control

### End-to-End Testing

#### User Scenarios
1. Fresh installation and configuration
2. Basic text explanation workflow
3. Configuration changes and persistence
4. Error handling and recovery
5. Performance under load

#### Test Environment
- Isolated Chrome profile
- Mock LLM API responses
- Automated interaction simulation
- Screenshot comparison for UI tests

## Performance Optimization

### Code Optimization Tips

#### Efficient Storage Usage
```javascript
// Bad: Multiple storage calls
await chrome.storage.local.set({ key1: value1 });
await chrome.storage.local.set({ key2: value2 });

// Good: Batch storage calls
await chrome.storage.local.set({
  key1: value1,
  key2: value2
});
```

#### Debouncing Events
```javascript
// In content.js
let timeout;
document.addEventListener('selectionchange', () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    // Process selection
  }, 100);
});
```

#### Memory Management
```javascript
// Clean up event listeners
component.destroy = () => {
  this.button.removeEventListener('click', this.handleClick);
  // Other cleanup
};
```

### Performance Monitoring

#### Key Metrics
- **Load Time**: Extension initialization
- **Response Time**: API call duration
- **Memory Usage**: Heap size over time
- **CPU Usage**: Background script impact

#### Monitoring Tools
- Chrome Task Manager (`Shift+Esc`)
- Chrome Performance Panel
- Chrome Memory Profiler
- Custom performance logging

## Security Considerations

### Input Validation

#### Always Validate
```javascript
function processUserInput(input) {
  // Check type
  if (typeof input !== 'string') {
    throw new Error('Input must be string');
  }
  
  // Check length
  if (input.length > 10000) {
    throw new Error('Input too long');
  }
  
  // Sanitize
  return sanitizeHtml(input);
}
```

#### Secure API Calls
```javascript
async function callAPI(apiKey, endpoint, data) {
  // Validate endpoint
  if (!isValidUrl(endpoint)) {
    throw new Error('Invalid endpoint');
  }
  
  // Use HTTPS
  if (!endpoint.startsWith('https://')) {
    console.warn('Non-HTTPS endpoint:', endpoint);
  }
  
  // Set timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      // ... other options
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
```

### Privacy Protection

#### Data Minimization
- Only store necessary data
- Clear temporary data promptly
- Offer easy data deletion
- Anonymize where possible

#### User Consent
- Explain data usage clearly
- Get explicit consent for sensitive operations
- Provide opt-out options
- Respect user preferences

## Release Process

### Version Bumping

#### Semantic Versioning
- **MAJOR**: Breaking changes to API or storage format
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes only

#### Update Files
1. `manifest.json` version field
2. `package.json` version (when added)
3. `CHANGELOG.md` release notes
4. Documentation version references

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog written
- [ ] Code review completed
- [ ] Manual testing passed
- [ ] Version numbers updated
- [ ] Release branch created
- [ ] Tag created

### Distribution

#### Chrome Web Store
1. Build production package
2. Upload to Developer Dashboard
3. Submit for review
4. Publish after approval

#### GitHub Releases
1. Create release from tag
2. Upload packaged extension
3. Include release notes
4. Announce to community

## Community and Support

### Getting Help

#### Development Questions
- Check existing documentation
- Search issue tracker
- Ask in discussions
- Review code examples

#### Reporting Bugs
- Use issue template
- Include reproduction steps
- Provide environment details
- Be patient and responsive

### Contributing Beyond Code

#### Documentation
- Improve existing guides
- Add code examples
- Translate to other languages
- Create tutorials

#### Testing
- Test new features
- Report edge cases
- Suggest test scenarios
- Help with test automation

#### Community Support
- Answer user questions
- Help troubleshoot issues
- Share use cases
- Provide feedback

## Resources

### Learning Materials

#### Chrome Extension Development
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/migrating/to-manifest-v3/)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

#### JavaScript and Web Development
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)
- [Google Developers Web Fundamentals](https://developers.google.com/web/fundamentals)

### Tools and Utilities

#### Development Tools
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Extension Developer Tools](https://chrome.google.com/webstore/detail/extensions-developer-too/ohmmkhmmmpcnpikjeljgnaoabkaalbgc)
- [JSON Formatter](https://chrome.google.com/webstore/detail/json-formatter/bcjindcccaagfpapjjmafapmmgkkhgoa)

#### Testing Tools
- [Jest](https://jestjs.io/) - Testing framework
- [Puppeteer](https://pptr.dev/) - Browser automation
- [Playwright](https://playwright.dev/) - E2E testing

### Project Resources

#### Codebase
- `docs/` - Documentation
- `tests/` - Test files
- `.github/` - GitHub workflows and templates

#### Communication
- Issue tracker for bugs and features
- Discussions for questions and ideas
- Project board for tracking work

## Conclusion

Thank you for your interest in contributing to Chrome Copilot! Your contributions help make this extension better for everyone. Whether you're fixing a small bug or adding a major feature, your work is appreciated.

### Next Steps for New Contributors
1. **Set up** your development environment
2. **Explore** the codebase and documentation
3. **Find** a good first issue or feature
4. **Discuss** your approach with maintainers
5. **Implement** and test your changes
6. **Submit** a pull request

### Staying Involved
- Watch the repository for updates
- Join discussions about new features
- Help review other contributions
- Share your experience with others

Together, we can build a powerful, user-friendly AI assistant that helps people understand and learn from web content more effectively.

---

*Developer Guide Version: 1.0*  
*Last Updated: February 2026*  
*For Chrome Copilot Version: 1.0.0*