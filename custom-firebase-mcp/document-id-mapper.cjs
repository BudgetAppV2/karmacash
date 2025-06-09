/**
 * Document ID Mapping System for Bible Access Module
 * 
 * Resolves API document IDs (e.g., "B3.4") to storage document IDs (e.g., "B3.4_Guidelines")
 * and vice versa for cross-reference system integration.
 */

class DocumentIdMapper {
  constructor() {
    // Known mapping patterns based on analysis
    this.knownMappings = new Map([
      // B1 Section - Project Foundation
      ['B1.1', 'B1.1_Project_Vision_Goals'],
      ['B1.3', 'B1.3_Roadmap_Milestones'],
      ['B1.4', 'B1.4_PostMVP_Features'],
      ['B1.5', 'B1.5_Commercialization'],
      
      // B2 Section - Core Principles & Standards
      ['B2.1', 'B2_1'], // Pattern variation detected
      ['B2.2', 'B2.2_Technical_Standards'],
      ['B2.3', 'B2_3'], // Pattern variation detected
      ['B2.4', 'B2_4'], // Pattern variation detected
      ['B2.5', 'B2_5'], // Pattern variation detected
      
      // B3 Section - UI/UX Implementation
      ['B3.4', 'B3.4_Guidelines'],
      ['B3.6', 'B3_6'], // Pattern variation detected
      ['B3.7', 'B3_7'], // Pattern variation detected
      ['B3.8', 'B3_8'], // Pattern variation detected
      ['B3.11', 'B3_11'], // Pattern variation detected
      
      // B5 Section - Data & Schema
      ['B5.2', 'B5_2'], // Pattern variation detected
      
      // B7 Section - AI Development Workflow
      ['B7.1', 'B7_1'], // Pattern variation detected
      ['B7.3', 'B7_3'], // Pattern variation detected
      
      // Additional patterns can be added as discovered
    ]);
    
    // Reverse mapping for efficiency
    this.reverseMapping = new Map();
    for (const [apiId, storageId] of this.knownMappings) {
      this.reverseMapping.set(storageId, apiId);
    }
  }

  /**
   * Convert API document ID to storage document ID
   * @param {string} apiDocumentId - API format (e.g., "B3.4")
   * @returns {string} Storage format (e.g., "B3.4_Guidelines")
   */
  apiToStorage(apiDocumentId) {
    // Check known mappings first
    if (this.knownMappings.has(apiDocumentId)) {
      return this.knownMappings.get(apiDocumentId);
    }
    
    // Apply heuristic patterns for unknown mappings
    return this.applyHeuristicMapping(apiDocumentId);
  }

  /**
   * Convert storage document ID to API document ID  
   * @param {string} storageDocumentId - Storage format (e.g., "B3.4_Guidelines")
   * @returns {string} API format (e.g., "B3.4")
   */
  storageToApi(storageDocumentId) {
    // Check reverse mapping first
    if (this.reverseMapping.has(storageDocumentId)) {
      return this.reverseMapping.get(storageDocumentId);
    }
    
    // Apply reverse heuristic patterns
    return this.applyReverseHeuristic(storageDocumentId);
  }

  /**
   * Apply heuristic mapping patterns for unknown document IDs
   * @param {string} apiDocumentId - API format document ID
   * @returns {string} Best guess storage format
   */
  applyHeuristicMapping(apiDocumentId) {
    // Pattern 1: B{section}.{subsection} → B{section}.{subsection}_{Title}
    // This requires document title lookup, return as-is for now
    
    // Pattern 2: B{section}.{subsection} → B{section}_{subsection}
    // Example: B2.3 → B2_3 (observed pattern)
    const dotPattern = /^(B\d+)\.(\d+)$/;
    if (dotPattern.test(apiDocumentId)) {
      return apiDocumentId.replace('.', '_');
    }
    
    // Fallback: return as-is
    return apiDocumentId;
  }

  /**
   * Apply reverse heuristic patterns for storage to API conversion
   * @param {string} storageDocumentId - Storage format document ID
   * @returns {string} Best guess API format
   */
  applyReverseHeuristic(storageDocumentId) {
    // Pattern 1: B{section}_{subsection} → B{section}.{subsection}
    const underscorePattern = /^(B\d+)_(\d+)$/;
    if (underscorePattern.test(storageDocumentId)) {
      return storageDocumentId.replace('_', '.');
    }
    
    // Pattern 2: B{section}.{subsection}_{Title} → B{section}.{subsection}
    const titlePattern = /^(B\d+\.\d+)_(.+)$/;
    if (titlePattern.test(storageDocumentId)) {
      return storageDocumentId.replace(/_.*$/, '');
    }
    
    // Fallback: return as-is
    return storageDocumentId;
  }

  /**
   * Get all possible storage variations for an API document ID
   * Useful for querying when exact mapping is unknown
   * @param {string} apiDocumentId - API format document ID
   * @returns {string[]} Array of possible storage IDs
   */
  getAllVariations(apiDocumentId) {
    const variations = [];
    
    // Add known mapping if exists
    if (this.knownMappings.has(apiDocumentId)) {
      variations.push(this.knownMappings.get(apiDocumentId));
    }
    
    // Add heuristic variations
    variations.push(this.applyHeuristicMapping(apiDocumentId));
    
    // Add direct API ID (in case storage uses API format)
    variations.push(apiDocumentId);
    
    // Remove duplicates
    return [...new Set(variations)];
  }

  /**
   * Add a new mapping to the known mappings
   * @param {string} apiDocumentId - API format
   * @param {string} storageDocumentId - Storage format
   */
  addMapping(apiDocumentId, storageDocumentId) {
    this.knownMappings.set(apiDocumentId, storageDocumentId);
    this.reverseMapping.set(storageDocumentId, apiDocumentId);
  }

  /**
   * Validate if a mapping exists or can be resolved
   * @param {string} apiDocumentId - API format document ID
   * @returns {Object} Validation result with suggestions
   */
  validateMapping(apiDocumentId) {
    const storageId = this.apiToStorage(apiDocumentId);
    const isKnown = this.knownMappings.has(apiDocumentId);
    const variations = this.getAllVariations(apiDocumentId);
    
    return {
      apiId: apiDocumentId,
      storageId,
      isKnownMapping: isKnown,
      isHeuristic: !isKnown,
      variations,
      confidence: isKnown ? 'high' : 'medium'
    };
  }
}

// Export for CommonJS (primary for .cjs files)
module.exports = DocumentIdMapper;
