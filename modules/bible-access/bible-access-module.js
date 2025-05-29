/**
 * Bible Access Module for CK_Priming_v11
 * Provides autonomous access to KarmaCash Bible documentation
 * Integrates with @gannonh/firebase-mcp server
 */

class BibleAccessModule {
  constructor(mcpClient, options = {}) {
    // Use provided MCP Client or create a simple one that calls global MCP functions
    this.mcpClient = mcpClient || {
      // Simple MCP client that calls global MCP functions
      getBibleDocument: async (documentId, version = 'optimized') => {
        const section = documentId.toLowerCase().match(/^b(\d+)/)?.[0] || 'b1';
        const fileMap = {
          'b1.1': 'b1.1_project_vision_goals',
          'b1.2': 'b1.2_target_audience', 
          'b1.3': 'b1.3_roadmap_milestones',
          'b1.4': 'b1.4_postmvp_features',
          'b1.5': 'b1.5_commercialization',
          'b1.6': 'b1.6_competitive_analysis'
        };
        const baseName = fileMap[documentId.toLowerCase()] || `${documentId.toLowerCase()}_document`;
        const fileName = version === 'optimized' ? `${baseName}.optimized.json` : `${baseName}.md`;
        const filePath = `bible/sections/${section}/${version}/${fileName}`;
        
        const fileInfo = await storage_get_file_info({ filePath });
        const response = await fetch(fileInfo.downloadUrl);
        
        if (version === 'optimized') {
          return await response.json();
        } else {
          return await response.text();
        }
      },

      getBibleCrossReferences: async (documentId, referenceType = 'all') => {
        const filters = [
          { field: 'source_document_id', operator: '==', value: documentId }
        ];
        if (referenceType !== 'all') {
          filters.push({ field: 'reference_type', operator: '==', value: referenceType });
        }
        const result = await firestore_list_documents({ 
          collection: 'bible_cross_references', 
          filters, 
          limit: 50 
        });
        return result.documents || [];
      },

      getMetrics: () => ({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        lastRequestTime: 0,
        successRate: '100.00',
        isConnected: true,
        lastError: null
      })
    };
    
    // Simple cache system
    this.cache = new Map();
    this.crossReferences = new Map();
    
    this.config = {
      basePath: 'bible/sections/',
      cacheTimeout: options.cacheTimeout || 300000, // 5 minutes
      maxCacheSize: options.maxCacheSize || 100,
      ...options
    };
    
    // Performance metrics
    this.metrics = {
      documentsRetrieved: 0,
      crossReferencesFollowed: 0,
      contextBuilds: 0,
      searches: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  // ==================== DOCUMENT RETRIEVAL ====================

  /**
   * Get a specific Bible document by ID
   * @param {string} documentId - Document ID (e.g., 'B1.1', 'B1.2')
   * @param {string} version - 'raw' or 'optimized' (default: 'optimized')
   * @returns {Promise<Object>} Document content
   */
  async getDocument(documentId, version = 'optimized') {
    const cacheKey = `${documentId}-${version}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        this.metrics.cacheHits++;
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    this.metrics.cacheMisses++;
    
    try {
      // Use the MCP client method
      const content = await this.mcpClient.getBibleDocument(documentId, version);
      
      // Cache the result
      this._addToCache(cacheKey, content);
      this.metrics.documentsRetrieved++;
      
      return content;
      
    } catch (error) {
      throw new Error(`Failed to retrieve document ${documentId}: ${error.message}`);
    }
  }

  /**
   * Get a specific section from a document
   * @param {string} documentId - Document ID
   * @param {string} sectionId - Section ID (e.g., 'vision_statement')
   * @returns {Promise<Object>} Section content
   */
  async getSection(documentId, sectionId) {
    const document = await this.getDocument(documentId, 'optimized');
    const section = document.sections?.find(s => 
      s.section_id.includes(sectionId) || s.heading.toLowerCase().includes(sectionId.toLowerCase())
    );
    
    if (!section) {
      throw new Error(`Section '${sectionId}' not found in document ${documentId}`);
    }
    
    return section;
  }

  /**
   * Search for content across Bible documents
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchContent(query, options = {}) {
    const { 
      sections = ['b1'], 
      maxResults = 10 
    } = options;
    
    const results = [];
    this.metrics.searches++;
    
    for (const section of sections) {
      try {
        const files = await storage_list_files({ 
          directoryPath: `bible/sections/${section}/optimized/` 
        });
        
        for (const file of files.files || []) {
          if (results.length >= maxResults) break;
          
          const documentId = this._extractDocumentId(file.name);
          if (documentId) {
            const document = await this.getDocument(documentId);
            
            // Search within document sections
            const matches = this._searchInDocument(document, query);
            results.push(...matches);
          }
        }
      } catch (error) {
        console.warn(`Error searching section ${section}:`, error.message);
      }
    }
    
    return results.slice(0, maxResults);
  }

  // ==================== CROSS-REFERENCE NAVIGATION ====================

  /**
   * Get cross-references for a document
   * @param {string} documentId - Source document ID
   * @param {string} referenceType - 'explicit_link', 'semantic_link', or 'all'
   * @returns {Promise<Array>} Cross-references
   */
  async getCrossReferences(documentId, referenceType = 'all') {
    const cacheKey = `${documentId}-${referenceType}`;
    
    // Check cache
    if (this.crossReferences.has(cacheKey)) {
      const cached = this.crossReferences.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }
      this.crossReferences.delete(cacheKey);
    }
    
    try {
      // Use the MCP client method
      const references = await this.mcpClient.getBibleCrossReferences(documentId, referenceType);
      
      // Cache the results
      this.crossReferences.set(cacheKey, {
        data: references,
        timestamp: Date.now()
      });
      this.metrics.crossReferencesFollowed += references.length;
      
      return references;
      
    } catch (error) {
      console.warn(`Error getting cross-references for ${documentId}:`, error.message);
      return [];
    }
  }

  /**
   * Follow a cross-reference and get the target content
   * @param {Object} crossReference - Cross-reference object
   * @returns {Promise<Object>} Target document or section
   */
  async followCrossReference(crossReference) {
    const { target_doc_id, target_document_id } = crossReference;
    const targetId = target_doc_id || target_document_id;
    
    if (!targetId) {
      throw new Error('Cross-reference missing target document ID');
    }
    
    return await this.getDocument(targetId);
  }

  // ==================== CONTEXT BUILDING ====================

  /**
   * Build context for a query by gathering related documents
   * @param {string} primaryDocumentId - Main document
   * @param {Object} options - Context building options
   * @returns {Promise<Object>} Context object with related content
   */
  async buildContext(primaryDocumentId, options = {}) {
    const { 
      includeExplicitRefs = true,
      includeSemanticRefs = false,
      maxDocuments = 3 
    } = options;
    
    this.metrics.contextBuilds++;
    
    const context = {
      primary: await this.getDocument(primaryDocumentId),
      related: [],
      crossReferences: []
    };
    
    // Get cross-references
    if (includeExplicitRefs) {
      const explicitRefs = await this.getCrossReferences(primaryDocumentId, 'explicit_link');
      context.crossReferences.push(...explicitRefs);
    }
    
    if (includeSemanticRefs) {
      const semanticRefs = await this.getCrossReferences(primaryDocumentId, 'semantic_link');
      context.crossReferences.push(...semanticRefs);
    }
    
    // Follow top cross-references
    const topRefs = context.crossReferences
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, maxDocuments);
    
    for (const ref of topRefs) {
      try {
        const relatedContent = await this.followCrossReference(ref);
        context.related.push({
          reference: ref,
          content: relatedContent
        });
      } catch (error) {
        console.warn(`Error following cross-reference:`, error.message);
      }
    }
    
    return context;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache() {
    this.cache.clear();
    this.crossReferences.clear();
  }

  /**
   * Get performance metrics from module and MCP client
   */
  getMetrics() {
    const mcpMetrics = this.mcpClient.getMetrics();
    
    return {
      module: {
        ...this.metrics,
        cacheEfficiency: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100 || 0,
        cacheSize: this.cache.size,
        crossRefCacheSize: this.crossReferences.size
      },
      mcpClient: mcpMetrics
    };
  }

  /**
   * Generate performance report
   * @returns {string} Formatted performance report
   */
  generatePerformanceReport() {
    const metrics = this.getMetrics();
    
    return `
=== Bible Access Module Performance Report ===

Module Statistics:
- Documents Retrieved: ${metrics.module.documentsRetrieved}
- Cross-References Followed: ${metrics.module.crossReferencesFollowed}
- Context Builds: ${metrics.module.contextBuilds}
- Searches Performed: ${metrics.module.searches}
- Cache Efficiency: ${metrics.module.cacheEfficiency.toFixed(2)}%
- Cache Size: ${metrics.module.cacheSize}
- Cross-Reference Cache Size: ${metrics.module.crossRefCacheSize}

MCP Client Performance:
- Total Requests: ${metrics.mcpClient.totalRequests}
- Success Rate: ${metrics.mcpClient.successRate}%
- Average Response Time: ${metrics.mcpClient.avgResponseTime}ms
- Connection Status: ${metrics.mcpClient.isConnected ? 'Connected' : 'Disconnected'}
- Last Error: ${metrics.mcpClient.lastError || 'None'}
    `.trim();
  }

  // ==================== PRIVATE METHODS ====================

  _extractDocumentId(fileName) {
    const match = fileName.match(/b(\d+)\.(\d+)/i);
    return match ? `B${match[1]}.${match[2]}` : null;
  }

  _addToCache(key, data) {
    // Implement simple LRU cache eviction
    if (this.cache.size >= this.config.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  _searchInDocument(document, query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    if (document.sections) {
      for (const section of document.sections) {
        if (section.text_content?.toLowerCase().includes(queryLower)) {
          results.push({
            documentId: document.document_id,
            sectionId: section.section_id,
            heading: section.heading,
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
    return occurrences / text.length * 1000; // Simple relevance scoring
  }
}

// Factory function for easy instantiation
function createBibleAccessModule(mcpClient, options = {}) {
  return new BibleAccessModule(mcpClient, options);
}

// Export with ES modules syntax
export { BibleAccessModule, createBibleAccessModule };