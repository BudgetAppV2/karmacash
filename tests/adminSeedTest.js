/**
 * Test script for triggerAdminSeed cloud function
 * 
 * This script tests the triggerAdminSeed cloud function directly from Node.js.
 * It demonstrates how to manually call a Firebase callable function with proper
 * authentication in the emulator environment.
 * 
 * Usage:
 *   node tests/adminSeedTest.js
 * 
 * Requirements:
 *   - Firebase emulator must be running
 */

// Import Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

// Firebase project configuration (test/emulator)
const firebaseConfig = {
  apiKey: "test-api-key", // Not important for emulator
  authDomain: "test-project.firebaseapp.com", // Not important for emulator
  projectId: "karmacash-6e8f5", // Should match your local project
  appId: "1:123456789012:web:1234567890abcdef" // Not important for emulator
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// Connect to emulators
connectAuthEmulator(auth, "http://localhost:9099");
connectFunctionsEmulator(functions, "localhost", 5001);

/**
 * Main test function
 */
async function testTriggerAdminSeed() {
  try {
    console.log('Starting triggerAdminSeed test...');
    
    // 1. Sign in to emulator with a test user
    // Create this user first via: firebase emulators:start
    // Then in the Firebase emulator UI: http://localhost:4000/auth
    console.log('Signing in test user...');
    const testUserEmail = "test@example.com";
    const testUserPassword = "password123";
    
    // Sign in with email/password (will throw if user doesn't exist)
    try {
      await signInWithEmailAndPassword(auth, testUserEmail, testUserPassword);
      console.log('Signed in successfully as:', auth.currentUser.uid);
    } catch (signInError) {
      console.error('Sign-in failed. Make sure to create this test user in the emulator UI first.');
      console.error('Error:', signInError.message);
      process.exit(1);
    }
    
    // 2. Get ID token (for manual verification if needed)
    console.log('Getting ID token...');
    const idToken = await auth.currentUser.getIdToken();
    console.log('ID token obtained:', idToken.substring(0, 20) + '...');
    
    // 3. Call the function (with auth token in payload as fallback)
    console.log('Calling triggerAdminSeed function...');
    const triggerSeed = httpsCallable(functions, 'triggerAdminSeed');
    const result = await triggerSeed({
      authToken: idToken, // Include as fallback for emulator issues
      targetMonth: '2025-06', // Test specific month
      recurringInstancesPct: 50, // 50% recurring instances (0-100 range expected)
      seedDemoUser: false // Seed for authenticated user
    });
    
    // 4. Output results
    console.log('Function call successful!');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
  } catch (error) {
    console.error('Error testing triggerAdminSeed function:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
  }
}

// Run the test function
testTriggerAdminSeed().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 