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
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  
  // Connect to emulators in development mode
  if (window.location.hostname === 'localhost') {
    console.log('Running in development mode - connecting to Firebase emulators');
    
    // Connect to Auth Emulator
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: false });
    
    // Connect to Firestore Emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Connect to Functions Emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
    
    console.log('Connected to all Firebase emulators (Auth, Firestore, Functions)');
  }
  
  console.log('Firebase initialized successfully using environment variables.');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Handle initialization error appropriately, maybe show an error message to the user
}

// Export the initialized services
export { app, auth, db, functions }; 