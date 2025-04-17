import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { initializeDefaultCategories, getCategories } from '../services/firebase/categories';

const TestCategoryInit = () => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [indexUrl, setIndexUrl] = useState(null);

  const handleInitialize = async () => {
    if (!currentUser) {
      setStatus('No user logged in');
      return;
    }

    setLoading(true);
    setStatus('Initializing categories...');
    setIndexUrl(null);

    try {
      // Call initialize function
      const initResult = await initializeDefaultCategories(currentUser.uid);
      
      // Check if we received an error object from the function
      if (initResult && initResult.error) {
        setStatus(`Error: ${initResult.message}`);
        if (initResult.indexUrl) {
          setIndexUrl(initResult.indexUrl);
        }
        setLoading(false);
        return;
      }
      
      setStatus('Categories initialized successfully. Fetching categories...');
      
      // Fetch categories to verify
      const fetchedCategories = await getCategories(currentUser.uid);
      
      // Check if we received an error object from the function
      if (fetchedCategories && fetchedCategories.error) {
        setStatus(`Error: ${fetchedCategories.message}`);
        if (fetchedCategories.indexUrl) {
          setIndexUrl(fetchedCategories.indexUrl);
        }
        setLoading(false);
        return;
      }
      
      setCategories(fetchedCategories || []);
      setStatus(`Initialization complete. Found ${fetchedCategories?.length || 0} categories.`);
    } catch (error) {
      console.error('Error:', error);
      setStatus(`Error: ${error.message}`);
      
      // Try to extract index URL from error message
      const match = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
      if (match) {
        setIndexUrl(match[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Category Initialization Test</h2>
      
      <button 
        onClick={handleInitialize}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#919A7F',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Processing...' : 'Initialize Default Categories'}
      </button>
      
      <div style={{ marginBottom: '20px' }}>
        Status: <strong>{status}</strong>
      </div>
      
      {indexUrl && (
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#FFF3CD',
          border: '1px solid #FFEEBA',
          borderRadius: '4px',
          color: '#856404'
        }}>
          <p><strong>Firebase Index Required</strong></p>
          <p>This operation requires a database index. You need to create it by clicking the link below:</p>
          <a 
            href={indexUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              display: 'inline-block',
              marginTop: '10px',
              color: '#0066cc',
              textDecoration: 'underline'
            }}
          >
            Create Firebase Index
          </a>
          <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
            After creating the index, return to this page and try again. It may take a few minutes for the index to be ready.
          </p>
        </div>
      )}
      
      {categories.length > 0 && (
        <div>
          <h3>Categories Found:</h3>
          <ul>
            {categories.map(cat => (
              <li key={cat.id}>
                {cat.name} ({cat.type}) - {cat.color}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestCategoryInit; 