import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

/**
 * Component for testing Firebase authentication with Cloud Functions
 * This is used to diagnose issues with context.auth in Cloud Functions
 */
const TestAuthComponent = () => {
  const [result, setResult] = useState(null);
  const [echoResult, setEchoResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Test authentication with the Cloud Function
  const testAuthentication = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setEchoResult(null);
    
    try {
      const auth = getAuth();
      const functions = getFunctions();
      const currentUserId = auth.currentUser?.uid;
      
      // Log the current auth state
      console.log("Current auth state:", auth.currentUser);
      console.log("Current user ID:", currentUserId);
      
      // Get a fresh token (might help with auth issues)
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        console.log("Fresh token obtained:", !!token);
      } else {
        console.log("No user is signed in");
      }
      
      // Prepare parameters with conditional emulator user ID for workaround
      const params = {};
      
      // Add the emulatorUserId parameter when in development mode
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (currentUserId) {
          // Try to ensure parameter is passed correctly
          params.emulatorUserId = currentUserId;
          params.isEmulator = true; // Additional flag to detect emulator mode
          
          console.log("Adding emulatorUserId for development:", currentUserId);
          console.log("Full params object being sent:", JSON.stringify(params));
        } else {
          console.warn("No user ID available for emulator workaround");
        }
      }
      
      // First test the auth function
      const testAuthFunction = httpsCallable(functions, 'testAuth');
      const response = await testAuthFunction(params);
      console.log("Test auth function result:", response.data);
      setResult(response.data);

      // Now test the echo function to see if parameters are passed correctly
      try {
        const echoFunction = httpsCallable(functions, 'echoTest');
        const echoResponse = await echoFunction(params);
        console.log("Echo function result:", echoResponse.data);
        setEchoResult(echoResponse.data);
      } catch (echoError) {
        console.error("Error calling echo function:", echoError);
      }
    } catch (error) {
      console.error("Error calling test function:", error);
      setError({
        code: error.code,
        message: error.message,
        details: error.details
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-auth-container">
      <h2>Authentication Test</h2>
      
      <button 
        className="test-auth-button"
        onClick={testAuthentication}
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test Authentication'}
      </button>
      
      {result && (
        <div className="test-result success">
          <h3>Test Auth Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      {echoResult && (
        <div className="test-result success">
          <h3>Echo Test Result:</h3>
          <pre>{JSON.stringify(echoResult, null, 2)}</pre>
        </div>
      )}
      
      {error && (
        <div className="test-result error">
          <h3>Error:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestAuthComponent; 