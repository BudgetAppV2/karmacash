import { memo, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import ChartWrapper from './ChartWrapper';
import { CHART_COLORS, BAR_CHART_CONFIG, getSemanticColor } from './chartTheme';
import styles from './IncomeExpenseChart.module.css';

/**
 * Income vs Expense Bar Chart Component
 * 
 * Displays monthly or weekly income vs expense comparison
 * Uses semantic colors from B3.8 Style Guide (positive/negative)
 */
const IncomeExpenseChart = memo(({
  data = [],
  title = "Revenus vs Dépenses",
  isLoading = false,
  error = null,
  height = 300,
  showGrid = true,
  timeFormat = 'month', // 'month' or 'week'
  currency = 'CAD'
}) => {
  // Process and format data
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    return data.map(item => ({
      period: item.period || item.name || 'Période',
      income: Math.abs(item.income || 0),
      expenses: Math.abs(item.expenses || 0),
      net: (item.income || 0) - Math.abs(item.expenses || 0),
      // Add formatted labels for accessibility
      incomeFormatted: new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.abs(item.income || 0)),
      expensesFormatted: new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.abs(item.expenses || 0))
    }));
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

  // Format Y-axis labels
  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k$`;
    }
    return `${value}$`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipHeader}>
          <span className={styles.tooltipPeriod}>{label}</span>
        </div>
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipRow}>
            <div className={styles.tooltipRowHeader}>
              <div 
                className={styles.tooltipIndicator}
                style={{ backgroundColor: getSemanticColor('income') }}
              />
              <span className={styles.tooltipLabel}>Revenus:</span>
            </div>
            <span className={styles.tooltipValue}>
              {formatCurrency(data.income)}
            </span>
          </div>
          <div className={styles.tooltipRow}>
            <div className={styles.tooltipRowHeader}>
              <div 
                className={styles.tooltipIndicator}
                style={{ backgroundColor: getSemanticColor('expense') }}
              />
              <span className={styles.tooltipLabel}>Dépenses:</span>
            </div>
            <span className={styles.tooltipValue}>
              {formatCurrency(data.expenses)}
            </span>
          </div>
          <div className={`${styles.tooltipRow} ${styles.tooltipRowNet}`}>
            <span className={styles.tooltipLabel}>Net:</span>
            <span 
              className={`${styles.tooltipValue} ${
                data.net >= 0 ? styles.positive : styles.negative
              }`}
            >
              {data.net >= 0 ? '+' : ''}{formatCurrency(data.net)}
            </span>
          </div>
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
              {entry.value === 'income' ? 'Revenus' : 'Dépenses'}
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
          <p className={styles.emptyText}>Aucune donnée à afficher</p>
          <span className={styles.emptySubtext}>
            Les données apparaîtront ici une fois des transactions ajoutées
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
      <BarChart
        data={chartData}
        margin={BAR_CHART_CONFIG.margin}
        barCategoryGap={BAR_CHART_CONFIG.barCategoryGap}
        barGap={BAR_CHART_CONFIG.barGap}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={CHART_COLORS.textSecondary}
            opacity={0.2}
            vertical={false}
          />
        )}
        
        <XAxis 
          dataKey="period"
          tick={{ 
            fontSize: 12, 
            fill: CHART_COLORS.textSecondary,
            fontFamily: "'IBM Plex Serif', serif"
          }}
          tickLine={{ stroke: CHART_COLORS.textSecondary, strokeWidth: 1 }}
          axisLine={{ stroke: CHART_COLORS.textSecondary, strokeWidth: 1 }}
        />
        
        <YAxis 
          tickFormatter={formatYAxis}
          tick={{ 
            fontSize: 12, 
            fill: CHART_COLORS.textSecondary,
            fontFamily: "'IBM Plex Serif', serif"
          }}
          tickLine={{ stroke: CHART_COLORS.textSecondary, strokeWidth: 1 }}
          axisLine={{ stroke: CHART_COLORS.textSecondary, strokeWidth: 1 }}
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
          dataKey="income"
          name="income"
          fill={getSemanticColor('income')}
          radius={BAR_CHART_CONFIG.radius}
          animationDuration={BAR_CHART_CONFIG.animationDuration}
          animationEasing={BAR_CHART_CONFIG.animationEasing}
        />
        
        <Bar
          dataKey="expenses"
          name="expenses"
          fill={getSemanticColor('expense')}
          radius={BAR_CHART_CONFIG.radius}
          animationDuration={BAR_CHART_CONFIG.animationDuration}
          animationEasing={BAR_CHART_CONFIG.animationEasing}
        />
      </BarChart>
    </ChartWrapper>
  );
});

IncomeExpenseChart.displayName = 'IncomeExpenseChart';

export default IncomeExpenseChart;