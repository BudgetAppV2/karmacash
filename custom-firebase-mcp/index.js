#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

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
  projectId: serviceAccount.project_id
});

const db = getFirestore();

// Create MCP server
const server = new Server({
  name: 'custom-firebase-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'firestore_set_document_with_id',
        description: 'Create or update a Firestore document with a custom document ID',
        inputSchema: {
          type: 'object',
          properties: {
            collection: {
              type: 'string',
              description: 'The Firestore collection name'
            },
            documentId: {
              type: 'string', 
              description: 'The custom document ID to use'
            },
            data: {
              type: 'object',
              description: 'The document data to store'
            },
            merge: {
              type: 'boolean',
              description: 'Whether to merge with existing document (default: false)',
              default: false
            }
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
            collection: {
              type: 'string',
              description: 'The Firestore collection name'
            },
            documentId: {
              type: 'string',
              description: 'The document ID to retrieve'
            }
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
            collection: {
              type: 'string',
              description: 'The Firestore collection name'
            },
            documentId: {
              type: 'string',
              description: 'The document ID to update'
            },
            data: {
              type: 'object',
              description: 'The fields to update'
            }
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
            collection: {
              type: 'string',
              description: 'The Firestore collection name'
            },
            documentId: {
              type: 'string',
              description: 'The document ID to delete'
            }
          },
          required: ['collection', 'documentId']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'firestore_set_document_with_id': {
        const { collection, documentId, data, merge = false } = args;
        
        // Add server timestamp if not present
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
        
        const updateData = {
          ...data,
          updatedAt: FieldValue.serverTimestamp()
        };

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

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
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
  console.error('Custom Firebase MCP Server running on stdio');
}

main().catch(console.error);