# triggerAdminSeed Function Documentation

## Overview

The `triggerAdminSeed` function is a Firebase Cloud Function that enables administrators to generate test data for development and testing purposes. It provides a programmatic way to execute seeding operations similar to the `scripts/seedAdmin.js` CLI script, but through a callable function that can be integrated into the application's UI.

## Authentication & Authorization

The function uses a dual authentication mechanism to accommodate both production and emulator environments:

1. **Production Authentication**: Uses Firebase Authentication context (`context.auth`) provided automatically by the Firebase Functions runtime.
2. **Emulator Fallback**: Falls back to manual token verification if `context.auth` is not available, using an ID token passed in the `authToken` parameter.

**Note**: In the current implementation, admin role checking is simplified (Option B in the requirements). Before deploying to production, proper admin role checking via custom claims should be implemented.

## Parameters

The function accepts the following parameters in the `data` object:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `authToken` | String | No | - | Firebase ID token for authentication fallback |
| `targetMonth` | String | No | null | Target month for transactions in "YYYY-MM" format |
| `recurringInstancesPct` | Number | No | 30 | Percentage of transactions that should be recurring instances (0-100) |
| `skipCategories` | Boolean | No | false | Skip category creation |
| `skipTransactions` | Boolean | No | false | Skip transaction creation |
| `skipRules` | Boolean | No | false | Skip recurring rule creation |
| `skipAllocations` | Boolean | No | false | Skip monthly budget allocation creation |
| `seedDemoUser` | Boolean | No | false | If true, seed for a demo user instead of the authenticated user |
| `budgetId` | String | No | - | Target an existing budget (creates new if not provided) |

## Return Value

The function returns an object with the following structure:

```javascript
{
  success: true,
  message: "Seeding completed successfully for user abc123 for month 2025-06.",
  details: {
    userId: "abc123",
    budgetId: "xyz789",
    categoryCount: 10,
    transactionCount: 20,
    ruleCount: 3,
    targetMonth: "2025-06",
    monthlyAllocations: true
  }
}
```

## Error Handling

If an error occurs, the function throws a `functions.https.HttpsError` with one of these error codes:

- `unauthenticated`: Authentication failed
- `permission-denied`: User lacks necessary permissions
- `not-found`: A requested resource was not found
- `invalid-argument`: Invalid parameter(s) provided
- `internal`: Other internal errors

## Example Usage (Client-Side)

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

// Get the functions instance
const functions = getFunctions();

// Create the callable function reference
const triggerSeed = httpsCallable(functions, 'triggerAdminSeed');

// Call the function with parameters
try {
  const result = await triggerSeed({
    targetMonth: '2025-06',
    recurringInstancesPct: 50,
    skipAllocations: false,
    seedDemoUser: false
  });
  
  console.log('Seeding successful:', result.data);
} catch (error) {
  console.error('Seeding failed:', error);
}
```

## Testing in Emulator

1. Start the Firebase emulators:
   ```
   firebase emulators:start
   ```

2. Create a test user in the Auth emulator UI (http://localhost:4000/auth)

3. Use the test script:
   ```
   node tests/adminSeedTest.js
   ```

## Implementation Notes

- The function reuses core seeding logic from `scripts/lib/seedUtils.js`
- A basic admin check placeholder is in place, to be replaced with proper admin role checking before production
- All operations are properly logged with the Firebase Functions logger 