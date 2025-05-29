/**
 * Enhanced Caching System for Bible Access Module
 * Provides intelligent content retrieval, prefetching, and cache management
 */

class EnhancedCacheSystem {
    constructor(options = {}) {
      this.config = {
        maxCacheSize: options.maxCacheSize || 100,
        cacheTimeout: options.cacheTimeout || 300000, // 5 minutes
        prefetchEnabled: options.prefetchEnabled !== false,
        compressionEnabled: options.compressionEnabled !== false,
        persistentCache: options.persistentCache || false,
        ...options
      };
  
      // Multi-level cache structure
      this.caches = {
        documents: new Map(),      // Full documents
        sections: new Map(),       // Document sections/chunks
        crossRefs: new Map(),      // Cross-references
        metadata: new Map(),       // File metadata
        searches: new Map()        // Search results
      };
  
      // Cache statistics
      this.stats = {
        hits: { documents: 0, sections: 0, crossRefs: 0, metadata: 0, searches: 0 },
        misses: { documents: 0, sections: 0, crossRefs: 0, metadata: 0, searches: 0 },
        evictions: 0,
        prefetches: 0,
        totalSize: 0
      };
  
      // Priority queue for LRU eviction
      this.accessQueue = [];
      this.accessIndex = new Map();
  
      // Prefetch patterns learned from usage
      this.prefetchPatterns = new Map();
    }
  
    // ==================== CACHE OPERATIONS ====================
  
    /**
     * Get cached item with automatic prefetching
     * @param {string} cacheType - Type of cache (documents, sections, etc.)
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
  
      // Check expiration
      if (Date.now() - item.timestamp > this.config.cacheTimeout) {
        cache.delete(key);
        this._removeFromAccessQueue(key);
        this.stats.misses[cacheType]++;
        return null;
      }
  
      // Update access time and queue
      item.lastAccess = Date.now();
      this._updateAccessQueue(key);
      this.stats.hits[cacheType]++;
  
      // Trigger prefetch if enabled
      if (this.config.prefetchEnabled) {
        this._triggerPrefetch(cacheType, key, item.data);
      }
  
      return item.data;
    }
  
    /**
     * Store item in cache with compression and eviction
     * @param {string} cacheType - Type of cache
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {Object} options - Caching options
     */
    set(cacheType, key, data, options = {}) {
      const cache = this.caches[cacheType];
      if (!cache) return;
  
      // Compress data if enabled
      const processedData = this.config.compressionEnabled ? 
        this._compressData(data) : data;
  
      const item = {
        data: processedData,
        timestamp: Date.now(),
        lastAccess: Date.now(),
        compressed: this.config.compressionEnabled,
        size: this._calculateSize(processedData),
        priority: options.priority || 1,
        ...options
      };
  
      // Check if we need to evict items
      this._ensureCapacity(item.size);
  
      // Store item
      cache.set(key, item);
      this._updateAccessQueue(key);
      this.stats.totalSize += item.size;
  
      // Learn prefetch patterns
      if (this.config.prefetchEnabled) {
        this._learnPrefetchPattern(cacheType, key);
      }
    }
  
    /**
     * Remove item from cache
     * @param {string} cacheType - Type of cache
     * @param {string} key - Cache key
     */
    delete(cacheType, key) {
      const cache = this.caches[cacheType];
      if (!cache || !cache.has(key)) return;
  
      const item = cache.get(key);
      cache.delete(key);
      this._removeFromAccessQueue(key);
      this.stats.totalSize -= item.size;
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
      }
    }
  
    // ==================== INTELLIGENT RETRIEVAL ====================
  
    /**
     * Get document with intelligent section prefetching
     * @param {string} documentId - Document ID
     * @param {Function} retrievalFunction - Function to retrieve document if not cached
     * @returns {Promise<Object>} Document content
     */
    async getDocumentWithPrefetch(documentId, retrievalFunction) {
      // Check cache first
      let document = this.get('documents', documentId);
      if (document) return document;
  
      // Retrieve document
      document = await retrievalFunction(documentId);
      this.set('documents', documentId, document, { priority: 2 });
  
      // Prefetch related content
      if (this.config.prefetchEnabled && document.sections) {
        this._prefetchDocumentSections(documentId, document);
        this._prefetchCrossReferences(documentId);
      }
  
      return document;
    }
  
    /**
     * Get section with context prefetching
     * @param {string} documentId - Document ID
     * @param {string} sectionId - Section ID
     * @param {Function} retrievalFunction - Section retrieval function
     * @returns {Promise<Object>} Section content
     */
    async getSectionWithContext(documentId, sectionId, retrievalFunction) {
      const cacheKey = `${documentId}-${sectionId}`;
      
      // Check cache
      let section = this.get('sections', cacheKey);
      if (section) return section;
  
      // Retrieve section
      section = await retrievalFunction(documentId, sectionId);
      this.set('sections', cacheKey, section, { priority: 3 });
  
      // Prefetch adjacent sections
      if (this.config.prefetchEnabled) {
        this._prefetchAdjacentSections(documentId, sectionId);
      }
  
      return section;
    }
  
    /**
     * Batch retrieve multiple items with optimization
     * @param {Array} requests - Array of {type, key, retrievalFunction}
     * @returns {Promise<Array>} Retrieved items
     */
    async batchRetrieve(requests) {
      const results = [];
      const missingRequests = [];
  
      // Check cache for all requests
      for (const request of requests) {
        const cached = this.get(request.type, request.key);
        if (cached) {
          results.push({ ...request, data: cached, fromCache: true });
        } else {
          missingRequests.push(request);
        }
      }
  
      // Parallel retrieval of missing items
      if (missingRequests.length > 0) {
        const retrievalPromises = missingRequests.map(async (request) => {
          try {
            const data = await request.retrievalFunction();
            this.set(request.type, request.key, data);
            return { ...request, data, fromCache: false };
          } catch (error) {
            return { ...request, error: error.message, fromCache: false };
          }
        });
  
        const retrievedResults = await Promise.all(retrievalPromises);
        results.push(...retrievedResults);
      }
  
      return results;
    }
  
    // ==================== PREFETCHING SYSTEM ====================
  
    /**
     * Manually trigger prefetch for specific content
     * @param {string} contentType - Type of content to prefetch
     * @param {string} contentId - Content identifier
     * @param {Function} retrievalFunction - Retrieval function
     */
    async prefetch(contentType, contentId, retrievalFunction) {
      const cacheKey = contentId;
      
      // Don't prefetch if already cached
      if (this.get(contentType, cacheKey)) return;
  
      try {
        const data = await retrievalFunction();
        this.set(contentType, cacheKey, data, { 
          priority: 1, // Lower priority for prefetched items
          prefetched: true 
        });
        this.stats.prefetches++;
      } catch (error) {
        console.warn(`Prefetch failed for ${contentType}:${contentId}:`, error.message);
      }
    }
  
    // ==================== CACHE ANALYTICS ====================
  
    /**
     * Get comprehensive cache statistics
     * @returns {Object} Cache statistics
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
          documents: this._calculateHitRate('documents'),
          sections: this._calculateHitRate('sections'),
          crossRefs: this._calculateHitRate('crossRefs'),
          metadata: this._calculateHitRate('metadata'),
          searches: this._calculateHitRate('searches')
        },
        cacheSizes: {
          documents: this.caches.documents.size,
          sections: this.caches.sections.size,
          crossRefs: this.caches.crossRefs.size,
          metadata: this.caches.metadata.size,
          searches: this.caches.searches.size
        },
        memoryUsage: this._formatBytes(this.stats.totalSize),
        prefetchPatterns: this.prefetchPatterns.size
      };
    }
  
    /**
     * Generate cache performance report
     * @returns {string} Formatted performance report
     */
    generateReport() {
      const stats = this.getStats();
      
      return `
  === Cache Performance Report ===
  Total Requests: ${stats.totalRequests}
  Overall Hit Rate: ${stats.overallHitRate.toFixed(2)}%
  Memory Usage: ${stats.memoryUsage}
  Evictions: ${stats.evictions}
  Prefetches: ${stats.prefetches}
  
  Hit Rates by Type:
  - Documents: ${stats.hitRates.documents.toFixed(2)}%
  - Sections: ${stats.hitRates.sections.toFixed(2)}%
  - Cross-References: ${stats.hitRates.crossRefs.toFixed(2)}%
  - Metadata: ${stats.hitRates.metadata.toFixed(2)}%
  - Searches: ${stats.hitRates.searches.toFixed(2)}%
  
  Cache Sizes:
  - Documents: ${stats.cacheSizes.documents}
  - Sections: ${stats.cacheSizes.sections}
  - Cross-References: ${stats.cacheSizes.crossRefs}
  - Metadata: ${stats.cacheSizes.metadata}
  - Searches: ${stats.cacheSizes.searches}
  
  Learned Prefetch Patterns: ${stats.prefetchPatterns}
      `.trim();
    }
  
    // ==================== PRIVATE METHODS ====================
  
    _ensureCapacity(newItemSize) {
      const totalCapacity = this.config.maxCacheSize;
      
      while (this.stats.totalSize + newItemSize > totalCapacity && this.accessQueue.length > 0) {
        this._evictLeastRecentlyUsed();
      }
    }
  
    _evictLeastRecentlyUsed() {
      if (this.accessQueue.length === 0) return;
  
      const oldestKey = this.accessQueue.shift();
      this.accessIndex.delete(oldestKey);
  
      // Find and remove from appropriate cache
      for (const [cacheType, cache] of Object.entries(this.caches)) {
        if (cache.has(oldestKey)) {
          const item = cache.get(oldestKey);
          cache.delete(oldestKey);
          this.stats.totalSize -= item.size;
          this.stats.evictions++;
          break;
        }
      }
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
  
    _compressData(data) {
      // Simple compression - in real implementation, use proper compression library
      if (typeof data === 'string') {
        return data.replace(/\s+/g, ' ').trim();
      }
      return data;
    }
  
    _calculateSize(data) {
      // Rough size calculation
      if (typeof data === 'string') {
        return data.length * 2; // UTF-16
      }
      return JSON.stringify(data).length * 2;
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
  
    _triggerPrefetch(cacheType, key, data) {
      // Simple prefetch patterns based on content type
      if (cacheType === 'documents' && data.document_level_cross_references) {
        // Prefetch cross-referenced documents
        data.document_level_cross_references.forEach(ref => {
          if (ref.target_document_id) {
            this._schedulePrefetch('documents', ref.target_document_id);
          }
        });
      }
    }
  
    _prefetchDocumentSections(documentId, document) {
      if (document.sections) {
        document.sections.forEach(section => {
          const sectionKey = `${documentId}-${section.section_id}`;
          this._schedulePrefetch('sections', sectionKey);
        });
      }
    }
  
    _prefetchCrossReferences(documentId) {
      this._schedulePrefetch('crossRefs', documentId);
    }
  
    _prefetchAdjacentSections(documentId, sectionId) {
      // This would implement logic to prefetch adjacent sections
      // Based on document structure
    }
  
    _schedulePrefetch(type, key) {
      // Schedule prefetch for next tick to avoid blocking
      setTimeout(() => {
        if (!this.get(type, key)) {
          // Would trigger actual prefetch here
          console.debug(`Scheduling prefetch for ${type}:${key}`);
        }
      }, 0);
    }
  
    _learnPrefetchPattern(cacheType, key) {
      const pattern = `${cacheType}:${key}`;
      const count = this.prefetchPatterns.get(pattern) || 0;
      this.prefetchPatterns.set(pattern, count + 1);
    }
  }
  
  module.exports = { EnhancedCacheSystem };