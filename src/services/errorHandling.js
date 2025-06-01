/**
 * Comprehensive Error Handling and Retry System
 * 
 * Advanced error handling, retry mechanisms, circuit breakers, and recovery strategies
 * for chart data operations and large dataset processing
 */

/**
 * Custom Error Classes for Different Error Types
 */
class BaseError extends Error {
  constructor(message, code, retryable = false, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.retryable = retryable;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

class NetworkError extends BaseError {
  constructor(message, context = {}) {
    super(message, 'NETWORK_ERROR', true, context);
  }
}

class FirestoreError extends BaseError {
  constructor(message, firestoreCode, context = {}) {
    const retryable = ['unavailable', 'resource-exhausted', 'deadline-exceeded'].includes(firestoreCode);
    super(message, `FIRESTORE_${firestoreCode?.toUpperCase()}`, retryable, context);
    this.firestoreCode = firestoreCode;
  }
}

class DataProcessingError extends BaseError {
  constructor(message, context = {}) {
    super(message, 'DATA_PROCESSING_ERROR', false, context);
  }
}

class ValidationError extends BaseError {
  constructor(message, field, context = {}) {
    super(message, 'VALIDATION_ERROR', false, { ...context, field });
    this.field = field;
  }
}

class QuotaExceededError extends BaseError {
  constructor(message, quotaType, context = {}) {
    super(message, 'QUOTA_EXCEEDED', true, { ...context, quotaType });
    this.quotaType = quotaType;
  }
}

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitorWindow = options.monitorWindow || 300000; // 5 minutes
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = [];
    this.lastFailureTime = null;
    this.nextRetryTime = null;
    this.successCount = 0;
    this.totalRequests = 0;
  }

  async execute(operation, ...args) {
    this.totalRequests++;
    
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextRetryTime) {
        throw new BaseError(
          `Circuit breaker ${this.name} is OPEN. Next retry at ${new Date(this.nextRetryTime)}`,
          'CIRCUIT_BREAKER_OPEN',
          true
        );
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    this.successCount++;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failures = [];
      this.lastFailureTime = null;
      this.nextRetryTime = null;
    }
  }

  onFailure(error) {
    const now = Date.now();
    this.lastFailureTime = now;
    
    // Remove old failures outside the monitor window
    this.failures = this.failures.filter(time => now - time < this.monitorWindow);
    this.failures.push(now);

    if (this.failures.length >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextRetryTime = now + this.resetTimeout;
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failures.length,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      nextRetryTime: this.nextRetryTime,
      successRate: this.totalRequests > 0 ? (this.successCount / this.totalRequests) * 100 : 0
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = [];
    this.lastFailureTime = null;
    this.nextRetryTime = null;
    this.successCount = 0;
    this.totalRequests = 0;
  }
}

/**
 * Advanced Retry Manager with Exponential Backoff
 */
class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitterFactor = options.jitterFactor || 0.1;
    this.retryableErrors = options.retryableErrors || [];
    this.circuitBreakers = new Map();
  }

  async executeWithRetry(operation, options = {}) {
    const {
      maxRetries = this.maxRetries,
      baseDelay = this.baseDelay,
      context = {},
      circuitBreakerName = null,
      validator = null,
      onRetry = null
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Use circuit breaker if specified
        let result;
        if (circuitBreakerName) {
          const circuitBreaker = this.getCircuitBreaker(circuitBreakerName);
          result = await circuitBreaker.execute(operation);
        } else {
          result = await operation();
        }

        // Validate result if validator provided
        if (validator && !validator(result)) {
          throw new ValidationError('Result validation failed', 'result', context);
        }

        return result;
      } catch (error) {
        lastError = this.enhanceError(error, { attempt, maxRetries, context });
        
        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, baseDelay);
        
        // Call retry callback if provided
        if (onRetry) {
          try {
            await onRetry(error, attempt, delay);
          } catch (callbackError) {
            console.warn('Retry callback error:', callbackError);
          }
        }

        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  calculateDelay(attempt, baseDelay) {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
    let delay = baseDelay * Math.pow(this.backoffMultiplier, attempt);
    
    // Apply maximum delay cap
    delay = Math.min(delay, this.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = delay * this.jitterFactor * Math.random();
    delay = delay + jitter;
    
    return Math.round(delay);
  }

  isRetryableError(error) {
    // Check if error is explicitly marked as retryable
    if (error.retryable !== undefined) {
      return error.retryable;
    }

    // Check against retryable error patterns
    return this.retryableErrors.some(pattern => {
      if (typeof pattern === 'string') {
        return error.code === pattern || error.name === pattern;
      }
      if (pattern instanceof RegExp) {
        return pattern.test(error.message) || pattern.test(error.code);
      }
      if (typeof pattern === 'function') {
        return pattern(error);
      }
      return false;
    });
  }

  enhanceError(error, metadata) {
    if (error instanceof BaseError) {
      error.context = { ...error.context, ...metadata };
      return error;
    }

    // Convert standard errors to enhanced errors
    if (error.code?.startsWith('firestore/')) {
      return new FirestoreError(error.message, error.code.replace('firestore/', ''), metadata);
    }

    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return new NetworkError(error.message, metadata);
    }

    // Default to base error
    return new BaseError(error.message, error.code || 'UNKNOWN_ERROR', false, metadata);
  }

  getCircuitBreaker(name, options = {}) {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker({ name, ...options }));
    }
    return this.circuitBreakers.get(name);
  }

  getAllCircuitBreakers() {
    return Array.from(this.circuitBreakers.values()).map(cb => cb.getStatus());
  }

  resetCircuitBreaker(name) {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error Recovery Strategies
 */
class ErrorRecoveryService {
  constructor() {
    this.recoveryStrategies = new Map();
    this.fallbackData = new Map();
    this.retryManager = new RetryManager({
      retryableErrors: [
        'NETWORK_ERROR',
        'FIRESTORE_UNAVAILABLE',
        'FIRESTORE_RESOURCE-EXHAUSTED',
        'FIRESTORE_DEADLINE-EXCEEDED',
        /timeout/i
      ]
    });
  }

  // Register recovery strategy for specific error types
  registerRecoveryStrategy(errorCode, strategy) {
    this.recoveryStrategies.set(errorCode, strategy);
  }

  // Register fallback data for specific operations
  registerFallbackData(operationKey, data) {
    this.fallbackData.set(operationKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Execute operation with full error handling and recovery
  async executeWithRecovery(operation, options = {}) {
    const {
      operationKey,
      fallbackStrategy = 'cache',
      degradedMode = false,
      timeout = 30000,
      onError = null,
      onFallback = null
    } = options;

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.retryManager.executeWithRetry(operation, options),
        this.createTimeoutPromise(timeout)
      ]);

      return { data: result, source: 'primary', degraded: false };
    } catch (error) {
      // Log error
      this.logError(error, { operationKey, options });

      // Call error callback
      if (onError) {
        try {
          await onError(error);
        } catch (callbackError) {
          console.warn('Error callback failed:', callbackError);
        }
      }

      // Attempt recovery
      const recoveryResult = await this.attemptRecovery(error, operationKey, options);
      
      if (recoveryResult) {
        if (onFallback) {
          try {
            await onFallback(recoveryResult);
          } catch (callbackError) {
            console.warn('Fallback callback failed:', callbackError);
          }
        }
        return recoveryResult;
      }

      // If recovery fails and degraded mode is enabled, return minimal data
      if (degradedMode) {
        return {
          data: this.getMinimalData(operationKey),
          source: 'degraded',
          degraded: true,
          error: error.message
        };
      }

      // Re-throw if no recovery possible
      throw error;
    }
  }

  async attemptRecovery(error, operationKey, options = {}) {
    // Try specific recovery strategy first
    const strategy = this.recoveryStrategies.get(error.code);
    if (strategy) {
      try {
        const result = await strategy(error, operationKey, options);
        return { data: result, source: 'recovery', degraded: false };
      } catch (recoveryError) {
        console.warn('Recovery strategy failed:', recoveryError);
      }
    }

    // Try fallback data
    const fallback = this.fallbackData.get(operationKey);
    if (fallback) {
      const isStale = Date.now() - fallback.timestamp > 300000; // 5 minutes
      return {
        data: fallback.data,
        source: 'fallback',
        degraded: isStale,
        stale: isStale
      };
    }

    return null;
  }

  getMinimalData(operationKey) {
    // Return minimal viable data structure based on operation type
    switch (operationKey) {
      case 'expense_distribution':
        return [];
      case 'income_expense':
        return [];
      case 'spending_trends':
        return [];
      case 'budget_comparison':
        return [];
      default:
        return {};
    }
  }

  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new BaseError(
          `Operation timed out after ${timeout}ms`,
          'TIMEOUT_ERROR',
          true
        ));
      }, timeout);
    });
  }

  logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // In production, you would send this to your error tracking service
    // Example: sendToErrorTrackingService(errorLog);
  }

  // Health check for all registered services
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      retryManager: {
        circuitBreakers: this.retryManager.getAllCircuitBreakers()
      },
      fallbackData: {
        count: this.fallbackData.size,
        entries: Array.from(this.fallbackData.keys())
      },
      recoveryStrategies: {
        count: this.recoveryStrategies.size,
        strategies: Array.from(this.recoveryStrategies.keys())
      }
    };

    return health;
  }

  // Clear all cached data and reset state
  reset() {
    this.fallbackData.clear();
    this.recoveryStrategies.clear();
    // Reset circuit breakers
    this.retryManager.circuitBreakers.forEach(cb => cb.reset());
  }
}

/**
 * Error Boundary for React Components
 */
export class ErrorBoundary {
  constructor(fallbackComponent, onError = null) {
    this.fallbackComponent = fallbackComponent;
    this.onError = onError;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const enhancedError = new BaseError(
      error.message,
      'COMPONENT_ERROR',
      false,
      { errorInfo, componentStack: errorInfo.componentStack }
    );

    if (this.onError) {
      this.onError(enhancedError);
    }

    // Log to error recovery service
    errorRecoveryService.logError(enhancedError, { type: 'component_error' });
  }

  render() {
    if (this.state?.hasError) {
      return this.fallbackComponent;
    }

    return this.props.children;
  }
}

// Export singleton instance
const errorRecoveryService = new ErrorRecoveryService();

export {
  BaseError,
  NetworkError,
  FirestoreError,
  DataProcessingError,
  ValidationError,
  QuotaExceededError,
  CircuitBreaker,
  RetryManager,
  ErrorRecoveryService,
  errorRecoveryService
};

// Export factory for creating specialized error handlers
export function createChartErrorHandler(chartType) {
  const errorHandler = new ErrorRecoveryService();
  
  // Register chart-specific fallback data
  errorHandler.registerFallbackData(chartType, []);
  
  // Register chart-specific recovery strategies
  errorHandler.registerRecoveryStrategy('FIRESTORE_UNAVAILABLE', async () => {
    // Return cached data or empty state
    return [];
  });

  return errorHandler;
}