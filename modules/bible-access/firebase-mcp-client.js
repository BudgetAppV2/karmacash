/**
 * Firebase MCP Client - Working Implementation
 * Integrates with @gannonh/firebase-mcp server
 * Uses actual MCP tools available in your setup
 */

class FirebaseMCPClient {
    constructor(options = {}) {
      this.config = {
        timeout: options.timeout || 30000,
        validateResponses: options.validateResponses !== false,
        ...options
      };
      
      // Connection state
      this.isConnected = true; // Assume connected since MCP tools are available
      this.lastError = null;
      
      // Performance metrics
      this.metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        lastRequestTime: null
      };
    }
  
    // ==================== CORE MCP TOOL ACCESS ====================
  
    /**
     * Direct access to MCP tools (since they're available globally)
     * This replaces the complex invoke mechanism from the theoretical implementation
     */
    async callMCPTool(toolName, parameters) {
      const startTime = Date.now();
      this.metrics.totalRequests++;
  
      try {
        let result;
        
        // Call the actual MCP tools that are available
        switch (toolName) {
          case 'storage_list_files':
            result = await storage_list_files(parameters);
            break;
          case 'storage_get_file_info':
            result = await storage_get_file_info(parameters);
            break;
          case 'storage_upload':
            result = await storage_upload(parameters);
            break;
          case 'firestore_list_documents':
            result = await firestore_list_documents(parameters);
            break;
          case 'firestore_get_document':
            result = await firestore_get_document(parameters);
            break;
          case 'firestore_add_document':
            result = await firestore_add_document(parameters);
            break;
          default:
            throw new Error(`MCP tool '${toolName}' not available`);
        }
  
        // Update metrics
        const responseTime = Date.now() - startTime;
        this.metrics.successfulRequests++;
        this.metrics.avgResponseTime = 
          (this.metrics.avgResponseTime + responseTime) / 2;
        this.metrics.lastRequestTime = responseTime;
  
        return result;
        
      } catch (error) {
        this.metrics.failedRequests++;
        this.lastError = error;
        throw new Error(`MCP tool '${toolName}' failed: ${error.message}`);
      }
    }
  
    // ==================== FIREBASE STORAGE OPERATIONS ====================
  
    /**
     * List files in Firebase Storage directory
     * @param {string} directoryPath - Directory path (with trailing slash)
     * @returns {Promise<Array>} List of files
     */
    async listFiles(directoryPath) {
      // Ensure trailing slash for directory listing (we learned this is critical)
      const normalizedPath = directoryPath && !directoryPath.endsWith('/') 
        ? `${directoryPath}/` 
        : directoryPath;
      
      const result = await this.callMCPTool('storage_list_files', { 
        directoryPath: normalizedPath 
      });
      
      return result.files || [];
    }
  
    /**
     * Get file information including download URL
     * @param {string} filePath - Full file path
     * @returns {Promise<Object>} File information with download URL
     */
    async getFileInfo(filePath) {
      const result = await this.callMCPTool('storage_get_file_info', { filePath });
      
      if (!result.downloadUrl) {
        throw new Error(`No download URL available for file: ${filePath}`);
      }
      
      return result;
    }
  
    /**
     * Upload file to Firebase Storage
     * @param {string} filePath - Destination file path
     * @param {string} content - File content
     * @param {string} contentType - MIME type
     * @param {Object} metadata - Optional metadata
     * @returns {Promise<Object>} Upload result
     */
    async uploadFile(filePath, content, contentType = null, metadata = {}) {
      const params = {
        filePath,
        content,
        ...(contentType && { contentType }),
        ...(Object.keys(metadata).length && { metadata })
      };
      
      return await this.callMCPTool('storage_upload', params);
    }
  
    // ==================== CONTENT FETCHING ====================
  
    /**
     * Fetch JSON content from download URL
     * @param {string} url - Download URL from storage_get_file_info
     * @returns {Promise<Object>} Parsed JSON content
     */
    async fetchJson(url) {
      // Use native fetch since we have download URLs
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    }
  
    /**
     * Fetch Markdown content from download URL
     * @param {string} url - Download URL from storage_get_file_info
     * @returns {Promise<string>} Markdown content
     */
    async fetchMarkdown(url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    }
  
    /**
     * Fetch plain text content from download URL
     * @param {string} url - Download URL from storage_get_file_info
     * @returns {Promise<string>} Text content
     */
    async fetchText(url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    }
  
    // ==================== FIRESTORE OPERATIONS ====================
  
    /**
     * List documents from Firestore collection
     * @param {string} collection - Collection name
     * @param {Array} filters - Query filters
     * @param {number} limit - Result limit
     * @param {Array} orderBy - Sort order
     * @returns {Promise<Object>} Query results
     */
    async listDocuments(collection, filters = [], limit = 20, orderBy = []) {
      const params = {
        collection,
        ...(filters.length && { filters }),
        ...(limit && { limit }),
        ...(orderBy.length && { orderBy })
      };
      
      return await this.callMCPTool('firestore_list_documents', params);
    }
  
    /**
     * Get single document from Firestore
     * @param {string} collection - Collection name
     * @param {string} documentId - Document ID
     * @returns {Promise<Object>} Document data
     */
    async getDocument(collection, documentId) {
      return await this.callMCPTool('firestore_get_document', {
        collection,
        id: documentId
      });
    }
  
    /**
     * Add document to Firestore collection
     * @param {string} collection - Collection name
     * @param {Object} data - Document data
     * @returns {Promise<Object>} Creation result
     */
    async addDocument(collection, data) {
      return await this.callMCPTool('firestore_add_document', {
        collection,
        data
      });
    }
  
    // ==================== BIBLE-SPECIFIC HELPERS ====================
  
    /**
     * Get Bible document with proper path handling
     * @param {string} documentId - Document ID (e.g., 'B1.1')
     * @param {string} version - 'raw' or 'optimized'
     * @returns {Promise<Object>} Document content
     */
    async getBibleDocument(documentId, version = 'optimized') {
      const section = this._extractBibleSection(documentId);
      const fileName = this._buildBibleFileName(documentId, version);
      const filePath = `bible/sections/${section}/${version}/${fileName}`;
      
      try {
        const fileInfo = await this.getFileInfo(filePath);
        
        if (version === 'optimized') {
          return await this.fetchJson(fileInfo.downloadUrl);
        } else {
          return await this.fetchMarkdown(fileInfo.downloadUrl);
        }
      } catch (error) {
        throw new Error(`Failed to get Bible document ${documentId} (${version}): ${error.message}`);
      }
    }
  
    /**
     * List all Bible documents in a section
     * @param {string} section - Section (e.g., 'b1')
     * @param {string} version - 'raw' or 'optimized'
     * @returns {Promise<Array>} List of document files
     */
    async listBibleDocuments(section, version = 'optimized') {
      const directoryPath = `bible/sections/${section}/${version}/`;
      return await this.listFiles(directoryPath);
    }
  
    /**
     * Get cross-references for a Bible document
     * @param {string} documentId - Source document ID
     * @param {string} referenceType - 'explicit_link', 'semantic_link', or 'all'
     * @returns {Promise<Array>} Cross-references
     */
    async getBibleCrossReferences(documentId, referenceType = 'all') {
      const filters = [
        { field: 'source_document_id', operator: '==', value: documentId }
      ];
      
      if (referenceType !== 'all') {
        filters.push({
          field: 'reference_type',
          operator: '==', 
          value: referenceType
        });
      }
      
      const result = await this.listDocuments('bible_cross_references', filters, 50);
      return result.documents || [];
    }
  
    // ==================== PERFORMANCE & MONITORING ====================
  
    /**
     * Get client performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
      const successRate = this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
        : 0;
      
      return {
        ...this.metrics,
        successRate: successRate.toFixed(2),
        isConnected: this.isConnected,
        lastError: this.lastError?.message || null
      };
    }
  
    /**
     * Reset performance metrics
     */
    resetMetrics() {
      this.metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        lastRequestTime: null
      };
    }
  
    // ==================== PRIVATE METHODS ====================
  
    _extractBibleSection(documentId) {
      const match = documentId.toLowerCase().match(/^b(\d+)/);
      return match ? `b${match[1]}` : 'b1';
    }
  
    _buildBibleFileName(documentId, version) {
      // Use the actual file naming pattern from your storage
      const docIdLower = documentId.toLowerCase().replace('.', '.');
      
      // Map document IDs to actual filenames based on what we saw in storage
      const fileMap = {
        'b1.1': 'b1.1_project_vision_goals',
        'b1.2': 'b1.2_target_audience', 
        'b1.3': 'b1.3_roadmap_milestones',
        'b1.4': 'b1.4_postmvp_features',
        'b1.5': 'b1.5_commercialization',
        'b1.6': 'b1.6_competitive_analysis'
      };
      
      const baseName = fileMap[docIdLower] || `${docIdLower}_document`;
      return version === 'optimized' ? `${baseName}.optimized.json` : `${baseName}.md`;
    }
  }
  
  // Factory function for easy instantiation
  function createFirebaseMCPClient(options = {}) {
    return new FirebaseMCPClient(options);
  }
  
  module.exports = { FirebaseMCPClient, createFirebaseMCPClient };