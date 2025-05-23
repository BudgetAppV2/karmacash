import React, { useEffect, useState } from 'react';
import { auth, db } from './services/firebase/firebaseInit';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

function FirebaseTest() {
  const [status, setStatus] = useState({
    firebase: 'Checking...',
    auth: 'Checking...',
    firestore: 'Checking...'
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check Firebase initialization
    if (auth && db) {
      setStatus(prev => ({ ...prev, firebase: 'Initialized' }));
    } else {
      setStatus(prev => ({ ...prev, firebase: 'Failed' }));
      setError('Firebase initialization failed');
      return;
    }

    // Check Auth
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        if (user) {
          setStatus(prev => ({ ...prev, auth: `Authenticated as ${user.email}` }));
        } else {
          setStatus(prev => ({ ...prev, auth: 'Not authenticated' }));
        }
      },
      (error) => {
        setStatus(prev => ({ ...prev, auth: 'Error' }));
        setError(`Auth error: ${error.message}`);
      }
    );

    // Check Firestore
    const checkFirestore = async () => {
      try {
        // Just try to get some collection
        const querySnapshot = await getDocs(collection(db, 'users'));
        setStatus(prev => ({ ...prev, firestore: `Connected (${querySnapshot.size} users found)` }));
      } catch (error) {
        setStatus(prev => ({ ...prev, firestore: 'Error' }));
        setError(`Firestore error: ${error.message}`);
      }
    };
    checkFirestore();

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Firebase Connection Test</h1>
      
      <div style={{ margin: '20px 0' }}>
        <h2>Status</h2>
        <ul>
          <li><strong>Firebase:</strong> {status.firebase}</li>
          <li><strong>Auth:</strong> {status.auth}</li>
          <li><strong>Firestore:</strong> {status.firestore}</li>
        </ul>
      </div>
      
      {error && (
        <div style={{ 
          background: '#ffebee', 
          padding: '10px', 
          borderRadius: '4px',
          border: '1px solid #ef9a9a',
          marginTop: '20px'
        }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h2>Debug Information</h2>
        <textarea 
          readOnly
          value={JSON.stringify({
            env: {
              DEV: import.meta.env.DEV,
              PROD: import.meta.env.PROD,
              MODE: import.meta.env.MODE,
              apiKeyPresent: !!import.meta.env.VITE_FIREBASE_API_KEY,
              projectIdPresent: !!import.meta.env.VITE_FIREBASE_PROJECT_ID
            },
            status
          }, null, 2)}
          style={{ width: '100%', height: '200px', fontFamily: 'monospace' }}
        />
      </div>
    </div>
  );
}

export default FirebaseTest; 