import React, { useState } from 'react';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * Demo component to showcase the ConfirmationDialog
 * 
 * @returns {JSX.Element} Demo UI with buttons to trigger different dialog examples
 */
const ConfirmationDialogDemo = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDestructiveDialogOpen, setIsDestructiveDialogOpen] = useState(false);
  const [dialogResult, setDialogResult] = useState(null);
  
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };
  
  const handleOpenDestructiveDialog = () => {
    setIsDestructiveDialogOpen(true);
  };
  
  const handleConfirm = () => {
    setDialogResult('User confirmed the action');
    setIsDialogOpen(false);
    setIsDestructiveDialogOpen(false);
  };
  
  const handleCancel = () => {
    setDialogResult('User cancelled the action');
    setIsDialogOpen(false);
    setIsDestructiveDialogOpen(false);
  };
  
  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Confirmation Dialog Demo</h1>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={handleOpenDialog}
          style={{
            backgroundColor: '#919A7F',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Open Standard Dialog
        </button>
        
        <button 
          onClick={handleOpenDestructiveDialog}
          style={{
            backgroundColor: '#C17C74',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Open Destructive Dialog
        </button>
      </div>
      
      {dialogResult && (
        <div 
          style={{ 
            padding: '16px', 
            backgroundColor: '#F8F9FA', 
            borderRadius: '8px', 
            marginBottom: '24px' 
          }}
        >
          <h3>Result:</h3>
          <p>{dialogResult}</p>
          <button 
            onClick={() => setDialogResult(null)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#919A7F',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      )}
      
      {/* Standard Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={isDialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action? This is a standard confirmation dialog."
        confirmText="Yes, Proceed"
        cancelText="Cancel"
      />
      
      {/* Destructive Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={isDestructiveDialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title="Confirm Deletion"
        message="Are you sure you want to delete this recurring rule? This will also remove all future planned transactions associated with it."
        confirmText="Delete Rule"
        cancelText="Cancel"
        isDestructive={true}
        itemId="example-rule-123"
      />
    </div>
  );
};

export default ConfirmationDialogDemo; 