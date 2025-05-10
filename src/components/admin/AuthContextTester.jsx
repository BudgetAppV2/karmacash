import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import styles from './AuthContextTester.module.css';

/**
 * Basic component to directly test auth status and token retrieval
 */
const AuthContextTester = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [log, setLog] = useState([]);
  
  // Add log entry
  const addLog = (message) => {
    console.log('AuthTest:', message);
    setLog(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, 8)}: ${message}`]);
  };
  
  // Check auth status on mount
  useEffect(() => {
    const auth = getAuth();
    addLog(`Initial check - current user: ${auth.currentUser ? auth.currentUser.email : 'none'}`);
    
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      addLog(`Auth state changed: ${authUser ? `User ${authUser.email}` : 'No user'}`);
      setUser(authUser);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Get token
  const handleGetToken = async () => {
    if (!user) {
      addLog('No user logged in - cannot get token');
      return;
    }
    
    try {
      addLog('Getting token...');
      const idToken = await user.getIdToken(true);
      addLog(`Token retrieved - length: ${idToken.length}`);
      setToken(idToken);
    } catch (error) {
      addLog(`Error getting token: ${error.message}`);
    }
  };
  
  // Test function manually (no external service)
  const handleTestManually = async () => {
    try {
      if (!token) {
        addLog('No token available - get token first');
        return;
      }
      
      addLog('Testing token details:');
      addLog(`Token preview: ${token.substring(0, 20)}...`);
      
      // Split token parts
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          addLog(`Token payload: ${JSON.stringify(payload)}`);
          addLog(`User ID from token: ${payload.user_id || payload.sub || 'not found'}`);
          addLog(`Project ID: ${payload.aud || 'not found'}`);
        } catch (e) {
          addLog(`Error parsing token: ${e.message}`);
        }
      } else {
        addLog(`Token format unexpected: ${parts.length} parts`);
      }
    } catch (error) {
      addLog(`Error in manual test: ${error.message}`);
    }
  };
  
  // Test with HTTP call directly to emulator
  const handleTestHTTP = async () => {
    if (!token) {
      addLog('No token available - get token first');
      return;
    }
    
    addLog('Testing with direct HTTP call to emulator');
    try {
      const response = await fetch('http://127.0.0.1:5001/karmacash-6e8f5/us-central1/testAuthContextHTTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: { directCall: true } })
      });
      
      const result = await response.json();
      addLog(`HTTP response: ${JSON.stringify(result)}`);
    } catch (error) {
      addLog(`HTTP call error: ${error.message}`);
    }
  };
  
  // Additional test variations
  const runCallableTests = async () => {
    if (!token) {
      addLog('No token available - get token first');
      return;
    }
    
    addLog('Testing with Firebase callable function - multiple approaches');
    
    try {
      const functions = getFunctions();
      const testAuthContextFn = httpsCallable(functions, 'testAuthContext');
      
      // Test 1: Standard approach (no token)
      addLog('Test 1: Standard approach (no token)');
      let result = await testAuthContextFn({ isEmulator: true });
      addLog(`Test 1 result: ${JSON.stringify(result.data)}`);
      
      // Test 2: With token
      addLog('Test 2: With token parameter');
      result = await testAuthContextFn({ token, isEmulator: true });
      addLog(`Test 2 result: ${JSON.stringify(result.data)}`);
      
      // Test 3: With token + userId
      addLog('Test 3: With token + userId');
      result = await testAuthContextFn({ 
        token, 
        userId: user.uid,
        isEmulator: true
      });
      addLog(`Test 3 result: ${JSON.stringify(result.data)}`);
    } catch (error) {
      addLog(`Callable tests error: ${error.message}`);
    }
  };
  
  // Test with Firebase callable function
  const handleTestCallable = async () => {
    await runCallableTests();
  };
  
  return (
    <div className={styles.container}>
      <h3>Auth Context Tester (Debug)</h3>
      
      <div className={styles.info}>
        <p><strong>Auth Status:</strong> {user ? `Logged in as ${user.email}` : 'Not logged in'}</p>
        <p><strong>Token:</strong> {token ? `${token.substring(0, 15)}...` : 'None'}</p>
      </div>
      
      <div className={styles.buttons}>
        <button 
          onClick={handleGetToken} 
          disabled={!user}
          className={styles.button}
        >
          Get Token
        </button>
        
        <button 
          onClick={handleTestManually} 
          disabled={!token}
          className={styles.button}
        >
          Test Token Manually
        </button>
        
        <button 
          onClick={handleTestHTTP} 
          disabled={!token}
          className={styles.button}
        >
          Test Direct HTTP
        </button>
        
        <button 
          onClick={handleTestCallable} 
          disabled={!token}
          className={styles.button}
        >
          Test Callable
        </button>
      </div>
      
      <div className={styles.logs}>
        <h4>Debug Logs:</h4>
        <pre>
          {log.map((entry, i) => (
            <div key={i}>{entry}</div>
          ))}
        </pre>
      </div>
    </div>
  );
};

export default AuthContextTester; 