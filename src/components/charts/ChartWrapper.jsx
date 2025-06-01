import { memo, useMemo } from 'react';
import { ResponsiveContainer } from 'recharts';
import { CHART_THEME, getChartDimensions } from './chartTheme';
import styles from './ChartWrapper.module.css';

/**
 * ChartWrapper Component
 * 
 * Provides consistent styling and responsive behavior for all charts
 * following KarmaCash Zen aesthetic (B3.4) and Style Guide (B3.8)
 */
const ChartWrapper = memo(({
  title,
  children,
  height = 300,
  className = '',
  isLoading = false,
  error = null,
  emptyMessage = 'Aucune donnée disponible',
  'aria-label': ariaLabel,
  ...restProps
}) => {
  // Optimize container styles to prevent recalculation - define at top
  const containerClasses = useMemo(() => 
    `${styles.chartContainer} ${className}`, [className]);

  if (error) {
    return (
      <div 
        className={containerClasses} 
        role="region"
        aria-label={ariaLabel || `Graphique: ${title}`}
        {...restProps}
      >
        {title && <h3 className={styles.chartTitle}>{title}</h3>}
        <div className={styles.errorState} role="alert" aria-live="polite">
          <p className={styles.errorText}>
            Erreur lors du chargement des données
          </p>
          <span className={styles.errorDetails}>{error}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className={containerClasses}
        role="region"
        aria-label={ariaLabel || `Graphique: ${title}`}
        {...restProps}
      >
        {title && <h3 className={styles.chartTitle}>{title}</h3>}
        <div 
          className={styles.loadingState} 
          style={{ height }}
          role="status"
          aria-live="polite"
          aria-label="Chargement des données du graphique en cours"
        >
          <div className={styles.loadingSpinner} aria-hidden="true" />
          <p className={styles.loadingText}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={containerClasses}
      role="region"
      aria-label={ariaLabel || `Graphique: ${title}`}
      {...restProps}
    >
      {title && <h3 className={styles.chartTitle} id={`chart-title-${title?.replace(/\s+/g, '-').toLowerCase()}`}>{title}</h3>}
      <div 
        className={styles.chartContent}
        role="img"
        aria-labelledby={title ? `chart-title-${title?.replace(/\s+/g, '-').toLowerCase()}` : undefined}
        aria-describedby={ariaLabel ? undefined : `chart-title-${title?.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <ResponsiveContainer 
          width="100%" 
          height={height}
          debounce={200} // Add debounce for resize events
        >
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
});

ChartWrapper.displayName = 'ChartWrapper';

export default ChartWrapper;