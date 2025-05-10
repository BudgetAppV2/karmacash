# Firebase Auth Context Testing Tools

This directory contains tools for testing and validating authentication context propagation in Firebase Cloud Functions.

## testAuthContext.js

This is a callable function that helps diagnose issues with authentication context in Firebase Functions, particularly when running in the emulator environment.

### Purpose

- Test whether `context.auth` is properly populated in callable functions
- Compare automatic auth context with manual token verification
- Understand how authentication works differently between emulator and production environments

### How it works

The function attempts to get the user ID in two different ways:
1. From `context.auth` (the standard recommended way)
2. From manual token verification (fallback method using `admin.auth().verifyIdToken()`)

It then returns detailed information about which method worked and the environment.

### Client-side usage

```javascript
import { testAuthContext } from 'src/services/firebase/adminService';

// Call the function
const result = await testAuthContext();
console.log(result);

/* Example response:
{
  success: true,
  userId: "abc123",
  authSource: "context.auth", // or "manual token verification"
  contextAuthPresent: true,   // Was context.auth populated?
  manualTokenProvided: true,  // Was a token provided for manual verification?
  timestamp: "2023-06-01T12:34:56.789Z",
  environment: "development"
}
*/
```

### Console testing

There's a utility script in `src/utils/testAuthContextCmd.js` that can be copied and pasted into the browser console for quick testing.

### Deployment

To deploy only this function:

```bash
npm run deploy-test-auth
```

or

```bash
firebase deploy --only functions:testAuthContext
```

## Troubleshooting

If `context.auth` is undefined in the emulator but works in production, consider:

1. Using the manual token verification approach in the emulator
2. Adding special handling for emulator environments
3. Making sure you're properly authenticating in the emulator environment 