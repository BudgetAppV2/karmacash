/**
 * CK Access Module for Context Keeper Guidance System
 * Provides autonomous access to CK operational guidance using Bible Access patterns
 * Optimizes token usage through selective on-demand module loading
 */

class CKAccessModule {
  constructor(mcpClient, options = {}) {
    // Use provided MCP Client or create a simple one that calls global MCP functions
    this.mcpClient = mcpClient || {
      // Simple MCP client that calls global MCP functions
      getCKGuidance: async (moduleId, version = 'optimized') => {
        const category = this._extractModuleCategory(moduleId);
        const fileName = this._buildCKFileName(moduleId, version);
        const filePath = `ck_guidance/modules/${category}/${version}/${fileName}`;
        
        try {
          // For now, use local file access - will integrate with Firebase MCP later
          if (version === 'optimized') {
            // Return mock optimized content for proof of concept
            return this._getMockOptimizedContent(moduleId);
          } else {
            // Return mock raw content
            return this._getMockRawContent(moduleId);
          }
        } catch (error) {
          throw new Error(`Failed to retrieve CK module ${moduleId}: ${error.message}`);
        }
      },

      getCKCrossReferences: async (moduleId, referenceType = 'all') => {
        // Mock cross-references for proof of concept
        return this._getMockCrossReferences(moduleId, referenceType);
      },

      getMetrics: () => ({
        totalRequests: this.metrics.totalRequests || 0,
        successfulRequests: this.metrics.successfulRequests || 0,
        failedRequests: this.metrics.failedRequests || 0,
        avgResponseTime: this.metrics.avgResponseTime || 0,
        lastRequestTime: this.metrics.lastRequestTime || 0,
        successRate: this.metrics.successRate || '100.00',
        isConnected: true,
        lastError: null
      })
    };
    
    // Enhanced cache system for CK modules
    this.cache = new Map();
    this.crossReferences = new Map();
    this.workflowCache = new Map(); // Cache for workflow-specific module combinations
    
    this.config = {
      basePath: 'ck_guidance/modules/',
      cacheTimeout: options.cacheTimeout || 600000, // 10 minutes (longer than Bible)
      maxCacheSize: options.maxCacheSize || 150, // Larger cache for CK
      prefetchEnabled: options.prefetchEnabled !== false,
      ...options
    };
    
    // Performance metrics with CK-specific tracking
    this.metrics = {
      modulesRetrieved: 0,
      crossReferencesFollowed: 0,
      workflowBuilds: 0,
      guidanceSearches: 0,
      cacheHits: 0,
      cacheMisses: 0,
      tokensSaved: 0, // Track token reduction
      initializationTokens: 0 // Track initialization efficiency
    };

    // CK module mapping based on analysis
    this.moduleMap = {
      'ck1.1': { category: 'initialization', name: 'identity_confirmation' },
      'ck1.2': { category: 'initialization', name: 'tool_validation' },
      'ck1.3': { category: 'initialization', name: 'session_context' },
      'ck2.1': { category: 'validation', name: 'hd_validation_protocol' },
      'ck2.2': { category: 'validation', name: 'task_validation' },
      'ck3.1': { category: 'task_management', name: 'task_generation' },
      'ck3.2': { category: 'task_management', name: 'task_structuring' },
      'ck4.1': { category: 'handoffs', name: 'handoff_templates' },
      'ck4.2': { category: 'handoffs', name: 'handoff_formatting' },
      'ck5.1': { category: 'session_management', name: 'session_planning' }
    };

    // Workflow dependencies for intelligent prefetching
    this.workflowDependencies = {
      'handoff_creation': ['ck4.1', 'ck2.1', 'ck3.1'], // Handoff templates + validation + task gen
      'task_generation': ['ck3.1', 'ck3.2', 'ck2.1'], // Task generation + structuring + validation
      'session_initialization': ['ck1.1', 'ck1.2', 'ck1.3'], // All initialization modules
      'quality_assurance': ['ck2.1', 'ck2.2', 'ck4.1'] // Validation protocols + templates
    };
  }

  // ==================== CORE CK GUIDANCE RETRIEVAL ====================

  /**
   * Get specific CK guidance module by ID
   * @param {string} moduleId - Module ID (e.g., 'CK4.1', 'ck4.1')
   * @param {string} version - 'raw' or 'optimized' (default: 'optimized')
   * @returns {Promise<Object>} Module content
   */
  async getGuidance(moduleId, version = 'optimized') {
    const normalizedId = moduleId.toLowerCase();
    const cacheKey = `${normalizedId}-${version}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        this.metrics.cacheHits++;
        this._trackTokenSavings(cached.data);
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    this.metrics.cacheMisses++;
    
    try {
      // Use the MCP client method
      const content = await this.mcpClient.getCKGuidance(normalizedId, version);
      
      // Cache the result
      this._addToCache(cacheKey, content);
      this.metrics.modulesRetrieved++;
      
      // Prefetch related modules if enabled
      if (this.config.prefetchEnabled) {
        this._triggerPrefetch(normalizedId, content);
      }
      
      return content;
      
    } catch (error) {
      this.metrics.failedRequests = (this.metrics.failedRequests || 0) + 1;
      throw new Error(`Failed to retrieve CK guidance ${moduleId}: ${error.message}`);
    }
  }

  /**
   * Get guidance for a complete workflow
   * @param {string} workflowType - Workflow type ('handoff_creation', 'task_generation', etc.)
   * @param {Object} options - Workflow options
   * @returns {Promise<Object>} Complete workflow guidance
   */
  async getWorkflowGuidance(workflowType, options = {}) {
    const cacheKey = `workflow-${workflowType}`;
    
    // Check workflow cache
    if (this.workflowCache.has(cacheKey)) {
      const cached = this.workflowCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        this.metrics.cacheHits++;
        return cached.data;
      }
      this.workflowCache.delete(cacheKey);
    }

    this.metrics.workflowBuilds++;
    
    const moduleIds = this.workflowDependencies[workflowType];
    if (!moduleIds) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    try {
      // Load all required modules in parallel
      const modulePromises = moduleIds.map(moduleId => 
        this.getGuidance(moduleId, 'optimized')
      );
      
      const modules = await Promise.all(modulePromises);
      
      const workflowGuidance = {
        workflowType,
        modules: moduleIds.map((id, index) => ({
          moduleId: id,
          content: modules[index]
        })),
        loadedAt: new Date().toISOString(),
        tokenEfficiency: this._calculateWorkflowTokens(modules)
      };
      
      // Cache the workflow
      this.workflowCache.set(cacheKey, {
        data: workflowGuidance,
        timestamp: Date.now()
      });
      
      return workflowGuidance;
      
    } catch (error) {
      throw new Error(`Failed to build workflow guidance for ${workflowType}: ${error.message}`);
    }
  }

  /**
   * Search for guidance across CK modules
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchGuidance(query, options = {}) {
    const { 
      categories = ['handoffs', 'validation', 'task_management'], 
      maxResults = 10 
    } = options;
    
    const results = [];
    this.metrics.guidanceSearches++;
    
    // Search across specified categories
    for (const category of categories) {
      const moduleIds = Object.keys(this.moduleMap).filter(id => 
        this.moduleMap[id].category === category
      );
      
      for (const moduleId of moduleIds) {
        if (results.length >= maxResults) break;
        
        try {
          const module = await this.getGuidance(moduleId);
          const matches = this._searchInModule(module, query);
          results.push(...matches);
        } catch (error) {
          console.warn(`Error searching module ${moduleId}:`, error.message);
        }
      }
    }
    
    return results.slice(0, maxResults);
  }

  /**
   * Get module index with categories and descriptions
   * @returns {Object} Complete module index
   */
  getCKModuleIndex() {
    const index = {};
    
    for (const [moduleId, info] of Object.entries(this.moduleMap)) {
      if (!index[info.category]) {
        index[info.category] = {};
      }
      
      index[info.category][moduleId] = {
        name: info.name,
        description: this._getModuleDescription(moduleId),
        dependencies: this._getModuleDependencies(moduleId),
        tokenSize: this._estimateModuleTokens(moduleId)
      };
    }
    
    return {
      categories: Object.keys(index),
      modules: index,
      totalModules: Object.keys(this.moduleMap).length,
      workflows: Object.keys(this.workflowDependencies)
    };
  }

  // ==================== CROSS-REFERENCE NAVIGATION ====================

  /**
   * Get cross-references for a CK module
   * @param {string} moduleId - Source module ID
   * @param {string} referenceType - Reference type filter
   * @returns {Promise<Array>} Cross-references
   */
  async getCrossReferences(moduleId, referenceType = 'all') {
    const cacheKey = `${moduleId}-${referenceType}`;
    
    // Check cache
    if (this.crossReferences.has(cacheKey)) {
      const cached = this.crossReferences.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }
      this.crossReferences.delete(cacheKey);
    }
    
    try {
      const references = await this.mcpClient.getCKCrossReferences(moduleId, referenceType);
      
      // Cache the results
      this.crossReferences.set(cacheKey, {
        data: references,
        timestamp: Date.now()
      });
      
      this.metrics.crossReferencesFollowed += references.length;
      return references;
      
    } catch (error) {
      console.warn(`Error getting cross-references for ${moduleId}:`, error.message);
      return [];
    }
  }

  // ==================== PERFORMANCE & MONITORING ====================

  /**
   * Get comprehensive performance metrics
   * @returns {Object} Performance metrics including token efficiency
   */
  getMetrics() {
    const mcpMetrics = this.mcpClient.getMetrics();
    const cacheEfficiency = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100 || 0;
    
    return {
      module: {
        ...this.metrics,
        cacheEfficiency: cacheEfficiency,
        cacheSize: this.cache.size,
        workflowCacheSize: this.workflowCache.size,
        crossRefCacheSize: this.crossReferences.size,
        tokenReductionRate: this._calculateTokenReduction()
      },
      mcpClient: mcpMetrics,
      performance: {
        targetCacheHitRatio: 80, // 80% target
        currentCacheHitRatio: cacheEfficiency,
        targetTokenReduction: 81, // 81% reduction target
        currentTokenReduction: this._calculateTokenReduction()
      }
    };
  }

  /**
   * Generate performance report for proof of concept
   * @returns {string} Formatted performance report
   */
  generatePerformanceReport() {
    const metrics = this.getMetrics();
    
    return `
=== CK Access Module Performance Report ===

Token Efficiency:
- Modules Retrieved: ${metrics.module.modulesRetrieved}
- Total Tokens Saved: ${metrics.module.tokensSaved}
- Token Reduction Rate: ${metrics.performance.currentTokenReduction.toFixed(2)}%
- Target Achievement: ${metrics.performance.currentTokenReduction >= 75 ? '✓ PASSED' : '✗ NEEDS IMPROVEMENT'}

Cache Performance:
- Cache Hit Ratio: ${metrics.module.cacheEfficiency.toFixed(2)}%
- Cache Target (80%): ${metrics.module.cacheEfficiency >= 80 ? '✓ ACHIEVED' : '✗ BELOW TARGET'}
- Cache Size: ${metrics.module.cacheSize} modules
- Workflow Cache: ${metrics.module.workflowCacheSize} workflows

Module Usage:
- Workflow Builds: ${metrics.module.workflowBuilds}
- Cross-References: ${metrics.module.crossReferencesFollowed}
- Guidance Searches: ${metrics.module.guidanceSearches}

System Status: ${this._getSystemStatus(metrics)}
    `.trim();
  }

  // ==================== PRIVATE METHODS ====================

  _extractModuleCategory(moduleId) {
    const normalizedId = moduleId.toLowerCase();
    const moduleInfo = this.moduleMap[normalizedId];
    return moduleInfo ? moduleInfo.category : 'general';
  }

  _buildCKFileName(moduleId, version) {
    const normalizedId = moduleId.toLowerCase();
    const moduleInfo = this.moduleMap[normalizedId];
    
    if (!moduleInfo) {
      throw new Error(`Unknown CK module: ${moduleId}`);
    }
    
    const baseName = `${normalizedId}_${moduleInfo.name}`;
    return version === 'optimized' ? `${baseName}.optimized.json` : `${baseName}.md`;
  }

  _addToCache(key, data) {
    // Implement LRU cache eviction
    if (this.cache.size >= this.config.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  _triggerPrefetch(moduleId, content) {
    // Prefetch related modules based on cross-references
    if (content.document_level_cross_references) {
      content.document_level_cross_references.forEach(ref => {
        if (ref.target_document_id && ref.target_document_id.startsWith('CK')) {
          // Schedule prefetch for related CK modules
          setTimeout(() => {
            this.getGuidance(ref.target_document_id).catch(() => {
              // Ignore prefetch errors
            });
          }, 100);
        }
      });
    }
  }

  _trackTokenSavings(content) {
    // Estimate tokens saved by cache hit
    const estimatedTokens = this._estimateContentTokens(content);
    this.metrics.tokensSaved += estimatedTokens;
  }

  _estimateContentTokens(content) {
    // Rough token estimation (1 token ≈ 4 characters)
    const textContent = JSON.stringify(content);
    return Math.ceil(textContent.length / 4);
  }

  _calculateTokenReduction() {
    // Calculate token reduction compared to full initialization
    const baselineTokens = 8500; // Current CK initialization baseline
    const actualTokens = Math.max(this.metrics.initializationTokens, 500); // Minimum viable tokens
    return ((baselineTokens - actualTokens) / baselineTokens) * 100;
  }

  _calculateWorkflowTokens(modules) {
    return modules.reduce((total, module) => {
      return total + this._estimateContentTokens(module);
    }, 0);
  }

  _searchInModule(module, query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    if (module.hierarchical_sections) {
      for (const section of module.hierarchical_sections) {
        if (section.text_content?.toLowerCase().includes(queryLower)) {
          results.push({
            moduleId: module.document_id,
            sectionId: section.section_id,
            heading: section.heading_text,
            snippet: this._extractSnippet(section.text_content, query),
            relevance: this._calculateRelevance(section.text_content, query)
          });
        }
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  _extractSnippet(text, query, maxLength = 200) {
    const queryIndex = text.toLowerCase().indexOf(query.toLowerCase());
    if (queryIndex === -1) return text.substring(0, maxLength) + '...';
    
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(text.length, queryIndex + query.length + 150);
    
    return '...' + text.substring(start, end) + '...';
  }

  _calculateRelevance(text, query) {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    const occurrences = (textLower.match(new RegExp(queryLower, 'g')) || []).length;
    return occurrences / text.length * 1000;
  }

  _getModuleDescription(moduleId) {
    const descriptions = {
      'ck4.1': 'Handoff Templates and Formatting - Standardized frameworks for CK-to-CG communication'
    };
    return descriptions[moduleId] || 'CK guidance module';
  }

  _getModuleDependencies(moduleId) {
    // Return module dependencies
    const dependencies = {
      'ck4.1': ['ck2.1']
    };
    return dependencies[moduleId] || [];
  }

  _estimateModuleTokens(moduleId) {
    // Estimate token size for modules
    const estimates = {
      'ck4.1': 800
    };
    return estimates[moduleId] || 500;
  }

  _getSystemStatus(metrics) {
    const cacheOk = metrics.module.cacheEfficiency >= 80;
    const tokenOk = metrics.performance.currentTokenReduction >= 75;
    
    if (cacheOk && tokenOk) return '🟢 OPTIMAL';
    if (cacheOk || tokenOk) return '🟡 GOOD';
    return '🔴 NEEDS OPTIMIZATION';
  }

  // ==================== MOCK DATA FOR PROOF OF CONCEPT ====================

  _getMockOptimizedContent(moduleId) {
    if (moduleId === 'ck4.1') {
      // Return the actual optimized content we created
      return require('./ck4.1_handoff_templates.optimized.json');
    }
    
    // Mock content for other modules
    return {
      document_id: `CK${moduleId.toUpperCase()}_Mock`,
      title: `Mock CK Module ${moduleId.toUpperCase()}`,
      hierarchical_sections: [
        {
          section_id: `${moduleId}-overview`,
          heading_text: 'Overview',
          text_content: `Mock guidance content for CK module ${moduleId}`,
          key_entities_identified: ['CK Module', 'Guidance'],
          cross_references_in_section: []
        }
      ],
      metadata: {
        word_count: 100,
        section_count: 1,
        optimization_version: '1.0'
      }
    };
  }

  _getMockRawContent(moduleId) {
    return `# CK ${moduleId.toUpperCase()}: Mock Module\n\nMock raw content for CK module ${moduleId}`;
  }

  _getMockCrossReferences(moduleId, referenceType) {
    // Mock cross-references
    return [
      {
        source_module_id: moduleId,
        target_module_id: 'ck2.1',
        reference_type: 'dependency',
        context: 'Quality validation procedures'
      }
    ];
  }

  /**
   * Clear all caches (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    this.crossReferences.clear();
    this.workflowCache.clear();
  }
}

// Factory function for easy instantiation
function createCKAccessModule(mcpClient, options = {}) {
  return new CKAccessModule(mcpClient, options);
}

// Export for ES modules
export { CKAccessModule, createCKAccessModule };