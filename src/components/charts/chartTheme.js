// Chart Theme Configuration for KarmaCash
// Follows B3.4 Guidelines (Zen aesthetic) and B3.8 Style Guide (color palette, typography)

// Color palette from B3.8 Style Guide
export const CHART_COLORS = {
  // Primary theme colors
  primary: '#919A7F',      // Primary Sage
  secondary: '#A58D7F',    // Secondary Taupe
  background: '#F3F0E8',   // Background
  surface: '#FFFFFF',      // Surface
  textPrimary: '#2F2F2F',  // Text Primary
  textSecondary: '#88837A', // Text Secondary
  
  // Semantic colors
  positive: '#568E8D',     // Positive (Income)
  negative: '#C17C74',     // Negative (Expenses)
  information: '#7A8D99',  // Information
  highlight: '#D9D0C7',    // Highlight

  // Categorical Colors Palette v5 (20 harmonious colors for chart segments)
  categorical: [
    '#7FB069', // Brighter Leaf Green
    '#4A7856', // Darker Muted Green
    '#99D4C8', // Pale Teal/Mint
    '#B8B07F', // Khaki/Desaturated Olive
    '#709AC7', // Slightly Stronger Slate Blue
    '#3A5A78', // Deep Navy/Indigo
    '#ADD8E6', // Standard Light Blue
    '#7EB5D6', // Clear Sky Blue
    '#4FB0A5', // Clear Aqua-Green
    '#337B77', // Dark Cyan/Teal
    '#85D4CF', // Bright Aqua
    '#C8AD9B', // Neutral Tan/Beige
    '#E0B470', // Clear Gold/Ochre
    '#9A705A', // Mid-Tone Brown
    '#F4A97F', // Clear Peach/Orange
    '#EEDC82', // Light Yellow/Flax
    '#CC807A', // Standard Terra Cotta
    '#E8B4BC', // Soft Pink
    '#A5584E', // Dark Brick/Brown-Red
    '#A08CBF'  // Clearer Lavender/Violet
  ]
};

// Typography configuration from B3.8 Style Guide
export const CHART_TYPOGRAPHY = {
  fontFamily: {
    heading: "'Work Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "'IBM Plex Serif', Georgia, 'Times New Roman', Times, serif"
  },
  fontSize: {
    xs: 12,   // 0.75rem
    sm: 14,   // 0.875rem  
    base: 16, // 1rem
    lg: 18,   // 1.125rem
    xl: 20,   // 1.25rem
    '2xl': 24 // 1.5rem
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600
  }
};

// Default chart theme configuration
export const CHART_THEME = {
  // Background and grid
  backgroundColor: CHART_COLORS.surface,
  gridColor: `${CHART_COLORS.textSecondary}20`, // 20% opacity
  
  // Axis styling
  axisColor: CHART_COLORS.textSecondary,
  tickColor: CHART_COLORS.textSecondary,
  
  // Typography
  fontFamily: CHART_TYPOGRAPHY.fontFamily.body,
  fontSize: CHART_TYPOGRAPHY.fontSize.sm,
  fontWeight: CHART_TYPOGRAPHY.fontWeight.regular,
  
  // Text colors
  labelColor: CHART_COLORS.textSecondary,
  titleColor: CHART_COLORS.textPrimary,
  
  // Spacing (following 4px base unit from B3.8)
  margin: {
    top: 24,    // --spacing-6
    right: 24,  // --spacing-6
    bottom: 32, // --spacing-8
    left: 24    // --spacing-6
  },
  
  // Animation (subtle following B3.4 Zen principles)
  animationDuration: 250, // 0.25s - calm transitions
  animationEasing: 'ease-out'
};

// Specific chart configurations
export const PIE_CHART_CONFIG = {
  ...CHART_THEME,
  // Pie chart specific styling
  labelStyle: {
    fontFamily: CHART_TYPOGRAPHY.fontFamily.body,
    fontSize: CHART_TYPOGRAPHY.fontSize.xs,
    fontWeight: CHART_TYPOGRAPHY.fontWeight.medium,
    fill: CHART_COLORS.textPrimary
  },
  // Inner radius for donut style (more calm/zen)
  innerRadius: '40%',
  outerRadius: '80%',
  paddingAngle: 2 // Small separation between segments
};

export const BAR_CHART_CONFIG = {
  ...CHART_THEME,
  // Bar chart specific styling
  barCategoryGap: '20%', // Spacing between categories
  barGap: 4, // Spacing between bars in same category (4px base unit)
  radius: [4, 4, 0, 0] // Rounded top corners (following --border-radius-sm)
};

export const LINE_CHART_CONFIG = {
  ...CHART_THEME,
  // Line chart specific styling
  strokeWidth: 2,
  strokeDasharray: '0', // Solid lines
  activeDotRadius: 4,
  dotRadius: 3
};

export const AREA_CHART_CONFIG = {
  ...CHART_THEME,
  // Area chart specific styling
  fillOpacity: 0.1, // Very subtle fill (Zen aesthetic)
  strokeWidth: 2
};

// Utility functions for color assignment
export const getCategoryColor = (index) => {
  return CHART_COLORS.categorical[index % CHART_COLORS.categorical.length];
};

export const getSemanticColor = (type) => {
  switch (type) {
    case 'income':
    case 'positive':
      return CHART_COLORS.positive;
    case 'expense':
    case 'negative':
      return CHART_COLORS.negative;
    case 'budget':
    case 'target':
      return CHART_COLORS.primary;
    case 'actual':
    case 'current':
      return CHART_COLORS.secondary;
    default:
      return CHART_COLORS.information;
  }
};

// Common responsive breakpoints (from B3.8 Style Guide)
export const CHART_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
};

// Responsive chart dimensions
export const getChartDimensions = (containerWidth) => {
  if (containerWidth < CHART_BREAKPOINTS.sm) {
    // Mobile
    return {
      height: 200,
      margin: { top: 16, right: 16, bottom: 24, left: 16 }
    };
  } else if (containerWidth < CHART_BREAKPOINTS.md) {
    // Small tablet
    return {
      height: 250,
      margin: { top: 20, right: 20, bottom: 28, left: 20 }
    };
  } else {
    // Desktop
    return {
      height: 300,
      margin: CHART_THEME.margin
    };
  }
};

export default CHART_THEME;