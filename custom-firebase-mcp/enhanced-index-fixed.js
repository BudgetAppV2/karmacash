#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} = require('@modelcontextprotocol/sdk/types.js');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { readFileSync } = require('fs');

// Initialize Firebase Admin with your service account
const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH || 
  '/Users/benoitarchambault/Documents/firebase credential_Karmacash/karmacash-6e8f5-firebase-adminsdk-fbsvc-c1e711941b.json';

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('Error reading service account file:', error.message);
  process.exit(1);
}

const app = initializeApp({ 
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'karmacash-6e8f5.firebasestorage.app'
});

const db = getFirestore();
const storage = getStorage();

// Bible Access Module Logic (inline for direct Firebase access)
class BibleAccessModule {
  constructor() {
    this.cache = new Map();
    this.crossReferences = new Map();
    this.metrics = {
      documentsRetrieved: 0,
      crossReferencesFollowed: 0,
      contextBuilds: 0,
      searches: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  async getDocument(documentId, version = 'optimized') {
    const cacheKey = `${documentId}-${version}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        this.metrics.cacheHits++;
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    this.metrics.cacheMisses++;
    
    try {
      // Build file path based on document ID
      const section = documentId.toLowerCase().match(/^b(\d+)/)?.[1] || '1';
      const fileMap = {
        'b1.1': 'b1.1_project_vision_goals',
        'b1.2': 'b1.2_target_audience', 
        'b1.3': 'b1.3_roadmap_milestones',
        'b1.4': 'b1.4_postmvp_features',
        'b1.5': 'b1.5_commercialization',
        'b1.6': 'b1.6_competitive_analysis',
        'b2.1': 'b2.1_design_philosophy',
        'b2.2': 'b2.2_technical_standards',
        'b2.3': 'b2.3_date_handling_guide',
        'b2.4': 'b2.4_error_handling_strategy',
        'b2.5': 'b2.5_code_project_structure'
      };
      
      const baseName = fileMap[documentId.toLowerCase()] || `${documentId.toLowerCase()}_document`;
      const fileName = version === 'optimized' ? `${baseName}.optimized.json` : `${baseName}.md`;
      const filePath = `bible/sections/b${section}/${version}/${fileName}`;
      
      // Get file from Firebase Storage
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      
      if (!exists) {
        throw new Error(`Document ${documentId} not found at ${filePath}`);
      }
      
      const [content] = await file.download();
      let data;
      
      if (version === 'optimized') {
        data = JSON.parse(content.toString());
      } else {
        data = content.toString();
      }
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      this.metrics.documentsRetrieved++;
      return data;
      
    } catch (error) {
      throw new Error(`Failed to retrieve document ${documentId}: ${error.message}`);
    }
  }

  async getCrossReferences(documentId, referenceType = 'all') {
    const cacheKey = `${documentId}-${referenceType}`;
    
    // Check cache
    if (this.crossReferences.has(cacheKey)) {
      const cached = this.crossReferences.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) {
        return cached.data;
      }
      this.crossReferences.delete(cacheKey);
    }
    
    try {
      let query = db.collection('bible_cross_references')
        .where('source_document_id', '==', documentId);
      
      if (referenceType !== 'all') {
        query = query.where('reference_type', '==', referenceType);
      }
      
      const snapshot = await query.limit(50).get();
      const references = [];
      
      snapshot.forEach(doc => {
        references.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
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

  async searchContent(query, options = {}) {
    const { sections = ['b1'], maxResults = 10 } = options;
    const results = [];
    this.metrics.searches++;
    
    try {
      for (const section of sections) {
        if (results.length >= maxResults) break;
        
        // List files in the section
        const bucket = storage.bucket();
        const [files] = await bucket.getFiles({
          prefix: `bible/sections/${section}/optimized/`
        });
        
        for (const file of files) {
          if (results.length >= maxResults) break;
          
          const documentId = this._extractDocumentId(file.name);
          if (documentId) {
            try {
              const document = await this.getDocument(documentId);
              const matches = this._searchInDocument(document, query);
              results.push(...matches);
            } catch (error) {
              console.warn(`Error searching in ${documentId}:`, error.message);
            }
          }
        }
      }
      
      return results.slice(0, maxResults);
    } catch (error) {
      console.error('Search error:', error.message);
      return [];
    }
  }

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
        const targetId = ref.target_doc_id || ref.target_document_id;
        if (targetId) {
          const relatedContent = await this.getDocument(targetId);
          context.related.push({
            reference: ref,
            content: relatedContent
          });
        }
      } catch (error) {
        console.warn(`Error following cross-reference:`, error.message);
      }
    }
    
    return context;
  }

  getMetrics() {
    return {
      module: {
        ...this.metrics,
        cacheEfficiency: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100 || 0,
        cacheSize: this.cache.size,
        crossRefCacheSize: this.crossReferences.size
      }
    };
  }

  _extractDocumentId(fileName) {
    const match = fileName.match(/b(\d+)\.(\d+)/i);
    return match ? `B${match[1]}.${match[2]}` : null;
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
    return occurrences / text.length * 1000;
  }
}

// Initialize Bible Access Module
const bibleModule = new BibleAccessModule();

// CK Module Access Logic (mirrors Bible Access pattern)
class CKModuleAccess {
  constructor() {
    this.cache = new Map();
    this.metrics = {
      modulesRetrieved: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  async getModule(moduleId, cacheSession = true) {
    const cacheKey = `ck-${moduleId}`;
    
    // Check cache first
    if (cacheSession && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        this.metrics.cacheHits++;
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    this.metrics.cacheMisses++;
    
    try {
      // Determine collection based on module ID
      let collection = 'ck_guidance_modules';
      if (moduleId.includes('handoff') || moduleId === 'enhanced_cg_handoff_v3') {
        collection = 'handoff_templates';
      } else if (moduleId === 'essential_ck_protocols_lite') {
        collection = 'ck_protocols';
      }
      
      // Fetch from Firestore
      const docRef = db.collection(collection).doc(moduleId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new Error(`Module ${moduleId} not found in ${collection}`);
      }
      
      const data = doc.data();
      
      // Cache the result if requested
      if (cacheSession) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      this.metrics.modulesRetrieved++;
      return data;
      
    } catch (error) {
      throw new Error(`Failed to retrieve CK module ${moduleId}: ${error.message}`);
    }
  }

  getMetrics() {
    return {
      module: {
        ...this.metrics,
        cacheEfficiency: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100 || 0,
        cacheSize: this.cache.size
      }
    };
  }
}

// Initialize CK Module Access
const ckModule = new CKModuleAccess();

// Create MCP server
const server = new Server({
  name: 'enhanced-firebase-mcp',
  version: '2.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Define available tools (original + Bible Access)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Original Firebase tools
      {
        name: 'firestore_set_document_with_id',
        description: 'Create or update a Firestore document with a custom document ID',
        inputSchema: {
          type: 'object',
          properties: {
            collection: { type: 'string', description: 'The Firestore collection name' },
            documentId: { type: 'string', description: 'The custom document ID to use' },
            data: { type: 'object', description: 'The document data to store' },
            merge: { type: 'boolean', description: 'Whether to merge with existing document (default: false)', default: false }
          },
          required: ['collection', 'documentId', 'data']
        }
      },
      {
        name: 'firestore_get_document_by_id',
        description: 'Get a Firestore document by its custom document ID',
        inputSchema: {
          type: 'object',
          properties: {
            collection: { type: 'string', description: 'The Firestore collection name' },
            documentId: { type: 'string', description: 'The document ID to retrieve' }
          },
          required: ['collection', 'documentId']
        }
      },
      {
        name: 'firestore_update_document_by_id',
        description: 'Update specific fields in a Firestore document by its custom document ID',
        inputSchema: {
          type: 'object',
          properties: {
            collection: { type: 'string', description: 'The Firestore collection name' },
            documentId: { type: 'string', description: 'The document ID to update' },
            data: { type: 'object', description: 'The fields to update' }
          },
          required: ['collection', 'documentId', 'data']
        }
      },
      {
        name: 'firestore_delete_document_by_id',
        description: 'Delete a Firestore document by its custom document ID',
        inputSchema: {
          type: 'object',
          properties: {
            collection: { type: 'string', description: 'The Firestore collection name' },
            documentId: { type: 'string', description: 'The document ID to delete' }
          },
          required: ['collection', 'documentId']
        }
      },
      // NEW: Bible Access Module tools
      {
        name: 'getBibleSection',
        description: 'Get a specific Bible document section with caching and optimization',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'Document ID (e.g., "B1.1", "B2.3")' },
            version: { type: 'string', description: 'Document version: "optimized" or "raw"', enum: ['optimized', 'raw'], default: 'optimized' }
          },
          required: ['documentId']
        }
      },
      {
        name: 'getCrossReferences',
        description: 'Get cross-references for a Bible document with filtering',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'Source document ID' },
            referenceType: { type: 'string', description: 'Type of references', enum: ['explicit_link', 'semantic_link', 'all'], default: 'all' }
          },
          required: ['documentId']
        }
      },
      {
        name: 'searchBibleContent',
        description: 'Search for content across Bible documents with intelligent ranking',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query text' },
            sections: { type: 'array', description: 'Bible sections to search', items: { type: 'string' }, default: ['b1'] },
            maxResults: { type: 'number', description: 'Maximum results', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'buildBibleContext',
        description: 'Build comprehensive context for a document with related content',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'Primary document ID' },
            includeExplicitRefs: { type: 'boolean', description: 'Include explicit cross-references', default: true },
            includeSemanticRefs: { type: 'boolean', description: 'Include semantic cross-references', default: false },
            maxDocuments: { type: 'number', description: 'Maximum related documents', default: 3 }
          },
          required: ['documentId']
        }
      },
      {
        name: 'getBiblePerformanceMetrics',
        description: 'Get comprehensive performance metrics from Bible Access Module',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      // NEW: CK Module Access tool
      {
        name: 'getCKModule',
        description: 'Get a CK module by ID with caching (mirrors Bible Access pattern)',
        inputSchema: {
          type: 'object',
          properties: {
            moduleId: { type: 'string', description: 'Module ID (e.g., "ck2.1", "enhanced_cg_handoff_v3", "essential_ck_protocols_lite")' },
            cacheSession: { type: 'boolean', description: 'Whether to cache the module for session reuse', default: true }
          },
          required: ['moduleId']
        }
      }
    ]
  };
});

// Handle tool calls (original + Bible Access)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Original Firebase tools
      case 'firestore_set_document_with_id': {
        const { collection, documentId, data, merge = false } = args;
        const docData = {
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
          ...(merge ? {} : { createdAt: FieldValue.serverTimestamp() })
        };
        const docRef = db.collection(collection).doc(documentId);
        if (merge) {
          await docRef.set(docData, { merge: true });
        } else {
          await docRef.set(docData);
        }
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              id: documentId,
              path: `${collection}/${documentId}`,
              operation: merge ? 'merged' : 'created'
            }, null, 2)
          }]
        };
      }

      case 'firestore_get_document_by_id': {
        const { collection, documentId } = args;
        const docRef = db.collection(collection).doc(documentId);
        const doc = await docRef.get();
        if (!doc.exists) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                exists: false,
                id: documentId,
                path: `${collection}/${documentId}`
              }, null, 2)
            }]
          };
        }
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              exists: true,
              id: doc.id,
              path: `${collection}/${doc.id}`,
              data: doc.data()
            }, null, 2)
          }]
        };
      }

      case 'firestore_update_document_by_id': {
        const { collection, documentId, data } = args;
        const updateData = { ...data, updatedAt: FieldValue.serverTimestamp() };
        const docRef = db.collection(collection).doc(documentId);
        await docRef.update(updateData);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              id: documentId,
              path: `${collection}/${documentId}`,
              operation: 'updated'
            }, null, 2)
          }]
        };
      }

      case 'firestore_delete_document_by_id': {
        const { collection, documentId } = args;
        const docRef = db.collection(collection).doc(documentId);
        await docRef.delete();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              id: documentId,
              path: `${collection}/${documentId}`,
              operation: 'deleted'
            }, null, 2)
          }]
        };
      }

      // NEW: Bible Access Module tools
      case 'getBibleSection': {
        const { documentId, version = 'optimized' } = args;
        const result = await bibleModule.getDocument(documentId, version);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              documentId,
              version,
              data: result
            }, null, 2)
          }]
        };
      }

      case 'getCrossReferences': {
        const { documentId, referenceType = 'all' } = args;
        const result = await bibleModule.getCrossReferences(documentId, referenceType);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              documentId,
              referenceType,
              totalReferences: result.length,
              data: result
            }, null, 2)
          }]
        };
      }

      case 'searchBibleContent': {
        const { query, sections = ['b1'], maxResults = 10 } = args;
        const result = await bibleModule.searchContent(query, { sections, maxResults });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              query,
              sections,
              totalResults: result.length,
              data: result
            }, null, 2)
          }]
        };
      }

      case 'buildBibleContext': {
        const { documentId, includeExplicitRefs = true, includeSemanticRefs = false, maxDocuments = 3 } = args;
        const result = await bibleModule.buildContext(documentId, {
          includeExplicitRefs,
          includeSemanticRefs,
          maxDocuments
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              documentId,
              context: result
            }, null, 2)
          }]
        };
      }

      case 'getBiblePerformanceMetrics': {
        const result = bibleModule.getMetrics();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              metrics: result
            }, null, 2)
          }]
        };
      }

      // NEW: CK Module Access handler
      case 'getCKModule': {
        const { moduleId, cacheSession = true } = args;
        const result = await ckModule.getModule(moduleId, cacheSession);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              moduleId,
              cached: cacheSession,
              data: result
            }, null, 2)
          }]
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in ${name}:`, error);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: true,
          message: error.message,
          tool: name,
          arguments: args
        }, null, 2)
      }]
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🔥 Enhanced Firebase MCP Server running on stdio');
  console.error('📚 Bible Access Module functions now available as MCP tools!');
}

main().catch(console.error);