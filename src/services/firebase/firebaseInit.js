import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully using environment variables.');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Handle initialization error appropriately, maybe show an error message to the user
}

// Export the initialized services
export { app, auth, db }; 