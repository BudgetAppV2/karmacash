---
description: 
globs: 
alwaysApply: false
---
---
description: Enforces KarmaCash Zen UI Animation and Accessibility Standards
globs: ["src/**/*.{js,jsx,ts,tsx,css,scss,module.css}"]
alwaysApply: true
---

# First, shout "ZEN UI ANIMATION AND ACCESSIBILITY STANDARDS ACTIVATED!"

Remember to adhere to the core Zen/Tranquility principles: Calm, Minimalist, Clarity, Responsive, Consistent.

Cross-reference with:
- B3.11 Animations & Interactions
- B3.4 UI/UX Guidelines

## Animation Principles

### DO: Use Animation Variables and Respect User Preferences

Use animation variables for timing and easing, and always respect prefers-reduced-motion.

**Anti-Patterns to Avoid:**
```css
/* BAD: Hardcoded animation timing and no reduced motion */
.fade-in {
  transition: opacity 0.3s ease-in-out;
}
```

**Preferred Patterns:**
```css
/* GOOD: Using variables and respecting reduced motion */
.fade-in {
  transition: opacity var(--transition-medium) var(--ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  .fade-in {
    transition: none;
  }
}
```

### DO: Animate Transform and Opacity for Performance

Prefer animating transform and opacity for better performance.

**Anti-Patterns to Avoid:**
```css
/* BAD: Animating layout properties */
@keyframes expand {
  from { width: 0; height: 0; }
  to { width: 100%; height: 200px; }
}
```

**Preferred Patterns:**
```css
/* GOOD: Animating transform */
@keyframes expand {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

### DO: Keep Animations Subtle and Purposeful

Animations should support the calm, zen-like feel of the application.

**Anti-Patterns to Avoid:**
```css
/* BAD: Excessive, distracting animation */
.bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30px); }
}
```

**Preferred Patterns:**
```css
/* GOOD: Subtle, purposeful animation */
.fade-in {
  animation: fadeIn var(--transition-medium) var(--ease-standard);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## Accessibility Standards

### DO: Use Proper ARIA Attributes

Ensure interactive elements have proper ARIA attributes when needed.

**Anti-Patterns to Avoid:**
```jsx
// BAD: Icon button without accessibility
<button onClick={closeModal}>
  <IconX />
</button>
```

**Preferred Patterns:**
```jsx
// GOOD: Accessible icon button
<button 
  onClick={closeModal}
  aria-label="Close modal"
  className={styles.iconButton}
>
  <IconX aria-hidden="true" />
</button>
```

### DO: Provide Alt Text for Images

Always provide alt text for images.

**Anti-Patterns to Avoid:**
```jsx
// BAD: Image without alt text
<img src="/logo.png" />
```

**Preferred Patterns:**
```jsx
// GOOD: Image with alt text
<img src="/logo.png" alt="KarmaCash Logo" />
```

### DO: Ensure Sufficient Color Contrast

Use the defined color variables to ensure sufficient contrast for readability.

**Anti-Patterns to Avoid:**
```css
/* BAD: Low contrast combination */
.light-text {
  color: #CCCCCC;
  background-color: #F3F0E8;
}
```

**Preferred Patterns:**
```css
/* GOOD: Using high contrast variables */
.text {
  color: var(--color-text-primary);
  background-color: var(--color-background);
}
```

### DO: Ensure Keyboard Accessibility

All interactive elements must be keyboard accessible.

**Anti-Patterns to Avoid:**
```jsx
// BAD: Using non-interactive elements for buttons
<div onClick={handleClick}>Click Me</div>
```

**Preferred Patterns:**
```jsx
// GOOD: Using proper buttons with keyboard accessibility
<button 
  onClick={handleClick}
  className={styles.button}
>
  Click Me
</button>
```

### DO: Provide Focus States

All interactive elements must have visible focus states.

**Anti-Patterns to Avoid:**
```css
/* BAD: Removing focus outline */
button:focus {
  outline: none;
}
```

**Preferred Patterns:**
```css
/* GOOD: Custom focus style using variables */
button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```