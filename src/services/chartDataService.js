/**
 * Chart Data Service
 * 
 * Centralized service for fetching, processing, and caching chart data
 * Optimized for large datasets and real-time updates
 */

import { 
  collection, 
  doc,
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  startAfter,
  limit as firestoreLimit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase/firebaseInit';
import { startOfWeek, startOfMonth, startOfQuarter, endOfWeek, endOfMonth, endOfQuarter, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cached queries

class ChartDataService {
  constructor() {
    this.cache = new Map();
    this.subscriptions = new Map();
    this.aggregationCache = new Map();
    this.retryCount = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Get chart data with caching and real-time updates
   * @param {string} userId - User ID
   * @param {string} chartType - Type of chart (expense_distribution, income_expense, etc.)
   * @param {Object} options - Query options (timeRange, filters, etc.)
   * @param {Function} onUpdate - Callback for real-time updates
   * @returns {Promise<Object>} Chart data
   */
  async getChartData(userId, chartType, options = {}, onUpdate = null) {
    const cacheKey = this._generateCacheKey(userId, chartType, options);
    
    // Check cache first - only use if not stale
    const cacheResult = this._getCachedDataWithMetadata(cacheKey);
    if (cacheResult && !cacheResult.isStale && !onUpdate) {
      return {
        data: cacheResult.data,
        source: 'cache',
        stale: false,
        degraded: false
      };
    }

    try {
      // Set up real-time listener if callback provided
      if (onUpdate) {
        return this._setupRealTimeListener(userId, chartType, options, onUpdate, cacheKey);
      }

      // Fetch data with retry mechanism
      const data = await this._fetchWithRetry(userId, chartType, options);
      
      // Cache the processed data
      this._setCachedData(cacheKey, data);
      
      // Return in the expected format for useChartData hook
      return {
        data,
        source: 'primary',
        stale: false,
        degraded: false
      };
    } catch (error) {
      console.error(`chartDataService error for ${chartType}:`, error.message);
      throw new Error(`Failed to fetch ${chartType} data: ${error.message}`);
    }
  }

  /**
   * Fetch expense distribution data
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Expense distribution data
   */
  async fetchExpenseDistribution(userId, options = {}) {
    const { timeRange = 'month', limit = 100, budgetId } = options;
    
    if (!budgetId) {
      throw new Error('Budget ID is required for fetching expense distribution');
    }
    
    const { startDate, endDate } = this._getDateRange(timeRange);

    // Query transactions from budget subcollection
    const transactionsQuery = query(
      collection(db, `budgets/${budgetId}/transactions`),
      where('type', '==', 'expense'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(transactionsQuery);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));

    // Get categories from budget subcollection
    const categoriesQuery = query(
      collection(db, `budgets/${budgetId}/categories`)
    );
    
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categories = categoriesSnapshot.docs.reduce((acc, doc) => {
      const data = doc.data();
      acc[doc.id] = {
        id: doc.id,
        name: data.name,
        color: data.color || '#7FB069'
      };
      return acc;
    }, {});

    // Aggregate by category
    const aggregated = this._aggregateByCategory(transactions, categories);
    
    return this._formatExpenseDistribution(aggregated);
  }

  /**
   * Fetch income vs expense data
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Income vs expense data
   */
  async fetchIncomeExpense(userId, options = {}) {
    const { timeRange = 'month', limit = 1000, budgetId } = options;
    
    if (!budgetId) {
      throw new Error('Budget ID is required for fetching income vs expense data');
    }
    
    const { startDate, endDate } = this._getDateRange(timeRange);

    // Query all transactions in date range from budget subcollection
    const transactionsQuery = query(
      collection(db, `budgets/${budgetId}/transactions`),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(transactionsQuery);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));

    // Group by time period based on range
    const grouped = this._groupByTimePeriod(transactions, timeRange);
    
    return this._formatIncomeExpense(grouped, timeRange);
  }

  /**
   * Fetch spending trends data
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Spending trends data
   */
  async fetchSpendingTrends(userId, options = {}) {
    const { timeRange = 'month', showTarget = true, limit = 1000, budgetId } = options;
    
    if (!budgetId) {
      throw new Error('Budget ID is required for fetching spending trends data');
    }
    
    const { startDate, endDate } = this._getDateRange(timeRange);

    // Query expense transactions from budget subcollection
    const transactionsQuery = query(
      collection(db, `budgets/${budgetId}/transactions`),
      where('type', '==', 'expense'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(transactionsQuery);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));

    // Get budget data if showing targets
    let budget = null;
    if (showTarget) {
      budget = await this._fetchBudgetData(budgetId);
    }

    // Group by day/week/month based on range
    const grouped = this._groupSpendingByPeriod(transactions, timeRange);
    
    return this._formatSpendingTrends(grouped, budget);
  }

  /**
   * Fetch budget comparison data
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Budget comparison data
   */
  async fetchBudgetComparison(userId, options = {}) {
    const { timeRange = 'month', limit = 1000, budgetId } = options;
    
    if (!budgetId) {
      throw new Error('Budget ID is required for fetching budget comparison data');
    }
    
    const { startDate, endDate } = this._getDateRange(timeRange);

    // Fetch budget document, transactions and categories from budget subcollections
    const [budgetDoc, transactionsSnapshot, categoriesSnapshot] = await Promise.all([
      getDoc(doc(db, 'budgets', budgetId)),
      getDocs(query(
        collection(db, `budgets/${budgetId}/transactions`),
        where('type', '==', 'expense'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        firestoreLimit(limit)
      )),
      getDocs(query(collection(db, `budgets/${budgetId}/categories`)))
    ]);

    // Process data
    const budget = budgetDoc.exists() ? budgetDoc.data() : {};
    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
    
    const categories = categoriesSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = { id: doc.id, ...doc.data() };
      return acc;
    }, {});

    // Aggregate actual spending by category
    const actualSpending = this._aggregateByCategory(transactions, categories);
    
    return this._formatBudgetComparison(budget, actualSpending, categories);
  }

  /**
   * Set up real-time listener for chart data
   * @private
   */
  _setupRealTimeListener(userId, chartType, options, onUpdate, cacheKey) {
    // Clean up existing subscription
    if (this.subscriptions.has(cacheKey)) {
      this.subscriptions.get(cacheKey)();
    }

    const { timeRange = 'month', budgetId } = options;
    
    if (!budgetId) {
      throw new Error('Budget ID is required for real-time updates');
    }
    
    const { startDate, endDate } = this._getDateRange(timeRange);

    // Set up Firestore listener for budget subcollection
    const transactionsQuery = query(
      collection(db, `budgets/${budgetId}/transactions`),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      transactionsQuery,
      async (snapshot) => {
        try {
          // Process the real-time data
          const data = await this._processChartData(chartType, snapshot, userId, options);
          
          // Update cache
          this._setCachedData(cacheKey, data);
          
          // Notify listeners
          onUpdate(data);
        } catch (error) {
          console.error('Real-time update error:', error);
          onUpdate({ error: error.message });
        }
      },
      (error) => {
        console.error('Real-time listener error:', error);
        onUpdate({ error: error.message });
      }
    );

    // Store subscription for cleanup
    this.subscriptions.set(cacheKey, unsubscribe);

    // Return initial data
    return this.getChartData(userId, chartType, options);
  }

  /**
   * Process chart data based on type
   * @private
   */
  async _processChartData(chartType, snapshot, userId, options) {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));

    switch (chartType) {
      case 'expense_distribution':
        return this._processExpenseDistribution(transactions, userId);
      case 'income_expense':
        return this._processIncomeExpense(transactions, options.timeRange);
      case 'spending_trends':
        return this._processSpendingTrends(transactions, userId, options);
      case 'budget_comparison':
        return this._processBudgetComparison(transactions, userId, options);
      default:
        throw new Error(`Unknown chart type: ${chartType}`);
    }
  }

  /**
   * Fetch data with retry mechanism
   * @private
   */
  async _fetchWithRetry(userId, chartType, options) {
    const retryKey = `${userId}-${chartType}`;
    let attempts = this.retryCount.get(retryKey) || 0;

    try {
      let data;
      switch (chartType) {
        case 'expense_distribution':
          data = await this.fetchExpenseDistribution(userId, options);
          break;
        case 'income_expense':
          data = await this.fetchIncomeExpense(userId, options);
          break;
        case 'spending_trends':
          data = await this.fetchSpendingTrends(userId, options);
          break;
        case 'budget_comparison':
          data = await this.fetchBudgetComparison(userId, options);
          break;
        default:
          throw new Error(`Unknown chart type: ${chartType}`);
      }

      // Reset retry count on success
      this.retryCount.delete(retryKey);
      return data;

    } catch (error) {
      attempts++;
      this.retryCount.set(retryKey, attempts);

      if (attempts >= this.maxRetries) {
        this.retryCount.delete(retryKey);
        throw error;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, this.retryDelay * Math.pow(2, attempts - 1))
      );

      return this._fetchWithRetry(userId, chartType, options);
    }
  }

  /**
   * Generate cache key
   * @private
   */
  _generateCacheKey(userId, chartType, options) {
    const optionsStr = JSON.stringify(options);
    return `${userId}-${chartType}-${optionsStr}`;
  }

  /**
   * Get cached data if valid
   * @private
   */
  _getCachedData(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Get cached data with metadata (staleness info)
   * @private
   */
  _getCachedDataWithMetadata(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    const isExpired = age > CACHE_DURATION;
    
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Consider data stale if it's more than 1 minute old
    const isStale = age > 60000; // 1 minute

    return {
      data: cached.data,
      isStale,
      age
    };
  }

  /**
   * Set cached data with timestamp
   * @private
   */
  _setCachedData(cacheKey, data) {
    // Implement LRU cache behavior
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get date range based on time range option
   * @private
   */
  _getDateRange(timeRange) {
    const now = new Date();
    
    switch (timeRange) {
      case 'week':
        return {
          startDate: startOfWeek(now, { locale: fr }),
          endDate: endOfWeek(now, { locale: fr })
        };
      case 'quarter':
        return {
          startDate: startOfQuarter(now),
          endDate: endOfQuarter(now)
        };
      case 'month':
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
    }
  }

  /**
   * Aggregate transactions by category
   * @private
   */
  _aggregateByCategory(transactions, categories) {
    const aggregated = {};
    
    transactions.forEach(transaction => {
      const categoryId = transaction.categoryId;
      const category = categories[categoryId];
      
      if (!category) return;
      
      if (!aggregated[categoryId]) {
        aggregated[categoryId] = {
          id: categoryId,
          name: category.name,
          color: category.color || '#7FB069',
          total: 0,
          count: 0,
          transactions: []
        };
      }
      
      aggregated[categoryId].total += Math.abs(transaction.amount);
      aggregated[categoryId].count++;
      aggregated[categoryId].transactions.push(transaction);
    });
    
    return Object.values(aggregated);
  }

  /**
   * Group transactions by time period
   * @private
   */
  _groupByTimePeriod(transactions, timeRange) {
    const grouped = {};
    
    transactions.forEach(transaction => {
      let periodKey;
      
      switch (timeRange) {
        case 'week':
          periodKey = format(transaction.date, 'EEE', { locale: fr });
          break;
        case 'quarter':
          periodKey = format(transaction.date, 'QQQ yyyy', { locale: fr });
          break;
        case 'month':
        default:
          periodKey = format(transaction.date, 'MMM', { locale: fr });
          break;
      }
      
      if (!grouped[periodKey]) {
        grouped[periodKey] = {
          period: periodKey,
          income: 0,
          expenses: 0,
          transactions: []
        };
      }
      
      if (transaction.type === 'income') {
        grouped[periodKey].income += Math.abs(transaction.amount);
      } else {
        grouped[periodKey].expenses += Math.abs(transaction.amount);
      }
      
      grouped[periodKey].transactions.push(transaction);
    });
    
    return Object.values(grouped);
  }

  /**
   * Format expense distribution data for charts
   * @private
   */
  _formatExpenseDistribution(aggregated) {
    return aggregated
      .sort((a, b) => b.total - a.total)
      .map(category => ({
        name: category.name,
        value: category.total,
        count: category.count,
        color: category.color,
        percentage: 0 // Will be calculated by chart component
      }));
  }

  /**
   * Format income vs expense data for charts
   * @private
   */
  _formatIncomeExpense(grouped, timeRange) {
    return grouped
      .sort((a, b) => new Date(a.period) - new Date(b.period))
      .map(period => ({
        period: period.period,
        income: period.income,
        expenses: period.expenses,
        net: period.income - period.expenses
      }));
  }

  /**
   * Format spending trends data for charts
   * @private
   */
  _formatSpendingTrends(grouped, budget) {
    const dailyTarget = budget ? budget.monthlyAmount / 30 : 100;
    
    return grouped.map(period => ({
      period: period.period,
      amount: period.amount,
      target: dailyTarget,
      variance: period.amount - dailyTarget,
      trend: period.trend || 'stable'
    }));
  }

  /**
   * Format budget comparison data for charts
   * @private
   */
  _formatBudgetComparison(budget, actualSpending, categories) {
    const comparison = [];
    
    // Process each category with budget allocation
    Object.entries(budget.allocations || {}).forEach(([categoryId, budgetAmount]) => {
      const category = categories[categoryId];
      const actual = actualSpending.find(a => a.id === categoryId);
      
      if (category) {
        comparison.push({
          category: category.name,
          budgeted: budgetAmount,
          actual: actual ? actual.total : 0,
          variance: (actual ? actual.total : 0) - budgetAmount,
          status: this._getBudgetStatus(actual ? actual.total : 0, budgetAmount)
        });
      }
    });
    
    return comparison.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  }

  /**
   * Get budget status based on variance
   * @private
   */
  _getBudgetStatus(actual, budgeted) {
    const variance = ((actual - budgeted) / budgeted) * 100;
    
    if (variance > 10) return 'over';
    if (variance > 5) return 'warning';
    return 'good';
  }

  /**
   * Fetch budget data for comparison
   * @private
   */
  async _fetchBudgetData(budgetId) {
    try {
      // Get budget categories
      const categoriesRef = collection(db, 'budgets', budgetId, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      
      const budgetData = {};
      categoriesSnapshot.docs.forEach(doc => {
        const categoryData = doc.data();
        budgetData[doc.id] = {
          id: doc.id,
          name: categoryData.name,
          budgetedAmount: categoryData.budgetedAmount || 0,
          color: categoryData.color
        };
      });
      
      return budgetData;
    } catch (error) {
      console.error('Error fetching budget data:', error);
      return {};
    }
  }

  /**
   * Group spending data by time period
   * @private
   */
  _groupSpendingByPeriod(transactions, timeRange) {
    const grouped = {};
    
    transactions.forEach(transaction => {
      let periodKey;
      
      switch (timeRange) {
        case 'week':
          periodKey = format(transaction.date, 'MMM dd', { locale: fr });
          break;
        case 'quarter':
          periodKey = format(transaction.date, 'MMM yyyy', { locale: fr });
          break;
        case 'year':
          periodKey = format(transaction.date, 'MMM', { locale: fr });
          break;
        case 'month':
        default:
          periodKey = format(transaction.date, 'dd', { locale: fr });
          break;
      }
      
      if (!grouped[periodKey]) {
        grouped[periodKey] = {
          period: periodKey,
          amount: 0,
          transactions: []
        };
      }
      
      grouped[periodKey].amount += Math.abs(transaction.amount);
      grouped[periodKey].transactions.push(transaction);
    });
    
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Clear all caches and subscriptions
   */
  clearCache() {
    this.cache.clear();
    this.aggregationCache.clear();
    
    // Clean up all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      subscriptions: this.subscriptions.size,
      aggregationCacheSize: this.aggregationCache.size
    };
  }
}

// Export singleton instance
export default new ChartDataService();