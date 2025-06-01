/**
 * Custom Hook for Chart Data Management
 * 
 * Integrates all the advanced data services for optimized chart data handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from './useBudget';
import chartDataService from '../services/chartDataService';
import realTimeUpdates from '../services/realTimeUpdates';
import { errorRecoveryService } from '../services/errorHandling';
import cacheManager from '../services/cacheManager';

export function useChartData(chartType, options = {}) {
  const { currentUser } = useAuth();
  const { currentBudgetId, isLoading: budgetLoading } = useBudget();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [source, setSource] = useState('primary');
  const unsubscribeRef = useRef(null);
  const mountedRef = useRef(true);

  const {
    timeRange = 'month',
    realTime = true,
    fallbackStrategy = 'cache',
    enableBatching = true,
    cacheTimeout = 300000, // 5 minutes
    onError: userOnError,
    onUpdate: userOnUpdate
  } = options;

  // Load chart data with full error handling and recovery
  const loadData = useCallback(async () => {
    if (!currentUser?.uid || !currentBudgetId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await chartDataService.getChartData(
        currentUser.uid,
        chartType,
        { timeRange, budgetId: currentBudgetId, ...options }
      );
      
      // Check if result exists and has expected structure
      if (!result) {
        console.error(`useChartData: No result returned for ${chartType}`);
        return;
      }

      // Set state directly - React will handle this safely
      setData(result.data);
      setIsStale(result.degraded || result.stale || false);
      setSource(result.source || 'primary');
      setIsLoading(false);

    } catch (err) {
      if (mountedRef.current) {
        console.error(`useChartData error for ${chartType}:`, err);
        setError(err);
        setIsLoading(false);
        setData(null);
      }
    }
  }, [currentUser?.uid, currentBudgetId, chartType, timeRange, fallbackStrategy, userOnError, options]);

  // Set up real-time updates
  useEffect(() => {
    if (!currentUser?.uid || !currentBudgetId || !realTime) return;

    // Set up real-time subscription
    const unsubscribe = realTimeUpdates.subscribe(
      currentUser.uid,
      chartType,
      { timeRange, budgetId: currentBudgetId, enableBatching },
      (update) => {
        if (!mountedRef.current) return;

        if (update.type === 'update') {
          setData(update.data);
          setIsStale(false);
          setSource('realtime');
          setError(null);
          
          if (userOnUpdate) {
            userOnUpdate(update.data);
          }
        } else if (update.type === 'error') {
          setError(new Error(update.error));
        }
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid, currentBudgetId, chartType, timeRange, realTime, enableBatching, userOnUpdate]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true; // Ensure it's set to true on mount
    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Force cache invalidation and refresh
  const forceRefresh = useCallback(async () => {
    if (currentUser?.uid && currentBudgetId) {
      await cacheManager.invalidate({
        tags: [`user:${currentUser.uid}`, `budget:${currentBudgetId}`, `chart:${chartType}`]
      });
      await loadData();
    }
  }, [currentUser?.uid, currentBudgetId, chartType, loadData]);

  return {
    data,
    isLoading: isLoading || budgetLoading,
    error,
    isStale,
    source,
    refresh,
    forceRefresh,
    // Metadata
    metadata: {
      chartType,
      timeRange,
      userId: currentUser?.uid,
      budgetId: currentBudgetId,
      lastUpdate: data ? Date.now() : null,
      realTimeEnabled: realTime
    }
  };
}

// Specialized hooks for each chart type
export function useExpenseDistribution(options = {}) {
  return useChartData('expense_distribution', options);
}

export function useIncomeExpense(options = {}) {
  return useChartData('income_expense', options);
}

export function useSpendingTrends(options = {}) {
  return useChartData('spending_trends', options);
}

export function useBudgetComparison(options = {}) {
  return useChartData('budget_comparison', options);
}

// Hook for managing multiple chart data sources
export function useMultipleChartData(chartConfigs) {
  const [results, setResults] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const subscriptions = [];
    let loadedCount = 0;
    const totalCharts = chartConfigs.length;

    const updateLoadingState = () => {
      setIsLoading(loadedCount < totalCharts);
    };

    chartConfigs.forEach(({ key, chartType, options = {} }) => {
      const subscription = {
        ...useChartData(chartType, {
          ...options,
          onUpdate: (data) => {
            setResults(prev => ({ ...prev, [key]: data }));
            if (options.onUpdate) options.onUpdate(data);
          },
          onError: (error) => {
            setErrors(prev => ({ ...prev, [key]: error }));
            if (options.onError) options.onError(error);
          }
        })
      };

      // Track loading completion
      if (!subscription.isLoading && !results[key]) {
        loadedCount++;
        updateLoadingState();
      }

      subscriptions.push({ key, subscription });
    });

    return () => {
      // Cleanup handled by individual useChartData hooks
    };
  }, [chartConfigs]);

  return {
    data: results,
    isLoading,
    errors,
    refresh: () => {
      // Trigger refresh for all charts
      Object.values(results).forEach(result => {
        if (result.refresh) result.refresh();
      });
    }
  };
}