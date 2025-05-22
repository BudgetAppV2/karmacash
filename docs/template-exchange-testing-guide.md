# Template Exchange System - Testing Guide

This guide will walk you through the process of testing the Template Exchange System step by step. Follow these instructions to validate the implementation before proceeding to the next phase of development.

## Prerequisites

Before you begin testing, make sure you have the following:

1. Node.js installed (v16+ recommended)
2. Firebase CLI installed globally (`npm install -g firebase-tools`)
3. Access to the Firebase project with appropriate permissions
4. Terminal or command prompt with access to the project directory

## Step 1: Firebase Project Setup and Configuration

### 1.1. Download Firebase Service Account Credentials

1. Go to the Firebase Console: https://console.firebase.google.com/
2. Select your project (`karmacash-6e8f5`)
3. Go to Project Settings > Service accounts
4. Click "Generate new private key" button
5. Save the JSON file in your project root as `firebase-credentials.json`

### 1.2. Authenticate with Firebase CLI

```bash
# Login to Firebase (if not already logged in)
firebase login

# Verify you're using the correct project
firebase use karmacash-6e8f5
```

### 1.3. Deploy Firebase Components

Our updated deployment script automates this process:

```bash
# Deploy Firestore rules and indexes
node src/template-exchange/scripts/deploy.js --rules

# Deploy Cloud Functions
node src/template-exchange/scripts/deploy.js --functions

# Or deploy everything at once
node src/template-exchange/scripts/deploy.js --all
```

If you encounter any issues, the script will provide detailed error messages to help troubleshoot.

## Step 2: API Key Generation

Once your Firebase components are deployed, you need to generate an API key for testing:

```bash
# Generate an API key
node src/template-exchange/scripts/create-api-key.js
```

This will:
1. Generate a secure random API key
2. Store it in Firestore in the `config/api_keys` document
3. Display the key in the terminal output

**IMPORTANT:** Copy this key and save it for testing. You'll need it for the next steps.

## Step 3: Running the API Tests

### 3.1. Set Environment Variables

Before running tests, set the required environment variables:

```bash
# Set API key (replace with the key generated in Step 2)
export API_KEY=your_generated_api_key

# Set API URL (replace with your Firebase project URL)
export API_URL=https://karmacash-6e8f5.web.app/api
```

### 3.2. Run the Test Suite

Our comprehensive test script will validate all aspects of the API:

```bash
# Run the test suite
node src/template-exchange/scripts/test-api.js
```

The test script performs 15 specific test cases:

1. **Authentication Tests**
   - Verify API key validation
   - Test behavior with missing/invalid API keys

2. **CRUD Operations**
   - Create templates with valid data
   - Retrieve templates by ID and session ID
   - Update template content and metadata
   - Delete templates

3. **Error Handling**
   - Invalid input validation
   - Malformed requests
   - Edge cases

4. **Pagination Tests**
   - List templates with pagination
   - Verify cursor-based pagination works correctly

5. **Sharding Strategy**
   - Create multiple templates
   - Verify distribution across shards

### 3.3. Reviewing Test Results

The test script generates a detailed report with:

- Summary of passed/failed tests
- Timing information for performance analysis
- Specific error details for any failed tests
- Recommendations based on test outcomes

A summary report will be displayed in the console, and a detailed report will be saved to `src/template-exchange/test-reports/api-test-report-{timestamp}.json`.

## Step 4: Manual Verification (Optional)

You can also perform manual testing using tools like Postman or curl:

### 4.1. Create a Template

```bash
curl -X POST https://karmacash-6e8f5.web.app/api/templates \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "sessionId": "M5.S4",
    "type": "handoff",
    "content": "# Test Handoff\nThis is a test template.",
    "status": "draft"
  }'
```

### 4.2. Get a Template by Session ID

```bash
curl -X GET "https://karmacash-6e8f5.web.app/api/templates/M5.S4?type=handoff" \
  -H "x-api-key: your_api_key"
```

### 4.3. List Templates

```bash
curl -X GET "https://karmacash-6e8f5.web.app/api/templates?type=handoff" \
  -H "x-api-key: your_api_key"
```

## Troubleshooting

If you encounter issues during testing, try these steps:

### Deployment Issues

1. Check Firebase deployment logs:
   ```bash
   firebase functions:log
   ```

2. Verify Firestore rules syntax:
   ```bash
   firebase deploy --only firestore:rules --dry-run
   ```

3. Ensure your API key is stored correctly in Firestore:
   - Check the `config/api_keys` document in Firestore
   - If missing, run the create-api-key script again

### API Testing Issues

1. Check environment variables:
   ```bash
   echo $API_KEY
   echo $API_URL
   ```

2. Verify network connectivity:
   ```bash
   curl -i $API_URL/healthCheck
   ```

3. Check for CORS issues in browser console if testing from a web interface

### Common Error Codes

- **401 Unauthorized**: Invalid or missing API key
- **400 Bad Request**: Invalid input data
- **404 Not Found**: Template or resource not found
- **500 Internal Server Error**: Server-side issue (check function logs)

## Conclusion

After completing these tests, you should have validated:

1. Firebase deployment works correctly
2. API authentication is functioning properly
3. CRUD operations for templates work as expected
4. Error handling behaves appropriately
5. The sharding strategy distributes templates correctly

If all tests pass, you can proceed to the next phase of development. If any tests fail, address the issues before continuing.

For detailed API documentation, refer to `docs/template-exchange-api-testing.md`. 