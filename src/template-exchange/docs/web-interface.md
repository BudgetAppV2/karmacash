# Template Exchange Web Interface

## Overview

The Template Exchange Web Interface provides a user-friendly way to interact with the Template Exchange System. It allows users to submit, view, and manage templates that facilitate communication between Google AI Studio and Cursor AI.

## Features

- **Submit Templates**: Create and store templates with specific session IDs
- **View Templates**: Browse and search through existing templates
- **Copy Templates**: Easily copy template content to clipboard for use in Google AI Studio or Cursor AI
- **Filter Templates**: Filter templates by type (handoff or summary)
- **Authentication**: API key-based authentication for secure access

## Technical Implementation

### Architecture

The web interface follows a simple client-side architecture:

- **HTML/CSS/JavaScript**: Pure frontend implementation with no framework dependencies
- **Firebase Hosting**: Hosts the static assets
- **Firebase Cloud Functions**: Provides the backend API
- **Firestore**: Stores template data

### API Integration

The web interface communicates with the following API endpoints:

- `templateExchangeHealthCheck`: Verify API connectivity
- `templateExchangeListTemplates`: List all templates with optional filtering
- `templateExchangeGetTemplate/{id}`: Get details for a specific template
- `templateExchangeCreateTemplate`: Create a new template

### Authentication

The web interface uses API key authentication to secure API access. Keys are:

1. Generated using the `create-api-key.js` script
2. Stored in localStorage for user convenience
3. Included in the HTTP header for all API requests

### File Structure

```
/public
  ├── index.html         # Main HTML structure
  ├── styles.css         # CSS styling
  ├── app.js             # Main application logic
  ├── firebase-config.js # Firebase configuration
  └── README.md          # Local documentation
```

## User Guide

### First-Time Setup

1. Navigate to the hosting URL: `https://karmacash-6e8f5.web.app`
2. You'll be prompted to enter your API key
   - If you don't have one, run `node src/template-exchange/scripts/create-api-key.js`
   - Copy the generated key and paste it into the prompt
3. The key will be saved in your browser's localStorage for future visits

### Creating a Template

1. Fill out the form in the "Submit Template" section:
   - **Session ID**: Enter in the format `M1.S2` (Milestone 1, Session 2)
   - **Template Type**: Select either "handoff" (for instructions to Cursor AI) or "summary" (for implementation summaries from Cursor AI)
   - **Content**: Paste the template content
2. Click "Submit Template"
3. You'll see a success message when the template is saved

### Viewing Templates

1. All templates are listed in the table on the right side
2. Use the "Filter by type" dropdown to show only handoff or summary templates
3. Click the "Refresh" button to update the list
4. Click "View" on any template to see its full details in a modal
5. In the modal, you can:
   - Copy the content to your clipboard with the "Copy to Clipboard" button
   - View metadata like creation date and status

### Loading More Templates

If you have many templates, the interface supports pagination:

1. Scroll to the bottom of the templates list
2. Click "Load More" to fetch additional templates

## Development Guide

### Local Development

To run the web interface locally:

1. Make sure you have Firebase CLI installed: `npm install -g firebase-tools`
2. Clone the repository and navigate to the template-exchange directory
3. Run `firebase serve --only hosting` to start a local server
4. Access the interface at `http://localhost:5000`

### Making Changes

1. Edit the files in the `public` directory:
   - `index.html` for layout changes
   - `styles.css` for styling updates
   - `app.js` for functionality modifications
2. Test locally using the Firebase serve command
3. Deploy using the deployment script

### Deployment

To deploy updates to the web interface:

1. Make and test your changes locally
2. Run the deployment script: `node src/template-exchange/scripts/deploy-web.js`
3. The script will:
   - Update the Firebase configuration if needed
   - Copy files to a temporary directory
   - Deploy to Firebase Hosting
   - Clean up temporary files

## Security Considerations

- **API Keys**: All API access requires a valid API key
- **HTTPS**: All communication is encrypted via HTTPS
- **Firestore Rules**: Backend data is protected by Firestore security rules
- **Input Validation**: Client-side and server-side validation of all inputs

## Troubleshooting

Common issues and solutions:

1. **API Key Invalid**: Generate a new API key using the script
2. **Templates Not Loading**: Check your internet connection and API key
3. **Submission Fails**: Ensure your session ID follows the format `M1.S2`
4. **Content Not Copied**: Some browsers restrict clipboard access; use manual copy if needed

## Future Enhancements

Planned future improvements include:

1. **User Authentication**: Add user accounts with Firebase Authentication
2. **Template Deletion**: Add functionality to delete templates
3. **Template Editing**: Allow editing existing templates
4. **Improved Filtering**: Add date ranges and search functionality
5. **Offline Support**: Add PWA capabilities for offline use

---

For API documentation, refer to the [API Reference](./api-reference.md) document. 