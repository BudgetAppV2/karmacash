import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ExpenseDistributionChart from '../../components/charts/ExpenseDistributionChart';
import IncomeExpenseChart from '../../components/charts/IncomeExpenseChart';
import SpendingTrendsChart from '../../components/charts/SpendingTrendsChart';
import BudgetComparisonChart from '../../components/charts/BudgetComparisonChart';
import { 
  useExpenseDistribution, 
  useIncomeExpense, 
  useSpendingTrends, 
  useBudgetComparison 
} from '../../hooks/useChartData';
import styles from './GraphsPage.module.css';

/**
 * GraphsPage Component
 * 
 * Main analytics dashboard displaying 4 chart types:
 * - Expense Distribution (Pie Chart)
 * - Income vs Expense (Bar Chart)  
 * - Spending Trends (Line Chart)
 * - Budget vs Actual (Comparison Chart)
 * 
 * Follows KarmaCash Zen aesthetic and responsive design principles
 */
function GraphsPage() {
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'quarter'

  // Use the optimized chart data hooks with real-time updates and error recovery
  const expenseDistribution = useExpenseDistribution({ 
    timeRange, 
    realTime: true,
    onError: (error) => console.warn('Expense distribution error:', error)
  });

  const incomeExpense = useIncomeExpense({ 
    timeRange, 
    realTime: true,
    onError: (error) => console.warn('Income expense error:', error)
  });

  const spendingTrends = useSpendingTrends({ 
    timeRange, 
    realTime: true,
    showTarget: true,
    onError: (error) => console.warn('Spending trends error:', error)
  });

  const budgetComparison = useBudgetComparison({ 
    timeRange, 
    realTime: true,
    onError: (error) => console.warn('Budget comparison error:', error)
  });

  // Determine overall loading state
  const isLoading = expenseDistribution.isLoading || 
                   incomeExpense.isLoading || 
                   spendingTrends.isLoading || 
                   budgetComparison.isLoading;

  // Determine if any data is stale (from cache/fallback)
  const isStale = expenseDistribution.isStale || 
                  incomeExpense.isStale || 
                  spendingTrends.isStale || 
                  budgetComparison.isStale;

  // Collect any errors
  const errors = [
    expenseDistribution.error,
    incomeExpense.error,
    spendingTrends.error,
    budgetComparison.error
  ].filter(Boolean);

  const hasErrors = errors.length > 0;

  // Optimized animation variants - memoized to prevent recreation
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // Slightly faster for better perceived performance
        delayChildren: 0.1 // Reduced delay
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { y: 15, opacity: 0 }, // Reduced distance for subtler effect
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400, // Increased for snappier feel
        damping: 30 // Adjusted for better spring behavior
      }
    }
  }), []);
  
  // Optimized time range handler - useCallback to prevent recreations
  const handleTimeRangeChange = useCallback((newRange) => {
    if (newRange !== timeRange) {
      setTimeRange(newRange);
    }
  }, [timeRange]);

  return (
    <motion.div 
      className={styles.graphsPage}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.header className={styles.pageHeader} variants={itemVariants}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Graphiques</h1>
          <p className={styles.pageDescription}>
            Visualisations de vos données financières et tendances
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className={styles.timeSelector} role="group" aria-labelledby="time-selector-label">
          <span id="time-selector-label" className={styles.timeSelectorLabel}>
            Période:
          </span>
          <div className={styles.timeOptions} role="tablist" aria-label="Sélection de période">
            {[
              { key: 'week', label: 'Semaine' },
              { key: 'month', label: 'Mois' },
              { key: 'quarter', label: 'Trimestre' }
            ].map(option => (
              <button
                key={option.key}
                role="tab"
                aria-selected={timeRange === option.key}
                aria-controls={`chart-content-${option.key}`}
                className={`${styles.timeOption} ${
                  timeRange === option.key ? styles.timeOptionActive : ''
                }`}
                onClick={() => handleTimeRangeChange(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* Charts Grid */}
      <main 
        className={styles.chartsGrid} 
        id={`chart-content-${timeRange}`}
        role="tabpanel"
        aria-labelledby="time-selector-label"
      >
        {/* Row 1: Expense Distribution & Income vs Expense */}
        <motion.section className={styles.chartRow} variants={itemVariants}>
          <div className={styles.chartColumn}>
            <ExpenseDistributionChart
              data={Array.isArray(expenseDistribution.data) ? expenseDistribution.data : []}
              title="Répartition des Dépenses"
              isLoading={expenseDistribution.isLoading}
              error={expenseDistribution.error}
              height={350}
              aria-label="Graphique circulaire montrant la répartition des dépenses par catégorie"
            />
            {expenseDistribution.isStale && (
              <div className={styles.staleIndicator}>
                Données en cache - {expenseDistribution.source}
              </div>
            )}
          </div>
          <div className={styles.chartColumn}>
            <IncomeExpenseChart
              data={Array.isArray(incomeExpense.data) ? incomeExpense.data : []}
              title="Revenus vs Dépenses"
              isLoading={incomeExpense.isLoading}
              error={incomeExpense.error}
              height={350}
              timeFormat={timeRange}
              aria-label="Graphique en barres comparant revenus et dépenses par période"
            />
            {incomeExpense.isStale && (
              <div className={styles.staleIndicator}>
                Données en cache - {incomeExpense.source}
              </div>
            )}
          </div>
        </motion.section>

        {/* Row 2: Spending Trends - Full Width */}
        <motion.section className={styles.chartRow} variants={itemVariants}>
          <div className={styles.chartColumnFull}>
            <SpendingTrendsChart
              data={Array.isArray(spendingTrends.data) ? spendingTrends.data : []}
              title="Tendances des Dépenses"
              isLoading={spendingTrends.isLoading}
              error={spendingTrends.error}
              height={300}
              timeFormat="day"
              showAverage={true}
              showTrend={true}
              aria-label="Graphique linéaire montrant l'évolution des dépenses dans le temps"
            />
            {spendingTrends.isStale && (
              <div className={styles.staleIndicator}>
                Données en cache - {spendingTrends.source}
              </div>
            )}
          </div>
        </motion.section>

        {/* Row 3: Budget Comparison - Full Width */}
        <motion.section className={styles.chartRow} variants={itemVariants}>
          <div className={styles.chartColumnFull}>
            <BudgetComparisonChart
              data={Array.isArray(budgetComparison.data) ? budgetComparison.data : []}
              title="Budget vs Dépenses Réelles"
              isLoading={budgetComparison.isLoading}
              error={budgetComparison.error}
              height={400}
              layout="vertical"
              showVariance={true}
              aria-label="Graphique en barres comparant budget prévu et dépenses réelles par catégorie"
            />
            {budgetComparison.isStale && (
              <div className={styles.staleIndicator}>
                Données en cache - {budgetComparison.source}
              </div>
            )}
          </div>
        </motion.section>
      </main>

      {/* Empty State for no data */}
      {!isLoading && !hasErrors && 
       (!expenseDistribution.data?.length && !incomeExpense.data?.length && 
        !spendingTrends.data?.length && !budgetComparison.data?.length) && (
        <motion.section 
          className={styles.emptyState} 
          variants={itemVariants}
          role="region"
          aria-label="État vide - aucune donnée disponible"
        >
          <h2 className={styles.emptyTitle}>Aucune donnée disponible</h2>
          <p className={styles.emptyDescription}>
            Commencez à ajouter des transactions pour voir vos graphiques financiers.
          </p>
          <button 
            className={styles.emptyAction}
            type="button"
            aria-label="Ajouter une nouvelle transaction pour commencer à voir les graphiques"
            onClick={() => {
              // Force refresh all data
              expenseDistribution.forceRefresh();
              incomeExpense.forceRefresh();
              spendingTrends.forceRefresh();
              budgetComparison.forceRefresh();
            }}
          >
            Actualiser les Données
          </button>
        </motion.section>
      )}

      {/* Error State */}
      {hasErrors && !isLoading && (
        <motion.section 
          className={styles.errorState} 
          variants={itemVariants}
          role="alert"
          aria-label="Erreurs de chargement des données"
        >
          <h2 className={styles.errorTitle}>Erreur de chargement</h2>
          <p className={styles.errorDescription}>
            Certaines données n'ont pas pu être chargées. Vérifiez votre connexion.
          </p>
          <button 
            className={styles.errorAction}
            type="button"
            onClick={() => {
              // Retry all failed data
              if (expenseDistribution.error) expenseDistribution.refresh();
              if (incomeExpense.error) incomeExpense.refresh();
              if (spendingTrends.error) spendingTrends.refresh();
              if (budgetComparison.error) budgetComparison.refresh();
            }}
          >
            Réessayer
          </button>
        </motion.section>
      )}

      {/* Stale Data Global Indicator */}
      {isStale && (
        <motion.div 
          className={styles.staleGlobalIndicator}
          variants={itemVariants}
          role="status"
          aria-label="Certaines données sont en cache"
        >
          <span>⚠️ Données en cache affichées - Connexion limitée</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default GraphsPage;