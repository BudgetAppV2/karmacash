import React, { useState } from 'react';
import ActionConfirm from './ActionConfirm';

/**
 * Demo component to showcase the ActionConfirm component
 */
const ActionConfirmDemo = () => {
  // State to track which actions have been confirmed
  const [confirmedActions, setConfirmedActions] = useState([]);
  
  // Handler functions for different actions
  const handleDeleteTransaction = () => {
    setConfirmedActions(prev => [
      ...prev, 
      { 
        action: 'Delete Transaction', 
        id: 'tx123', 
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
  };
  
  const handleArchiveCategory = () => {
    setConfirmedActions(prev => [
      ...prev, 
      { 
        action: 'Archive Category', 
        id: 'cat456', 
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
  };
  
  const handleClearHistory = () => {
    setConfirmedActions(prev => [
      ...prev, 
      { 
        action: 'Clear History', 
        id: null, 
        timestamp: new Date().toLocaleTimeString() 
      }
    ]);
  };
  
  // Function to clear the confirmed actions list
  const clearConfirmations = () => {
    setConfirmedActions([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Action Confirm Demo</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Available Actions</h2>
        <p>Click the confirm buttons to trigger actions and generate AI Context logs.</p>
        
        <div style={{ marginBottom: '16px' }}>
          <ActionConfirm 
            actionName="Delete Transaction" 
            onConfirm={handleDeleteTransaction} 
            itemId="tx123"
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <ActionConfirm 
            actionName="Archive Category" 
            onConfirm={handleArchiveCategory} 
            itemId="cat456"
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <ActionConfirm 
            actionName="Clear History" 
            onConfirm={handleClearHistory}
          />
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#e9ecef', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Confirmed Actions Log</h2>
          <button 
            onClick={clearConfirmations}
            style={{
              padding: '4px 8px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Log
          </button>
        </div>
        
        {confirmedActions.length === 0 ? (
          <p>No actions have been confirmed yet.</p>
        ) : (
          <ul style={{ 
            listStyleType: 'none', 
            padding: '0',
            margin: '0'
          }}>
            {confirmedActions.map((item, index) => (
              <li key={index} style={{ 
                padding: '8px',
                borderBottom: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>
                  <strong>{item.action}</strong>
                  {item.id && <span style={{ marginLeft: '8px', color: '#6c757d' }}>ID: {item.id}</span>}
                </span>
                <span style={{ color: '#6c757d' }}>{item.timestamp}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px' }}>
        <h3>Implementation Notes:</h3>
        <ul>
          <li>The component takes an actionName, onConfirm callback, and optional itemId</li>
          <li>When confirmed, it logs using logger.aiContext</li>
          <li>The button is fully accessible with keyboard navigation</li>
          <li>Console logs show the AI Context entries</li>
          <li>Open your console to see the logs (press F12)</li>
        </ul>
      </div>
    </div>
  );
};

export default ActionConfirmDemo; 