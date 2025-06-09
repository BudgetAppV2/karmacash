import React, { memo, ReactNode, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Type definitions for comprehensive prop validation
interface SafeCardProps {
  /** Main content to display in the card */
  children: ReactNode;
  /** Optional header content */
  header?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Card variant for different visual styles */
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the card is interactive (clickable) */
  interactive?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Accessibility label */
  'aria-label'?: string;
  /** Accessibility description */
  'aria-describedby'?: string;
  /** Role for screen readers */
  role?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// Animation variants for smooth interactions
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -2, transition: { duration: 0.2 } },
  tap: { scale: 0.98, transition: { duration: 0.1 } }
};

// Error boundary wrapper component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SafeCardErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SafeCard Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div 
          className="safe-card safe-card--error"
          role="alert"
          aria-label="Card error"
        >
          <p>Something went wrong loading this card.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * SafeCard Component
 * 
 * A secure, accessible, and performant card component for KarmaCash.
 * Implements comprehensive security measures, WCAG 2.1 compliance,
 * and performance optimizations.
 */
const SafeCard = memo<SafeCardProps>(({
  children,
  header,
  footer,
  variant = 'default',
  size = 'md',
  interactive = false,
  onClick,
  loading = false,
  error = false,
  errorMessage,
  disabled = false,
  className = '',
  style,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role,
  'data-testid': testId = 'safe-card',
  ...restProps
}) => {
  // Input validation and sanitization
  const sanitizedClassName = useMemo(() => {
    // Remove potentially dangerous characters from className
    return className.replace(/[<>'"&]/g, '');
  }, [className]);

  const sanitizedErrorMessage = useMemo(() => {
    // Sanitize error message to prevent XSS
    if (!errorMessage) return undefined;
    return errorMessage.replace(/[<>'"&]/g, '');
  }, [errorMessage]);

  // Performance optimized click handler
  const handleClick = useCallback(() => {
    if (disabled || loading || error) return;
    onClick?.();
  }, [disabled, loading, error, onClick]);

  // Keyboard interaction handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!interactive || disabled || loading || error) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [interactive, disabled, loading, error, handleClick]);

  // Memoized CSS classes for performance
  const cardClasses = useMemo(() => {
    const baseClasses = [
      'safe-card',
      `safe-card--${variant}`,
      `safe-card--${size}`,
    ];

    if (interactive) baseClasses.push('safe-card--interactive');
    if (loading) baseClasses.push('safe-card--loading');
    if (error) baseClasses.push('safe-card--error');
    if (disabled) baseClasses.push('safe-card--disabled');
    if (sanitizedClassName) baseClasses.push(sanitizedClassName);

    return baseClasses.join(' ');
  }, [variant, size, interactive, loading, error, disabled, sanitizedClassName]);

  // Accessibility props
  const accessibilityProps = useMemo(() => {
    const props: Record<string, any> = {
      'data-testid': testId,
    };

    if (ariaLabel) props['aria-label'] = ariaLabel;
    if (ariaDescribedBy) props['aria-describedby'] = ariaDescribedBy;
    
    if (interactive) {
      props.role = role || 'button';
      props.tabIndex = disabled ? -1 : 0;
      props['aria-disabled'] = disabled;
    } else {
      props.role = role || 'article';
    }

    if (loading) {
      props['aria-busy'] = true;
      props['aria-live'] = 'polite';
    }

    if (error) {
      props['aria-invalid'] = true;
      if (sanitizedErrorMessage) {
        props['aria-describedby'] = `${testId}-error`;
      }
    }

    return props;
  }, [
    testId,
    ariaLabel,
    ariaDescribedBy,
    interactive,
    role,
    disabled,
    loading,
    error,
    sanitizedErrorMessage
  ]);

  // Loading spinner component
  const LoadingSpinner = memo(() => (
    <div className="safe-card__loading-spinner" aria-hidden="true">
      <div className="safe-card__spinner"></div>
    </div>
  ));

  // Error display component
  const ErrorDisplay = memo(() => (
    <div 
      className="safe-card__error-display"
      id={`${testId}-error`}
      role="alert"
    >
      <span className="safe-card__error-icon" aria-hidden="true">⚠️</span>
      <span className="safe-card__error-text">
        {sanitizedErrorMessage || 'An error occurred'}
      </span>
    </div>
  ));

  return (
    <SafeCardErrorBoundary>
      <motion.div
        className={cardClasses}
        style={style}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={interactive && !disabled ? "hover" : undefined}
        whileTap={interactive && !disabled ? "tap" : undefined}
        onClick={interactive ? handleClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        {...accessibilityProps}
        {...restProps}
      >
        {/* Header Section */}
        <AnimatePresence>
          {header && (
            <motion.div
              className="safe-card__header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {header}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Section */}
        <div className="safe-card__content">
          {loading && <LoadingSpinner />}
          {error && <ErrorDisplay />}
          {!loading && !error && children}
        </div>

        {/* Footer Section */}
        <AnimatePresence>
          {footer && !loading && !error && (
            <motion.div
              className="safe-card__footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {footer}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Focus indicator for accessibility */}
        {interactive && (
          <div className="safe-card__focus-indicator" aria-hidden="true" />
        )}
      </motion.div>
    </SafeCardErrorBoundary>
  );
});

// Display name for debugging
SafeCard.displayName = 'SafeCard';

export default SafeCard;
export type { SafeCardProps };