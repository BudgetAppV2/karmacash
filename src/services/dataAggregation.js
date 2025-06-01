/**
 * Data Aggregation and Filtering Service
 * 
 * Advanced utilities for processing and filtering large transaction datasets
 * Optimized for performance with 1000+ transactions
 */

import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  format,
  isWithinInterval,
  differenceInDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval
} from 'date-fns';
import { fr } from 'date-fns/locale';

class DataAggregationService {
  constructor() {
    this.aggregationCache = new Map();
    this.filterCache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Aggregate transactions with advanced filtering and grouping
   * @param {Array} transactions - Array of transaction objects
   * @param {Object} options - Aggregation options
   * @returns {Object} Aggregated data
   */
  aggregateTransactions(transactions, options = {}) {
    const {
      groupBy = 'category', // 'category', 'date', 'month', 'week', 'type'
      timeRange = 'month',
      filters = {},
      includeSubcategories = false,
      sortBy = 'amount',
      sortOrder = 'desc',
      limit = null,
      calculateTrends = false,
      includePercentages = true
    } = options;

    // Generate cache key
    const cacheKey = this._generateAggregationKey(transactions, options);
    
    // Check cache
    const cached = this._getCachedAggregation(cacheKey);
    if (cached) return cached;

    // Apply filters first for performance
    const filteredTransactions = this.filterTransactions(transactions, filters);

    // Group transactions
    const grouped = this._groupTransactions(filteredTransactions, groupBy, timeRange);

    // Calculate aggregations
    const aggregated = this._calculateAggregations(grouped, options);

    // Apply sorting and limiting
    const sorted = this._sortAggregations(aggregated, sortBy, sortOrder);
    const limited = limit ? sorted.slice(0, limit) : sorted;

    // Calculate additional metrics
    const result = {
      data: limited,
      totals: this._calculateTotals(filteredTransactions),
      metadata: {
        totalTransactions: filteredTransactions.length,
        dateRange: this._getDateRange(filteredTransactions),
        groupBy,
        timeRange,
        appliedFilters: Object.keys(filters)
      }
    };

    // Add trends if requested
    if (calculateTrends) {
      result.trends = this._calculateTrends(limited, groupBy);
    }

    // Add percentages if requested
    if (includePercentages) {
      result.data = this._addPercentages(result.data, result.totals);
    }

    // Cache result
    this._setCachedAggregation(cacheKey, result);

    return result;
  }

  /**
   * Filter transactions based on criteria
   * @param {Array} transactions - Array of transaction objects
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered transactions
   */
  filterTransactions(transactions, filters = {}) {
    const {
      dateRange,
      categories,
      amountRange,
      type,
      description,
      tags,
      recurring,
      userId
    } = filters;

    return transactions.filter(transaction => {
      // Date range filter
      if (dateRange) {
        const transactionDate = new Date(transaction.date);
        const { start, end } = dateRange;
        if (!isWithinInterval(transactionDate, { start: new Date(start), end: new Date(end) })) {
          return false;
        }
      }

      // Category filter
      if (categories && categories.length > 0) {
        if (!categories.includes(transaction.categoryId)) {
          return false;
        }
      }

      // Amount range filter
      if (amountRange) {
        const amount = Math.abs(transaction.amount);
        if (amount < amountRange.min || amount > amountRange.max) {
          return false;
        }
      }

      // Transaction type filter
      if (type && transaction.type !== type) {
        return false;
      }

      // Description search filter
      if (description) {
        const desc = transaction.description?.toLowerCase() || '';
        if (!desc.includes(description.toLowerCase())) {
          return false;
        }
      }

      // Tags filter
      if (tags && tags.length > 0) {
        const transactionTags = transaction.tags || [];
        if (!tags.some(tag => transactionTags.includes(tag))) {
          return false;
        }
      }

      // Recurring filter
      if (recurring !== undefined) {
        if (Boolean(transaction.isRecurring) !== Boolean(recurring)) {
          return false;
        }
      }

      // User filter
      if (userId && transaction.userId !== userId) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate spending patterns and insights
   * @param {Array} transactions - Array of transaction objects
   * @param {Object} options - Analysis options
   * @returns {Object} Spending patterns and insights
   */
  analyzeSpendingPatterns(transactions, options = {}) {
    const { compareToLastPeriod = true, includeForecasts = false } = options;

    const analysis = {
      summary: this._calculateSpendingSummary(transactions),
      patterns: this._identifySpendingPatterns(transactions),
      insights: this._generateSpendingInsights(transactions),
      categories: this._analyzeCategorySpending(transactions)
    };

    // Compare to previous period if requested
    if (compareToLastPeriod) {
      analysis.comparison = this._compareSpendingPeriods(transactions);
    }

    // Generate forecasts if requested
    if (includeForecasts) {
      analysis.forecasts = this._generateSpendingForecasts(transactions);
    }

    return analysis;
  }

  /**
   * Optimize data structure for large datasets
   * @param {Array} transactions - Large array of transactions
   * @param {Object} options - Optimization options
   * @returns {Object} Optimized data structure
   */
  optimizeForLargeDataset(transactions, options = {}) {
    const {
      chunkSize = 1000,
      useIndexing = true,
      compressData = false,
      enableLazyLoading = true
    } = options;

    // Create indexed structure for fast lookups
    const optimized = {
      data: transactions,
      indices: {},
      chunks: [],
      metadata: {
        totalSize: transactions.length,
        chunkSize,
        isOptimized: true,
        createdAt: Date.now()
      }
    };

    if (useIndexing) {
      // Create indices for common query patterns
      optimized.indices = {
        byCategory: this._createCategoryIndex(transactions),
        byDate: this._createDateIndex(transactions),
        byType: this._createTypeIndex(transactions),
        byAmount: this._createAmountIndex(transactions),
        byUser: this._createUserIndex(transactions)
      };
    }

    if (enableLazyLoading) {
      // Split into chunks for lazy loading
      optimized.chunks = this._createChunks(transactions, chunkSize);
      
      // Remove full data to save memory
      optimized.data = null;
      optimized.getChunk = (index) => optimized.chunks[index];
      optimized.getTotalChunks = () => optimized.chunks.length;
    }

    if (compressData) {
      // Compress transaction data (simplified approach)
      optimized.compressed = this._compressTransactionData(transactions);
    }

    return optimized;
  }

  /**
   * Calculate rolling averages for trend analysis
   * @param {Array} data - Time series data
   * @param {number} window - Rolling window size
   * @returns {Array} Data with rolling averages
   */
  calculateRollingAverages(data, window = 7) {
    return data.map((item, index) => {
      const start = Math.max(0, index - window + 1);
      const slice = data.slice(start, index + 1);
      const average = slice.reduce((sum, d) => sum + d.amount, 0) / slice.length;
      
      return {
        ...item,
        rollingAverage: average,
        trend: index > 0 ? (item.amount > data[index - 1].amount ? 'up' : 'down') : 'stable'
      };
    });
  }

  /**
   * Group transactions by specified criteria
   * @private
   */
  _groupTransactions(transactions, groupBy, timeRange) {
    const groups = {};

    transactions.forEach(transaction => {
      let key;

      switch (groupBy) {
        case 'category':
          key = transaction.categoryId || 'uncategorized';
          break;
        case 'type':
          key = transaction.type || 'unknown';
          break;
        case 'date':
          key = this._getDateKey(transaction.date, timeRange);
          break;
        case 'month':
          key = format(new Date(transaction.date), 'yyyy-MM');
          break;
        case 'week':
          key = format(startOfWeek(new Date(transaction.date)), 'yyyy-MM-dd');
          break;
        default:
          key = 'all';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
    });

    return groups;
  }

  /**
   * Calculate aggregations for grouped data
   * @private
   */
  _calculateAggregations(grouped, options) {
    return Object.entries(grouped).map(([key, transactions]) => {
      const amounts = transactions.map(t => Math.abs(t.amount));
      
      return {
        group: key,
        transactions,
        count: transactions.length,
        total: amounts.reduce((sum, amount) => sum + amount, 0),
        average: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length,
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        median: this._calculateMedian(amounts),
        standardDeviation: this._calculateStandardDeviation(amounts),
        firstTransaction: new Date(Math.min(...transactions.map(t => new Date(t.date)))),
        lastTransaction: new Date(Math.max(...transactions.map(t => new Date(t.date))))
      };
    });
  }

  /**
   * Create category index for fast lookups
   * @private
   */
  _createCategoryIndex(transactions) {
    const index = {};
    transactions.forEach((transaction, i) => {
      const categoryId = transaction.categoryId || 'uncategorized';
      if (!index[categoryId]) {
        index[categoryId] = [];
      }
      index[categoryId].push(i);
    });
    return index;
  }

  /**
   * Create date index for time-based queries
   * @private
   */
  _createDateIndex(transactions) {
    const index = {};
    transactions.forEach((transaction, i) => {
      const dateKey = format(new Date(transaction.date), 'yyyy-MM-dd');
      if (!index[dateKey]) {
        index[dateKey] = [];
      }
      index[dateKey].push(i);
    });
    return index;
  }

  /**
   * Calculate median value
   * @private
   */
  _calculateMedian(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   * @private
   */
  _calculateStandardDeviation(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Generate cache key for aggregations
   * @private
   */
  _generateAggregationKey(transactions, options) {
    const hash = this._simpleHash(JSON.stringify({
      transactionCount: transactions.length,
      options,
      firstId: transactions[0]?.id,
      lastId: transactions[transactions.length - 1]?.id
    }));
    return `agg_${hash}`;
  }

  /**
   * Simple hash function for cache keys
   * @private
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get cached aggregation if valid
   * @private
   */
  _getCachedAggregation(key) {
    const cached = this.aggregationCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.aggregationCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached aggregation
   * @private
   */
  _setCachedAggregation(key, data) {
    this.aggregationCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Cleanup old entries
    if (this.aggregationCache.size > 100) {
      const firstKey = this.aggregationCache.keys().next().value;
      this.aggregationCache.delete(firstKey);
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.aggregationCache.clear();
    this.filterCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      aggregationCacheSize: this.aggregationCache.size,
      filterCacheSize: this.filterCache.size
    };
  }
}

// Export singleton instance
export default new DataAggregationService();