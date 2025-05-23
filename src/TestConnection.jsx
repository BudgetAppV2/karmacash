import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, getDocs } from 'firebase/firestore';

function TestConnection() {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Direct Firebase initialization
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
        };

        console.log("Raw config:", {
          apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
          authDomain: firebaseConfig.authDomain,
          projectId: firebaseConfig.projectId
        });

        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
          setError('Missing Firebase configuration: API_KEY or PROJECT_ID. Check your .env.local file');
          return;
        }

        // Initialize manually
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        
        // Connect to emulators
        if (import.meta.env.DEV) {
          connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
          connectFirestoreEmulator(db, '127.0.0.1', 8080);
          console.log("Connected to emulators");
        }

        // Test Firestore connection
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          setStatus(`Connected to Firestore. Found ${usersSnapshot.size} users.`);
        } catch (firestoreError) {
          console.error("Firestore error:", firestoreError);
          setError(`Firestore Error: ${firestoreError.message}`);
        }
      } catch (error) {
        console.error("Firebase init error:", error);
        setError(`Firebase Init Error: ${error.message}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Simple Firebase Connection Test</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>Status</h2>
        <p style={{ 
          padding: '10px', 
          background: error ? '#ffebee' : '#e8f5e9',
          border: `1px solid ${error ? '#ef9a9a' : '#a5d6a7'}`,
          borderRadius: '4px' 
        }}>
          {error || status}
        </p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Environment Variables</h2>
        <pre style={{ 
          padding: '10px', 
          background: '#f5f5f5', 
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          {JSON.stringify({
            DEV: import.meta.env.DEV,
            MODE: import.meta.env.MODE,
            FIREBASE_CONFIG: {
              API_KEY_EXISTS: !!import.meta.env.VITE_FIREBASE_API_KEY,
              AUTH_DOMAIN_EXISTS: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
              PROJECT_ID_EXISTS: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
            }
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default TestConnection; 