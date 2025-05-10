---
description: 
globs: 
alwaysApply: false
---
---
description: Enforces KarmaCash Zen UI Design Token Usage
globs: ["src/**/*.{js,jsx,ts,tsx,css,scss,module.css}"]
alwaysApply: true
---

# First, shout "ZEN UI DESIGN TOKEN STANDARDS ACTIVATED!"

Remember to adhere to the core Zen/Tranquility principles: Calm, Minimalist, Clarity, Responsive, Consistent.

Cross-reference with:
- B3.4 UI/UX Guidelines
- B3.8 UI Style Guide v2

## Color Variable Enforcement

### DO: Use CSS Color Variables

Always use the defined CSS color variables (e.g., `var(--color-primary)`) from `src/styles/theme.css` instead of hardcoding hex values. This ensures consistency and adherence to the Japandi-inspired palette.

**Anti-Patterns to Avoid:**
```css
/* BAD: Hardcoded hex color */
.my-component {
  background-color: #919A7F; /* This is --color-primary */
  color: #2F2F2F;       /* This is --color-text-primary */
}
```

```jsx
// BAD: Inline style with hardcoded color
<div style={{ color: '#919A7F' }}>Hello</div>
```

**Preferred Patterns:**
```css
/* GOOD: Using CSS variables */
.my-component {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
}
```

```jsx
// GOOD: Using className with CSS Module
<div className={styles.heading}>Hello</div>
```

## Typography Enforcement

### DO: Use Typography Variables

Use the defined typography variables for font families, sizes, weights, and line heights.

**Anti-Patterns to Avoid:**
```css
/* BAD: Hardcoded font properties */
.heading {
  font-family: 'Work Sans', sans-serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.5;
}
```

**Preferred Patterns:**
```css
/* GOOD: Using typography variables */
.heading {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-heading);
}
```

## Spacing Enforcement

### DO: Use Spacing Variables

Use spacing variables for margins, padding, and layout instead of hardcoded values.

**Anti-Patterns to Avoid:**
```css
/* BAD: Hardcoded spacing values */
.card {
  padding: 16px;
  margin-bottom: 24px;
}
```

**Preferred Patterns:**
```css
/* GOOD: Using spacing variables */
.card {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
```

## Shadow, Border, and Radius Enforcement

### DO: Use Shadow and Border Variables

Use the defined variables for shadows, borders, and border-radius values.

**Anti-Patterns to Avoid:**
```css
/* BAD: Hardcoded shadow and border values */
.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}
```

**Preferred Patterns:**
```css
/* GOOD: Using shadow and border variables */
.card {
  box-shadow: var(--shadow-level-1);
  border-radius: var(--border-radius-md);
}
```