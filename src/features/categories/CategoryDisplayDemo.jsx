import React, { useState } from 'react';
import CategoryDisplay from './CategoryDisplay';

/**
 * Demo component to showcase the CategoryDisplay component
 */
const CategoryDisplayDemo = () => {
  // Default categories containing both valid and invalid data for testing
  const [categories, setCategories] = useState([
    { id: 'cat1', name: 'Épicerie', color: '#198754' },
    { id: 'cat2', name: 'Transport', color: '#0DCAF0' },
    { id: 'cat3', name: 'Logement', color: '#FFC107' },
    { id: 'cat4', name: null, color: '#DC3545' }, // Invalid category with null name
    { id: 'cat5', name: 'Loisirs', color: '#6C757D' },
    { id: 'cat6', name: undefined, color: '#6610F2' } // Invalid category with undefined name
  ]);

  // Function to toggle between valid-only and mixed data sets
  const toggleInvalidData = () => {
    if (categories.some(cat => !cat.name)) {
      // Switch to valid-only data
      setCategories(categories.filter(cat => cat.name));
    } else {
      // Switch back to data with invalid entries
      setCategories([
        { id: 'cat1', name: 'Épicerie', color: '#198754' },
        { id: 'cat2', name: 'Transport', color: '#0DCAF0' },
        { id: 'cat3', name: 'Logement', color: '#FFC107' },
        { id: 'cat4', name: null, color: '#DC3545' },
        { id: 'cat5', name: 'Loisirs', color: '#6C757D' },
        { id: 'cat6', name: undefined, color: '#6610F2' }
      ]);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Category Display Demo</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={toggleInvalidData}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0D6EFD',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {categories.some(cat => !cat.name) 
            ? 'Show Valid Categories Only' 
            : 'Show With Invalid Categories'}
        </button>
        
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <strong>Current Data:</strong> 
          {categories.some(cat => !cat.name) 
            ? ' Mixed valid and invalid categories (check console for error logs)' 
            : ' Valid categories only'}
        </div>
      </div>
      
      <CategoryDisplay categories={categories} />
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#F8F9FA', borderRadius: '4px' }}>
        <h3>Implementation Notes:</h3>
        <ul>
          <li>The component displays categories with color indicators</li>
          <li>Invalid categories (null/undefined names) are displayed as "Unnamed Category"</li>
          <li>Console logs include info, debug, and error levels</li>
          <li>The component uses semantic HTML with proper accessibility attributes</li>
        </ul>
      </div>
    </div>
  );
};

export default CategoryDisplayDemo; 