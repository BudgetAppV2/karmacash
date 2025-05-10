import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Flag to track emulator mode
export const isEmulatorMode = import.meta.env.DEV;

// Define the Firebase configuration object using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // From .env.local
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Log API key first few characters for debugging
console.log('Using API Key (first 10 chars):', firebaseConfig.apiKey.substring(0, 10) + '...');
console.log('Using Project ID:', firebaseConfig.projectId); // Always log project ID for consistency checking

// Check if essential config values are present (basic validation)
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    'Firebase config is missing essential values (apiKey or projectId). ' +
    'Ensure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are set in your .env.local file.'
  );
}

// Initialize Firebase app and services
let app;
let auth;
let db;
let functions;

try {
  console.log('FIREBASE INIT: Starting Firebase initialization');
  app = initializeApp(firebaseConfig);
  console.log('FIREBASE INIT: App initialized successfully');
  
  auth = getAuth(app);
  console.log('FIREBASE INIT: Auth service initialized');
  
  db = getFirestore(app);
  console.log('FIREBASE INIT: Firestore service initialized');
  
  functions = getFunctions(app);
  // Explicitly set the region and project ID for functions
  if (firebaseConfig.projectId) {
    functions = getFunctions(app, 'us-central1', firebaseConfig.projectId);
    console.log(`FIREBASE INIT: Functions service initialized with explicit project ID: ${firebaseConfig.projectId}`);
  } else {
    functions = getFunctions(app);
    console.log('FIREBASE INIT: Functions service initialized with default project ID');
  }
  
  // Set up emulator connections in development mode
  if (isEmulatorMode) {
    try {
      console.log('FIREBASE INIT: Connecting to Firebase emulators with project:', firebaseConfig.projectId);
      
      // Connect to Auth emulator with explicit project ID reference
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('FIREBASE INIT: Auth emulator connected successfully');
      
      // Connect to Firestore emulator
      connectFirestoreEmulator(db, '127.0.0.1', 8085);
      console.log('FIREBASE INIT: Firestore emulator connected successfully');
      
      // Connect to Functions emulator with explicit project ID
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      console.log('FIREBASE INIT: Functions emulator connected successfully');
      
      console.log('FIREBASE INIT: Successfully connected to all Firebase emulators');
    } catch (emulatorError) {
      console.error('FIREBASE INIT: Failed to connect to Firebase emulators:', {
        message: emulatorError.message,
        code: emulatorError.code || 'unknown',
        name: emulatorError.name
      });
    }
  }
  
  console.log('FIREBASE INIT: Firebase initialized successfully');
} catch (error) {
  console.error('FIREBASE INIT: Firebase initialization failed:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  // Handle initialization error appropriately, maybe show an error message to the user
}

// Export the initialized services with explicit names for clarity
export const firebaseApp = app;
export const firebaseAuth = auth;
export const firestore = db;
export const firebaseFunctions = functions;

// Also export with original names for backward compatibility
export { app, auth, db, functions }; 