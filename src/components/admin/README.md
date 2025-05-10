# Auth Context Testing Components

This directory contains development tools for testing and validating authentication context propagation in Firebase Cloud Functions.

## AuthContextTester Component

A simple UI component that helps diagnose issues with authentication context in Firebase Functions, particularly when running in the emulator environment.

### Location

The component is rendered conditionally in the Profile page, only in development mode:

```jsx
{import.meta.env.DEV && (
  <div className="dev-tools-section">
    <h2>Outils de développement</h2>
    <AuthContextTester />
  </div>
)}
```

### How to Use

1. Run the application in development mode
2. Log in to the application
3. Navigate to the Profile page
4. Scroll down to the "Outils de développement" (Development Tools) section
5. Click the "Test Auth Context" button
6. Review the results to see:
   - Which auth method worked (context.auth or manual token verification)
   - Whether context.auth was available
   - Whether the manual token was used
   - The user ID that was determined

### Understanding the Results

The test will show you which authentication method was used:

- **Auth Source:** Will be `context.auth` if Firebase properly passed the authentication context, or `manual token verification` if the fallback method was used.
- **Context Auth Present:** Whether `context.auth` existed at all in the function
- **Manual Token Used:** Whether the token was provided and used as a fallback
- **User ID:** The authenticated user ID that was determined

### Expected Behavior

In production, `context.auth` should work correctly. In the Firebase emulator, you may find that `context.auth` is not available, and the manual token verification is needed.

This diagnostic tool helps understand how authentication is propagating in different environments and can help debug issues related to auth context.

### How It Works

This component uses the `adminService.js` service, which calls the `testAuthContext` Firebase Cloud Function. The function tries two methods to get the user ID:

1. From `context.auth` (the standard Firebase way)
2. From manual token verification (as a fallback)

It then returns information about which method worked and what data was available.

### Related Files

- `src/components/admin/AuthContextTester.jsx` - The UI component
- `src/components/admin/AuthContextTester.module.css` - Component styles
- `src/services/firebase/adminService.js` - Client-side service to call the function
- `functions/src/admin/testAuthContext.js` - The Firebase Cloud Function

### Zen UI Integration

This component follows the Zen/Tranquility principles from [B3.4 Guidelines]:

- **Calm & Minimalist Aesthetic:** Uses muted colors and clean design
- **Clarity & Focus:** Clear presentation of test results
- **Soothing Error Handling:** Calm presentation of errors without alarm
- **Progressive Disclosure:** Shows detailed results only after testing 