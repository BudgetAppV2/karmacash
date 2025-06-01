import { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import ChartWrapper from './ChartWrapper';
import { CHART_COLORS, PIE_CHART_CONFIG, getCategoryColor } from './chartTheme';
import styles from './ExpenseDistributionChart.module.css';

/**
 * Expense Distribution Pie Chart Component
 * 
 * Displays expense distribution by category following KarmaCash Zen aesthetic
 * Uses categorical color palette from B3.8 Style Guide
 */
const ExpenseDistributionChart = memo(({
  data = [],
  title = "Répartition des Dépenses",
  isLoading = false,
  error = null,
  height = 350,
  showLegend = true,
  showPercentage = true
}) => {
  // Process and format data
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    // Calculate total for percentage calculations
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    
    return data.map((item, index) => ({
      name: item.name || item.category || 'Sans catégorie',
      value: item.value || 0,
      percentage: total > 0 ? ((item.value || 0) / total * 100).toFixed(1) : 0,
      color: item.color || getCategoryColor(index),
      count: item.count || 0
    })).filter(item => item.value > 0);
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipHeader}>
          <div 
            className={styles.tooltipColorIndicator}
            style={{ backgroundColor: data.color }}
          />
          <span className={styles.tooltipCategory}>{data.name}</span>
        </div>
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Montant:</span>
            <span className={styles.tooltipValue}>
              {new Intl.NumberFormat('fr-CA', {
                style: 'currency',
                currency: 'CAD'
              }).format(data.value)}
            </span>
          </div>
          {showPercentage && (
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Pourcentage:</span>
              <span className={styles.tooltipValue}>{data.percentage}%</span>
            </div>
          )}
          {data.count > 0 && (
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Transactions:</span>
              <span className={styles.tooltipValue}>{data.count}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom label function for pie slices
  const renderLabel = ({ percentage, name }) => {
    // Only show label if percentage is significant enough (> 5%)
    if (parseFloat(percentage) < 5) return '';
    return `${percentage}%`;
  };

  // Custom legend component
  const CustomLegend = (props) => {
    const { payload } = props;
    
    return (
      <div className={styles.legend}>
        {payload.map((entry, index) => (
          <div key={index} className={styles.legendItem}>
            <div 
              className={styles.legendColor}
              style={{ backgroundColor: entry.color }}
            />
            <span className={styles.legendText}>
              {entry.value}
            </span>
            <span className={styles.legendAmount}>
              {new Intl.NumberFormat('fr-CA', {
                style: 'currency',
                currency: 'CAD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(entry.payload.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Empty state
  if (!isLoading && (!chartData || chartData.length === 0)) {
    return (
      <ChartWrapper title={title} className={styles.chartContainer}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Aucune dépense à afficher</p>
          <span className={styles.emptySubtext}>
            Les dépenses apparaîtront ici une fois des transactions ajoutées
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
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showPercentage ? renderLabel : false}
          outerRadius={PIE_CHART_CONFIG.outerRadius}
          innerRadius={PIE_CHART_CONFIG.innerRadius}
          paddingAngle={PIE_CHART_CONFIG.paddingAngle}
          dataKey="value"
          animationDuration={PIE_CHART_CONFIG.animationDuration}
          animationEasing={PIE_CHART_CONFIG.animationEasing}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color}
              stroke={CHART_COLORS.surface}
              strokeWidth={2}
            />
          ))}
        </Pie>
        
        <Tooltip 
          content={<CustomTooltip />}
          cursor={false}
          wrapperStyle={{ outline: 'none' }}
        />
        
        {showLegend && (
          <Legend 
            content={<CustomLegend />}
            verticalAlign="bottom"
            height={36}
          />
        )}
      </PieChart>
    </ChartWrapper>
  );
});

ExpenseDistributionChart.displayName = 'ExpenseDistributionChart';

export default ExpenseDistributionChart;