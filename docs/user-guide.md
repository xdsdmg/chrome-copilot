# Chrome Copilot - User Guide

## Introduction

Welcome to Chrome Copilot! This AI-powered browser extension helps you understand and analyze text content on any webpage. With a simple right-click, you can get explanations, summaries, translations, and more for any selected text.

### What Can Chrome Copilot Do?
- **Explain complex concepts** in simple terms
- **Summarize lengthy content** into key points
- **Translate text** to different languages
- **Answer questions** about selected content
- **Provide context** and background information

## Getting Started

### Quick Start
1. **Install** the extension from Chrome Web Store
2. **Configure** your API key in settings (see [Setup Guide](setup.md))
3. **Select text** on any webpage
4. **Right-click** and choose "Chrome Copilot"
5. **View the result** in popup, side panel, or notification

### First-Time Setup
If you haven't configured Chrome Copilot yet, please follow the [Setup Guide](setup.md) to configure your API key and preferences before continuing.

## Basic Usage

### The Context Menu Method (Recommended)

#### Step 1: Select Text
- Navigate to any webpage with text content
- Select text by clicking and dragging with your mouse
- You can select a few words, a sentence, or multiple paragraphs

#### Step 2: Access Chrome Copilot
- **Right-click** on the selected text
- Look for **"Chrome Copilot"** in the context menu
- Click the menu item

#### Step 3: View Results
- The extension will process your request
- Results appear based on your display settings:
  - **Popup**: Extension popup opens with full explanation
  - **Side Panel**: Chrome side panel opens (Chrome 114+)
  - **Notification**: Brief summary appears as desktop notification

#### Step 4: Interact with Results
- **Read** the AI-generated explanation
- **Copy** to clipboard using the copy button
- **Save** to history (if enabled)
- **Clear** to start over

### The Popup Method

#### Accessing the Popup
1. Click the Chrome Copilot icon (🤖) in your Chrome toolbar
2. The popup opens showing:
   - Connection status
   - Quick settings
   - Recent history
   - Test button

#### Using "Test with Current Selection"
1. Select text on a webpage (keep popup open)
2. Click **"Test with Current Selection"** in popup footer
3. Extension processes the currently selected text
4. Result displays in the popup

#### Popup Views
The popup has four different views:

1. **Config View** (Default): Quick settings and history
2. **Result View**: Shows AI explanation with copy/clear options
3. **Loading View**: Shows progress while processing
4. **Error View**: Displays error messages with retry options

## Advanced Features

### Custom Prompt Templates

#### Using Different Prompt Types
1. Open the popup
2. In **Quick Settings**, find **"Prompt Template"** dropdown
3. Select from available prompts:
   - **Default**: Explanation in simple terms
   - **Summarize**: Creates concise summary
   - **Translate to English**: Translates non-English text
   - **Explain like I'm 5**: Simplified explanation for beginners
   - **Your custom prompts**: Any templates you've created

#### Creating Custom Prompts
1. Open **Options Page** (right-click extension icon → Options)
2. Scroll to **"Prompt Templates"** section
3. Click **"Add Custom Prompt"**
4. Enter:
   - **Name**: How it appears in dropdown (e.g., "Technical Explanation")
   - **Template**: The prompt text with `{text}` variable
5. Click **Save**

#### Example Custom Prompts
```javascript
// For extracting key points
"Extract the 5 most important points from: {text}"

// For code explanation
"Explain this code snippet: {text}"

// For critical analysis
"Provide a critical analysis of: {text}"

// For simplification
"Simplify this technical text for a non-expert: {text}"
```

### Display Options

#### Choosing Where Results Appear
1. Open **Options Page**
2. Find **"Display Location"** setting
3. Choose from:
   - **Popup**: Opens extension popup (default)
   - **Side Panel**: Opens Chrome side panel
   - **Notification**: Shows desktop notification

#### Popup Display
- **Best for**: Detailed explanations, copying content
- **Features**: Full formatting, copy button, metadata
- **Size**: 400×500 pixels (adjustable via browser)

#### Side Panel Display
- **Best for**: Longer content, multi-tasking
- **Requirements**: Chrome 114 or later
- **Features**: Persistent across tabs, larger viewing area
- **Access**: Click extension icon → "Open side panel"

#### Notification Display
- **Best for**: Quick summaries, non-intrusive feedback
- **Features**: Brief excerpt (first 100 characters)
- **Duration**: Auto-closes after 10 seconds
- **Click Action**: Focuses Chrome window

### Theme Customization

#### Selecting a Theme
1. Open **Options Page**
2. Find **"Theme"** setting
3. Choose:
   - **Light**: Bright interface
   - **Dark**: Dark interface (reduces eye strain)
   - **System**: Follows your operating system theme

#### Theme Behavior
- **Light/Dark**: Fixed theme regardless of system
- **System**: Automatically switches based on OS settings
- **Immediate Change**: Theme updates without restart

### History Management

#### Viewing History
1. Open the **Popup**
2. Scroll to **"Recent Queries"** section
3. See your last queries with:
   - Source website
   - Timestamp
   - First few words of query and result

#### History Details
- **Storage**: Local to your browser (not synced)
- **Limit**: Configurable (default: 50 items)
- **Privacy**: Only you can see your history

#### Clearing History
1. In **Popup**: Click "Clear All" in Recent Queries section
2. In **Options Page**: Click "Clear History" in Data Management section

#### Exporting History
1. Open **Options Page**
2. Scroll to **"Data Management"** section
3. Click **"Export All Data"**
4. Save JSON file to backup your history

## Use Cases and Examples

### Learning and Education

#### Understanding Complex Articles
1. Find a technical article or research paper
2. Select a complex paragraph
3. Right-click → "Chrome Copilot"
4. Get simplified explanation of key concepts

#### Studying Foreign Language Content
1. Find content in a language you're learning
2. Select text you don't understand
3. Use "Translate to English" prompt template
4. Get translation and context

### Work and Productivity

#### Research Assistance
1. Gather information from multiple sources
2. Select key findings or statistics
3. Use "Summarize" prompt for quick overviews
4. Compare explanations across sources

#### Document Review
1. Select dense legal or technical text
2. Get plain-language explanations
3. Identify key points and implications
4. Save explanations for reference

### Content Creation

#### Idea Generation
1. Select inspiring text or concepts
2. Ask for expansion or related ideas
3. Use explanations as writing prompts
4. Build upon AI-generated insights

#### Fact-Checking and Verification
1. Select questionable statements
2. Ask for clarification or verification
3. Get additional context or sources
4. Note any limitations or caveats

### Technical Work

#### Code Explanation
1. Select code snippet from documentation
2. Use custom "Explain this code" prompt
3. Get line-by-line explanation
4. Understand algorithms and patterns

#### API Documentation
1. Select technical API documentation
2. Get simplified usage examples
3. Understand parameters and responses
4. Identify common use cases

## Tips and Best Practices

### Text Selection Tips

#### Optimal Selection Size
- **Too Short**: 1-2 words may lack context
- **Good Range**: 1-3 sentences or 50-500 characters
- **Too Long**: May exceed token limits or produce vague responses

#### Context Matters
- Include relevant surrounding text when needed
- For technical terms, include definitions if nearby
- For quotes, include attribution if available

### Prompt Engineering Tips

#### Be Specific
- Instead of "explain this," try "explain the main argument in this text"
- Specify desired format: "list three key points," "explain in one paragraph"
- Indicate audience: "explain for beginners," "explain for experts"

#### Use Context Variables
- Reference `{context.title}` in prompts for source-aware responses
- Use `{context.url}` when asking about website-specific content
- Include `{context.timestamp}` for time-sensitive information

#### Iterative Refinement
1. Start with default explanation
2. If unclear, rephrase or ask follow-up
3. Use different prompt templates for different angles
4. Combine multiple explanations for comprehensive understanding

### Performance Optimization

#### For Faster Responses
- Use `gpt-3.5-turbo` model (OpenAI) or `claude-3-haiku` (Anthropic)
- Limit selection to 300-500 characters
- Use "Summarize" prompt for brevity
- Enable notifications for quick feedback

#### For Higher Quality
- Use `gpt-4-turbo` or `claude-3-opus` models
- Provide more context in selection
- Use detailed custom prompts
- Review and refine responses

### Cost Management

#### API Usage Tips
- Free-tier APIs may have limits (check provider terms)
- Monitor usage through provider dashboards
- Use cheaper models for routine explanations
- Save important explanations locally to avoid re-queries

#### Reducing API Calls
- Enable history to avoid repeating same queries
- Copy and save useful explanations
- Use cached responses when available
- Batch related questions when possible

## Troubleshooting

### Common Issues and Solutions

#### "API Key Not Configured" Error
- **Symptom**: Red status indicator, error message about API key
- **Solution**: 
  1. Open Options Page
  2. Enter valid API key for selected provider
  3. Click "Test Connection"
  4. Save settings

#### Context Menu Not Appearing
- **Symptom**: No "Chrome Copilot" option when right-clicking selected text
- **Solutions**:
  1. Refresh the webpage
  2. Restart Chrome browser
  3. Check extension is enabled in `chrome://extensions/`
  4. Try different text selection

#### Slow or No Response
- **Symptom**: Processing takes longer than expected or times out
- **Solutions**:
  1. Check internet connection
  2. Try smaller text selection
  3. Switch to faster model (gpt-3.5-turbo or claude-3-haiku)
  4. Check API provider status page for outages

#### Poor Quality Explanations
- **Symptom**: Explanations are vague, incorrect, or irrelevant
- **Solutions**:
  1. Provide more context in selection
  2. Use more specific prompt templates
  3. Try different LLM provider
  4. Break complex queries into smaller parts

### Error Messages

#### Common Error Messages
- **"Network error"**: Check internet connection, firewall settings
- **"API error"**: Verify API key, check provider status
- **"Invalid configuration"**: Reset to defaults and reconfigure
- **"Rate limit exceeded"**: Wait before making more requests

#### Getting Help
1. Check this User Guide for specific topics
2. Review [Setup Guide](setup.md) for configuration help
3. Check console for technical details (F12 → Console)
4. Report issues with details about the problem

## Privacy and Security

### Your Data

#### What We Store
- **Configuration**: Your settings and preferences
- **API Keys**: Encrypted in Chrome local storage
- **History**: Your query history (if enabled)
- **Temporary Data**: Current selection and results

#### What We Don't Store
- **Personal Information**: We don't collect names, emails, etc.
- **Browsing History**: We don't track websites you visit
- **Content**: Selected text is only sent to configured API endpoint
- **Analytics**: No usage tracking by default

### Data Protection

#### API Key Security
- Stored in Chrome's secure local storage
- Never sent to our servers (only to configured LLM API)
- Masked in user interface (shown as •••••)
- Redacted in data exports

#### Text Privacy
- Selected text is sent only to your configured LLM provider
- Transmission uses HTTPS encryption
- No intermediate servers or logging
- You control what text is processed

### Privacy Controls

#### Clearing Data
- **History**: Clear via popup or options page
- **Configuration**: Reset to defaults
- **All Data**: Clear via options page "Clear All Data"

#### Export/Import
- Export includes configuration and history (API keys redacted)
- Import only from trusted sources
- Full control over your data portability

## Advanced Configuration

### Custom API Endpoints

#### Self-Hosted LLMs
1. Set up local LLM server (Ollama, LM Studio, etc.)
2. In Options Page, select "Custom API" provider
3. Enter your local endpoint (e.g., `http://localhost:11434/api/generate`)
4. Configure authentication if required

#### Alternative Cloud Providers
1. Find compatible API endpoint
2. Configure request format to match provider
3. Set appropriate headers and parameters
4. Test with sample requests

### Keyboard Shortcuts

#### Chrome Extension Shortcuts
1. Navigate to `chrome://extensions/shortcuts`
2. Find Chrome Copilot
3. Set shortcuts for:
   - Open popup
   - Open side panel
   - Process current selection

#### Browser Shortcuts
- `Ctrl+Shift+Y` (Windows/Linux) or `Cmd+Shift+Y` (Mac): Open extension popup
- Right-click on selected text: Access context menu

### Integration with Other Tools

#### Clipboard Integration
- Enable "Auto-copy results" in settings
- Results automatically copy to clipboard
- Paste into notes, documents, or other apps

#### Note-taking Apps
1. Copy explanations from Chrome Copilot
2. Paste into:
   - Notion, OneNote, Evernote
   - Google Docs, Microsoft Word
   - Markdown editors
3. Organize by topic or project

#### Research Workflows
1. Use Chrome Copilot for initial understanding
2. Save explanations to research notes
3. Follow up with deeper research
4. Cite sources from original context

## Updates and New Features

### Staying Updated

#### Automatic Updates
- Chrome automatically updates extensions from Web Store
- New versions install in background
- Configuration preserved across updates

#### Update Notes
- Check extension description in Web Store
- Review changelog in documentation
- New features highlighted in popup

### Feature Requests

#### Suggesting Improvements
1. Identify pain points or desired features
2. Consider if feature aligns with extension goals
3. Check if similar functionality exists
4. Submit detailed feature request

#### Community Feedback
- Share how you use Chrome Copilot
- Suggest prompt templates for specific domains
- Report edge cases or limitations
- Contribute to documentation

## Frequently Asked Questions

### General Questions

#### Q: Is Chrome Copilot free to use?
A: The extension itself is free, but you need to provide your own API key for LLM services (some providers offer free tiers).

#### Q: Which LLM provider should I choose?
A: OpenAI (GPT) is recommended for most users. Anthropic (Claude) is good for longer content. Custom API for self-hosted options.

#### Q: How much text can I process at once?
A: Typically 500-4000 characters depending on model. Very long text may be truncated.

#### Q: Is my data private?
A: Yes. Text is sent only to your configured API endpoint. We don't store or log your data.

### Technical Questions

#### Q: Why do I need an API key?
A: The extension uses external AI services that require authentication and may have usage costs.

#### Q: Can I use local/offline AI models?
A: Yes, via the Custom API provider with local endpoints like Ollama or LM Studio.

#### Q: How do I reduce API costs?
A: Use cheaper models (gpt-3.5-turbo), shorter text, enable history to avoid repeats.

#### Q: Can I use multiple API keys?
A: Yes, configure different keys for different providers in settings.

### Usage Questions

#### Q: Can I use Chrome Copilot on PDFs or images?
A: Only on selectable text. PDFs with selectable text work; images with text don't.

#### Q: Does it work on all websites?
A: Most websites work. Some with complex JavaScript or text protection may not.

#### Q: Can I customize the response format?
A: Yes, through custom prompt templates that specify desired format.

#### Q: How do I save good explanations?
A: Copy to clipboard or export history. Enable "Save history" for automatic storage.

## Support and Resources

### Getting Help

#### Documentation
- [Setup Guide](setup.md): Installation and configuration
- [API Documentation](api.md): Technical reference
- [Architecture](architecture.md): System design

#### Troubleshooting Steps
1. Check connection status in popup
2. Verify API key in settings
3. Test with simple text selection
4. Check Chrome console for errors (F12)

#### Contact Options
- GitHub Issues for bug reports
- Feature requests via project channels
- Community discussions for usage tips

### Learning Resources

#### Prompt Engineering
- Experiment with different prompt templates
- Study effective prompt examples
- Learn how context affects responses
- Practice iterative refinement

#### Best Practices
- Start with small selections
- Use appropriate prompt for task
- Save useful prompts and explanations
- Monitor API usage and costs

## Conclusion

Chrome Copilot transforms how you interact with text on the web. Whether you're learning new concepts, researching topics, or simply trying to understand complex content, Chrome Copilot provides instant AI-powered assistance.

### Key Takeaways
1. **Simple Access**: Right-click any selected text
2. **Flexible Configuration**: Multiple providers, prompts, display options
3. **Privacy Focused**: Your data stays with you
4. **Continuously Improving**: Regular updates and new features

### Next Steps
1. **Configure** your API key if not done already
2. **Experiment** with different prompt templates
3. **Explore** advanced features like custom prompts
4. **Share** feedback to help improve the extension

Thank you for using Chrome Copilot! We hope it enhances your browsing experience and helps you learn and work more effectively.

---

*User Guide Version: 1.0*  
*Last Updated: February 2026*  
*Chrome Copilot Version: 1.0.0*