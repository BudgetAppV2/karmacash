import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

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

// Check if essential config values are present (basic validation)
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    'Firebase config is missing essential values (apiKey or projectId). ' +
    'Ensure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are set in your .env.local file.'
  );
}

// Initialize Firebase only once
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
  console.log('FIREBASE INIT: Functions service initialized');
  
  // Connect to emulators in development mode
  if (import.meta.env.DEV) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
  }
  
  console.log('FIREBASE INIT: Firebase initialized successfully using environment variables.');
} catch (error) {
  console.error('FIREBASE INIT: Firebase initialization failed:', error);
  // Handle initialization error appropriately, maybe show an error message to the user
}

// Export the initialized services
export { app, auth, db, functions }; 