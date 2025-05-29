/**
 * CK_Priming_v11 Integration Layer
 * Integrates Bible Access Module with the existing CK system
 * Provides seamless Bible content access for autonomous AI operations
 */

const { BibleAccessModule, createBibleAccessModule } = require('./bible-access-module');
const { FirebaseMCPClient } = require('./firebase-mcp-client');

class CKBibleIntegration {
  constructor(ckSystem, options = {}) {
    this.ckSystem = ckSystem;
    this.options = {
      autoInitialize: options.autoInitialize !== false,
      prefetchCommonContent: options.prefetchCommonContent !== false,
      enableContextualHelp: options.enableContextualHelp !== false,
      logPerformance: options.logPerformance !== false,
      ...options
    };
    
    // Initialize Bible Access Module
    this.bibleModule = null;
    this.isInitialized = false;
    this.initializationError = null;
    
    // Integration state
    this.lastQuery = null;
    this.queryHistory = [];
    this.contextCache = new Map();
    
    if (this.options.autoInitialize) {
      this.initialize().catch(error => {
        console.error('Auto-initialization failed:', error);
        this.initializationError = error;
      });
    }
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize the Bible Access Module integration
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    try {
      console.log('Initializing CK Bible Integration...');
      
      // Create MCP client
      const mcpClient = new FirebaseMCPClient({
        retryAttempts: 3,
        timeout: 30000,
        validateResponses: true
      });
      
      // Test connection
      await mcpClient.connect();
      console.log('✅ MCP Client connected successfully');
      
      // Create Bible Access Module
      this.bibleModule = createBibleAccessModule(mcpClient, {
        maxCacheSize: 100 * 1024 * 1024, // 100MB cache
        prefetchEnabled: true,
        cacheTimeout: 600000 // 10 minutes
      });
      
      console.log('✅ Bible Access Module created');
      
      // Prefetch common content if enabled
      if (this.options.prefetchCommonContent) {
        await this._prefetchCommonContent();
        console.log('✅ Common content prefetched');
      }
      
      this.isInitialized = true;
      console.log('🎉 CK Bible Integration initialized successfully');
      
      return true;
      
    } catch (error) {
      this.initializationError = error;
      console.error('❌ CK Bible Integration initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if integration is ready for use
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isInitialized && this.bibleModule !== null && !this.initializationError;
  }

  // ==================== CK SYSTEM INTEGRATION ====================

  /**
   * Enhance CK system with Bible content access
   * This method would be called by CK_Priming_v11 to add Bible capabilities
   */
  enhanceCKSystem() {
    if (!this.isReady()) {
      throw new Error('Bible integration not ready. Call initialize() first.');
    }
    
    // Add Bible-specific methods to CK system
    this.ckSystem.getBibleContent = this.getBibleContent.bind(this);
    this.ckSystem.searchBible = this.searchBible.bind(this);
    this.ckSystem.buildBibleContext = this.buildBibleContext.bind(this);
    this.ckSystem.getBibleSection = this.getBibleSection.bind(this);
    this.ckSystem.followBibleReference = this.followBibleReference.bind(this);
    
    // Add performance monitoring
    if (this.options.logPerformance) {
      this.ckSystem.getBiblePerformance = this.getPerformanceMetrics.bind(this);
    }
    
    // Add contextual help if enabled
    if (this.options.enableContextualHelp) {
      this.ckSystem.getBibleHelp = this.getContextualHelp.bind(this);
    }
    
    console.log('✅ CK System enhanced with Bible capabilities');
  }

  // ==================== AUTONOMOUS BIBLE ACCESS ====================

  /**
   * Get Bible content for CK autonomous operations
   * @param {string} documentId - Document ID (e.g., 'B1.1')
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Bible content with metadata
   */
  async getBibleContent(documentId, options = {}) {
    if (!this.isReady()) {
      throw new Error('Bible integration not initialized');
    }
    
    const startTime = Date.now();
    
    try {
      const { version = 'optimized', includeContext = false } = options;
      
      // Get primary document
      const document = await this.bibleModule.getDocument(documentId, version);
      
      const result = {
        document,
        documentId,
        version,
        retrievedAt: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
      
      // Include context if requested
      if (includeContext) {
        result.context = await this.bibleModule.buildContext(documentId, {
          includeExplicitRefs: true,
          includeSemanticRefs: false,
          maxDocuments: 3
        });
      }
      
      this._logQuery('getBibleContent', documentId, options, result.responseTime);
      return result;
      
    } catch (error) {
      this._logError('getBibleContent', documentId, error);
      throw error;
    }
  }

  /**
   * Search Bible content for specific information
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results with context
   */
  async searchBible(query, options = {}) {
    if (!this.isReady()) {
      throw new Error('Bible integration not initialized');
    }
    
    const startTime = Date.now();
    
    try {
      const searchOptions = {
        sections: options.sections || ['b1'],
        maxResults: options.maxResults || 5,
        ...options
      };
      
      const results = await this.bibleModule.searchContent(query, searchOptions);
      
      const response = {
        query,
        results,
        totalResults: results.length,
        searchedSections: searchOptions.sections,
        responseTime: Date.now() - startTime,
        searchedAt: new Date().toISOString()
      };
      
      this._logQuery('searchBible', query, options, response.responseTime);
      return response;
      
    } catch (error) {
      this._logError('searchBible', query, error);
      throw error;
    }
  }

  /**
   * Get specific Bible section for focused content
   * @param {string} documentId - Document ID
   * @param {string} sectionId - Section identifier
   * @returns {Promise<Object>} Section content
   */
  async getBibleSection(documentId, sectionId) {
    if (!this.isReady()) {
      throw new Error('Bible integration not initialized');
    }
    
    const startTime = Date.now();
    
    try {
      const section = await this.bibleModule.getSection(documentId, sectionId);
      
      const result = {
        section,
        documentId,
        sectionId,
        responseTime: Date.now() - startTime,
        retrievedAt: new Date().toISOString()
      };
      
      this._logQuery('getBibleSection', `${documentId}.${sectionId}`, {}, result.responseTime);
      return result;
      
    } catch (error) {
      this._logError('getBibleSection', `${documentId}.${sectionId}`, error);
      throw error;
    }
  }

  /**
   * Build contextual information for CK decision making
   * @param {string} primaryDocumentId - Main document
   * @param {Object} options - Context options
   * @returns {Promise<Object>} Rich context object
   */
  async buildBibleContext(primaryDocumentId, options = {}) {
    if (!this.isReady()) {
      throw new Error('Bible integration not initialized');
    }
    
    const cacheKey = `${primaryDocumentId}-${JSON.stringify(options)}`;
    
    // Check context cache
    if (this.contextCache.has(cacheKey)) {
      const cached = this.contextCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minute cache
        return cached.data;
      }
    }
    
    const startTime = Date.now();
    
    try {
      const context = await this.bibleModule.buildContext(primaryDocumentId, {
        includeExplicitRefs: true,
        includeSemanticRefs: options.includeSemanticRefs || false,
        maxDocuments: options.maxDocuments || 3,
        ...options
      });
      
      const result = {
        ...context,
        primaryDocumentId,
        contextBuiltAt: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
      
      // Cache the context
      this.contextCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      this._logQuery('buildBibleContext', primaryDocumentId, options, result.responseTime);
      return result;
      
    } catch (error) {
      this._logError('buildBibleContext', primaryDocumentId, error);
      throw error;
    }
  }

  /**
   * Follow cross-references autonomously
   * @param {string} sourceDocumentId - Source document
   * @param {string} targetReference - Target reference (e.g., 'B2.3')
   * @returns {Promise<Object>} Referenced content
   */
  async followBibleReference(sourceDocumentId, targetReference) {
    if (!this.isReady()) {
      throw new Error('Bible integration not initialized');
    }
    
    const startTime = Date.now();
    
    try {
      // Get cross-references for source document
      const crossRefs = await this.bibleModule.getCrossReferences(sourceDocumentId);
      
      // Find the specific reference
      const targetRef = crossRefs.find(ref => 
        ref.target_doc_id === targetReference ||
        ref.context_snippet?.includes(targetReference)
      );
      
      if (!targetRef) {
        throw new Error(`Reference ${targetReference} not found from ${sourceDocumentId}`);
      }
      
      // Follow the reference
      const content = await this.bibleModule.followCrossReference(targetRef);
      
      const result = {
        sourceDocumentId,
        targetReference,
        crossReference: targetRef,
        content,
        responseTime: Date.now() - startTime,
        followedAt: new Date().toISOString()
      };
      
      this._logQuery('followBibleReference', `${sourceDocumentId}->${targetReference}`, {}, result.responseTime);
      return result;
      
    } catch (error) {
      this._logError('followBibleReference', `${sourceDocumentId}->${targetReference}`, error);
      throw error;
    }
  }

  // ==================== PERFORMANCE & MONITORING ====================

  /**
   * Get comprehensive performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    if (!this.isReady()) {
      return { error: 'Bible integration not initialized' };
    }
    
    const bibleMetrics = this.bibleModule.getMetrics();
    
    return {
      integration: {
        isInitialized: this.isInitialized,
        initializationError: this.initializationError?.message || null,
        totalQueries: this.queryHistory.length,
        averageResponseTime: this._calculateAverageResponseTime(),
        lastQuery: this.lastQuery,
        contextCacheSize: this.contextCache.size
      },
      bibleModule: bibleMetrics
    };
  }

  /**
   * Generate performance report
   * @returns {string} Formatted performance report
   */
  generatePerformanceReport() {
    if (!this.isReady()) {
      return 'Bible integration not initialized';
    }
    
    const metrics = this.getPerformanceMetrics();
    const bibleReport = this.bibleModule.generatePerformanceReport();
    
    return `
=== CK Bible Integration Performance Report ===

Integration Statistics:
- Initialization Status: ${metrics.integration.isInitialized ? '✅ Success' : '❌ Failed'}
- Total Queries: ${metrics.integration.totalQueries}
- Average Response Time: ${metrics.integration.averageResponseTime}ms
- Context Cache Size: ${metrics.integration.contextCacheSize}
- Last Query: ${metrics.integration.lastQuery || 'None'}

${bibleReport}
    `.trim();
  }

  /**
   * Get contextual help for CK operations
   * @param {string} topic - Help topic
   * @returns {Promise<Object>} Contextual help information
   */
  async getContextualHelp(topic) {
    const helpTopics = {
      'budgeting': 'B1.1', // Project Vision & Goals
      'user-personas': 'B1.2', // Target Audience
      'roadmap': 'B1.3', // Roadmap & Milestones
      'features': 'B1.4', // Post-MVP Features
      'monetization': 'B1.5', // Commercialization
      'competition': 'B1.6' // Competitive Analysis
    };
    
    const documentId = helpTopics[topic.toLowerCase()];
    if (!documentId) {
      return { error: `No help available for topic: ${topic}` };
    }
    
    return await this.getBibleContent(documentId, { includeContext: true });
  }

  // ==================== PRIVATE METHODS ====================

  async _prefetchCommonContent() {
    const commonDocuments = ['B1.1', 'B1.2', 'B1.3'];
    await this.bibleModule.prefetchDocuments(commonDocuments);
  }

  _logQuery(operation, target, options, responseTime) {
    const queryLog = {
      operation,
      target,
      options,
      responseTime,
      timestamp: new Date().toISOString()
    };
    
    this.queryHistory.push(queryLog);
    this.lastQuery = queryLog;
    
    // Keep only last 100 queries
    if (this.queryHistory.length > 100) {
      this.queryHistory.shift();
    }
    
    if (this.options.logPerformance) {
      console.log(`📊 Bible Query: ${operation}(${target}) - ${responseTime}ms`);
    }
  }

  _logError(operation, target, error) {
    const errorLog = {
      operation,
      target,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.error(`❌ Bible Error: ${operation}(${target}) - ${error.message}`);
    
    // Could send to error tracking service here
  }

  _calculateAverageResponseTime() {
    if (this.queryHistory.length === 0) return 0;
    
    const totalTime = this.queryHistory.reduce((sum, query) => sum + query.responseTime, 0);
    return Math.round(totalTime / this.queryHistory.length);
  }
}

// Factory function for easy integration
function integrateBibleWithCK(ckSystem, options = {}) {
  return new CKBibleIntegration(ckSystem, options);
}

module.exports = { CKBibleIntegration, integrateBibleWithCK };