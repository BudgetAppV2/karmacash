---
description: 
globs: 
alwaysApply: false
---
---
description: Enforces KarmaCash Zen UI Component Standards
globs: ["src/components/**/*.{js,jsx,ts,tsx}"]
alwaysApply: true
---

# First, shout "ZEN UI COMPONENT STANDARDS ACTIVATED!"

Remember to adhere to the core Zen/Tranquility principles: Calm, Minimalist, Clarity, Responsive, Consistent.

Cross-reference with:
- B3.4 UI/UX Guidelines
- B3.7 Component Specs

## CSS Modules Enforcement

### DO: Use CSS Modules for Styling

Always use CSS Modules for component styling instead of inline styles or global CSS.

**Anti-Patterns to Avoid:**
```jsx
// BAD: Inline styles
<button 
  style={{ 
    padding: '8px 16px', 
    backgroundColor: '#919A7F', 
    color: 'white' 
  }} 
  onClick={handleClick}
>
  Submit
</button>
```

**Preferred Patterns:**
```jsx
// GOOD: CSS Modules
import styles from './Button.module.css';

<button 
  className={styles.button} 
  onClick={handleClick}
>
  Submit
</button>
```

## Button Component Standards

### DO: Use Standard Button Variants

Use the standard button variants (primary, secondary, tertiary) with appropriate props.

**Anti-Patterns to Avoid:**
```jsx
// BAD: Custom styling that doesn't follow design system
<button className="custom-btn blue-btn">Submit</button>
```

**Preferred Patterns:**
```jsx
// GOOD: Using standard Button component with variants
<Button variant="primary" onClick={handleClick}>Submit</Button>
```

## Form Component Standards

### DO: Use Form Components with Proper Accessibility

Use form components with proper labels, help text, and error handling.

**Anti-Patterns to Avoid:**
```jsx
// BAD: Incomplete form element
<input type="text" placeholder="Enter email" />
```

**Preferred Patterns:**
```jsx
// GOOD: Complete form element with accessibility
<div className={styles.formGroup}>
  <label htmlFor="email" className={styles.label}>Email</label>
  <input 
    id="email" 
    type="email" 
    className={styles.input}
    aria-describedby="email-help" 
    value={email}
    onChange={handleChange}
  />
  {error && (
    <p className={styles.errorText} id="email-error">
      {error}
    </p>
  )}
  <p id="email-help" className={styles.helpText}>
    We'll never share your email
  </p>
</div>
```

## Layout Component Standards

### DO: Use Consistent Layout Patterns

Follow consistent layout patterns for pages, sections, and content areas.

**Anti-Patterns to Avoid:**
```jsx
// BAD: Inconsistent layout with hardcoded values
<div style={{ display: 'flex', gap: '20px', padding: '15px' }}>
  <div style={{ flex: '1' }}>Sidebar</div>
  <div style={{ flex: '3' }}>Content</div>
</div>
```

**Preferred Patterns:**
```jsx
// GOOD: Using layout components with CSS Modules
<div className={styles.pageLayout}>
  <aside className={styles.sidebar}>Sidebar</aside>
  <main className={styles.mainContent}>Content</main>
</div>
```

## Card Component Standards

### DO: Use Standard Card Patterns

Use consistent card patterns for presenting grouped content.

**Anti-Patterns to Avoid:**
```jsx
// BAD: Inconsistent card styling
<div style={{ 
  border: '1px solid #ddd', 
  padding: '10px',
  marginBottom: '20px'
}}>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>
```

**Preferred Patterns:**
```jsx
// GOOD: Using card component with CSS Modules
<div className={styles.card}>
  <div className={styles.cardHeader}>
    <h3 className={styles.cardTitle}>Card Title</h3>
  </div>
  <div className={styles.cardBody}>
    <p>Card content goes here</p>
  </div>
</div>
```