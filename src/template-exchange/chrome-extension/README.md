# Template Exchange Chrome Extension

A Chrome extension for integrating Google AI Studio with the Template Exchange System. This extension enables seamless handoff template fetching and summary submission directly from Google AI Studio.

## Features

- **Direct Integration with Google AI Studio**: Adds a sidebar button to Google AI Studio interface for easy access to Template Exchange functionality.
- **Automatic Session Detection**: Detects session IDs (e.g., M7.S6) from the current page or URL.
- **Handoff Fetching**: Retrieve handoff templates from the Template Exchange System.
- **Summary Submission**: Submit implementation summaries back to the Template Exchange System.
- **Secure Authentication**: Securely store and manage your API key.
- **Clipboard Support**: Copy handoff templates to clipboard for easy pasting.
- **Responsive Design**: Works well on all screen sizes, with dark mode support.

## Installation

### Developer Installation (Unpacked Extension)

1. Clone the repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the `src/template-exchange/chrome-extension` directory
5. The extension should now appear in your Chrome toolbar

### Production Installation (Coming Soon)

The extension will soon be available on the Chrome Web Store for easy installation.

## Usage

### Authentication

Before using the extension, you need to authenticate with your Template Exchange API key:

1. Click the Template Exchange icon in your Chrome toolbar
2. Enter your API key in the authentication form
3. Click "Authenticate"

If the authentication is successful, you'll see the main interface.

### Using the Popup Interface

The popup interface provides two main functions:

#### Fetching Handoff Templates

1. Click the Template Exchange icon in your Chrome toolbar
2. Make sure you're on the "Fetch Handoff" tab
3. Enter a session ID (e.g., M7.S6) or let the extension auto-detect it
4. Click "Fetch Handoff"
5. The handoff template will be copied to your clipboard

#### Submitting Summaries

1. Click the Template Exchange icon in your Chrome toolbar
2. Switch to the "Submit Summary" tab
3. Enter a session ID or let the extension auto-detect it
4. Type your implementation summary in the text area
5. Click "Submit Summary"

### Using the Google AI Studio Integration

When browsing Google AI Studio:

1. A floating Template Exchange button will appear in the bottom-right corner
2. Click the button to open the sidebar
3. The sidebar will automatically detect session IDs from the page
4. Use the buttons to fetch handoffs or submit summaries directly from the sidebar

## Development

### Project Structure

```
chrome-extension/
├── css/
│   └── content.css       # Styles for the injected UI
├── images/               # Extension icons
├── js/
│   ├── background.js     # Service worker for API communication
│   ├── content.js        # Content script for Google AI Studio integration
│   └── popup.js          # Script for the popup UI
├── manifest.json         # Extension manifest
├── popup.html            # Popup UI
└── README.md             # This file
```

### Building the Extension

This extension follows Chrome's Manifest V3 guidelines. To build a production version:

1. Make sure all files are in place
2. Create a ZIP file of the `chrome-extension` directory
3. The ZIP file can be uploaded to the Chrome Web Store Developer Dashboard

## Troubleshooting

- **Authentication Issues**: If you're having trouble authenticating, try regenerating your API key.
- **Session ID Not Detected**: You can manually enter the session ID if auto-detection fails.
- **Permission Errors**: Make sure you've granted the extension permission to access Google AI Studio.
- **Extension Not Working**: Try reloading the Google AI Studio page or reinstalling the extension.

## Security

This extension requires the following permissions:

- `storage`: To store your API key securely
- `activeTab`: To detect session IDs and integrate with Google AI Studio
- `scripting`: To inject the sidebar UI into Google AI Studio
- Host permissions for `https://us-central1-karmacash-6e8f5.cloudfunctions.net/*` and `https://ai.google.dev/*`

Your API key is stored securely in Chrome's extension storage and is never shared with any third party.

## License

Copyright © 2023 KarmaCash. All rights reserved. 