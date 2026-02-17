# Chrome Copilot - Setup Guide

## Overview
This guide provides step-by-step instructions for installing and configuring the Chrome Copilot browser extension. Chrome Copilot is an AI-powered text explanation tool that adds a right-click context menu option for selected text.

## System Requirements

### Browser Requirements
- **Chrome Browser**: Version 88 or higher (Manifest V3 support required)
- **Operating Systems**: 
  - Windows 10 or later
  - macOS 10.15 (Catalina) or later
  - Linux (Ubuntu 20.04+, Fedora 33+, etc.)
  - ChromeOS

### Internet Connection
- Required for LLM API communication
- HTTPS connections to API endpoints (OpenAI, Anthropic, or custom)

### Permissions Required
The extension requires the following permissions:
- **Context menus**: To add "Chrome Copilot" option when text is selected
- **Storage**: To save configuration and history
- **Active tab**: To access content of current webpage
- **Scripting**: To interact with webpage content
- **Side panel**: For optional side panel display
- **Host permissions**: For API endpoints (api.openai.com, api.anthropic.com, api.deepseek.com)

## Installation Methods

### Method 1: Load Unpacked Extension (Development/Testing)

#### Step 1: Download or Clone the Extension
```bash
# Clone the repository (if using Git)
git clone <repository-url>
cd chrome-copilot

# Or download and extract the ZIP file
```

#### Step 2: Enable Developer Mode in Chrome
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Toggle **Developer mode** ON (top-right corner)

#### Step 3: Load the Extension
1. Click the **Load unpacked** button
2. Navigate to and select the `chrome-copilot` directory
3. Click **Select Folder**

#### Step 4: Verify Installation
- The Chrome Copilot extension should appear in your extensions list
- Extension icon (🤖) should appear in the Chrome toolbar
- No errors should appear in the extensions page

### Method 2: Install from Chrome Web Store (Production)

*Note: Available after extension is published to Chrome Web Store*

1. Visit Chrome Web Store
2. Search for "Chrome Copilot"
3. Click **Add to Chrome**
4. Click **Add Extension** in the confirmation dialog
5. Extension will auto-update when new versions are released

## Initial Configuration

### Accessing Configuration Options

#### Option 1: Extension Popup
1. Click the Chrome Copilot icon (🤖) in Chrome toolbar
2. Click **Open Full Settings** button in popup
3. This opens the options page in a new tab

#### Option 2: Direct Options Page
1. Navigate to `chrome://extensions/`
2. Find Chrome Copilot in the list
3. Click **Details**
4. Click **Extension options**

#### Option 3: Right-click Menu
1. Right-click on the extension icon in toolbar
2. Select **Options**

### Step 1: Configure LLM Provider

#### Selecting a Provider
1. In the options page, locate **LLM Configuration** section
2. Select your preferred provider:
   - **OpenAI** (Recommended for most users)
   - **Anthropic** (Claude models)
   - **DeepSeek** (DeepSeek models)
   - **Custom API** (Self-hosted or alternative APIs)

#### OpenAI Configuration
1. **API Key**: Obtain from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Model**: Select from available models:
   - `gpt-4` (Most capable, higher cost)
   - `gpt-4-turbo` (Balanced performance)
   - `gpt-3.5-turbo` (Fast, cost-effective)
   - `gpt-3.5-turbo-instruct` (Instruction-optimized)
3. **Endpoint**: Leave as default (`https://api.openai.com/v1/chat/completions`)

#### Anthropic Configuration
1. **API Key**: Obtain from [Anthropic Console](https://console.anthropic.com/)
2. **Model**: Select from available models:
   - `claude-3-opus-20240229` (Most capable)
   - `claude-3-sonnet-20240229` (Balanced)
   - `claude-3-haiku-20240307` (Fast, cost-effective)
3. **Endpoint**: Leave as default (`https://api.anthropic.com/v1/messages`)

#### DeepSeek Configuration
1. **API Key**: Obtain from [DeepSeek Platform](https://platform.deepseek.com/api-keys)
2. **Model**: Select from available models:
   - `deepseek-chat` (General purpose chat model)
   - `deepseek-coder` (Optimized for programming tasks)
   - `deepseek-reasoner` (Enhanced reasoning capabilities)
3. **Endpoint**: Leave as default (`https://api.deepseek.com/v1/chat/completions`)

#### Custom API Configuration
1. **API Key**: Your custom API key (if required)
2. **Model**: Enter model name (e.g., "custom", "local-llm")
3. **Endpoint**: Full URL to your API endpoint
4. **Authentication Method**: Select header type:
   - `Authorization: Bearer <token>`
   - `x-api-key: <key>`
   - Custom header (specify in format `Header-Name: value`)

### Step 2: Configure API Key

#### Security Considerations
- API keys are stored in Chrome's secure local storage
- Keys are never sent to external servers except to configured API endpoints
- Export functionality redacts API keys

#### Entering API Key
1. Locate **API Key** field in LLM Configuration section
2. Paste your API key
3. Click **Test Connection** to verify
4. Click **Save** to store securely

*Note: API keys are masked (shown as •••••) for security*

### Step 3: Configure Prompt Templates

#### Default Prompt
The default prompt template explains selected text in simple terms:
```
Explain the following text in simple terms: {text}

Context:
- Source: {context.title}
- URL: {context.url}
- Time: {context.timestamp}
```

#### Custom Prompts
1. Click **Add Custom Prompt** button
2. Enter prompt **Name** (e.g., "Summarize", "Translate")
3. Enter **Template** using available variables:
   - `{text}`: Selected text
   - `{context.title}`: Page title
   - `{context.url}`: Page URL
   - `{context.timestamp}`: Current time
   - `{context.hostname}`: Website domain
   - `{context.language}`: Page language
4. Click **Save**

#### Example Prompt Templates
```javascript
// Summarization
"Summarize this text in 3 bullet points: {text}"

// Translation to English
"Translate the following text to English: {text}"

// Explain for beginners
"Explain this like I'm 5 years old: {text}"

// Technical explanation
"Provide a technical explanation of: {text}"

// Extract key points
"Extract the 5 most important points from: {text}"
```

### Step 4: Configure Display Settings

#### Display Location
Select where results appear:
- **Popup** (Default): Opens extension popup with result
- **Side Panel**: Opens Chrome side panel (requires Chrome 114+)
- **Notification**: Shows desktop notification (brief summary)

#### Theme Selection
Choose interface theme:
- **Light**: Light color scheme
- **Dark**: Dark color scheme
- **System**: Follows system theme preference

#### Additional Settings
- **Auto-copy results**: Automatically copy results to clipboard
- **Save history**: Store query history (recommended)
- **Max history items**: Limit stored history (default: 50)

### Step 5: Save Configuration

#### Saving Changes
1. Review all settings
2. Click **Save All Settings** button
3. Wait for confirmation message
4. Configuration is automatically synced across Chrome instances (if signed in)

#### Testing Configuration
1. Click **Test Configuration** button
2. Extension will:
   - Verify API key is configured
   - Test connection to selected provider
   - Update status indicator
3. Green status indicator indicates successful configuration

## First-Time Usage

### Basic Workflow
1. **Select text** on any webpage
2. **Right-click** to open context menu
3. Click **Chrome Copilot** menu item
4. Wait for AI processing (typically 2-10 seconds)
5. View result in configured display location

### Quick Test
1. Open any webpage with text content
2. Select a paragraph or sentence
3. Right-click and select "Chrome Copilot"
4. Verify:
   - Popup opens (or notification appears)
   - AI explanation is displayed
   - Status indicator shows "Connected"

## Troubleshooting Setup Issues

### Common Issues and Solutions

#### Issue: Extension Not Loading
**Symptoms**: Extension doesn't appear in toolbar, errors in extensions page

**Solutions**:
1. Verify Chrome version is 88+
2. Check Developer mode is enabled
3. Ensure all files are present in directory
4. Check Chrome console for errors (F12 → Console)

#### Issue: API Key Not Working
**Symptoms**: "API key not configured" error, red status indicator

**Solutions**:
1. Verify API key is correctly copied
2. Check provider selection matches API key type
3. Test API key directly with provider (e.g., OpenAI Playground)
4. Ensure billing is set up (for paid APIs)

#### Issue: Context Menu Not Appearing
**Symptoms**: No "Chrome Copilot" option when right-clicking selected text

**Solutions**:
1. Refresh the webpage
2. Restart Chrome browser
3. Check extension is enabled in `chrome://extensions/`
4. Try selecting different text (some pages restrict selection)

#### Issue: Network Errors
**Symptoms**: "Network error" messages, timeouts

**Solutions**:
1. Check internet connection
2. Verify firewall/antivirus isn't blocking API endpoints
3. Try different LLM provider
4. Check if API service is down (provider status page)

### Debugging Tools

#### Chrome DevTools
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Storage** → **Extension Storage** for configuration
4. Check **Console** for error messages

#### Extension Debug Views
1. Right-click extension icon → **Inspect popup**
2. Opens DevTools for popup UI
3. Check console and network tabs

#### Service Worker Debugging
1. Navigate to `chrome://extensions/`
2. Find Chrome Copilot
3. Click **Service Worker** link (under "Inspect views")
4. Opens DevTools for background service worker

## Configuration Management

### Backup Configuration

#### Export Settings
1. Open options page
2. Scroll to **Data Management** section
3. Click **Export All Data**
4. Save JSON file to secure location

#### Import Settings
1. Open options page
2. Scroll to **Data Management** section
3. Click **Import Data**
4. Select previously exported JSON file
5. Click **Confirm Import**

*Note: Importing will overwrite existing configuration*

### Reset to Defaults
1. Open options page
2. Scroll to **Data Management** section
3. Click **Reset to Defaults**
4. Confirm reset action
5. Extension will restart with default configuration

### Clear History
1. Open popup or options page
2. Find **History** section
3. Click **Clear All History**
4. Confirm action

## Advanced Configuration

### Custom CSS Styling
For advanced users, you can customize the appearance:

1. Create a user stylesheet extension
2. Target Chrome Copilot elements:
```css
/* Example: Customize popup colors */
.chrome-copilot-popup {
  --primary-color: #your-color;
  --background-color: #your-bg;
}
```

### API Rate Limiting
If experiencing rate limits:
1. Reduce request frequency
2. Use faster/cheaper models
3. Implement client-side caching
4. Consider batch processing

### Privacy Settings
- API keys stored locally only
- No telemetry or analytics by default
- History stored locally (not synced)
- Optional anonymized usage reporting (opt-in)

## Performance Optimization

### Recommended Settings for Best Performance

#### For Fast Response
- Provider: OpenAI
- Model: `gpt-3.5-turbo`
- Max tokens: 500
- Display location: Popup

#### For High Quality
- Provider: OpenAI
- Model: `gpt-4-turbo`
- Max tokens: 1000
- Display location: Side panel

#### For Cost Efficiency
- Provider: Anthropic
- Model: `claude-3-haiku`
- Max tokens: 300
- Display location: Notification

### Memory Management
- History limited to 50 items by default
- Large responses truncated for notifications
- Automatic cleanup of temporary data

## Updates and Maintenance

### Checking for Updates
- Chrome automatically updates extensions from Web Store
- For unpacked extensions: Reload from `chrome://extensions/`

### Version Compatibility
- Configuration format is versioned
- Updates maintain backward compatibility
- Major version changes may require reconfiguration

### Security Updates
- Monitor extension update notes
- Update API keys periodically
- Review permission changes on update

## Support Resources

### Getting Help
1. **Documentation**: Check other docs in `/docs/` directory
2. **GitHub Issues**: Report bugs or request features
3. **Community**: Check project discussions

### Reporting Issues
When reporting issues, include:
1. Chrome version
2. Extension version
3. Steps to reproduce
4. Error messages
5. Screenshots if applicable

### Feature Requests
Suggest new features via:
1. GitHub issues
2. Feature request template
3. Include use case and expected behavior

---

*Next Steps*: After setup, read the [User Guide](user-guide.md) for detailed usage instructions or the [Developer Guide](developer.md) for contribution information.

*Last Updated: February 2026*