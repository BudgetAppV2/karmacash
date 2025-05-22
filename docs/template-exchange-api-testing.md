# Template Exchange System - API Testing Guide

This guide explains how to test the Template Exchange API to validate its functionality, performance, and reliability before proceeding to the next development phase.

## Overview

The Template Exchange API provides endpoints for managing templates between Google AI Studio and Cursor AI. The testing process ensures that all API endpoints function correctly, authentication works as expected, and the data is properly stored and retrieved.

## Prerequisites

- Node.js 16 or higher
- Firebase CLI installed (`npm install -g firebase-tools`)
- API key for the Template Exchange System
- Access to the Firebase project

## Testing Scripts

We've developed two main scripts to facilitate testing and deployment:

1. **API Testing Script**: `src/template-exchange/scripts/test-api.js`
2. **Deployment Script**: `scripts/deploy.js`

### Deploying the API

Before testing, ensure the API is deployed to Firebase:

```bash
# Deploy everything (Firestore rules, indexes, and Cloud Functions)
node scripts/deploy.js --all

# Or deploy individual components
node scripts/deploy.js --rules    # Deploy only Firestore rules
node scripts/deploy.js --indexes  # Deploy only Firestore indexes
node scripts/deploy.js --functions # Deploy only Cloud Functions
```

### Running the API Tests

To run the automated API tests:

```bash
# Set environment variables
export API_KEY=your_api_key
export API_URL=https://your-project-id.web.app/api

# Run the tests
node src/template-exchange/scripts/test-api.js
```

Alternatively, you can enter the API key and URL when prompted by the script.

## Test Cases

The testing script executes 15 test cases covering the following aspects:

1. **Health Check**: Ensures the API is operational
2. **API Key Validation**: Verifies that unauthorized requests are properly rejected
3. **Create Template (Handoff)**: Tests creating a new handoff template
4. **Create Template (Summary)**: Tests creating a new summary template
5. **Get Template by Session ID**: Tests retrieving a template by its session ID
6. **Get Template by ID**: Tests retrieving a template by its document ID
7. **List Templates**: Tests listing all templates
8. **List Templates with Filter**: Tests filtering templates by type
9. **Update Template**: Tests updating an existing template
10. **Validation - Invalid Session ID**: Verifies rejection of invalid session IDs
11. **Validation - Invalid Type**: Verifies rejection of invalid template types
12. **Pagination**: Tests pagination functionality
13. **Delete Template**: Tests template deletion
14. **Verify Deletion**: Confirms templates are properly deleted
15. **Sharding Strategy**: Verifies the sharding strategy for distributed data storage

## Test Reports

After running the tests, a detailed report is generated in the `src/template-exchange/test-reports` directory. This report includes:

- Summary of test results (passed/failed/skipped)
- Detailed information about each test
- Response data and status codes
- Error messages for failed tests
- Performance metrics (response times)

## Manual Testing

In addition to the automated tests, you can use Postman or similar tools to manually test the API endpoints:

### API Endpoints

| Endpoint | Method | Description | Headers |
|----------|--------|-------------|---------|
| `/healthCheck` | GET | Check API health | None |
| `/templates` | GET | List templates | x-api-key |
| `/templates/:id` | GET | Get template by ID | x-api-key |
| `/templates/:sessionId` | GET | Get template by session ID | x-api-key |
| `/templates` | POST | Create template | x-api-key, Content-Type: application/json |
| `/templates/:id` | PUT | Update template | x-api-key, Content-Type: application/json |
| `/templates/:id` | DELETE | Delete template | x-api-key |

### Example Requests

#### Create Template
```http
POST /templates
Headers:
  x-api-key: your_api_key
  Content-Type: application/json
Body:
{
  "sessionId": "M5.S4",
  "type": "handoff",
  "content": "# Task Objective: Implement feature X\n## Details: ...",
  "status": "draft"
}
```

#### Get Template by Session ID
```http
GET /templates/M5.S4?type=handoff
Headers:
  x-api-key: your_api_key
```

## Troubleshooting

If you encounter issues during testing:

1. **Authentication Errors**: Verify your API key is correct and properly included in requests
2. **Connection Errors**: Check that the API URL is correct and the functions are deployed
3. **Validation Errors**: Ensure your request payloads match the expected schema
4. **Not Found Errors**: Verify the requested resource exists

## Acceptance Criteria

The API testing is considered successful when:

1. All automated tests pass
2. Response times are within acceptable limits (<500ms for most operations)
3. Error responses provide clear, actionable information
4. The sharding strategy effectively distributes data
5. Authentication mechanisms correctly protect resources

## Next Steps

After successful API testing:

1. Proceed to integration testing with the Chrome extension and Cursor AI
2. Measure end-to-end performance for complete workflows
3. Document any edge cases or issues for future improvements 