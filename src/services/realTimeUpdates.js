/**
 * Real-Time Updates Service
 * 
 * Manages real-time updates for chart data when transactions change
 * Uses Firestore listeners and WebSocket connections for immediate updates
 */

import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase/firebaseInit';
import cacheManager from './cacheManager';
import dataAggregation from './dataAggregation';

class RealTimeUpdatesService {
  constructor() {
    this.listeners = new Map();
    this.subscribers = new Map();
    this.debounceTimers = new Map();
    this.batchUpdates = new Map();
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // Performance tracking
    this.updateStats = {
      totalUpdates: 0,
      batchedUpdates: 0,
      failedUpdates: 0,
      averageLatency: 0
    };
  }

  /**
   * Subscribe to real-time updates for specific chart data
   * @param {string} userId - User ID
   * @param {string} chartType - Type of chart to monitor
   * @param {Object} options - Update options (must include budgetId)
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  subscribe(userId, chartType, options = {}, callback) {
    const { budgetId } = options;
    
    if (!budgetId) {
      throw new Error('Budget ID is required for real-time updates');
    }
    
    const subscriptionId = this._generateSubscriptionId(userId, chartType, options);
    
    // Store callback
    this.subscribers.set(subscriptionId, {
      callback,
      chartType,
      options,
      userId,
      budgetId,
      lastUpdate: 0,
      updateCount: 0
    });

    // Set up Firestore listeners if not already active
    this._setupFirestoreListeners(userId, budgetId);
    
    // Set up real-time chart data updates
    this._setupChartDataListener(userId, chartType, options, subscriptionId);

    // Return unsubscribe function
    return () => this.unsubscribe(subscriptionId);
  }

  /**
   * Unsubscribe from real-time updates
   * @param {string} subscriptionId - Subscription ID to remove
   */
  unsubscribe(subscriptionId) {
    const subscription = this.subscribers.get(subscriptionId);
    if (!subscription) return;

    // Remove subscription
    this.subscribers.delete(subscriptionId);
    
    // Clean up debounce timer if exists
    if (this.debounceTimers.has(subscriptionId)) {
      clearTimeout(this.debounceTimers.get(subscriptionId));
      this.debounceTimers.delete(subscriptionId);
    }

    // Remove from batch updates
    this.batchUpdates.delete(subscriptionId);

    // Clean up Firestore listeners if no more subscribers for this user and budget
    const { userId, budgetId } = subscription;
    const hasOtherSubscriptions = Array.from(this.subscribers.values())
      .some(sub => sub.userId === userId && sub.budgetId === budgetId);
    
    if (!hasOtherSubscriptions) {
      this._cleanupFirestoreListeners(userId, budgetId);
    }
  }

  /**
   * Force refresh of all active subscriptions
   * @param {string} userId - Optional user ID to refresh only specific user data
   */
  async forceRefresh(userId = null) {
    const targetSubscriptions = userId 
      ? Array.from(this.subscribers.entries()).filter(([_, sub]) => sub.userId === userId)
      : Array.from(this.subscribers.entries());

    const refreshPromises = targetSubscriptions.map(([subscriptionId, subscription]) => 
      this._triggerChartUpdate(subscriptionId, { force: true })
    );

    await Promise.allSettled(refreshPromises);
  }

  /**
   * Get connection status and statistics
   * @returns {Object} Status and stats
   */
  getStatus() {
    return {
      connectionStatus: this.connectionStatus,
      activeSubscriptions: this.subscribers.size,
      activeListeners: this.listeners.size,
      updateStats: { ...this.updateStats },
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Enable or disable batching for performance optimization
   * @param {boolean} enabled - Whether to enable batching
   * @param {number} batchDelay - Delay in ms for batching
   */
  setBatching(enabled, batchDelay = 500) {
    this.batchingEnabled = enabled;
    this.batchDelay = batchDelay;
  }

  /**
   * Set up Firestore listeners for transactions and related data
   * @private
   */
  _setupFirestoreListeners(userId, budgetId) {
    const listenerId = `transactions_${userId}_${budgetId}`;
    
    if (this.listeners.has(listenerId)) {
      return; // Already listening
    }

    // Listen to transaction changes in budget subcollection
    const transactionsQuery = query(
      collection(db, `budgets/${budgetId}/transactions`),
      orderBy('date', 'desc')
    );

    const unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (snapshot) => this._handleTransactionChanges(snapshot, userId, budgetId),
      (error) => this._handleListenerError(error, listenerId)
    );

    // Listen to category changes in budget subcollection
    const categoriesQuery = query(
      collection(db, `budgets/${budgetId}/categories`)
    );

    const unsubscribeCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => this._handleCategoryChanges(snapshot, userId, budgetId),
      (error) => this._handleListenerError(error, `categories_${userId}_${budgetId}`)
    );

    // Listen to budget document changes
    const budgetDocRef = doc(db, 'budgets', budgetId);

    const unsubscribeBudget = onSnapshot(
      budgetDocRef,
      (snapshot) => this._handleBudgetChanges(snapshot, userId, budgetId),
      (error) => this._handleListenerError(error, `budget_${userId}_${budgetId}`)
    );

    // Store unsubscribe functions
    this.listeners.set(listenerId, () => {
      unsubscribeTransactions();
      unsubscribeCategories();
      unsubscribeBudget();
    });

    this.connectionStatus = 'connected';
    this.reconnectAttempts = 0;
  }

  /**
   * Set up specific chart data listener
   * @private
   */
  _setupChartDataListener(userId, chartType, options, subscriptionId) {
    // This would set up additional specific listeners if needed
    // For now, the general transaction listener will handle most chart updates
  }

  /**
   * Handle transaction changes from Firestore
   * @private
   */
  _handleTransactionChanges(snapshot, userId, budgetId) {
    const startTime = Date.now();
    
    // Get affected chart types
    const affectedChartTypes = this._getAffectedChartTypes(snapshot);
    
    // Invalidate relevant cache entries
    this._invalidateRelevantCache(userId, budgetId, affectedChartTypes);
    
    // Trigger updates for relevant subscriptions
    this._triggerRelevantUpdates(userId, budgetId, affectedChartTypes);
    
    // Update performance stats
    const latency = Date.now() - startTime;
    this._updatePerformanceStats(latency);
  }

  /**
   * Handle category changes from Firestore
   * @private
   */
  _handleCategoryChanges(snapshot, userId, budgetId) {
    // Categories affect expense distribution and budget comparison charts
    const affectedChartTypes = ['expense_distribution', 'budget_comparison'];
    
    this._invalidateRelevantCache(userId, budgetId, affectedChartTypes);
    this._triggerRelevantUpdates(userId, budgetId, affectedChartTypes);
  }

  /**
   * Handle budget changes from Firestore
   * @private
   */
  _handleBudgetChanges(snapshot, userId, budgetId) {
    // Budgets affect spending trends and budget comparison charts
    const affectedChartTypes = ['spending_trends', 'budget_comparison'];
    
    this._invalidateRelevantCache(userId, budgetId, affectedChartTypes);
    this._triggerRelevantUpdates(userId, budgetId, affectedChartTypes);
  }

  /**
   * Determine which chart types are affected by transaction changes
   * @private
   */
  _getAffectedChartTypes(snapshot) {
    const affectedChartTypes = new Set();
    
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();
      
      // All charts are affected by any transaction change
      affectedChartTypes.add('expense_distribution');
      affectedChartTypes.add('income_expense');
      affectedChartTypes.add('spending_trends');
      affectedChartTypes.add('budget_comparison');
      
      // Could add more specific logic here based on transaction type, category, etc.
    });
    
    return Array.from(affectedChartTypes);
  }

  /**
   * Invalidate relevant cache entries
   * @private
   */
  _invalidateRelevantCache(userId, budgetId, chartTypes) {
    chartTypes.forEach(chartType => {
      // Invalidate cache entries for this user, budget and chart type
      cacheManager.invalidate({
        tags: [`user:${userId}`, `budget:${budgetId}`, `chart:${chartType}`]
      });
    });
  }

  /**
   * Trigger updates for relevant subscriptions
   * @private
   */
  _triggerRelevantUpdates(userId, budgetId, chartTypes) {
    const relevantSubscriptions = Array.from(this.subscribers.entries())
      .filter(([_, subscription]) => 
        subscription.userId === userId && 
        subscription.budgetId === budgetId &&
        chartTypes.includes(subscription.chartType)
      );

    relevantSubscriptions.forEach(([subscriptionId, subscription]) => {
      if (this.batchingEnabled) {
        this._batchUpdate(subscriptionId);
      } else {
        this._debounceUpdate(subscriptionId);
      }
    });
  }

  /**
   * Debounce updates to prevent excessive calls
   * @private
   */
  _debounceUpdate(subscriptionId, delay = 300) {
    // Clear existing timer
    if (this.debounceTimers.has(subscriptionId)) {
      clearTimeout(this.debounceTimers.get(subscriptionId));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this._triggerChartUpdate(subscriptionId);
      this.debounceTimers.delete(subscriptionId);
    }, delay);

    this.debounceTimers.set(subscriptionId, timer);
  }

  /**
   * Batch updates for performance optimization
   * @private
   */
  _batchUpdate(subscriptionId) {
    // Add to batch
    this.batchUpdates.set(subscriptionId, Date.now());

    // Schedule batch processing if not already scheduled
    if (!this.batchProcessor) {
      this.batchProcessor = setTimeout(() => {
        this._processBatchedUpdates();
        this.batchProcessor = null;
      }, this.batchDelay || 500);
    }
  }

  /**
   * Process all batched updates
   * @private
   */
  _processBatchedUpdates() {
    const batchedSubscriptions = Array.from(this.batchUpdates.keys());
    this.batchUpdates.clear();

    // Process updates in parallel
    const updatePromises = batchedSubscriptions.map(subscriptionId => 
      this._triggerChartUpdate(subscriptionId)
    );

    Promise.allSettled(updatePromises).then(() => {
      this.updateStats.batchedUpdates += batchedSubscriptions.length;
    });
  }

  /**
   * Trigger chart update for a specific subscription
   * @private
   */
  async _triggerChartUpdate(subscriptionId, options = {}) {
    const subscription = this.subscribers.get(subscriptionId);
    if (!subscription) return;

    try {
      const { userId, chartType, options: chartOptions, callback } = subscription;
      
      // Fetch fresh data (this will use the cache manager and data aggregation)
      const chartDataService = (await import('./chartDataService')).default;
      const freshData = await chartDataService.getChartData(
        userId, 
        chartType, 
        chartOptions
      );

      // Call the callback with fresh data
      callback({
        type: 'update',
        data: freshData,
        timestamp: Date.now(),
        subscriptionId
      });

      // Update subscription stats
      subscription.lastUpdate = Date.now();
      subscription.updateCount++;
      
      this.updateStats.totalUpdates++;

    } catch (error) {
      console.error('Chart update error:', error);
      
      // Notify subscriber of error
      subscription.callback({
        type: 'error',
        error: error.message,
        timestamp: Date.now(),
        subscriptionId
      });
      
      this.updateStats.failedUpdates++;
    }
  }

  /**
   * Handle listener errors and attempt reconnection
   * @private
   */
  _handleListenerError(error, listenerId) {
    console.error(`Firestore listener error (${listenerId}):`, error);
    
    this.connectionStatus = 'error';
    
    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      setTimeout(() => {
        this._attemptReconnection(listenerId);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.connectionStatus = 'failed';
    }
  }

  /**
   * Attempt to reconnect failed listeners
   * @private
   */
  _attemptReconnection(listenerId) {
    // Clean up failed listener
    this._cleanupSpecificListener(listenerId);
    
    // Extract user ID and budget ID from listener ID
    const parts = listenerId.split('_');
    const userId = parts[1];
    const budgetId = parts[2];
    
    if (userId && budgetId) {
      // Re-setup listeners
      this._setupFirestoreListeners(userId, budgetId);
    }
  }

  /**
   * Clean up Firestore listeners for a user and budget
   * @private
   */
  _cleanupFirestoreListeners(userId, budgetId) {
    const listenerId = `transactions_${userId}_${budgetId}`;
    const unsubscribe = this.listeners.get(listenerId);
    
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Clean up specific listener
   * @private
   */
  _cleanupSpecificListener(listenerId) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Generate unique subscription ID
   * @private
   */
  _generateSubscriptionId(userId, chartType, options) {
    const optionsHash = JSON.stringify(options);
    return `${userId}_${chartType}_${btoa(optionsHash).slice(0, 8)}`;
  }

  /**
   * Update performance statistics
   * @private
   */
  _updatePerformanceStats(latency) {
    const { totalUpdates, averageLatency } = this.updateStats;
    
    this.updateStats.averageLatency = 
      (averageLatency * totalUpdates + latency) / (totalUpdates + 1);
  }

  /**
   * Clean up all listeners and subscriptions
   */
  destroy() {
    // Unsubscribe all
    this.subscribers.clear();
    
    // Clear timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    if (this.batchProcessor) {
      clearTimeout(this.batchProcessor);
    }
    
    // Clean up Firestore listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    
    this.connectionStatus = 'disconnected';
  }
}

// Export singleton instance
export default new RealTimeUpdatesService();