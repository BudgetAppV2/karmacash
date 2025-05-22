/**
 * Template API
 * 
 * This module handles HTTP requests for template operations.
 * It provides endpoints for creating, retrieving, and listing templates.
 */

const express = require('express');
const cors = require('cors')({ origin: true });
const bodyParser = require('body-parser');
const templateService = require('../services/template-service');
const authMiddleware = require('../middleware/auth-middleware');

// Create Express app
const app = express();

// Apply middleware
app.use(cors);
app.use(bodyParser.json());
app.use(authMiddleware);

/**
 * Get template by session ID
 * GET /api/templates/:sessionId
 */
app.get('/api/templates/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const type = req.query.type || 'handoff';
    
    // Log request
    console.log(`GET template for session ${sessionId}, type ${type}`);
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Session ID is required'
      });
    }
    
    const template = await templateService.getTemplateBySessionId(sessionId, type);
    
    if (!template) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No ${type} template found for session ${sessionId}`
      });
    }
    
    // Convert server timestamps to ISO strings for JSON response
    const response = {
      ...template,
      createdAt: template.createdAt ? template.createdAt.toDate().toISOString() : null,
      updatedAt: template.updatedAt ? template.updatedAt.toDate().toISOString() : null
    };
    
    return res.status(200).json(response);
  } catch (error) {
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
  }
});

/**
 * Create a new template
 * POST /api/templates
 */
app.post('/api/templates', async (req, res) => {
  try {
    const templateData = req.body;
    
    // Log request (without content for brevity)
    console.log(`POST template for session ${templateData.sessionId}, type ${templateData.type}`);
    
    // Validate required fields
    if (!templateData.sessionId || !templateData.type || !templateData.content) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: sessionId, type, content'
      });
    }
    
    // Validate session ID format
    if (!templateData.sessionId.match(/^[A-Z]\d+\.[A-Z]\d+$/)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid session ID format. Expected format: M1.S2'
      });
    }
    
    // Validate template type
    if (templateData.type !== 'handoff' && templateData.type !== 'summary') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid template type. Expected "handoff" or "summary"'
      });
    }
    
    // Create the template
    const result = await templateService.createTemplate(templateData);
    
    // Convert server timestamps to ISO strings for JSON response
    const response = {
      ...result,
      createdAt: result.createdAt ? result.createdAt.toDate().toISOString() : null,
      updatedAt: result.updatedAt ? result.updatedAt.toDate().toISOString() : null
    };
    
    return res.status(201).json(response);
  } catch (error) {
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
  }
});

/**
 * List all templates with optional filtering
 * GET /api/templates
 */
app.get('/api/templates', async (req, res) => {
  try {
    // Extract query parameters
    const { type, status, limit = 10, startAfter } = req.query;
    
    // Log request
    console.log(`GET templates list with filters: type=${type}, status=${status}, limit=${limit}`);
    
    // Parse limit to number
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Limit must be a number between 1 and 100'
      });
    }
    
    // Validate type if provided
    if (type && type !== 'handoff' && type !== 'summary') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid template type. Expected "handoff" or "summary"'
      });
    }
    
    // Validate status if provided
    if (status && !['draft', 'active', 'archived'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status. Expected "draft", "active", or "archived"'
      });
    }
    
    // Get templates
    const templates = await templateService.listTemplates({
      type,
      status,
      limit: limitNum,
      startAfterId: startAfter
    });
    
    // Format response with ISO date strings
    const response = templates.map(template => ({
      ...template,
      createdAt: template.createdAt ? template.createdAt.toDate().toISOString() : null,
      updatedAt: template.updatedAt ? template.updatedAt.toDate().toISOString() : null
    }));
    
    // Include pagination metadata
    const result = {
      templates: response,
      pagination: {
        limit: limitNum,
        hasMore: response.length === limitNum,
        nextStartAfter: response.length > 0 ? response[response.length - 1].id : null
      }
    };
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in listTemplates:', error);
    
    // Handle pagination errors
    if (error.message.includes('Start document with ID')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while listing templates'
    });
  }
});

/**
 * Update a template
 * PUT /api/templates/:id
 */
app.put('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;
    
    // Log request
    console.log(`PUT template ${id}`);
    
    if (!id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Template ID is required'
      });
    }
    
    // Validate template type if provided
    if (templateData.type && 
        templateData.type !== 'handoff' && 
        templateData.type !== 'summary') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid template type. Expected "handoff" or "summary"'
      });
    }
    
    // Validate status if provided
    if (templateData.status && 
        !['draft', 'active', 'archived'].includes(templateData.status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status. Expected "draft", "active", or "archived"'
      });
    }
    
    // Update the template
    const result = await templateService.updateTemplate(id, templateData);
    
    // Format response with ISO date strings
    const response = {
      ...result,
      createdAt: result.createdAt ? result.createdAt.toDate().toISOString() : null,
      updatedAt: result.updatedAt ? result.updatedAt.toDate().toISOString() : null
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in updateTemplate:', error);
    
    // Handle not found error
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    // Handle validation errors
    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating the template'
    });
  }
});

/**
 * Delete a template
 * DELETE /api/templates/:id
 */
app.delete('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Log request
    console.log(`DELETE template ${id}`);
    
    if (!id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Template ID is required'
      });
    }
    
    // Ensure the template exists
    const template = await templateService.getTemplateById(id);
    if (!template) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Template with ID ${id} not found`
      });
    }
    
    // Delete the template
    await templateService.deleteTemplate(id);
    
    return res.status(200).json({
      id,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    
    // Handle not found error
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while deleting the template'
    });
  }
});

// Export individual handlers for direct Cloud Function use
module.exports = app;
module.exports.getTemplate = app.get('/api/templates/:sessionId');
module.exports.createTemplate = app.post('/api/templates');
module.exports.listTemplates = app.get('/api/templates'); 