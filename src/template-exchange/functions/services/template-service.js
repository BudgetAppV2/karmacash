/**
 * Template Service
 * 
 * This service handles the business logic for template operations.
 * It provides methods for creating, retrieving, and listing templates.
 */

const admin = require('firebase-admin');
const { TemplateModel } = require('../models/template-exchange-schema');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Firestore
const db = admin.firestore();
const templateModel = new TemplateModel(db);

/**
 * Create a new template
 * @param {Object} templateData - Template data to create
 * @returns {Promise<Object>} - Created template data with ID
 */
async function createTemplate(templateData) {
  try {
    // Ensure required fields are present
    if (!templateData.sessionId || !templateData.type || !templateData.content) {
      throw new Error('Missing required fields: sessionId, type, content');
    }
    
    // Add server timestamp if not provided
    if (!templateData.createdAt) {
      templateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
    if (!templateData.updatedAt) {
      templateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    // Set default status if not provided
    if (!templateData.status) {
      templateData.status = 'draft';
    }
    
    // Create the template using the model
    const docRef = await templateModel.create(templateData);
    
    // Return the created template with its ID
    return {
      id: docRef.id,
      ...templateData,
      message: `Template created successfully`
    };
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * Get a template by ID
 * @param {string} id - Template ID to retrieve
 * @returns {Promise<Object>} - Template data or null if not found
 */
async function getTemplateById(id) {
  try {
    if (!id) {
      throw new Error('Template ID is required');
    }
    
    const doc = await templateModel.getById(id);
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`Error getting template with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get a template by session ID and type
 * @param {string} sessionId - Session ID to retrieve
 * @param {string} type - Template type (handoff or summary)
 * @returns {Promise<Object>} - Template data or null if not found
 */
async function getTemplateBySessionId(sessionId, type = 'handoff') {
  try {
    // Validate session ID format
    if (!sessionId.match(/^[A-Z]\d+\.[A-Z]\d+$/)) {
      throw new Error('Invalid session ID format. Expected format: M1.S2');
    }
    
    // Validate type
    if (type !== 'handoff' && type !== 'summary') {
      throw new Error('Invalid template type. Expected "handoff" or "summary"');
    }
    
    // Query for templates with this session ID
    const templates = await templateModel.getBySessionId(sessionId);
    
    if (templates.length === 0) {
      return null;
    }
    
    // Filter by type and get the most recent
    const matchingTemplates = templates
      .filter(doc => doc.data().type === type)
      .sort((a, b) => {
        // Sort by updatedAt in descending order
        const aTime = a.data().updatedAt ? a.data().updatedAt.toMillis() : 0;
        const bTime = b.data().updatedAt ? b.data().updatedAt.toMillis() : 0;
        return bTime - aTime;
      });
    
    if (matchingTemplates.length === 0) {
      return null;
    }
    
    // Return the most recent template
    const mostRecent = matchingTemplates[0];
    return {
      id: mostRecent.id,
      ...mostRecent.data()
    };
  } catch (error) {
    console.error(`Error getting template for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * List templates with optional filtering
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by template type
 * @param {string} options.status - Filter by template status
 * @param {number} options.limit - Maximum number of templates to return
 * @param {string} options.startAfterId - Document ID to start after (for pagination)
 * @returns {Promise<Array<Object>>} - Array of template objects
 */
async function listTemplates(options = {}) {
  try {
    const { limit = 10 } = options;
    
    // Simplified query to avoid complex index requirements
    // Just get the most recent templates
    const snapshot = await db.collection('templates')
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();
    
    // Convert to array of objects
    const templates = [];
    snapshot.forEach(doc => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return templates;
  } catch (error) {
    console.error('Error listing templates:', error);
    throw error;
  }
}

/**
 * Update a template
 * @param {string} id - Template ID to update
 * @param {Object} templateData - Updated template data
 * @returns {Promise<Object>} - Updated template data
 */
async function updateTemplate(id, templateData) {
  try {
    // Ensure the template exists
    const template = await templateModel.getById(id);
    if (!template.exists) {
      throw new Error(`Template with ID ${id} not found`);
    }
    
    // Update the updatedAt timestamp
    templateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    // Update the template
    await templateModel.update(id, templateData);
    
    return {
      id,
      ...templateData,
      message: `Template updated successfully`
    };
  } catch (error) {
    console.error(`Error updating template ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a template
 * @param {string} id - Template ID to delete
 * @returns {Promise<void>}
 */
async function deleteTemplate(id) {
  try {
    // Ensure the template exists
    const doc = await templateModel.getById(id);
    if (!doc.exists) {
      throw new Error(`Template with ID ${id} not found`);
    }
    
    // Delete the template
    await db.collection('templates').doc(id).delete();
    
    return;
  } catch (error) {
    console.error(`Error deleting template ${id}:`, error);
    throw error;
  }
}

module.exports = {
  createTemplate,
  getTemplateById,
  getTemplateBySessionId,
  listTemplates,
  updateTemplate,
  deleteTemplate
}; 