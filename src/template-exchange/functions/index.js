/**
 * Cloud Functions Index
 * 
 * Main entry point for all Firebase Cloud Functions.
 * This file exports the API endpoints for the Template Exchange System.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const templateApi = require('./api/template-api');
const authMiddleware = require('./middleware/auth-middleware');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configure functions with appropriate region and timeout
const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '256MB'
};

// API Endpoints - Use the entire Express app
exports.templateExchangeApi = functions.runWith(runtimeOpts).https.onRequest(templateApi);

// Individual API endpoints for direct access
exports.templateExchangeGetTemplate = functions.runWith(runtimeOpts).https.onRequest((req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Process the request with CORS and authentication
  cors(req, res, () => {
    authMiddleware(req, res, () => {
      // Extract sessionId and type from request
      const parts = req.path.split('/');
      const sessionId = parts[parts.length - 1];
      const type = req.query.type || 'handoff';
      
      // Call the template service directly
      const templateService = require('./services/template-service');
      
      templateService.getTemplateBySessionId(sessionId, type)
        .then(template => {
          if (!template) {
            return res.status(404).json({
              error: 'Not Found',
              message: `No ${type} template found for session ${sessionId}`
            });
          }
          
          // Convert server timestamps to ISO strings for JSON response if they exist
          const response = {
            ...template,
            createdAt: template.createdAt && typeof template.createdAt.toDate === 'function' 
              ? template.createdAt.toDate().toISOString() 
              : template.createdAt,
            updatedAt: template.updatedAt && typeof template.updatedAt.toDate === 'function' 
              ? template.updatedAt.toDate().toISOString() 
              : template.updatedAt
          };
          
          return res.status(200).json(response);
        })
        .catch(error => {
          console.error('Error in getTemplate:', error);
          
          // Handle validation errors
          if (error.message.includes('Invalid session ID format') || 
              error.message.includes('Invalid template type')) {
            return res.status(400).json({
              error: 'Bad Request',
              message: error.message
            });
          }
          
          return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while retrieving the template'
          });
        });
    });
  });
});

exports.templateExchangeCreateTemplate = functions.runWith(runtimeOpts).https.onRequest((req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Process the request with CORS and authentication
  cors(req, res, () => {
    authMiddleware(req, res, () => {
      const templateData = req.body;
      const templateService = require('./services/template-service');
      
      // Validate required fields
      if (!templateData.sessionId || !templateData.type || !templateData.content) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields: sessionId, type, content'
        });
      }
      
      // Create the template
      templateService.createTemplate(templateData)
        .then(result => {
          // Convert server timestamps to ISO strings for JSON response if they exist
          const response = {
            ...result,
            createdAt: result.createdAt && typeof result.createdAt.toDate === 'function' 
              ? result.createdAt.toDate().toISOString() 
              : result.createdAt,
            updatedAt: result.updatedAt && typeof result.updatedAt.toDate === 'function' 
              ? result.updatedAt.toDate().toISOString() 
              : result.updatedAt
          };
          
          return res.status(201).json(response);
        })
        .catch(error => {
          console.error('Error in createTemplate:', error);
          
          // Handle specific validation errors
          if (error.message.includes('Missing required fields') ||
              error.message.includes('Invalid session ID') ||
              error.message.includes('Invalid template type')) {
            return res.status(400).json({
              error: 'Bad Request',
              message: error.message
            });
          }
          
          return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while creating the template'
          });
        });
    });
  });
});

exports.templateExchangeListTemplates = functions.runWith(runtimeOpts).https.onRequest((req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Process the request with CORS and authentication
  cors(req, res, () => {
    authMiddleware(req, res, () => {
      // Extract query parameters
      const { type, status, limit = 10, startAfter } = req.query;
      const templateService = require('./services/template-service');
      
      // Parse limit to number
      const limitNum = parseInt(limit, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Limit must be a number between 1 and 100'
        });
      }
      
      // Get templates
      templateService.listTemplates({
        type,
        status,
        limit: limitNum,
        startAfterId: startAfter
      })
        .then(templates => {
          // Format response with ISO date strings
          const response = templates.map(template => ({
            ...template,
            createdAt: template.createdAt && typeof template.createdAt.toDate === 'function' 
              ? template.createdAt.toDate().toISOString() 
              : template.createdAt,
            updatedAt: template.updatedAt && typeof template.updatedAt.toDate === 'function' 
              ? template.updatedAt.toDate().toISOString() 
              : template.updatedAt
          }));
          
          return res.status(200).json({
            templates: response,
            pagination: {
              limit: limitNum,
              hasMore: response.length === limitNum
            }
          });
        })
        .catch(error => {
          console.error('Error in listTemplates:', error);
          
          return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred while listing templates'
          });
        });
    });
  });
});

// Health check endpoint
exports.templateExchangeHealthCheck = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
}); 