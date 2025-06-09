/**
 * Document ID Mapper for MCP Server
 * Maps between API document IDs and storage document IDs
 */

class DocumentIdMapper {
  constructor() {
    this.mappings = new Map();
    this.initializeDefaultMappings();
  }

  initializeDefaultMappings() {
    // Common ID format mappings
    const defaultMappings = {
      'B1.1': ['b1.1', 'B1.1', 'B1_1'],
      'B1.2': ['b1.2', 'B1.2', 'B1_2'],
      'B1.3': ['b1.3', 'B1.3', 'B1_3'],
      'B1.4': ['b1.4', 'B1.4', 'B1_4'],
      'B1.5': ['b1.5', 'B1.5', 'B1_5'],
      'B1.6': ['b1.6', 'B1.6', 'B1_6'],
      'B2.1': ['b2.1', 'B2.1', 'B2_1'],
      'B2.2': ['b2.2', 'B2.2', 'B2_2'],
      'B2.3': ['b2.3', 'B2.3', 'B2_3'],
      'B2.4': ['b2.4', 'B2.4', 'B2_4'],
      'B2.5': ['b2.5', 'B2.5', 'B2_5'],
      'B3.4': ['b3.4', 'B3.4', 'B3_4'],
      'B3.8': ['b3.8', 'B3.8', 'B3_8'],
      'B3.11': ['b3.11', 'B3.11', 'B3_11']
    };

    for (const [apiId, variations] of Object.entries(defaultMappings)) {
      this.mappings.set(apiId, variations);
    }
  }

  /**
   * Convert API document ID to storage format
   * @param {string} apiId - API document ID (e.g., 'B3.4')
   * @returns {string} Storage document ID (e.g., 'b3.4')
   */
  apiToStorage(apiId) {
    if (!apiId) return '';
    
    // Return the first (primary) storage format
    const variations = this.getAllVariations(apiId);
    return variations[0] || apiId.toLowerCase();
  }

  /**
   * Get all possible variations of a document ID
   * @param {string} documentId - Document ID
   * @returns {Array<string>} Array of possible variations
   */
  getAllVariations(documentId) {
    if (!documentId) return [];

    // Check if we have explicit mappings
    if (this.mappings.has(documentId)) {
      return this.mappings.get(documentId);
    }

    // Generate variations automatically
    const variations = [documentId];
    
    // Add lowercase version
    if (documentId !== documentId.toLowerCase()) {
      variations.push(documentId.toLowerCase());
    }
    
    // Add uppercase version
    if (documentId !== documentId.toUpperCase()) {
      variations.push(documentId.toUpperCase());
    }
    
    // Convert dots to underscores and vice versa
    if (documentId.includes('.')) {
      variations.push(documentId.replace(/\./g, '_'));
      variations.push(documentId.toLowerCase().replace(/\./g, '_'));
    }
    
    if (documentId.includes('_')) {
      variations.push(documentId.replace(/_/g, '.'));
      variations.push(documentId.toLowerCase().replace(/_/g, '.'));
    }

    return [...new Set(variations)]; // Remove duplicates
  }

  /**
   * Add a custom mapping
   * @param {string} apiId - API document ID
   * @param {string} storageId - Storage document ID that works
   */
  addMapping(apiId, storageId) {
    if (!apiId || !storageId) return;
    
    const existing = this.mappings.get(apiId) || [];
    if (!existing.includes(storageId)) {
      existing.unshift(storageId); // Add to front as primary
      this.mappings.set(apiId, existing);
    }
  }

  /**
   * Validate a document ID mapping
   * @param {string} documentId - Document ID to validate
   * @returns {Object} Validation details
   */
  validateMapping(documentId) {
    const storageId = this.apiToStorage(documentId);
    const variations = this.getAllVariations(documentId);
    
    return {
      apiId: documentId,
      storageId: storageId,
      variations: variations,
      variationCount: variations.length,
      hasExplicitMapping: this.mappings.has(documentId),
      isValid: storageId && storageId.length > 0
    };
  }

  /**
   * Get mapping statistics
   * @returns {Object} Statistics about mappings
   */
  getStats() {
    return {
      explicitMappings: this.mappings.size,
      totalMappedIds: Array.from(this.mappings.keys()),
      averageVariations: Array.from(this.mappings.values())
        .reduce((sum, variations) => sum + variations.length, 0) / this.mappings.size || 0
    };
  }
}

module.exports = DocumentIdMapper;
