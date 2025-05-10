# KarmaCash Cloud Functions Source Code

This directory contains the source code for Firebase Cloud Functions used in the KarmaCash application. It's organized into subdirectories based on functionality.

## Directory Structure

- `/admin` - Administrative functions (seeding data, diagnostics)
- `/budgets` - Budget-related functions (calculations, monthly data)

## Key Functions

### Admin Functions

- `triggerAdminSeed` - Callable function to generate test data for development/testing
- `testAuthContext` - Diagnostic function for auth context testing

### Budget Functions

- `manageRecurringInstances` - Manages recurring transaction instances within a budget (generate/delete)
- `recalculateBudget` - Budget calculation helper for monthly data

## Development in Firebase Emulators

When developing with Firebase Emulators, be aware of these key behavioral differences that might require special handling:

1. **Authentication Context Issues** - The `context.auth` object is often `null` in Callable Functions when using emulators, even when the client is properly authenticated.

2. **Callable Function Payload Nesting** - Client payload can be unexpectedly nested (sometimes `data.data` or even `data.data.data`) in emulators.

3. **ServerTimestamp Unavailability** - The `admin.firestore.FieldValue.serverTimestamp()` function may be unavailable in emulators.

For detailed explanations and solution patterns for these issues, see [Handling Firebase Emulator Specific Behaviors in Cloud Functions](../../docs/B4.3_Backend_Functions.md#8-handling-firebase-emulator-specific-behaviors-in-cloud-functions).

The `triggerAdminSeed.js` function in the `admin` directory is a reference implementation that addresses all three of these challenges. It demonstrates:

- Dual authentication approach (context.auth with manual token verification fallback)
- Robust payload extraction with multi-level nesting checks
- Timestamp helper function with graceful fallback to `new Date()`

## Testing with Emulators

To run the Firebase Emulators:

```bash
firebase emulators:start
```

The emulators provide a local development environment to test your functions without deploying to production. For more information on testing with the emulators, refer to the main [functions/README.md](../README.md). 