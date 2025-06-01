/**
 * Advanced Cache Manager
 * 
 * Multi-layer caching system with persistence, invalidation, and optimization
 * for chart data and aggregations
 */

class CacheManager {
  constructor(options = {}) {
    this.options = {
      maxMemorySize: options.maxMemorySize || 50 * 1024 * 1024, // 50MB
      maxDiskSize: options.maxDiskSize || 100 * 1024 * 1024, // 100MB
      defaultTTL: options.defaultTTL || 5 * 60 * 1000, // 5 minutes
      persistToDisk: options.persistToDisk || true,
      enableCompression: options.enableCompression || true,
      debugMode: options.debugMode || false
    };

    // Multi-layer cache structure
    this.memoryCache = new Map();
    this.diskCache = new Map();
    this.metadata = new Map();
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      operations: 0
    };

    // Cache invalidation tracking
    this.dependencies = new Map();
    this.tags = new Map();
    
    // Initialize disk storage if enabled
    if (this.options.persistToDisk && typeof window !== 'undefined') {
      this._initializeDiskStorage();
    }

    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this._performCleanup();
    }, 60000); // Every minute
  }

  /**
   * Get data from cache with automatic fallback
   * @param {string} key - Cache key
   * @param {Object} options - Cache options
   * @returns {any|null} Cached data or null
   */
  async get(key, options = {}) {
    this.stats.operations++;
    
    try {
      // Check memory cache first
      const memoryResult = this._getFromMemory(key);
      if (memoryResult !== null) {
        this.stats.hits++;
        this._updateAccessTime(key);
        return memoryResult;
      }

      // Check disk cache if enabled
      if (this.options.persistToDisk) {
        const diskResult = await this._getFromDisk(key);
        if (diskResult !== null) {
          this.stats.hits++;
          // Promote to memory cache
          this._setInMemory(key, diskResult, options);
          return diskResult;
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this._logError('Cache get error', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set data in cache with intelligent storage decisions
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {Object} options - Cache options
   */
  async set(key, data, options = {}) {
    const {
      ttl = this.options.defaultTTL,
      tags = [],
      dependencies = [],
      priority = 'normal', // 'low', 'normal', 'high'
      compress = this.options.enableCompression
    } = options;

    try {
      const serializedData = compress ? this._compress(data) : data;
      const size = this._calculateSize(serializedData);
      
      // Store metadata
      this._setMetadata(key, {
        size,
        ttl,
        createdAt: Date.now(),
        accessedAt: Date.now(),
        priority,
        compressed: compress,
        tags,
        dependencies
      });

      // Decide storage location based on size and priority
      if (this._shouldStoreInMemory(size, priority)) {
        this._setInMemory(key, serializedData, options);
      }

      // Store to disk if enabled and appropriate
      if (this.options.persistToDisk && this._shouldStoreToDisk(size, priority)) {
        await this._setToDisk(key, serializedData, options);
      }

      // Update tag mappings for invalidation
      this._updateTagMappings(key, tags);
      
      // Update dependency mappings
      this._updateDependencyMappings(key, dependencies);

      this.stats.totalSize += size;
      
      // Perform eviction if necessary
      this._performEvictionIfNeeded();
      
    } catch (error) {
      this._logError('Cache set error', error);
    }
  }

  /**
   * Invalidate cache entries by key pattern or tags
   * @param {string|Array|Object} criteria - Invalidation criteria
   */
  async invalidate(criteria) {
    try {
      let keysToInvalidate = [];

      if (typeof criteria === 'string') {
        // Single key or pattern
        if (criteria.includes('*')) {
          keysToInvalidate = this._getKeysByPattern(criteria);
        } else {
          keysToInvalidate = [criteria];
        }
      } else if (Array.isArray(criteria)) {
        // Array of keys or tags
        keysToInvalidate = criteria;
      } else if (criteria.tags) {
        // Invalidate by tags
        keysToInvalidate = this._getKeysByTags(criteria.tags);
      } else if (criteria.dependencies) {
        // Invalidate by dependencies
        keysToInvalidate = this._getKeysByDependencies(criteria.dependencies);
      }

      // Remove from all cache layers
      for (const key of keysToInvalidate) {
        await this._removeFromAllLayers(key);
      }

      this._logDebug(`Invalidated ${keysToInvalidate.length} cache entries`);
      
    } catch (error) {
      this._logError('Cache invalidation error', error);
    }
  }

  /**
   * Get or set with automatic fallback to generator function
   * @param {string} key - Cache key
   * @param {Function} generator - Function to generate data if not cached
   * @param {Object} options - Cache options
   * @returns {any} Cached or generated data
   */
  async getOrSet(key, generator, options = {}) {
    // Try to get from cache first
    let data = await this.get(key, options);
    
    if (data !== null) {
      return data;
    }

    // Generate data if not in cache
    try {
      data = await generator();
      
      // Cache the generated data
      await this.set(key, data, options);
      
      return data;
    } catch (error) {
      this._logError('Generator function error', error);
      throw error;
    }
  }

  /**
   * Warm up cache with precomputed data
   * @param {Array} entries - Array of {key, data, options} objects
   */
  async warmup(entries) {
    this._logDebug(`Warming up cache with ${entries.length} entries`);
    
    const promises = entries.map(async ({ key, data, options = {} }) => {
      try {
        await this.set(key, data, { ...options, priority: 'high' });
      } catch (error) {
        this._logError(`Warmup error for key ${key}`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get cache statistics and health metrics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.operations > 0 
      ? (this.stats.hits / this.stats.operations * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryEntries: this.memoryCache.size,
      diskEntries: this.diskCache.size,
      totalEntries: this.metadata.size,
      memorySize: this._getMemorySize(),
      diskSize: this._getDiskSize(),
      averageEntrySize: this.metadata.size > 0 
        ? Math.round(this.stats.totalSize / this.metadata.size)
        : 0
    };
  }

  /**
   * Clear all cache data
   */
  async clear() {
    this.memoryCache.clear();
    this.diskCache.clear();
    this.metadata.clear();
    this.dependencies.clear();
    this.tags.clear();
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      operations: 0
    };

    if (this.options.persistToDisk && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('karmacash_cache');
        sessionStorage.removeItem('karmacash_cache_meta');
      } catch (error) {
        this._logError('Disk cache clear error', error);
      }
    }

    this._logDebug('Cache cleared');
  }

  /**
   * Export cache data for backup/migration
   * @returns {Object} Serializable cache data
   */
  async export() {
    const exportData = {
      version: '1.0',
      timestamp: Date.now(),
      memory: Object.fromEntries(this.memoryCache),
      disk: Object.fromEntries(this.diskCache),
      metadata: Object.fromEntries(this.metadata),
      stats: this.stats
    };

    return exportData;
  }

  /**
   * Import cache data from backup
   * @param {Object} data - Exported cache data
   */
  async import(data) {
    if (data.version !== '1.0') {
      throw new Error('Incompatible cache export version');
    }

    await this.clear();

    // Restore cache entries
    if (data.memory) {
      for (const [key, value] of Object.entries(data.memory)) {
        this.memoryCache.set(key, value);
      }
    }

    if (data.disk) {
      for (const [key, value] of Object.entries(data.disk)) {
        this.diskCache.set(key, value);
      }
    }

    if (data.metadata) {
      for (const [key, value] of Object.entries(data.metadata)) {
        this.metadata.set(key, value);
      }
    }

    this._logDebug('Cache data imported');
  }

  /**
   * Initialize disk storage using browser storage APIs
   * @private
   */
  _initializeDiskStorage() {
    try {
      // Try to load existing cache from localStorage
      const stored = localStorage.getItem('karmacash_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const [key, value] of Object.entries(parsed)) {
          this.diskCache.set(key, value);
        }
      }

      // Load metadata from sessionStorage
      const storedMeta = sessionStorage.getItem('karmacash_cache_meta');
      if (storedMeta) {
        const parsedMeta = JSON.parse(storedMeta);
        for (const [key, value] of Object.entries(parsedMeta)) {
          this.metadata.set(key, value);
        }
      }
    } catch (error) {
      this._logError('Disk storage initialization error', error);
    }
  }

  /**
   * Get data from memory cache
   * @private
   */
  _getFromMemory(key) {
    const data = this.memoryCache.get(key);
    if (data === undefined) return null;

    // Check if expired
    const metadata = this.metadata.get(key);
    if (metadata && this._isExpired(metadata)) {
      this._removeFromMemory(key);
      return null;
    }

    return this._decompress(data, metadata?.compressed);
  }

  /**
   * Get data from disk cache
   * @private
   */
  async _getFromDisk(key) {
    try {
      const data = this.diskCache.get(key);
      if (data === undefined) return null;

      // Check if expired
      const metadata = this.metadata.get(key);
      if (metadata && this._isExpired(metadata)) {
        await this._removeFromDisk(key);
        return null;
      }

      return this._decompress(data, metadata?.compressed);
    } catch (error) {
      this._logError('Disk cache read error', error);
      return null;
    }
  }

  /**
   * Set data in memory cache
   * @private
   */
  _setInMemory(key, data, options = {}) {
    this.memoryCache.set(key, data);
  }

  /**
   * Set data in disk cache
   * @private
   */
  async _setToDisk(key, data, options = {}) {
    try {
      this.diskCache.set(key, data);
      
      // Persist to localStorage (with size limits)
      if (this._getDiskSize() < this.options.maxDiskSize) {
        const diskData = Object.fromEntries(this.diskCache);
        localStorage.setItem('karmacash_cache', JSON.stringify(diskData));
        
        const metaData = Object.fromEntries(this.metadata);
        sessionStorage.setItem('karmacash_cache_meta', JSON.stringify(metaData));
      }
    } catch (error) {
      this._logError('Disk cache write error', error);
    }
  }

  /**
   * Remove from all cache layers
   * @private
   */
  async _removeFromAllLayers(key) {
    this._removeFromMemory(key);
    await this._removeFromDisk(key);
    this._removeMetadata(key);
  }

  /**
   * Check if cache entry should be stored in memory
   * @private
   */
  _shouldStoreInMemory(size, priority) {
    // High priority items always go to memory
    if (priority === 'high') return true;
    
    // Don't store large items in memory
    if (size > 1024 * 1024) return false; // 1MB limit
    
    // Check available memory space
    return this._getMemorySize() + size < this.options.maxMemorySize;
  }

  /**
   * Check if cache entry should be stored to disk
   * @private
   */
  _shouldStoreToDisk(size, priority) {
    // Don't persist low priority items
    if (priority === 'low') return false;
    
    // Check available disk space
    return this._getDiskSize() + size < this.options.maxDiskSize;
  }

  /**
   * Perform cache cleanup and eviction
   * @private
   */
  _performCleanup() {
    // Remove expired entries
    for (const [key, metadata] of this.metadata.entries()) {
      if (this._isExpired(metadata)) {
        this._removeFromAllLayers(key);
      }
    }

    // Perform eviction if over size limits
    this._performEvictionIfNeeded();
  }

  /**
   * Perform LRU eviction if needed
   * @private
   */
  _performEvictionIfNeeded() {
    // Memory eviction
    while (this._getMemorySize() > this.options.maxMemorySize) {
      const oldestKey = this._findOldestKey(this.memoryCache);
      if (oldestKey) {
        this._removeFromMemory(oldestKey);
        this.stats.evictions++;
      } else {
        break;
      }
    }

    // Disk eviction
    while (this._getDiskSize() > this.options.maxDiskSize) {
      const oldestKey = this._findOldestKey(this.diskCache);
      if (oldestKey) {
        this._removeFromDisk(oldestKey);
        this.stats.evictions++;
      } else {
        break;
      }
    }
  }

  /**
   * Find oldest cache key based on access time
   * @private
   */
  _findOldestKey(cache) {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const key of cache.keys()) {
      const metadata = this.metadata.get(key);
      if (metadata && metadata.accessedAt < oldestTime) {
        oldestTime = metadata.accessedAt;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Simple compression using JSON.stringify
   * @private
   */
  _compress(data) {
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data);
  }

  /**
   * Simple decompression
   * @private
   */
  _decompress(data, isCompressed) {
    if (!isCompressed || typeof data !== 'string') {
      return data;
    }
    
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  /**
   * Calculate approximate size of data
   * @private
   */
  _calculateSize(data) {
    return JSON.stringify(data).length * 2; // Rough estimate in bytes
  }

  /**
   * Get total memory cache size
   * @private
   */
  _getMemorySize() {
    let size = 0;
    for (const key of this.memoryCache.keys()) {
      const metadata = this.metadata.get(key);
      if (metadata) {
        size += metadata.size;
      }
    }
    return size;
  }

  /**
   * Get total disk cache size
   * @private
   */
  _getDiskSize() {
    let size = 0;
    for (const key of this.diskCache.keys()) {
      const metadata = this.metadata.get(key);
      if (metadata) {
        size += metadata.size;
      }
    }
    return size;
  }

  /**
   * Check if cache entry is expired
   * @private
   */
  _isExpired(metadata) {
    return Date.now() - metadata.createdAt > metadata.ttl;
  }

  /**
   * Update access time for LRU
   * @private
   */
  _updateAccessTime(key) {
    const metadata = this.metadata.get(key);
    if (metadata) {
      metadata.accessedAt = Date.now();
    }
  }

  /**
   * Log debug messages
   * @private
   */
  _logDebug(message) {
    if (this.options.debugMode) {
      console.log(`[CacheManager] ${message}`);
    }
  }

  /**
   * Get keys by tags for invalidation
   * @private
   */
  _getKeysByTags(tags) {
    const keys = [];
    for (const [key, metadata] of this.metadata.entries()) {
      if (metadata.tags && tags.some(tag => metadata.tags.includes(tag))) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Get keys by dependencies for invalidation
   * @private
   */
  _getKeysByDependencies(dependencies) {
    const keys = [];
    for (const [key, metadata] of this.metadata.entries()) {
      if (metadata.dependencies && dependencies.some(dep => metadata.dependencies.includes(dep))) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Get keys by pattern (with wildcard support)
   * @private
   */
  _getKeysByPattern(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keys = [];
    for (const key of this.metadata.keys()) {
      if (regex.test(key)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Update tag mappings for invalidation
   * @private
   */
  _updateTagMappings(key, tags) {
    for (const tag of tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(key);
    }
  }

  /**
   * Update dependency mappings
   * @private
   */
  _updateDependencyMappings(key, dependencies) {
    for (const dep of dependencies) {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep).add(key);
    }
  }

  /**
   * Set metadata for cache entry
   * @private
   */
  _setMetadata(key, metadata) {
    this.metadata.set(key, metadata);
  }

  /**
   * Remove metadata for cache entry
   * @private
   */
  _removeMetadata(key) {
    const metadata = this.metadata.get(key);
    if (metadata) {
      this.stats.totalSize -= metadata.size;
      this.metadata.delete(key);
    }
  }

  /**
   * Remove from memory cache
   * @private
   */
  _removeFromMemory(key) {
    this.memoryCache.delete(key);
  }

  /**
   * Remove from disk cache
   * @private
   */
  async _removeFromDisk(key) {
    this.diskCache.delete(key);
    // Update localStorage
    if (this.options.persistToDisk && typeof window !== 'undefined') {
      try {
        const diskData = Object.fromEntries(this.diskCache);
        localStorage.setItem('karmacash_cache', JSON.stringify(diskData));
      } catch (error) {
        this._logError('Disk cache update error', error);
      }
    }
  }

  /**
   * Log error messages
   * @private
   */
  _logError(message, error) {
    console.error(`[CacheManager] ${message}:`, error);
  }

  /**
   * Cleanup on destruction
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Export singleton instance
export default new CacheManager();