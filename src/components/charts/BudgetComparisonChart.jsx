import { memo, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import ChartWrapper from './ChartWrapper';
import { CHART_COLORS, BAR_CHART_CONFIG, getSemanticColor } from './chartTheme';
import styles from './BudgetComparisonChart.module.css';

/**
 * Budget vs Actual Comparison Chart Component
 * 
 * Displays budget allocations vs actual spending by category
 * Uses color coding to indicate over/under budget status
 */
const BudgetComparisonChart = memo(({
  data = [],
  title = "Budget vs Dépenses Réelles",
  isLoading = false,
  error = null,
  height = 350,
  showGrid = true,
  showVariance = true,
  currency = 'CAD',
  layout = 'vertical' // 'vertical' or 'horizontal'
}) => {
  // Process and format data
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    // Additional safety check before mapping
    const dataArray = Array.isArray(data) ? data : [];
    
    return dataArray.map(item => {
      const budgeted = Math.abs(item.budgeted || item.budget || 0);
      const actual = Math.abs(item.actual || item.spent || 0);
      const variance = actual - budgeted;
      const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
      
      // Determine status
      let status = 'good';
      if (variancePercent > 10) status = 'over';
      else if (variancePercent > 5) status = 'warning';
      
      return {
        category: item.category || item.name || 'Catégorie',
        budgeted,
        actual,
        variance,
        variancePercent,
        status,
        // Formatted values for accessibility
        budgetedFormatted: new Intl.NumberFormat('fr-CA', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(budgeted),
        actualFormatted: new Intl.NumberFormat('fr-CA', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(actual),
        varianceFormatted: new Intl.NumberFormat('fr-CA', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(Math.abs(variance))
      };
    }).sort((a, b) => {
      // Sort by variance descending (most over budget first)
      return b.variancePercent - a.variancePercent;
    });
  }, [data, currency]);

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: value >= 1000 ? 0 : 2
    }).format(Math.abs(value));
  };

  // Format axis labels
  const formatAxis = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k$`;
    }
    return `${value}$`;
  };

  // Get bar color based on status
  const getBarColor = (status, type) => {
    if (type === 'budgeted') {
      return CHART_COLORS.information; // Neutral color for budget
    }
    
    switch (status) {
      case 'over':
        return CHART_COLORS.negative; // Over budget
      case 'warning':
        return '#D9A566'; // Warning color (amber)
      case 'good':
      default:
        return CHART_COLORS.positive; // Under or on budget
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipHeader}>
          <span className={styles.tooltipCategory}>{label}</span>
          <div className={`${styles.statusBadge} ${styles[data.status]}`}>
            {data.status === 'over' ? 'Dépassé' : 
             data.status === 'warning' ? 'Attention' : 'OK'}
          </div>
        </div>
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipRow}>
            <div className={styles.tooltipRowHeader}>
              <div 
                className={styles.tooltipIndicator}
                style={{ backgroundColor: getBarColor('', 'budgeted') }}
              />
              <span className={styles.tooltipLabel}>Budget:</span>
            </div>
            <span className={styles.tooltipValue}>
              {formatCurrency(data.budgeted)}
            </span>
          </div>
          <div className={styles.tooltipRow}>
            <div className={styles.tooltipRowHeader}>
              <div 
                className={styles.tooltipIndicator}
                style={{ backgroundColor: getBarColor(data.status, 'actual') }}
              />
              <span className={styles.tooltipLabel}>Dépensé:</span>
            </div>
            <span className={styles.tooltipValue}>
              {formatCurrency(data.actual)}
            </span>
          </div>
          {showVariance && (
            <div className={`${styles.tooltipRow} ${styles.tooltipVariance}`}>
              <span className={styles.tooltipLabel}>Écart:</span>
              <span 
                className={`${styles.tooltipValue} ${
                  data.variance >= 0 ? styles.negative : styles.positive
                }`}
              >
                {data.variance >= 0 ? '+' : ''}{formatCurrency(data.variance)}
                {data.budgeted > 0 && (
                  <span className={styles.tooltipPercent}>
                    ({data.variancePercent > 0 ? '+' : ''}{data.variancePercent.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom legend component
  const CustomLegend = (props) => {
    const { payload } = props;
    
    return (
      <div className={styles.legend}>
        {payload.map((entry, index) => (
          <div key={index} className={styles.legendItem}>
            <div 
              className={styles.legendIndicator}
              style={{ backgroundColor: entry.color }}
            />
            <span className={styles.legendText}>
              {entry.value === 'budgeted' ? 'Budget' : 'Dépensé'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Summary statistics
  const summary = useMemo(() => {
    const totalBudgeted = chartData.reduce((sum, item) => sum + item.budgeted, 0);
    const totalActual = chartData.reduce((sum, item) => sum + item.actual, 0);
    const overBudgetCount = chartData.filter(item => item.status === 'over').length;
    
    return {
      totalBudgeted,
      totalActual,
      totalVariance: totalActual - totalBudgeted,
      overBudgetCount,
      totalCategories: chartData.length
    };
  }, [chartData]);

  // Empty state
  if (!isLoading && (!chartData || chartData.length === 0)) {
    return (
      <ChartWrapper title={title} className={styles.chartContainer}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Aucune comparaison à afficher</p>
          <span className={styles.emptySubtext}>
            Définissez des budgets pour voir la comparaison
          </span>
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper 
      title={title}
      isLoading={isLoading}
      error={error}
      height={height}
      className={styles.chartContainer}
    >
      <div className={styles.chartWithSummary}>
        {/* Summary stats */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Budget:</span>
            <span className={styles.summaryValue}>
              {formatCurrency(summary.totalBudgeted)}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Dépensé:</span>
            <span 
              className={`${styles.summaryValue} ${
                summary.totalVariance >= 0 ? styles.negative : styles.positive
              }`}
            >
              {formatCurrency(summary.totalActual)}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Catégories dépassées:</span>
            <span className={styles.summaryValue}>
              {summary.overBudgetCount}/{summary.totalCategories}
            </span>
          </div>
        </div>

        {/* Chart */}
        <BarChart
          data={chartData}
          layout={layout}
          margin={BAR_CHART_CONFIG.margin}
          barCategoryGap={BAR_CHART_CONFIG.barCategoryGap}
          barGap={BAR_CHART_CONFIG.barGap}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={CHART_COLORS.textSecondary}
              opacity={0.2}
              horizontal={layout === 'vertical'}
              vertical={layout === 'horizontal'}
            />
          )}
          
          <XAxis 
            type={layout === 'vertical' ? 'category' : 'number'}
            dataKey={layout === 'vertical' ? 'category' : undefined}
            tickFormatter={layout === 'horizontal' ? formatAxis : undefined}
            tick={{ 
              fontSize: 12, 
              fill: CHART_COLORS.textSecondary,
              fontFamily: "'IBM Plex Serif', serif"
            }}
            tickLine={{ stroke: CHART_COLORS.textSecondary, strokeWidth: 1 }}
            axisLine={{ stroke: CHART_COLORS.textSecondary, strokeWidth: 1 }}
            interval={0}
            angle={layout === 'vertical' ? -45 : 0}
            textAnchor={layout === 'vertical' ? 'end' : 'middle'}
            height={layout === 'vertical' ? 60 : undefined}
          />
          
          <YAxis 
            type={layout === 'vertical' ? 'number' : 'category'}
            dataKey={layout === 'horizontal' ? 'category' : undefined}
            tickFormatter={layout === 'vertical' ? formatAxis : undefined}
            tick={{ 
              fontSize: 12, 
              fill: CHART_COLORS.textSecondary,
              fontFamily: "'IBM Plex Serif', serif"
            }}
            tickLine={{ stroke: CHART_COLORS.textSecondary, strokeWidth: 1 }}
            axisLine={{ stroke: CHART_COLORS.textSecondary, strokeWidth: 1 }}
            width={layout === 'horizontal' ? 120 : undefined}
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ 
              fill: CHART_COLORS.highlight, 
              opacity: 0.3 
            }}
            wrapperStyle={{ outline: 'none' }}
          />
          
          <Legend 
            content={<CustomLegend />}
            wrapperStyle={{ paddingTop: '16px' }}
          />
          
          <Bar
            dataKey="budgeted"
            name="budgeted"
            fill={getBarColor('', 'budgeted')}
            radius={layout === 'vertical' ? BAR_CHART_CONFIG.radius : [0, 4, 4, 0]}
            animationDuration={BAR_CHART_CONFIG.animationDuration}
            animationEasing={BAR_CHART_CONFIG.animationEasing}
          />
          
          <Bar
            dataKey="actual"
            name="actual"
            radius={layout === 'vertical' ? BAR_CHART_CONFIG.radius : [0, 4, 4, 0]}
            animationDuration={BAR_CHART_CONFIG.animationDuration}
            animationEasing={BAR_CHART_CONFIG.animationEasing}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.status, 'actual')}
              />
            ))}
          </Bar>
        </BarChart>
      </div>
    </ChartWrapper>
  );
});

BudgetComparisonChart.displayName = 'BudgetComparisonChart';

export default BudgetComparisonChart;