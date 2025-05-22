# Template Exchange System - Simple Usage Guide

This guide explains how to use the Template Exchange System with minimal setup in future Cursor instances.

## One-Time Setup (Recommended)

Run this installer script **once** to make all Template Exchange commands available in all future Cursor sessions:

```bash
node /Users/benoitarchambault/Desktop/KarmaCash/src/template-exchange/install-cursor-extension.js
```

This modifies your `.cursorrc` file to automatically load the commands whenever Cursor starts.

## API Key Configuration

The system uses a real Firebase API key that has already been generated and securely stored. You should not need to manually configure this as it's handled automatically by the system.

If you need to update the API key for any reason, use:

```javascript
await storeApiKey('your-new-api-key')
```

## Using the Commands

After setup, you can directly use these commands in any Cursor session:

### Fetch a Handoff Template

```javascript
// Get a handoff template from the Firebase API
const template = await fetchHandoff('M7.S6');
console.log(template);
```

### Submit an Implementation Summary

```javascript
// Submit your implementation summary to Firebase
const result = await submitSummary('M7.S6', 'Implementation complete with the following features: ...');
console.log('Summary submitted with ID:', result.id);
```

### Check System Health

```javascript
// Verify the Template Exchange API is working
const health = await checkHealth();
console.log('System health:', health ? 'OK' : 'ERROR');
```

### List Available Templates

```javascript
// Get a list of all templates in the system
const templates = await listTemplates();
console.log('Found', templates.length, 'templates');
templates.forEach(t => console.log(`- ${t.sessionId} (${t.type})`));
```

### Get Help

```javascript
// Show all available commands and their usage
showHelp();
```

## Troubleshooting

If you encounter any issues:

1. Verify your internet connection
2. Check that the Firebase API is responsive with `await checkHealth()`
3. Ensure your API key is valid with `await storeApiKey('your-api-key')`
4. Check for any error messages that might indicate the specific problem

## Technical Details

- All templates are stored in Firebase Firestore
- Communication happens via secure Firebase Cloud Functions
- API authentication is handled automatically
- No mock mode is used - all operations connect to the real Firebase backend 