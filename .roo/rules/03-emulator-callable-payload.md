---
description:
globs:
alwaysApply: false
---
# Firebase Emulator: Callable Function Payload Nesting

**FIREBASE EMULATOR AWARENESS:** When generating or modifying Firebase Cloud Functions `onCall` handlers intended to run in the Firebase Local Emulator Suite, be aware that the client payload (the `data` argument to the `onCall` handler) might be unexpectedly nested.

For example, a client sending `{ myKey: 'value' }` might be received on the server in the emulator as:
- `data.data.myKey` (double `data` nesting)
- Or even `data.data.data.myKey` (triple `data` nesting)

The top-level `data` object received by the `onCall` handler may also contain other emulator-specific properties like `rawRequest`.

**Implement robust client payload extraction logic that checks for these potential nesting levels before accessing client parameters.**

*Example Extraction Logic:*
```javascript
// (Inside onCall handler: async (data, context) => { ... })
let clientPayload = {};
if (data && data.data && typeof data.data.data === 'object' && data.data.data !== null) {
    clientPayload = data.data.data; // Check triple nesting
} else if (data && typeof data.data === 'object' && data.data !== null) {
    clientPayload = data.data; // Check double nesting
} else if (data && typeof data === 'object') {
    clientPayload = data; // Assume direct payload (expected in production)
} else {
    // Handle case where data is not as expected
    // logger.error('Could not extract client payload from data object.');
}
// Now use clientPayload.myKey, clientPayload.authToken, etc.
```
*(Note: Consider logging `Object.keys(data)` and the derived `clientPayload` during development in emulators if issues arise with payload access).*

*Reference:* See the client payload extraction logic in `functions/src/admin/triggerAdminSeed.js`.
