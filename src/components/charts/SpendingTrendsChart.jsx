import { memo, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Dot
} from 'recharts';
import ChartWrapper from './ChartWrapper';
import { CHART_COLORS, LINE_CHART_CONFIG } from './chartTheme';
import styles from './SpendingTrendsChart.module.css';

/**
 * Spending Trends Line Chart Component
 * 
 * Displays spending trends over time with smooth line visualization
 * Includes trend indicators and average spending reference line
 */
const SpendingTrendsChart = memo(({
  data = [],
  title = "Tendances des Dépenses",
  isLoading = false,
  error = null,
  height = 300,
  showGrid = true,
  showAverage = true,
  showTrend = true,
  currency = 'CAD',
  timeFormat = 'day' // 'day', 'week', 'month'
}) => {
  // Process and format data
  const { chartData, averageSpending, trendDirection } = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return { chartData: [], averageSpending: 0, trendDirection: 'neutral' };
    
    const processedData = data.map((item, index) => ({
      period: item.period || item.date || `Période ${index + 1}`,
      amount: Math.abs(item.amount || item.spending || 0),
      target: item.target || item.budget || null,
      // Format for accessibility
      amountFormatted: new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.abs(item.amount || item.spending || 0))
    }));

    // Calculate average spending
    const totalSpending = processedData.reduce((sum, item) => sum + item.amount, 0);
    const avgSpending = processedData.length > 0 ? totalSpending / processedData.length : 0;

    // Calculate trend direction (simple linear trend)
    let trend = 'neutral';
    if (processedData.length >= 2) {
      const firstHalf = processedData.slice(0, Math.floor(processedData.length / 2));
      const secondHalf = processedData.slice(Math.floor(processedData.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, item) => sum + item.amount, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, item) => sum + item.amount, 0) / secondHalf.length;
      
      const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      if (changePercent > 5) trend = 'increasing';
      else if (changePercent < -5) trend = 'decreasing';
    }

    return {
      chartData: processedData,
      averageSpending: avgSpending,
      trendDirection: trend
    };
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
            <span className={styles.tooltipLabel}>Dépenses:</span>
            <span className={styles.tooltipValue}>
              {formatCurrency(data.amount)}
            </span>
          </div>
          {data.target && (
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Budget:</span>
              <span className={styles.tooltipValue}>
                {formatCurrency(data.target)}
              </span>
            </div>
          )}
          {showAverage && (
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>Moyenne:</span>
              <span className={styles.tooltipValue}>
                {formatCurrency(averageSpending)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom dot for data points
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    
    // Highlight dots that are significantly above or below average
    const isOutlier = showAverage && Math.abs(payload.amount - averageSpending) > averageSpending * 0.3;
    
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={isOutlier ? 5 : 3}
        fill={isOutlier ? CHART_COLORS.secondary : CHART_COLORS.primary}
        stroke={CHART_COLORS.surface}
        strokeWidth={2}
      />
    );
  };

  // Trend indicator component
  const TrendIndicator = () => {
    if (!showTrend || trendDirection === 'neutral') return null;
    
    return (
      <div className={styles.trendIndicator}>
        <div className={`${styles.trendIcon} ${styles[trendDirection]}`}>
          {trendDirection === 'increasing' ? '↗' : '↙'}
        </div>
        <span className={`${styles.trendText} ${styles[trendDirection]}`}>
          Tendance {trendDirection === 'increasing' ? 'à la hausse' : 'à la baisse'}
        </span>
      </div>
    );
  };

  // Empty state
  if (!isLoading && (!chartData || chartData.length === 0)) {
    return (
      <ChartWrapper title={title} className={styles.chartContainer}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Aucune tendance à afficher</p>
          <span className={styles.emptySubtext}>
            Les tendances apparaîtront ici avec plus de données
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
      <div className={styles.chartWithIndicators}>
        {showTrend && <TrendIndicator />}
        
        <LineChart
          data={chartData}
          margin={LINE_CHART_CONFIG.margin}
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
              stroke: CHART_COLORS.primary, 
              strokeWidth: 1,
              strokeDasharray: "3 3"
            }}
            wrapperStyle={{ outline: 'none' }}
          />
          
          {/* Average spending reference line */}
          {showAverage && averageSpending > 0 && (
            <ReferenceLine 
              y={averageSpending} 
              stroke={CHART_COLORS.information}
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{ 
                value: "Moyenne", 
                position: "topRight",
                style: { 
                  fontSize: 12, 
                  fill: CHART_COLORS.textSecondary,
                  fontFamily: "'IBM Plex Serif', serif"
                }
              }}
            />
          )}
          
          {/* Main spending line */}
          <Line
            type="monotone"
            dataKey="amount"
            stroke={CHART_COLORS.primary}
            strokeWidth={LINE_CHART_CONFIG.strokeWidth}
            dot={<CustomDot />}
            activeDot={{ 
              r: LINE_CHART_CONFIG.activeDotRadius,
              fill: CHART_COLORS.secondary,
              stroke: CHART_COLORS.surface,
              strokeWidth: 2
            }}
            animationDuration={LINE_CHART_CONFIG.animationDuration}
            animationEasing={LINE_CHART_CONFIG.animationEasing}
          />
          
          {/* Budget target line (if available) */}
          {chartData.some(item => item.target) && (
            <Line
              type="monotone"
              dataKey="target"
              stroke={CHART_COLORS.information}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
              animationDuration={LINE_CHART_CONFIG.animationDuration}
            />
          )}
        </LineChart>
      </div>
    </ChartWrapper>
  );
});

SpendingTrendsChart.displayName = 'SpendingTrendsChart';

export default SpendingTrendsChart;