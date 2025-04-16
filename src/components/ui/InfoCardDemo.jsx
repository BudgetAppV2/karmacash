import React from 'react';
import InfoCard from './InfoCard';

/**
 * Demo component to showcase all InfoCard variants
 */
const InfoCardDemo = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>InfoCard Component Demo</h1>
      
      <h2>Standard Variants</h2>
      
      {/* Info variant */}
      <InfoCard 
        title="Information Message" 
        message="This is a standard information message using the 'info' variant."
        variant="info"
      />
      
      {/* Warning variant */}
      <InfoCard 
        title="Warning Message" 
        message="This is a warning message using the 'warning' variant. Please pay attention to this."
        variant="warning"
      />
      
      {/* Error variant */}
      <InfoCard 
        title="Error Message" 
        message="This is an error message using the 'error' variant. Action is required to resolve this issue."
        variant="error"
      />
      
      <h2>Edge Cases</h2>
      
      {/* Invalid variant - should log a warning */}
      <InfoCard 
        title="Invalid Variant" 
        message="This card has an invalid 'success' variant. It should fall back to the info style and log a warning."
        variant="success"
      />
      
      {/* Default variant (no variant specified) */}
      <InfoCard 
        title="Default Variant" 
        message="This card doesn't specify a variant and should use the default 'info' style."
      />
      
      {/* Long content */}
      <InfoCard 
        title="Card with Long Content" 
        message="This card contains a longer message to demonstrate how the component handles larger blocks of text. The card should expand appropriately to fit all the content while maintaining its styling and readability. This helps us verify that the layout remains consistent even with variable content length."
        variant="info"
      />
    </div>
  );
};

export default InfoCardDemo; 