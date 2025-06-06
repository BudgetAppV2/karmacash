/**
 * Enhanced Caching System for CK Access Module
 * Optimized for CK workflow patterns and token efficiency
 * Based on Bible Access Module patterns with CK-specific enhancements
 */

class CKEnhancedCacheSystem {
  constructor(options = {}) {
    this.config = {
      maxCacheSize: options.maxCacheSize || 150, // Larger than Bible Access (100)
      cacheTimeout: options.cacheTimeout || 600000, // 10 minutes (vs 5 for Bible)
      prefetchEnabled: options.prefetchEnabled !== false,
      workflowAwareCache: options.workflowAwareCache !== false,
      tokenEfficiencyMode: options.tokenEfficiencyMode !== false,
      persistentCache: options.persistentCache || false,
      ...options
    };

    // Multi-level cache structure optimized for CK workflows
    this.caches = {
      modules: new Map(),         // Individual CK modules
      workflows: new Map(),       // Complete workflow guidance sets
      crossRefs: new Map(),       // Cross-references between modules
      searches: new Map(),        // Search results
      templates: new Map()        // Handoff templates and patterns
    };

    // CK-specific cache statistics
    this.stats = {
      hits: { modules: 0, workflows: 0, crossRefs: 0, searches: 0, templates: 0 },
      misses: { modules: 0, workflows: 0, crossRefs: 0, searches: 0, templates: 0 },
      evictions: 0,
      prefetches: 0,
      workflowOptimizations: 0,
      tokensSaved: 0,
      totalSize: 0
    };

    // Priority queue for intelligent eviction
    this.accessQueue = [];
    this.accessIndex = new Map();

    // CK workflow patterns for intelligent prefetching
    this.workflowPatterns = new Map();
    this.moduleUsageFrequency = new Map();

    // Token efficiency tracking
    this.tokenMetrics = {
      baselineInitialization: 8500, // Current CK initialization tokens
      optimizedInitialization: 0,
      totalTokensSaved: 0,
      reductionPercentage: 0
    };
  }

  // ==================== CORE CACHE OPERATIONS ====================

  /**
   * Get cached item with CK-specific optimizations
   * @param {string} cacheType - Type of cache (modules, workflows, etc.)
   * @param {string} key - Cache key
   * @returns {any|null} Cached item or null if not found
   */
  get(cacheType, key) {
    const cache = this.caches[cacheType];
    if (!cache) return null;

    const item = cache.get(key);
    if (!item) {
      this.stats.misses[cacheType]++;
      return null;
    }

    // Check expiration with workflow-aware timeout
    const timeout = this._getTimeoutForType(cacheType);
    if (Date.now() - item.timestamp > timeout) {
      cache.delete(key);
      this._removeFromAccessQueue(key);
      this.stats.misses[cacheType]++;
      return null;
    }

    // Update access tracking
    item.lastAccess = Date.now();
    this._updateAccessQueue(key);
    this.stats.hits[cacheType]++;

    // Track token savings
    if (item.tokenSize) {
      this.stats.tokensSaved += item.tokenSize;
      this.tokenMetrics.totalTokensSaved += item.tokenSize;
    }

    // Trigger workflow-aware prefetch
    if (this.config.workflowAwareCache && cacheType === 'modules') {
      this._triggerWorkflowPrefetch(key, item.data);
    }

    return item.data;
  }

  /**
   * Store item in cache with CK-specific optimizations
   * @param {string} cacheType - Type of cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {Object} options - Caching options
   */
  set(cacheType, key, data, options = {}) {
    const cache = this.caches[cacheType];
    if (!cache) return;

    // Calculate token size for efficiency tracking
    const tokenSize = this._estimateTokenSize(data);

    const item = {
      data,
      timestamp: Date.now(),
      lastAccess: Date.now(),
      tokenSize,
      cacheType,
      workflowContext: options.workflowContext,
      priority: this._calculatePriority(cacheType, key, options),
      size: this._calculateSize(data),
      ...options
    };

    // Ensure capacity with intelligent eviction
    this._ensureCapacity(item.size);

    // Store item
    cache.set(key, item);
    this._updateAccessQueue(key);
    this.stats.totalSize += item.size;

    // Learn workflow patterns for future optimization
    if (this.config.workflowAwareCache) {
      this._learnWorkflowPattern(cacheType, key, options.workflowContext);
    }

    // Update module usage frequency
    if (cacheType === 'modules') {
      this._updateUsageFrequency(key);
    }
  }

  // ==================== CK WORKFLOW-SPECIFIC METHODS ====================

  /**
   * Get complete workflow guidance with intelligent caching
   * @param {string} workflowType - Workflow type
   * @param {Array} moduleIds - Required module IDs
   * @param {Function} retrievalFunction - Function to load modules
   * @returns {Promise<Object>} Complete workflow guidance
   */
  async getWorkflowWithCache(workflowType, moduleIds, retrievalFunction) {
    const workflowKey = `${workflowType}-${moduleIds.join(',')}`;
    
    // Check workflow cache first
    let workflow = this.get('workflows', workflowKey);
    if (workflow) {
      this.stats.workflowOptimizations++;
      return workflow;
    }

    // Load individual modules (potentially from cache)
    const modules = {};
    const uncachedModules = [];

    for (const moduleId of moduleIds) {
      const cached = this.get('modules', moduleId);
      if (cached) {
        modules[moduleId] = cached;
      } else {
        uncachedModules.push(moduleId);
      }
    }

    // Retrieve uncached modules
    if (uncachedModules.length > 0) {
      const retrieved = await this._batchRetrieveModules(uncachedModules, retrievalFunction);
      Object.assign(modules, retrieved);
      
      // Cache individual modules
      for (const [moduleId, module] of Object.entries(retrieved)) {
        this.set('modules', moduleId, module, { 
          workflowContext: workflowType,
          priority: 3 
        });
      }
    }

    // Build complete workflow
    workflow = {
      workflowType,
      modules,
      moduleIds,
      loadedAt: new Date().toISOString(),
      tokenEfficiency: {
        totalTokens: Object.values(modules).reduce((sum, module) => 
          sum + this._estimateTokenSize(module), 0),
        cachedModules: moduleIds.length - uncachedModules.length,
        cacheHitRatio: (moduleIds.length - uncachedModules.length) / moduleIds.length
      }
    };

    // Cache the complete workflow
    this.set('workflows', workflowKey, workflow, { 
      priority: 4, // High priority for workflows
      workflowContext: workflowType
    });

    return workflow;
  }

  /**
   * Prefetch modules for anticipated workflow
   * @param {string} workflowType - Anticipated workflow
   * @param {Function} retrievalFunction - Module retrieval function
   */
  async prefetchWorkflow(workflowType, retrievalFunction) {
    const moduleIds = this._getWorkflowModules(workflowType);
    if (!moduleIds) return;

    for (const moduleId of moduleIds) {
      // Only prefetch if not already cached
      if (!this.get('modules', moduleId)) {
        try {
          const module = await retrievalFunction(moduleId);
          this.set('modules', moduleId, module, { 
            prefetched: true,
            workflowContext: workflowType,
            priority: 1 // Lower priority for prefetched
          });
          this.stats.prefetches++;
        } catch (error) {
          console.warn(`Prefetch failed for ${moduleId}:`, error.message);
        }
      }
    }
  }

  /**
   * Get module with workflow context optimization
   * @param {string} moduleId - Module identifier
   * @param {string} workflowContext - Current workflow context
   * @param {Function} retrievalFunction - Retrieval function if not cached
   * @returns {Promise<Object>} Module content
   */
  async getModuleWithContext(moduleId, workflowContext, retrievalFunction) {
    // Check cache with context awareness
    let module = this.get('modules', moduleId);
    if (module) return module;

    // Retrieve module
    module = await retrievalFunction(moduleId);
    
    // Cache with workflow context
    this.set('modules', moduleId, module, { 
      workflowContext,
      priority: this._getWorkflowPriority(workflowContext)
    });

    // Trigger related module prefetching
    if (this.config.prefetchEnabled) {
      this._prefetchRelatedModules(moduleId, workflowContext, retrievalFunction);
    }

    return module;
  }

  // ==================== TOKEN EFFICIENCY TRACKING ====================

  /**
   * Calculate token reduction achieved
   * @returns {Object} Token efficiency metrics
   */
  getTokenEfficiency() {
    const currentInitTokens = Math.max(this.tokenMetrics.optimizedInitialization, 500);
    const reduction = ((this.tokenMetrics.baselineInitialization - currentInitTokens) / 
                      this.tokenMetrics.baselineInitialization) * 100;

    return {
      baselineTokens: this.tokenMetrics.baselineInitialization,
      optimizedTokens: currentInitTokens,
      reductionPercentage: reduction,
      totalTokensSaved: this.tokenMetrics.totalTokensSaved,
      target: 81, // 81% reduction target
      achieved: reduction >= 81
    };
  }

  /**
   * Update initialization token count
   * @param {number} tokens - Tokens used for initialization
   */
  updateInitializationTokens(tokens) {
    this.tokenMetrics.optimizedInitialization = tokens;
    this.tokenMetrics.reductionPercentage = 
      ((this.tokenMetrics.baselineInitialization - tokens) / 
       this.tokenMetrics.baselineInitialization) * 100;
  }

  // ==================== PERFORMANCE ANALYTICS ====================

  /**
   * Get comprehensive cache statistics
   * @returns {Object} Detailed cache performance metrics
   */
  getStats() {
    const totalHits = Object.values(this.stats.hits).reduce((a, b) => a + b, 0);
    const totalMisses = Object.values(this.stats.misses).reduce((a, b) => a + b, 0);
    const totalRequests = totalHits + totalMisses;

    return {
      ...this.stats,
      totalRequests,
      overallHitRate: totalRequests > 0 ? (totalHits / totalRequests * 100) : 0,
      hitRates: {
        modules: this._calculateHitRate('modules'),
        workflows: this._calculateHitRate('workflows'),
        crossRefs: this._calculateHitRate('crossRefs'),
        searches: this._calculateHitRate('searches'),
        templates: this._calculateHitRate('templates')
      },
      cacheSizes: {
        modules: this.caches.modules.size,
        workflows: this.caches.workflows.size,
        crossRefs: this.caches.crossRefs.size,
        searches: this.caches.searches.size,
        templates: this.caches.templates.size
      },
      tokenEfficiency: this.getTokenEfficiency(),
      workflowOptimizations: this.stats.workflowOptimizations,
      memoryUsage: this._formatBytes(this.stats.totalSize)
    };
  }

  /**
   * Generate CK-specific performance report
   * @returns {string} Formatted performance report
   */
  generateReport() {
    const stats = this.getStats();
    const tokenEff = stats.tokenEfficiency;
    
    return `
=== CK Enhanced Cache Performance Report ===

Token Efficiency:
- Baseline Initialization: ${tokenEff.baselineTokens} tokens
- Optimized Initialization: ${tokenEff.optimizedTokens} tokens
- Reduction Achieved: ${tokenEff.reductionPercentage.toFixed(2)}%
- Target (81%): ${tokenEff.achieved ? '✓ ACHIEVED' : '✗ BELOW TARGET'}
- Total Tokens Saved: ${tokenEff.totalTokensSaved}

Cache Performance:
- Overall Hit Rate: ${stats.overallHitRate.toFixed(2)}%
- Target (80%): ${stats.overallHitRate >= 80 ? '✓ ACHIEVED' : '✗ BELOW TARGET'}
- Memory Usage: ${stats.memoryUsage}
- Evictions: ${stats.evictions}

Hit Rates by Type:
- Modules: ${stats.hitRates.modules.toFixed(2)}%
- Workflows: ${stats.hitRates.workflows.toFixed(2)}%
- Cross-Refs: ${stats.hitRates.crossRefs.toFixed(2)}%
- Searches: ${stats.hitRates.searches.toFixed(2)}%
- Templates: ${stats.hitRates.templates.toFixed(2)}%

Workflow Optimizations:
- Workflow Cache Hits: ${stats.workflowOptimizations}
- Prefetches: ${stats.prefetches}
- Module Usage Patterns: ${this.workflowPatterns.size}

System Status: ${this._getSystemStatus(stats)}
    `.trim();
  }

  // ==================== PRIVATE METHODS ====================

  _getTimeoutForType(cacheType) {
    // Different timeouts for different cache types
    const timeouts = {
      modules: this.config.cacheTimeout,
      workflows: this.config.cacheTimeout * 2, // Workflows last longer
      crossRefs: this.config.cacheTimeout,
      searches: this.config.cacheTimeout / 2, // Searches expire faster
      templates: this.config.cacheTimeout * 3 // Templates last longest
    };
    return timeouts[cacheType] || this.config.cacheTimeout;
  }

  _calculatePriority(cacheType, key, options) {
    let priority = options.priority || 2; // Default medium priority
    
    // Adjust based on cache type
    const typePriorities = {
      workflows: 4,    // Highest - complete workflows
      templates: 3,    // High - handoff templates
      modules: 2,      // Medium - individual modules
      crossRefs: 2,    // Medium - cross-references
      searches: 1      // Low - search results
    };
    
    priority = Math.max(priority, typePriorities[cacheType] || 2);
    
    // Boost priority for frequently used modules
    if (cacheType === 'modules') {
      const frequency = this.moduleUsageFrequency.get(key) || 0;
      if (frequency > 5) priority += 1;
    }
    
    return Math.min(priority, 5); // Cap at 5
  }

  _estimateTokenSize(data) {
    // More accurate token estimation for CK content
    if (typeof data === 'string') {
      return Math.ceil(data.length / 3.5); // Slightly more accurate
    }
    
    const jsonString = JSON.stringify(data);
    return Math.ceil(jsonString.length / 3.5);
  }

  _calculateSize(data) {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16
    }
    return JSON.stringify(data).length * 2;
  }

  _ensureCapacity(newItemSize) {
    const totalCapacity = this.config.maxCacheSize * 1024; // Convert to bytes
    
    while (this.stats.totalSize + newItemSize > totalCapacity && this.accessQueue.length > 0) {
      this._evictLeastRecentlyUsed();
    }
  }

  _evictLeastRecentlyUsed() {
    if (this.accessQueue.length === 0) return;

    // Find lowest priority item among least recently used
    const candidate = this.accessQueue[0];
    let lowestPriority = 5;
    let evictKey = candidate;

    for (let i = 0; i < Math.min(5, this.accessQueue.length); i++) {
      const key = this.accessQueue[i];
      const item = this._findItemInCaches(key);
      if (item && item.priority < lowestPriority) {
        lowestPriority = item.priority;
        evictKey = key;
      }
    }

    // Remove from appropriate cache
    const item = this._findItemInCaches(evictKey);
    if (item) {
      const cache = this.caches[item.cacheType];
      cache.delete(evictKey);
      this._removeFromAccessQueue(evictKey);
      this.stats.totalSize -= item.size;
      this.stats.evictions++;
    }
  }

  _findItemInCaches(key) {
    for (const [cacheType, cache] of Object.entries(this.caches)) {
      if (cache.has(key)) {
        const item = cache.get(key);
        return { ...item, cacheType };
      }
    }
    return null;
  }

  _updateAccessQueue(key) {
    const existingIndex = this.accessIndex.get(key);
    
    if (existingIndex !== undefined) {
      // Move to end
      this.accessQueue.splice(existingIndex, 1);
      this.accessQueue.push(key);
      
      // Update indices
      for (let i = existingIndex; i < this.accessQueue.length; i++) {
        this.accessIndex.set(this.accessQueue[i], i);
      }
    } else {
      // Add to end
      this.accessQueue.push(key);
      this.accessIndex.set(key, this.accessQueue.length - 1);
    }
  }

  _removeFromAccessQueue(key) {
    const index = this.accessIndex.get(key);
    if (index !== undefined) {
      this.accessQueue.splice(index, 1);
      this.accessIndex.delete(key);
      
      // Update indices
      for (let i = index; i < this.accessQueue.length; i++) {
        this.accessIndex.set(this.accessQueue[i], i);
      }
    }
  }

  _triggerWorkflowPrefetch(moduleId, data) {
    // Prefetch related modules based on cross-references
    if (data.document_level_cross_references) {
      data.document_level_cross_references.forEach(ref => {
        if (ref.target_document_id && ref.target_document_id.startsWith('CK')) {
          setTimeout(() => {
            // This would trigger actual prefetch in full implementation
            console.debug(`Would prefetch ${ref.target_document_id} for workflow optimization`);
          }, 0);
        }
      });
    }
  }

  _learnWorkflowPattern(cacheType, key, workflowContext) {
    if (!workflowContext) return;
    
    const pattern = `${workflowContext}:${key}`;
    const count = this.workflowPatterns.get(pattern) || 0;
    this.workflowPatterns.set(pattern, count + 1);
  }

  _updateUsageFrequency(moduleId) {
    const count = this.moduleUsageFrequency.get(moduleId) || 0;
    this.moduleUsageFrequency.set(moduleId, count + 1);
  }

  _calculateHitRate(cacheType) {
    const hits = this.stats.hits[cacheType];
    const misses = this.stats.misses[cacheType];
    const total = hits + misses;
    return total > 0 ? (hits / total * 100) : 0;
  }

  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  _getSystemStatus(stats) {
    const cacheOk = stats.overallHitRate >= 80;
    const tokenOk = stats.tokenEfficiency.reductionPercentage >= 75;
    
    if (cacheOk && tokenOk) return '🟢 OPTIMAL';
    if (cacheOk || tokenOk) return '🟡 GOOD';
    return '🔴 NEEDS OPTIMIZATION';
  }

  _getWorkflowModules(workflowType) {
    // Define workflow module dependencies
    const workflows = {
      'handoff_creation': ['ck4.1', 'ck2.1', 'ck3.1'],
      'task_generation': ['ck3.1', 'ck3.2', 'ck2.1'],
      'session_initialization': ['ck1.1', 'ck1.2', 'ck1.3'],
      'quality_assurance': ['ck2.1', 'ck2.2', 'ck4.1']
    };
    return workflows[workflowType];
  }

  _getWorkflowPriority(workflowContext) {
    const priorities = {
      'handoff_creation': 4,
      'session_initialization': 4,
      'task_generation': 3,
      'quality_assurance': 3
    };
    return priorities[workflowContext] || 2;
  }

  async _batchRetrieveModules(moduleIds, retrievalFunction) {
    const promises = moduleIds.map(id => retrievalFunction(id));
    const modules = await Promise.all(promises);
    
    const result = {};
    moduleIds.forEach((id, index) => {
      result[id] = modules[index];
    });
    
    return result;
  }

  async _prefetchRelatedModules(moduleId, workflowContext, retrievalFunction) {
    // This would implement intelligent related module prefetching
    console.debug(`Would prefetch related modules for ${moduleId} in ${workflowContext}`);
  }

  /**
   * Clear specific cache type or all caches
   * @param {string} cacheType - Cache type to clear (optional)
   */
  clear(cacheType = null) {
    if (cacheType) {
      this.caches[cacheType].clear();
    } else {
      Object.values(this.caches).forEach(cache => cache.clear());
      this.accessQueue = [];
      this.accessIndex.clear();
      this.stats.totalSize = 0;
      this.workflowPatterns.clear();
      this.moduleUsageFrequency.clear();
    }
  }
}

export { CKEnhancedCacheSystem };