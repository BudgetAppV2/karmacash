# Cursor AI Template Exchange Integration

This document provides comprehensive documentation for the autonomous integration between Cursor AI and the Template Exchange System. The integration allows Cursor AI to directly fetch handoffs and submit summaries with minimal setup.

## Quick Start

To use Template Exchange commands in Cursor:

### Option 1: One-Time Setup (Recommended)

Run the installer script to make commands globally available in all Cursor sessions:

```bash
node src/template-exchange/install-cursor-extension.js
```

This will update your `.cursorrc` file to automatically load the Template Exchange commands whenever Cursor starts.

After installation, you can directly use:

```javascript
await fetchHandoff('M7.S6')  // Get a handoff template
await submitSummary('M7.S6', 'Implementation complete...')  // Submit a summary
```

### Option 2: Manual Loading

If you prefer not to modify your `.cursorrc`, you can manually load the commands in each Cursor session:

```javascript
require('/Users/benoitarchambault/Desktop/KarmaCash/src/template-exchange/load-templates.js')
```

## Features

- **Autonomous Commands**: Simple functions that Cursor AI can invoke directly
- **Secure API Key Storage**: Multiple fallback methods for secure API key management
- **Memory Graph Integration**: Automatic tracking of template usage and patterns
- **Robust Error Handling**: Graceful failure handling with mock fallbacks
- **Minimal Configuration**: Works with minimal setup

## Available Commands

### `fetchHandoff(sessionId)`

Fetches a handoff template from Google AI Studio.

**Parameters:**
- `sessionId` (String): Session ID in format M#.S# (e.g., "M7.S6")

**Returns:** Promise resolving to the template content as a string

**Example:**
```javascript
const template = await fetchHandoff('M7.S6');
console.log(template);
```

### `submitSummary(sessionId, content)`

Submits a summary back to Google AI Studio.

**Parameters:**
- `sessionId` (String): Session ID in format M#.S# (e.g., "M7.S6")
- `content` (String): Summary content

**Returns:** Promise resolving to submission result object

**Example:**
```javascript
const result = await submitSummary('M7.S6', 'Implementation complete...');
console.log(result);
```

### `storeApiKey(apiKey)`

Stores your API key securely for future use.

**Parameters:**
- `apiKey` (String): Your Template Exchange API key

**Returns:** Promise resolving to boolean indicating success

**Example:**
```javascript
await storeApiKey('your-api-key-here');
```

### `listTemplates([options])`

Lists templates from the exchange system.

**Parameters:**
- `options` (Optional Object): Filter options
  - `type` (String): Filter by template type ('handoff' or 'summary')
  - `status` (String): Filter by template status

**Returns:** Promise resolving to array of templates

**Example:**
```javascript
const templates = await listTemplates({ type: 'handoff' });
console.log(templates);
```

### `checkHealth()`

Checks if the template exchange system is operational.

**Returns:** Promise resolving to boolean

**Example:**
```javascript
const isHealthy = await checkHealth();
console.log('System health:', isHealthy);
```

## Typical Usage Flow

1. **Start a new session**: When Cursor starts with the extension installed, all commands are automatically available
2. **Fetch a handoff**: `await fetchHandoff("M7.S6")`
3. **Implement the required changes**: Work on the task described in the handoff
4. **Submit a summary of changes**: `await submitSummary("M7.S3", summaryContent)`

## Fallback Mechanisms

The system includes several fallback mechanisms to ensure reliability:

1. **API Key Retrieval**: Tries multiple sources in sequence:
   - Encrypted key in `~/.cursor/template-exchange-key.enc`
   - Project `.env` file
   - `src/template-exchange/credentials.json`
   - Environment variable `TEMPLATE_API_KEY`

2. **API Endpoint Fallbacks**: Tries multiple Firebase endpoints in sequence:
   - Cloud Functions endpoint
   - Template Exchange Firebase site
   - Main KarmaCash Firebase site

3. **Mock Mode**: Falls back to pre-defined templates when:
   - API endpoints are unreachable
   - Authentication fails
   - Requested template doesn't exist in Firebase

## Advanced Usage

### Memory Graph Integration

The system automatically logs template usage patterns to the Memory Graph MCP when available:

- Template fetches (successful and failed)
- Summary submissions
- Session relationships

### Customizing Mock Templates

You can add or modify mock templates by editing the `mockTemplates` object in `cursor-ai-commands.js`.

### Disabling Mock Mode

To force the system to always use Firebase (failing if templates don't exist):

```javascript
global.USE_MOCK_MODE = false;
```

## Troubleshooting

### API Key Issues

If you encounter authentication errors:

1. Generate a new API key: `node src/template-exchange/scripts/create-api-key.js`
2. Store the key: `await storeApiKey('your-new-api-key')`

### Network Issues

If you're experiencing network problems:

1. Check system health: `await checkHealth()`
2. Verify your internet connection
3. The system will automatically fall back to mock mode if network issues persist

### Command Not Found

If commands are not available:

1. Ensure you've either installed the extension or loaded it manually
2. Try running `showHelp()` to see if commands are loaded
3. If needed, manually load with `require('/path/to/load-templates.js')`

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
   - [Browser Extension](#browser-extension)
   - [Command-line Tools](#command-line-tools)
   - [Automated Synchronization](#automated-synchronization)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)

## Overview

The Cursor AI integration for Template Exchange provides several components that work together to enable template sharing between systems:

1. **HTTP Client Library**: A robust JavaScript library for making API calls to the Template Exchange system with proper error handling and retry logic.
2. **Browser Extension**: A script that can be loaded into Cursor AI to provide direct access to templates.
3. **Synchronization Tool**: A command-line tool that synchronizes templates between Cursor AI and the Template Exchange system.
4. **Testing Utilities**: Tools to verify that the integration is working correctly.

## Prerequisites

Before setting up the integration, ensure you have:

- Node.js 14.x or higher
- A Cursor AI account
- A Template Exchange API key
- Access to the Template Exchange server

## Installation

### 1. Install Dependencies

```bash
cd src/template-exchange
npm install axios dotenv
```

### 2. Set Up Environment Variables

Create or edit the `.env` file in your project root and add:

```
CURSOR_API_KEY=your_cursor_api_key
TEMPLATE_EXCHANGE_API_KEY=your_template_exchange_api_key
```

You can generate a Template Exchange API key using the provided script:

```bash
node scripts/create-api-key.js
```

## Configuration

### Client Configuration

The Cursor AI client can be configured with various options:

```javascript
const client = new CursorAIClient({
  apiKey: 'your-api-key',  // Optional, falls back to env variable
  baseURL: 'https://api.cursor.ai/v1',  // Optional
  timeout: 30000,  // Optional, in milliseconds
  maxRetries: 3  // Optional, number of retry attempts
});
```

### Synchronization Settings

To customize the synchronization behavior, you can edit the `sync-cursor-templates.js` file:

- Adjust logging levels with `LOG_LEVEL` environment variable
- Change synchronization criteria in the `identifyChanges` function
- Add custom field mappings in the `normalizeTemplate` function

## Usage

### Browser Extension

The browser extension allows you to interact with the Template Exchange system directly from Cursor AI.

#### Installation in Cursor AI

1. Open Cursor AI in your browser
2. Navigate to Settings > Extensions
3. Add a new Custom Extension
4. Paste the URL: `https://template-exchange-karmacash.web.app/cursor-ai-extension.js`
5. Click "Install" and then enter your API key when prompted

#### Usage in Cursor AI

Once installed, you can use the extension through the Cursor AI interface:

1. **List Templates**: View all available templates
2. **Apply Template**: Load a template into the current prompt
3. **Save Template**: Save the current prompt as a template

```javascript
// You can also use the API programmatically
const TemplateExchange = window.TemplateExchange;
const client = TemplateExchange.init('your-api-key');

// List templates
const templates = await client.listTemplates();

// Apply a template
await client.applyTemplate('template-id');

// Save current prompt as a template
await client.importCurrentPrompt();
```

### Command-line Tools

#### Testing the Integration

Run the test script to verify that the integration is working correctly:

```bash
# Test all functionality
node scripts/test-cursor-integration.js test

# List available templates
node scripts/test-cursor-integration.js list

# Get a specific template
node scripts/test-cursor-integration.js get template-123

# Create a test template
node scripts/test-cursor-integration.js create

# Test synchronization
node scripts/test-cursor-integration.js sync
```

#### Manual Synchronization

To manually synchronize templates between systems:

```bash
node scripts/sync-cursor-templates.js
```

### Automated Synchronization

For automated synchronization, you can set up a cron job or scheduled task:

#### Linux/macOS Cron Job

```bash
# Edit crontab
crontab -e

# Add a job to run every hour
0 * * * * cd /path/to/project && node src/template-exchange/scripts/sync-cursor-templates.js >> /path/to/logs/sync.log 2>&1
```

#### Windows Task Scheduler

1. Open Task Scheduler
2. Create a new task
3. Set the trigger to run at your preferred schedule
4. Add an action to run `node.exe` with arguments pointing to `sync-cursor-templates.js`

## API Reference

### CursorAIClient

The main client for interacting with the Cursor AI API.

#### Methods

- `constructor(options)`: Creates a new client instance
- `request(config)`: Makes an HTTP request with retry logic
- `getTemplate(templateId)`: Retrieves a template by ID
- `listTemplates(options)`: Lists available templates
- `createTemplate(template)`: Creates a new template
- `updateTemplate(templateId, template)`: Updates an existing template
- `deleteTemplate(templateId)`: Deletes a template
- `searchTemplates(query, options)`: Searches for templates

### Browser Extension API

- `TemplateExchange.init(apiKey)`: Initializes the extension
- `TemplateExchange.Client`: The client class for direct instantiation

## Troubleshooting

### Common Issues

#### API Key Issues

**Symptom**: You see "API key is required" errors.

**Solution**: 
- Check that your API key is correctly set in the `.env` file
- For the browser extension, ensure the API key is properly stored in localStorage

#### Network Errors

**Symptom**: You see "Network Error" or "Failed to fetch" errors.

**Solution**:
- Check your internet connection
- Verify that the Template Exchange server is running
- Check if there are any CORS issues if using the browser extension

#### Synchronization Failures

**Symptom**: Synchronization fails with errors.

**Solution**:
- Check the logs in `src/template-exchange/logs`
- Verify that both systems are accessible
- Check for any schema differences that might need handling in `normalizeTemplate`

### Debug Logging

To enable detailed logging, set the `LOG_LEVEL` environment variable:

```bash
LOG_LEVEL=debug node scripts/sync-cursor-templates.js
```

## Contributing

Contributions to the Cursor AI integration are welcome! Here's how you can help:

1. **Report Issues**: File bug reports with detailed steps to reproduce
2. **Suggest Features**: Open a feature request with a clear description
3. **Submit Code**: Fork the repository, make changes, and submit a pull request

When contributing code, please ensure:

- All tests pass using `node scripts/test-cursor-integration.js test`
- Your code follows the existing style patterns
- You've added appropriate documentation
- New features include corresponding tests

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

For more information, contact the project maintainers or visit the Template Exchange documentation. 