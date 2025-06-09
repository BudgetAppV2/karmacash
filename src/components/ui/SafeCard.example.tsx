import React, { useState } from 'react';
import SafeCard from './SafeCard';
import './SafeCard.css';

/**
 * SafeCard Examples and Integration Testing
 * This file demonstrates all features of the SafeCard component
 */

const SafeCardExamples: React.FC = () => {
  const [interactiveState, setInteractiveState] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleInteractiveClick = () => {
    setInteractiveState(prev => prev === 'clicked' ? 'default' : 'clicked');
  };

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const handleErrorTest = () => {
    setError(!error);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>SafeCard Component Examples</h1>
      
      {/* Basic Cards */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Basic Cards</h2>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          
          <SafeCard variant="default">
            <h3>Default Card</h3>
            <p>This is a default card with basic styling.</p>
          </SafeCard>

          <SafeCard variant="elevated">
            <h3>Elevated Card</h3>
            <p>This card has enhanced shadow for elevated appearance.</p>
          </SafeCard>

          <SafeCard variant="outlined">
            <h3>Outlined Card</h3>
            <p>This card uses border styling instead of shadow.</p>
          </SafeCard>

          <SafeCard variant="filled">
            <h3>Filled Card</h3>
            <p>This card has a subtle background fill.</p>
          </SafeCard>
        </div>
      </section>

      {/* Size Variants */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Size Variants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <SafeCard size="sm" variant="outlined">
            <h4>Small Card</h4>
            <p>Compact size for minimal content.</p>
          </SafeCard>

          <SafeCard size="md" variant="outlined">
            <h4>Medium Card (Default)</h4>
            <p>Standard size for most use cases.</p>
          </SafeCard>

          <SafeCard size="lg" variant="outlined">
            <h4>Large Card</h4>
            <p>Spacious layout for detailed content or prominent display.</p>
          </SafeCard>
        </div>
      </section>

      {/* Interactive Cards */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Interactive Cards</h2>
        
        <SafeCard 
          interactive
          onClick={handleInteractiveClick}
          variant="elevated"
          aria-label="Interactive card example"
        >
          <h3>Click Me!</h3>
          <p>This card is interactive. Current state: <strong>{interactiveState}</strong></p>
          <p>Try clicking, pressing Enter, or Space when focused.</p>
        </SafeCard>

        <SafeCard 
          interactive
          disabled
          variant="outlined"
          style={{ marginTop: '16px' }}
        >
          <h3>Disabled Interactive Card</h3>
          <p>This card is interactive but disabled - it cannot be clicked.</p>
        </SafeCard>
      </section>

      {/* Cards with Header and Footer */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Cards with Header and Footer</h2>
        
        <SafeCard 
          variant="default"
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Card with Header</h3>
              <span style={{ fontSize: '12px', color: '#666' }}>2 hours ago</span>
            </div>
          }
          footer={
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" style={{ padding: '8px 16px', fontSize: '14px' }}>
                Action 1
              </button>
              <button type="button" style={{ padding: '8px 16px', fontSize: '14px' }}>
                Action 2
              </button>
            </div>
          }
        >
          <p>This card demonstrates header and footer sections with custom content.</p>
          <p>The header contains a title and timestamp, while the footer has action buttons.</p>
        </SafeCard>
      </section>

      {/* State Testing */}
      <section style={{ marginBottom: '40px' }}>
        <h2>State Testing</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <button onClick={handleLoadingTest} style={{ marginRight: '8px' }}>
            Test Loading State
          </button>
          <button onClick={handleErrorTest}>
            Toggle Error State
          </button>
        </div>

        <SafeCard 
          loading={loading}
          error={error}
          errorMessage="This is a test error message to demonstrate error handling."
          variant="default"
        >
          <h3>State Testing Card</h3>
          <p>Use the buttons above to test loading and error states.</p>
          <p>The card will show appropriate UI for each state.</p>
        </SafeCard>
      </section>

      {/* Accessibility Examples */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Accessibility Features</h2>
        
        <SafeCard 
          role="region"
          aria-label="Accessibility demonstration card"
          aria-describedby="accessibility-description"
          variant="outlined"
        >
          <h3>Accessibility Features</h3>
          <p id="accessibility-description">
            This card demonstrates accessibility features including ARIA labels, 
            roles, and keyboard navigation support.
          </p>
          <ul>
            <li>Screen reader compatible</li>
            <li>Keyboard navigation support</li>
            <li>Focus indicators</li>
            <li>WCAG 2.1 compliant</li>
          </ul>
        </SafeCard>

        <SafeCard 
          interactive
          onClick={() => alert('Accessible interactive card clicked!')}
          aria-label="Click to show alert"
          variant="filled"
          style={{ marginTop: '16px' }}
        >
          <h3>Try Keyboard Navigation</h3>
          <p>Tab to this card and press Enter or Space to activate it.</p>
        </SafeCard>
      </section>

      {/* Security Examples */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Security Features</h2>
        
        <SafeCard 
          className="custom-class <script>alert('This should be sanitized')</script>"
          error={true}
          errorMessage="Error message with <img src='x' onerror='alert(\"XSS\")'>potential XSS"
          variant="default"
        >
          <h3>Security Testing</h3>
          <p>This card tests input sanitization:</p>
          <ul>
            <li>className prop is sanitized</li>
            <li>Error messages are sanitized</li>
            <li>XSS prevention is active</li>
          </ul>
        </SafeCard>
      </section>

      {/* Complex Content Example */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Complex Content</h2>
        
        <SafeCard 
          variant="elevated"
          header={
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>User Profile</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>John Doe</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>john.doe@example.com</div>
                </div>
              </div>
            </div>
          }
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Last login: 2 hours ago</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button">Edit</button>
                <button type="button">View Profile</button>
              </div>
            </div>
          }
        >
          <div>
            <h4>Account Status</h4>
            <p>✅ Account verified</p>
            <p>✅ Two-factor authentication enabled</p>
            <p>✅ Privacy settings configured</p>
            
            <h4>Recent Activity</h4>
            <ul>
              <li>Updated profile picture</li>
              <li>Changed password</li>
              <li>Logged in from new device</li>
            </ul>
          </div>
        </SafeCard>
      </section>

      {/* Performance Note */}
      <section>
        <SafeCard variant="filled">
          <h3>Performance Features</h3>
          <p>This component includes several performance optimizations:</p>
          <ul>
            <li><strong>React.memo</strong>: Prevents unnecessary re-renders</li>
            <li><strong>useMemo</strong>: Memoizes expensive calculations</li>
            <li><strong>useCallback</strong>: Stabilizes function references</li>
            <li><strong>CSS optimizations</strong>: Hardware acceleration, efficient selectors</li>
          </ul>
          <p>All examples on this page are fully interactive and demonstrate real-world usage.</p>
        </SafeCard>
      </section>
    </div>
  );
};

export default SafeCardExamples;