#!/usr/bin/env node

/**
 * Template Exchange - Cursor AI Integration
 * 
 * This script synchronizes templates between the Template Exchange system and Cursor AI.
 * It can be run manually or as a scheduled task.
 */

const path = require('path');
const fs = require('fs').promises;
const CursorAIClient = require('./cursor-integration-client');
const { getTemplateService } = require('../services/template-service');

// Configure logging
const logLevel = process.env.LOG_LEVEL || 'info';
const logger = {
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  info: (...args) => logLevel !== 'error' && console.log('[INFO]', ...args),
  debug: (...args) => logLevel === 'debug' && console.log('[DEBUG]', ...args)
};

/**
 * Main function to synchronize templates
 */
async function syncTemplates() {
  try {
    logger.info('Starting template synchronization with Cursor AI');
    
    // Initialize clients
    const cursorClient = new CursorAIClient();
    const templateService = getTemplateService();
    
    // Get templates from both systems
    logger.info('Fetching templates from Cursor AI');
    const cursorTemplates = await fetchAllCursorTemplates(cursorClient);
    
    logger.info('Fetching templates from Template Exchange');
    const localTemplates = await templateService.listTemplates();
    
    // Process templates for synchronization
    const { 
      templatesToImport, 
      templatesToExport, 
      templatesToUpdate 
    } = identifyChanges(cursorTemplates, localTemplates);
    
    // Perform synchronization
    await importTemplates(templateService, templatesToImport);
    await exportTemplates(cursorClient, templatesToExport);
    await updateTemplates(cursorClient, templateService, templatesToUpdate);
    
    logger.info('Template synchronization completed successfully');
    
    // Write sync report to file
    await writeSyncReport({
      timestamp: new Date().toISOString(),
      imported: templatesToImport.length,
      exported: templatesToExport.length,
      updated: templatesToUpdate.length,
      cursorTemplatesCount: cursorTemplates.length,
      localTemplatesCount: localTemplates.length
    });
    
  } catch (error) {
    handleSyncError(error);
  }
}

/**
 * Fetch all templates from Cursor AI with pagination
 */
async function fetchAllCursorTemplates(cursorClient) {
  const allTemplates = [];
  let hasMore = true;
  let offset = 0;
  const limit = 100;
  
  while (hasMore) {
    try {
      logger.debug(`Fetching templates from offset ${offset} with limit ${limit}`);
      const response = await cursorClient.listTemplates({ offset, limit });
      
      if (response.templates && response.templates.length > 0) {
        allTemplates.push(...response.templates);
        offset += response.templates.length;
        
        if (response.templates.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      logger.error('Error fetching templates from Cursor AI:', error.message);
      throw error;
    }
  }
  
  logger.info(`Retrieved ${allTemplates.length} templates from Cursor AI`);
  return allTemplates;
}

/**
 * Identify templates that need to be imported, exported, or updated
 */
function identifyChanges(cursorTemplates, localTemplates) {
  // Maps for faster lookups
  const cursorTemplateMap = new Map(
    cursorTemplates.map(template => [template.id, template])
  );
  
  const localTemplateMap = new Map(
    localTemplates.map(template => [template.id, template])
  );
  
  // Find templates that exist in Cursor AI but not locally
  const templatesToImport = cursorTemplates.filter(
    template => !localTemplateMap.has(template.id)
  );
  
  // Find templates that exist locally but not in Cursor AI
  const templatesToExport = localTemplates.filter(
    template => !cursorTemplateMap.has(template.id)
  );
  
  // Find templates that exist in both but have different lastModified timestamps
  const templatesToUpdate = cursorTemplates.filter(cursorTemplate => {
    const localTemplate = localTemplateMap.get(cursorTemplate.id);
    return localTemplate && 
           new Date(cursorTemplate.lastModified) > new Date(localTemplate.lastModified);
  });
  
  logger.info(`Found ${templatesToImport.length} templates to import`);
  logger.info(`Found ${templatesToExport.length} templates to export`);
  logger.info(`Found ${templatesToUpdate.length} templates to update`);
  
  return { templatesToImport, templatesToExport, templatesToUpdate };
}

/**
 * Import templates from Cursor AI to Template Exchange
 */
async function importTemplates(templateService, templates) {
  if (templates.length === 0) {
    logger.info('No templates to import');
    return;
  }
  
  logger.info(`Importing ${templates.length} templates from Cursor AI`);
  
  for (const template of templates) {
    try {
      const normalizedTemplate = normalizeTemplate(template);
      await templateService.createTemplate(normalizedTemplate);
      logger.info(`Imported template: ${template.name} (${template.id})`);
    } catch (error) {
      logger.error(`Failed to import template ${template.id}:`, error.message);
    }
  }
}

/**
 * Export templates from Template Exchange to Cursor AI
 */
async function exportTemplates(cursorClient, templates) {
  if (templates.length === 0) {
    logger.info('No templates to export');
    return;
  }
  
  logger.info(`Exporting ${templates.length} templates to Cursor AI`);
  
  for (const template of templates) {
    try {
      const normalizedTemplate = normalizeTemplate(template, true);
      await cursorClient.createTemplate(normalizedTemplate);
      logger.info(`Exported template: ${template.name} (${template.id})`);
    } catch (error) {
      logger.error(`Failed to export template ${template.id}:`, error.message);
    }
  }
}

/**
 * Update templates that have changed
 */
async function updateTemplates(cursorClient, templateService, templates) {
  if (templates.length === 0) {
    logger.info('No templates to update');
    return;
  }
  
  logger.info(`Updating ${templates.length} templates`);
  
  for (const template of templates) {
    try {
      const normalizedTemplate = normalizeTemplate(template);
      await templateService.updateTemplate(template.id, normalizedTemplate);
      logger.info(`Updated template: ${template.name} (${template.id})`);
    } catch (error) {
      logger.error(`Failed to update template ${template.id}:`, error.message);
    }
  }
}

/**
 * Normalize template data between systems
 */
function normalizeTemplate(template, forCursorAI = false) {
  // This function handles any differences in schema between systems
  const normalized = { ...template };
  
  if (forCursorAI) {
    // Fields to transform or remove for Cursor AI compatibility
    delete normalized.internal_id;
    // Add any other transformations needed for Cursor AI
  } else {
    // Fields to transform or remove for Template Exchange compatibility
    delete normalized.cursor_specific_field;
    // Add any other transformations needed for Template Exchange
  }
  
  return normalized;
}

/**
 * Write a sync report to file
 */
async function writeSyncReport(report) {
  try {
    const reportsDir = path.join(__dirname, '../logs');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const reportPath = path.join(
      reportsDir, 
      `sync-report-${new Date().toISOString().replace(/:/g, '-')}.json`
    );
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    logger.info(`Sync report written to ${reportPath}`);
  } catch (error) {
    logger.error('Failed to write sync report:', error.message);
  }
}

/**
 * Handle synchronization errors
 */
function handleSyncError(error) {
  if (error.name === 'ResponseError') {
    logger.error(`API Error (${error.status}):`, error.message);
    if (error.response && error.response.data) {
      logger.error('Response details:', JSON.stringify(error.response.data));
    }
  } else if (error.name === 'NetworkError') {
    logger.error('Network Error:', error.message);
  } else {
    logger.error('Synchronization Error:', error.message);
  }
  
  process.exit(1);
}

// Execute if run directly
if (require.main === module) {
  syncTemplates().catch(error => {
    logger.error('Unhandled exception:', error);
    process.exit(1);
  });
}

module.exports = { syncTemplates }; 