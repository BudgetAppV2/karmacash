# Template Exchange Scripts

This directory contains utility scripts for the Template Exchange system, particularly focused on the Cursor AI integration. These scripts provide functionality for managing templates, testing the integration, and synchronizing data between systems.

## Available Scripts

| Script | Description |
|--------|-------------|
| `cursor-integration-client.js` | A robust HTTP client for making API calls to Cursor AI with proper error handling and retry logic |
| `sync-cursor-templates.js` | Synchronizes templates between the Template Exchange system and Cursor AI |
| `test-cursor-integration.js` | A testing utility to verify the Cursor AI integration |
| `create-api-key.js` | Generates a new API key for authenticating with the Template Exchange API |
| `deploy-web.js` | Deploys the web interface to Firebase Hosting |

## Quick Start

### Installation

First, ensure you have the required dependencies:

```bash
npm install axios dotenv
```

### API Key Setup

Generate a new API key for authentication:

```bash
node create-api-key.js
```

Add the API key to your `.env` file:

```
CURSOR_API_KEY=your_cursor_api_key
TEMPLATE_EXCHANGE_API_KEY=your_template_exchange_api_key
```

### Testing the Integration

Run a complete integration test:

```bash
node test-cursor-integration.js test
```

Or test specific functionality:

```bash
# List templates
node test-cursor-integration.js list

# Get a specific template
node test-cursor-integration.js get template-123

# Create a test template
node test-cursor-integration.js create

# Test synchronization
node test-cursor-integration.js sync
```

### Manual Synchronization

Synchronize templates between systems:

```bash
node sync-cursor-templates.js
```

### Deployment

Deploy the web interface to Firebase Hosting:

```bash
node deploy-web.js
```

## How It Works

### Cursor AI Integration Client

The `cursor-integration-client.js` file provides a robust HTTP client for making API calls to Cursor AI. It includes:

- Secure API key handling from environment variables
- Retry logic with exponential backoff for failed requests
- Proper error handling with custom error classes
- Type checking and documentation
- Methods for template operations (get, list, create, update, delete)

### Template Synchronization

The `sync-cursor-templates.js` script synchronizes templates between the Template Exchange system and Cursor AI. It:

1. Fetches templates from both systems
2. Identifies differences (templates to import, export, or update)
3. Performs the necessary operations to synchronize the data
4. Generates a sync report
5. Handles errors gracefully

### Integration Testing

The `test-cursor-integration.js` script provides a command-line interface for testing the integration. It allows you to:

1. Verify that API keys and environment variables are correctly set up
2. Test individual operations (get, list, create)
3. Test the synchronization process
4. Run a complete integration test that covers all functionality

## Configuration

### Logging

You can configure logging levels using the `LOG_LEVEL` environment variable:

```bash
LOG_LEVEL=debug node sync-cursor-templates.js
```

Available levels: `error`, `warn`, `info`, `debug`

### Retry Logic

The client automatically retries failed requests with exponential backoff. You can configure the retry behavior when creating the client:

```javascript
const client = new CursorAIClient({
  maxRetries: 5,  // Default: 3
  timeout: 60000  // Default: 30000 (30 seconds)
});
```

## Integration Architecture

The Cursor AI integration consists of several components that work together:

1. **Backend Components**:
   - `cursor-integration-client.js`: Core HTTP client for API communication
   - `sync-cursor-templates.js`: Server-side synchronization tool

2. **Frontend Components**:
   - `../public/cursor-ai-extension.js`: Browser extension for Cursor AI
   - Web interface for template management

3. **Testing & Utilities**:
   - `test-cursor-integration.js`: Command-line testing tool
   - `create-api-key.js`: API key management

The flow of data typically follows this pattern:

```
Cursor AI <--> cursor-integration-client.js <--> Template Exchange API <--> Template Storage
```

For more detailed information, see the complete [Cursor AI Integration Documentation](../docs/cursor-ai-integration.md).

## Troubleshooting

### Common Issues

- **API Connection Issues**: Check that your API keys and environment variables are correctly set up.
- **Synchronization Failures**: Look for logs in the `../logs` directory for detailed error information.
- **Permission Errors**: Ensure that the scripts have execute permissions (`chmod +x script-name.js`).

### Getting Help

If you encounter issues not covered in the documentation, please:

1. Check the [Troubleshooting](../docs/cursor-ai-integration.md#troubleshooting) section of the documentation
2. File an issue in the project repository with detailed steps to reproduce
3. Contact the project maintainers

## Contributing

Contributions to these scripts are welcome! Please see the [Contributing](../docs/cursor-ai-integration.md#contributing) section of the documentation for guidelines. 