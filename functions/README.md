# KarmaCash Firebase Cloud Functions

This directory contains the Firebase Cloud Functions for the KarmaCash application.

## Recurring Transaction Generation

### Overview

The `processRecurringTransactions` function automatically generates transactions based on recurring rules defined by users. It runs daily at midnight Eastern Time and performs the following operations:

1. Queries for all active recurring rules across all users
2. For each rule:
   - Deletes existing future transactions linked to the rule
   - Generates new transactions within a 1-year future window
   - Updates the rule's `nextDate` to the next occurrence
   - Handles rule deactivation if its end date has passed

### Data Model

The function follows the Firebase Firestore data model:

- Recurring rules: `/users/{userId}/recurringRules/{ruleId}`
- Transactions: `/users/{userId}/transactions/{transactionId}`

### Algorithm

The core algorithm follows specification [B5.5.8] and includes:

1. **Time Window Calculation:**
   - Retroactive limit: 3 months back from today
   - Future window: 1 year ahead from today

2. **Rule Processing:**
   - Filters out rules with missing required fields
   - Deactivates rules with end dates in the past
   - Calculates dates based on frequency type (daily, weekly, biweekly, monthly, quarterly, yearly)
   - Handles special cases like month-end dates and leap years

3. **Transaction Generation:**
   - Uses batch operations for efficient Firestore writes
   - Stays under Firestore's 500 operations per batch limit
   - Sets proper fields including `isRecurringInstance: true` and `recurringRuleId`
   - Handles edge cases for date calculations

### Date Calculation

The function includes sophisticated date calculation logic:

- `calculateFirstOccurrence`: Determines the first valid date to start generating transactions
- `calculateNextDate`: Computes the next occurrence based on frequency type
- Special handling for:
  - Month-end dates (e.g., January 31 → February 28/29)
  - Leap years
  - Bi-weekly calculations

### Error Handling

The function implements robust error handling:

- Per-rule error isolation: an error in one rule doesn't affect processing of other rules
- Detailed logging for debugging
- Batch operation management to prevent exceeding Firestore limits

### Testing

#### Test Function

A callable function `testProcessRule` is provided for testing and debugging:

```javascript
// Example client code to test a specific recurring rule
firebase.functions().httpsCallable('testProcessRule')({
  ruleId: 'your-rule-id-here'
}).then(result => {
  console.log('Test result:', result.data);
}).catch(error => {
  console.error('Test error:', error);
});
```

#### Testing Locally

To test the functions locally:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Start the emulator: `npm run serve`
4. Use the Firebase Admin SDK or client SDK to call the functions

### Deployment

Deploy the functions to Firebase:

```bash
cd functions
npm install
npm run deploy
```

### Logs

To view logs for debugging:

```bash
firebase functions:log
```

## Other Functions

### onUserCreated

This function creates default categories for new users when they sign up.

### logSink

A simple HTTP endpoint for logging, useful for debugging.

## Dependencies

- firebase-admin: Firestore and Firebase Admin SDK
- firebase-functions: Firebase Cloud Functions framework
- date-fns: Date manipulation utilities
- winston: Logging library 