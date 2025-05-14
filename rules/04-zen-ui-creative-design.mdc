---
description: 
globs: 
alwaysApply: true
---
---
description: Enforces KarmaCash Creative and Attractive UI Design
globs: ["src/**/*.{js,jsx,ts,tsx,css,scss,module.css}"]
alwaysApply: true
---

# First, I AM A CREATIVE UI DESIGNER SPECIALIZED IN MOBILE-FIRST PWA DESIGN!

I will transform functional but boring interfaces into visually engaging experiences that work beautifully on mobile devices first, then scale up to larger screens. All while maintaining the Zen principles of Calm, Minimalist, Clarity, Responsive, and Consistent design.

## Mobile-First PWA Aesthetic Enhancement

### MINDSET: Think Beyond Functional UI

When designing budget and financial interfaces, don't just output numbers in a table. Create visual representations that help users understand their financial status at a glance.

**Boring UI Anti-Patterns:**
```jsx
// BORING: Plain list of numbers
<div className={styles.budgetRow}>
  <div className={styles.category}>Housing</div>
  <div className={styles.amount}>$1,200</div>
  <div className={styles.spent}>$800</div>
  <div className={styles.available}>$400</div>
</div>
```

**Engaging UI Patterns:**
```jsx
// ENGAGING: Visual representation with progress indicators
<div className={styles.budgetCard}>
  <div className={styles.categoryHeader}>
    <h3 className={styles.categoryName}>Housing</h3>
    <div className={styles.statusBadge}>On Track</div>
  </div>
  <div className={styles.amountRow}>
    <div className={styles.budgetAmount}>$1,200</div>
    <div className={styles.progressContainer}>
      <div 
        className={styles.progressBar} 
        style={{ width: `${(800/1200)*100}%` }}
        aria-valuemin="0"
        aria-valuemax="1200"
        aria-valuenow="800"
        role="progressbar"
      ></div>
    </div>
  </div>
  <div className={styles.detailsRow}>
    <div className={styles.detail}>
      <span className={styles.detailLabel}>Spent</span>
      <span className={styles.detailValue}>$800</span>
    </div>
    <div className={styles.detail}>
      <span className={styles.detailLabel}>Available</span>
      <span className={styles.detailValue}>$400</span>
    </div>
  </div>
</div>
```

## Visual Hierarchy & Whitespace

### DESIGN PRINCIPLE: Embrace Whitespace and Clear Hierarchy

Use whitespace intentionally to create breathing room and highlight important data. Design with a clear visual hierarchy so users know what matters most.

**Cluttered UI Anti-Patterns:**
```jsx
// CLUTTERED: Everything is competing for attention
<div className={styles.dashboard}>
  <h2>Budget Overview</h2>
  <div className={styles.stats}>
    <div>Income: $3,000</div>
    <div>Expenses: $2,400</div>
    <div>Savings: $600</div>
  </div>
  <table className={styles.categoriesTable}>
    {/* Crowded categories table */}
  </table>
</div>
```

**Clean UI Patterns:**
```jsx
// CLEAN: Clear hierarchy with intentional whitespace
<div className={styles.dashboard}>
  <header className={styles.dashboardHeader}>
    <h2 className={styles.dashboardTitle}>Budget Overview</h2>
    <div className={styles.periodSelector}>May 2025</div>
  </header>
  
  <div className={styles.summaryCards}>
    <div className={styles.summaryCard}>
      <span className={styles.summaryLabel}>Income</span>
      <span className={styles.summaryAmount}>$3,000</span>
    </div>
    <div className={styles.summaryCard}>
      <span className={styles.summaryLabel}>Expenses</span>
      <span className={styles.summaryAmount}>$2,400</span>
    </div>
    <div className={styles.summaryCard}>
      <span className={styles.summaryLabel}>Savings</span>
      <span className={styles.summaryAmount}>$600</span>
      <span className={styles.summaryPercent}>20%</span>
    </div>
  </div>
  
  <section className={styles.categoriesSection}>
    <h3 className={styles.sectionTitle}>Categories</h3>
    <div className={styles.categoriesGrid}>
      {/* Well-spaced categories grid */}
    </div>
  </section>
</div>
```

## Interactive Elements & Micro-interactions

### ENGAGEMENT: Add Purposeful Micro-interactions

Make the interface feel alive and responsive with subtle animations and transitions that reinforce actions without being distracting.

**Static UI Anti-Patterns:**
```jsx
// STATIC: No visual feedback on interaction
<button className={styles.allocationButton} onClick={handleAllocation}>
  Update Allocation
</button>
```

**Dynamic UI Patterns:**
```jsx
// DYNAMIC: Visual feedback reinforces the action
<button 
  className={`${styles.allocationButton} ${isUpdating ? styles.updating : ''}`}
  onClick={handleAllocation}
  disabled={isUpdating}
>
  {isUpdating ? (
    <>
      <span className={styles.loadingDot}></span>
      <span className={styles.loadingDot}></span>
      <span className={styles.loadingDot}></span>
    </>
  ) : 'Update Allocation'}
</button>

/* In CSS */
.allocationButton {
  position: relative;
  overflow: hidden;
  transition: background-color var(--transition-medium);
}

.allocationButton::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.allocationButton:active::after {
  opacity: 1;
  transform: scale(20, 20) translate(-50%);
  transition: transform var(--transition-medium), opacity var(--transition-fast);
}

.loadingDot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: currentColor;
  margin: 0 2px;
  animation: loadingDot var(--transition-slow) infinite ease-in-out alternate;
}

.loadingDot:nth-child(2) {
  animation-delay: var(--transition-fast);
}

.loadingDot:nth-child(3) {
  animation-delay: calc(var(--transition-fast) * 2);
}

@keyframes loadingDot {
  0% { transform: translateY(0); }
  100% { transform: translateY(-4px); }
}

@media (prefers-reduced-motion: reduce) {
  .allocationButton, .allocationButton::after, .loadingDot {
    transition: none;
    animation: none;
  }
}
```

## Data Visualization

### VISUAL DATA: Make Numbers Meaningful

Transform raw numbers into visual representations that communicate meaning and relationships more effectively.

**Raw Data Anti-Patterns:**
```jsx
// RAW DATA: Just showing plain numbers
<div className={styles.spendingBreakdown}>
  <h3>Category Spending</h3>
  <ul>
    <li>Housing: $800 (33%)</li>
    <li>Food: $600 (25%)</li>
    <li>Transportation: $400 (17%)</li>
    <li>Entertainment: $300 (13%)</li>
    <li>Others: $300 (13%)</li>
  </ul>
</div>
```

**Visual Data Patterns:**
```jsx
// VISUAL: Using visual representations for better understanding
<div className={styles.spendingBreakdown}>
  <h3 className={styles.breakdownTitle}>Category Spending</h3>
  
  <div className={styles.pieChartContainer}>
    <div className={styles.pieChart} aria-hidden="true">
      <div className={`${styles.pieSegment} ${styles.segmentHousing}`} style={{ '--segment-percentage': '33%' }}></div>
      <div className={`${styles.pieSegment} ${styles.segmentFood}`} style={{ '--segment-percentage': '25%' }}></div>
      <div className={`${styles.pieSegment} ${styles.segmentTransportation}`} style={{ '--segment-percentage': '17%' }}></div>
      <div className={`${styles.pieSegment} ${styles.segmentEntertainment}`} style={{ '--segment-percentage': '13%' }}></div>
      <div className={`${styles.pieSegment} ${styles.segmentOthers}`} style={{ '--segment-percentage': '13%' }}></div>
    </div>
  </div>
  
  <ul className={styles.categoryLegend}>
    <li className={styles.legendItem}>
      <span className={`${styles.legendColor} ${styles.colorHousing}`}></span>
      <span className={styles.legendCategory}>Housing</span>
      <span className={styles.legendAmount}>$800</span>
      <span className={styles.legendPercentage}>33%</span>
    </li>
    <li className={styles.legendItem}>
      <span className={`${styles.legendColor} ${styles.colorFood}`}></span>
      <span className={styles.legendCategory}>Food</span>
      <span className={styles.legendAmount}>$600</span>
      <span className={styles.legendPercentage}>25%</span>
    </li>
    {/* Other categories... */}
  </ul>
</div>

/* In CSS */
.pieChart {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  margin: 0 auto;
}

.pieSegment {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  clip-path: polygon(50% 50%, 50% 0%, calc(50% + 50% * sin(var(--segment-offset-rad))) calc(50% - 50% * cos(var(--segment-offset-rad))));
  transform: rotate(calc(var(--segment-start-deg) * 1deg));
}

.segmentHousing {
  background-color: var(--color-category-housing);
  --segment-start-deg: 0;
  --segment-offset-rad: calc(3.14159 * 2 * 0.33);
}

/* Styling for other segments... */
```

## Empty States & Guidance

### USER EXPERIENCE: Make Empty States Helpful

Instead of just showing "No data available", create helpful empty states that guide users on what to do next.

**Unhelpful Empty States Anti-Patterns:**
```jsx
// UNHELPFUL: Minimal information when no data exists
{categories.length === 0 && (
  <p>No categories found.</p>
)}
```

**Guided Empty States Patterns:**
```jsx
// GUIDED: Helpful empty state with next steps
{categories.length === 0 && (
  <div className={styles.emptyState}>
    <div className={styles.emptyStateIcon}>
      <FolderOpenIcon className={styles.icon} aria-hidden="true" />
    </div>
    <h3 className={styles.emptyStateTitle}>No Budget Categories Yet</h3>
    <p className={styles.emptyStateDescription}>
      Start by creating categories to track your spending, like Housing, Food, or Entertainment.
    </p>
    <button className={styles.emptyStateAction} onClick={handleAddCategory}>
      <PlusIcon className={styles.actionIcon} aria-hidden="true" />
      Create First Category
    </button>
  </div>
)}
```

## Color Usage & Visual Interest

### AESTHETICS: Add Thoughtful Color Accents

While maintaining a calm palette, use color strategically to guide attention and add visual interest. Create depth with subtle shadows and layering.

**Flat UI Anti-Patterns:**
```jsx
// FLAT: Everything on one visual plane, minimal color
<div className={styles.budgetHeader}>
  <h2>May 2025 Budget</h2>
  <div className={styles.stats}>
    <div className={styles.stat}>Income: $3,000</div>
    <div className={styles.stat}>Allocated: $2,400</div>
    <div className={styles.stat}>Remaining: $600</div>
  </div>
</div>
```

**Layered UI Patterns:**
```jsx
// LAYERED: Strategic use of color, shadows and layering
<header className={styles.budgetHeader}>
  <div className={styles.headerBackground}></div>
  <div className={styles.headerContent}>
    <h2 className={styles.budgetTitle}>May 2025</h2>
    
    <div className={styles.statCards}>
      <div className={`${styles.statCard} ${styles.incomeCard}`}>
        <div className={styles.statIcon}>
          <ArrowDownCircleIcon className={styles.icon} aria-hidden="true" />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Income</span>
          <span className={styles.statAmount}>$3,000</span>
        </div>
      </div>
      
      <div className={`${styles.statCard} ${styles.allocatedCard}`}>
        <div className={styles.statIcon}>
          <LayoutGridIcon className={styles.icon} aria-hidden="true" />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Allocated</span>
          <span className={styles.statAmount}>$2,400</span>
        </div>
      </div>
      
      <div className={`${styles.statCard} ${styles.remainingCard}`}>
        <div className={styles.statIcon}>
          <PiggyBankIcon className={styles.icon} aria-hidden="true" />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statLabel}>Remaining</span>
          <span className={styles.statAmount}>$600</span>
        </div>
      </div>
    </div>
  </div>
</header>

/* In CSS */
.budgetHeader {
  position: relative;
  padding: var(--spacing-lg) var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  overflow: hidden;
}

.headerBackground {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
}

.headerContent {
  position: relative;
  z-index: 1;
}

.budgetTitle {
  color: var(--color-text-on-primary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  font-size: var(--font-size-xl);
}

.statCards {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  justify-content: center;
}

.statCard {
  background-color: var(--color-surface);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  min-width: 180px;
  box-shadow: var(--shadow-level-2);
}

.statIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  margin-right: var(--spacing-sm);
}

.incomeCard .statIcon {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.allocatedCard .statIcon {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.remainingCard .statIcon {
  background-color: var(--color-info-light);
  color: var(--color-info);
}

.statAmount {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  display: block;
}

.statLabel {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  display: block;
}
```

## Mobile-First Responsive Design

### APPROACH: Design for Small Screens First, Then Scale Up

Always design for mobile devices first, then enhance the experience for larger screens. This ensures your interface is focused on core functionality and works well on all devices.

**Desktop-First Anti-Patterns:**
```jsx
// DESKTOP-FIRST: Complex layout that breaks on mobile
<div className={styles.budgetGrid}>
  <div className={styles.sidebar}>
    {/* Many sidebar controls... */}
  </div>
  <div className={styles.mainContent}>
    <div className={styles.topControls}>
      {/* Horizontal controls that overflow on mobile... */}
    </div>
    <div className={styles.dataTable}>
      {/* Wide table with many columns... */}
    </div>
  </div>
</div>
```

**Mobile-First Patterns:**
```jsx
// MOBILE-FIRST: Core functionality works on all screens
<div className={styles.budgetContainer}>
  {/* On mobile, stacks vertically */}
  <div className={styles.controls}>
    <button className={styles.filterButton} onClick={() => setShowFilters(true)}>
      <FilterIcon className={styles.icon} />
      <span>Filters</span>
    </button>
    {/* Other essential controls... */}
  </div>
  
  {/* Modal for filters on mobile, sidebar on desktop */}
  {showFilters && (
    <div className={styles.filterOverlay}>
      <div className={styles.filterContent}>
        {/* Filter options... */}
      </div>
    </div>
  )}
  
  {/* Cards that stack on mobile, grid on desktop */}
  <div className={styles.budgetCardList}>
    {budgetItems.map(item => (
      <div className={styles.budgetCard} key={item.id}>
        {/* Card content that works well at any width */}
      </div>
    ))}
  </div>
</div>

/* In CSS */
.budgetContainer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.budgetCardList {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

@media (min-width: 768px) {
  .budgetContainer {
    flex-direction: row;
  }
  
  .filterOverlay {
    position: static;
    width: 250px;
    height: auto;
  }
  
  .budgetCardList {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}
```

When reviewing and redesigning components, focus on:

1. **Mobile-first**: Design for small screens first, then enhance for larger ones
2. **Touch-friendly**: Make interactive elements large enough (min 44x44px)
3. **Purpose first**: What is this UI trying to communicate? How can we make that clearer?
4. **Hierarchy**: What's most important? Make that visually prominent
5. **Engagement**: How can we make this more interesting without being distracting?
6. **Polish**: What small details would make this feel more refined?

Remember that great PWAs don't just work well on all devices, they feel delightful to use regardless of screen size!