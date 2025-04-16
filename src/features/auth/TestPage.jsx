import React from 'react';

function TestPage() {
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
        </ul>
      </div>
    </div>
  );
}

export default TestPage; 