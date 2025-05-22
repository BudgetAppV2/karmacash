# Template Exchange System Scripts

This directory contains utility scripts for deploying and testing the Template Exchange System.

## Available Scripts

### `deploy.js`

Automates the deployment of Firebase components for the Template Exchange System.

#### Usage

```bash
# Deploy everything (Firestore rules, indexes, and Cloud Functions)
node scripts/deploy.js --all

# Or deploy individual components
node scripts/deploy.js --rules     # Deploy only Firestore security rules
node scripts/deploy.js --indexes   # Deploy only Firestore indexes
node scripts/deploy.js --functions # Deploy only Cloud Functions
```

### Other Important Scripts (Located in `src/template-exchange/scripts/`)

#### `test-api.js`

Tests the Template Exchange API endpoints to verify functionality, performance, and reliability.

```bash
# Set environment variables
export API_KEY=your_api_key
export API_URL=https://your-project-id.web.app/api

# Run the tests
node src/template-exchange/scripts/test-api.js
```

#### `create-api-key.js`

Generates and stores an API key in Firestore for use with the Template Exchange System.

```bash
node src/template-exchange/scripts/create-api-key.js [path/to/serviceAccountKey.json]
```

## Documentation

For more detailed information about these scripts and how to use them, refer to:

- [API Testing Guide](../docs/template-exchange-api-testing.md)
- [Bible Section B7.5: API Testing Tools](../docs/B7.5_API_Testing_Tools.md)

## Requirements

- Node.js 16 or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project access 