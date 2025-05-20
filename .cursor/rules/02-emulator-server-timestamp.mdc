---
description:
globs:
alwaysApply: false
---
# Firebase Emulator: serverTimestamp() Unavailability

**FIREBASE EMULATOR AWARENESS:** When generating or modifying Firebase Cloud Functions code that uses Firestore timestamps and is intended to be run in the Firebase Local Emulator Suite, be aware that `admin.firestore.FieldValue.serverTimestamp()` may be unavailable or behave inconsistently.

**Implement a conditional fallback to `new Date()` for emulator compatibility.**

*Example Helper Function:*
```javascript
const getFirestoreTimestamp = () => {
  if (admin.firestore && admin.firestore.FieldValue && admin.firestore.FieldValue.serverTimestamp) {
    return admin.firestore.FieldValue.serverTimestamp();
  }
  // It's good practice to log a warning when the fallback is used.
  // logger.warn('Falling back to new Date() for timestamp (serverTimestamp unavailable - likely emulator).');
  return new Date();
};
```
*(Note: Ensure `admin` is correctly initialized Firebase Admin SDK and `logger` is your project's logger if you include the warning).*

*Reference:* See the `getFirestoreTimestamp` implementation in `functions/src/admin/triggerAdminSeed.js`.
