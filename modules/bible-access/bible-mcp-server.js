#!/usr/bin/env node

/**
 * Bible Access MCP Server
 * Exposes Bible Access Module functions as MCP tools
 * Bridges the gap between the local Bible Access Module and MCP client access
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

// Import Bible Access Module (adjust path as needed)
import { createBibleAccessModule } from './bible-access-module.js';

// Global MCP functions (these need to be available in the environment)
// These will be provided by the underlying Firebase MCP server
const mcpTools = {
  storage_list_files: async (params) => {
    // This needs to call the actual Firebase MCP server
    throw new Error('storage_list_files not available - requires Firebase MCP server');
  },
  storage_get_file_info: async (params) => {
    throw new Error('storage_get_file_info not available - requires Firebase MCP server');
  },
  firestore_list_documents: async (params) => {
    throw new Error('firestore_list_documents not available - requires Firebase MCP server');
  },
  firestore_get_document: async (params) => {
    throw new Error('firestore_get_document not available - requires Firebase MCP server');
  }
};

// Create MCP server
const server = new Server({
  name: 'bible-access-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Initialize Bible Access Module
let bibleModule;

async function initializeBibleModule() {
  try {
    // Create a mock MCP client that throws errors to indicate the limitation
    const mockMcpClient = {
      getBibleDocument: async (documentId, version = 'optimized') => {
        throw new Error('Bible Access Module requires Firebase MCP server to be running in the same environment');
      },
      getBibleCrossReferences: async (documentId, referenceType = 'all') => {
        throw new Error('Bible Access Module requires Firebase MCP server to be running in the same environment');
      },
      getMetrics: () => ({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        lastRequestTime: 0,
        successRate: '0.00',
        isConnected: false,
        lastError: 'Firebase MCP server not available in this environment'
      })
    };

    bibleModule = createBibleAccessModule(mockMcpClient);
    console.error('⚠️  Bible Module initialized with mock client - Firebase MCP server required for actual functionality');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Bible Access Module:', error.message);
    return false;
  }
}

// Define available Bible Access tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'bible_get_document',
        description: 'Get a specific Bible document by ID with caching and optimization',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'Document ID (e.g., "B1.1", "B2.3")'
            },
            version: {
              type: 'string',
              description: 'Document version: "optimized" or "raw"',
              enum: ['optimized', 'raw'],
              default: 'optimized'
            }
          },
          required: ['documentId']
        }
      },
      {
        name: 'bible_get_section',
        description: 'Get a specific section from a Bible document',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'Document ID (e.g., "B1.1")'
            },
            sectionId: {
              type: 'string',
              description: 'Section identifier or heading keyword'
            }
          },
          required: ['documentId', 'sectionId']
        }
      },
      {
        name: 'bible_search_content',
        description: 'Search for content across Bible documents with intelligent ranking',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query text'
            },
            sections: {
              type: 'array',
              description: 'Bible sections to search (e.g., ["b1", "b2"])',
              items: { type: 'string' },
              default: ['b1']
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 10
            }
          },
          required: ['query']
        }
      },
      {
        name: 'bible_get_cross_references',
        description: 'Get cross-references for a Bible document with filtering',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'Source document ID'
            },
            referenceType: {
              type: 'string',
              description: 'Type of references to retrieve',
              enum: ['explicit_link', 'semantic_link', 'all'],
              default: 'all'
            }
          },
          required: ['documentId']
        }
      },
      {
        name: 'bible_build_context',
        description: 'Build comprehensive context for a document with related content',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              description: 'Primary document ID'
            },
            includeExplicitRefs: {
              type: 'boolean',
              description: 'Include explicit cross-references',
              default: true
            },
            includeSemanticRefs: {
              type: 'boolean',
              description: 'Include semantic cross-references',
              default: false
            },
            maxDocuments: {
              type: 'number',
              description: 'Maximum related documents to include',
              default: 3
            }
          },
          required: ['documentId']
        }
      },
      {
        name: 'bible_get_performance_metrics',
        description: 'Get comprehensive performance metrics from Bible Access Module',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Initialize module if not done yet
  if (!bibleModule) {
    const initialized = await initializeBibleModule();
    if (!initialized) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: true,
            message: "Bible Access Module failed to initialize",
            tool: name,
            instructions: "This server requires Firebase MCP tools to be available in the same environment"
          }, null, 2)
        }]
      };
    }
  }

  try {
    switch (name) {
      case 'bible_get_document': {
        const { documentId, version = 'optimized' } = args;
        const result = await bibleModule.getDocument(documentId, version);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              documentId,
              version,
              data: result,
              tool: name
            }, null, 2)
          }]
        };
      }

      case 'bible_get_section': {
        const { documentId, sectionId } = args;
        const result = await bibleModule.getSection(documentId, sectionId);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              documentId,
              sectionId,
              data: result,
              tool: name
            }, null, 2)
          }]
        };
      }

      case 'bible_search_content': {
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
              data: result,
              tool: name
            }, null, 2)
          }]
        };
      }

      case 'bible_get_cross_references': {
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
              data: result,
              tool: name
            }, null, 2)
          }]
        };
      }

      case 'bible_build_context': {
        const { 
          documentId, 
          includeExplicitRefs = true, 
          includeSemanticRefs = false, 
          maxDocuments = 3 
        } = args;
        
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
              context: result,
              tool: name
            }, null, 2)
          }]
        };
      }

      case 'bible_get_performance_metrics': {
        const result = bibleModule.getMetrics();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              metrics: result,
              tool: name
            }, null, 2)
          }]
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown Bible Access tool: ${name}`
        );
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
          help: "This Bible Access MCP server requires Firebase MCP tools to be available. Make sure @gannonh/firebase-mcp is running in the same environment."
        }, null, 2)
      }]
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🔥 Bible Access MCP Server running on stdio');
  console.error('📚 High-level Bible functions now available as MCP tools');
  console.error('⚠️  Requires Firebase MCP server to be running in the same environment');
}

main().catch(console.error);