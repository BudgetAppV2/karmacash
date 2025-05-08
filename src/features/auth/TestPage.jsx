import React, { useState } from 'react';
import { signIn, signUp, sendPasswordReset, auth } from '../../services/authService';

function TestPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const testAuth = async () => {
    try {
      setResult('Testing auth service...');
      setError(null);
      
      // Just check if auth is properly initialized
      if (auth) {
        setResult('Auth service is available!');
      } else {
        throw new Error('Auth service is not available');
      }
    } catch (err) {
      console.error('Auth test error:', err);
      setError(err.message || 'Unknown error testing auth');
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#0D6EFD', marginBottom: '20px' }}>Test Page</h1>
      <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
        If you can see this page, React is rendering correctly!
      </p>
      
      <button 
        onClick={testAuth}
        style={{
          backgroundColor: '#0D6EFD',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '20px'
        }}
      >
        Test Auth Service
      </button>
      
      {result && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '5px',
          textAlign: 'left'
        }}>
          <strong>Result:</strong> {result}
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          textAlign: 'left'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        color: '#212529'
      }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Troubleshooting Info</h2>
        <ul style={{ textAlign: 'left', lineHeight: '1.8' }}>
          <li>App is running</li>
          <li>React components can render</li>
          <li>Routes are working properly</li>
          <li>Authentication: {result ? '✅' : error ? '❌' : '⏳'}</li>
        </ul>
      </div>
    </div>
  );
}

export default TestPage; 