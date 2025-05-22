# Template Exchange System - Web Interface

This web interface allows for seamless interaction with the Template Exchange System, facilitating template sharing between Google AI Studio and Cursor AI.

## Features

- **Submit Templates**: Create and store templates with specific session IDs
- **View Templates**: Browse and search through existing templates
- **Copy Templates**: Easily copy template content to clipboard for use in Google AI Studio or Cursor AI
- **Filter Templates**: Filter templates by type (handoff or summary)

## Usage

### First-Time Setup

When you first access the web interface at https://template-exchange-karmacash.web.app, you'll be prompted to enter your API key. This key is required for authentication with the Template Exchange API. If you don't have an API key, you can create one using the `create-api-key.js` script in the template-exchange/scripts directory.

### Creating Templates

1. Enter a valid session ID in the format `M1.S2` (Milestone 1, Session 2)
2. Select the template type (handoff or summary)
3. Enter the template content
4. Click "Submit Template"

### Viewing Templates

1. Browse the list of templates in the table
2. Use the filter dropdown to show only specific template types
3. Click "View" on any template to see its full content
4. Use the "Copy to Clipboard" button to copy the template content

## API Integration

This web interface integrates with the following API endpoints:

- `/templateExchangeHealthCheck` - Verify API connectivity
- `/templateExchangeListTemplates` - List all templates with optional filtering
- `/templateExchangeGetTemplate/{id}` - Get details for a specific template
- `/templateExchangeCreateTemplate` - Create a new template

## Development

### Local Development

To run the web interface locally:

1. Ensure the Firebase project is set up
2. Navigate to the `template-exchange` directory
3. Run `firebase serve --only hosting:template-exchange`

### Deployment

To deploy updates to the web interface:

1. Make your changes to the files in the `public` directory
2. Run the deployment script: `node scripts/deploy-web.js`
3. The interface will be deployed to https://template-exchange-karmacash.web.app

## Security

- All API requests require a valid API key
- API keys are stored in localStorage for convenience
- All data is stored in Firebase Firestore with appropriate security rules 