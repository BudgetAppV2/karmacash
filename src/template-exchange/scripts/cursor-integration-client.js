/**
 * Cursor AI Integration Client
 * 
 * A secure and robust client for integrating with Cursor AI.
 * Features:
 * - Secure API key handling
 * - Retry logic with exponential backoff
 * - Proper error handling
 * - Type checking
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// ResponseError class for better error handling
class ResponseError extends Error {
  constructor(message, response) {
    super(message);
    this.name = 'ResponseError';
    this.response = response;
    this.status = response.status;
  }
}

// NetworkError class for better retry logic
class NetworkError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

/**
 * CursorAIClient provides methods for interacting with the Cursor AI API
 */
class CursorAIClient {
  /**
   * Create a new CursorAIClient instance
   * @param {Object} options - Configuration options
   * @param {string} options.apiKey - API key (optional, can use env var)
   * @param {string} options.baseURL - Base URL for the API
   * @param {number} options.timeout - Request timeout in ms
   * @param {number} options.maxRetries - Maximum number of retry attempts
   */
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.CURSOR_API_KEY;
    this.baseURL = options.baseURL || 'https://api.cursor.ai/v1';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    
    if (!this.apiKey) {
      throw new Error('API key is required. Provide it in constructor options or set CURSOR_API_KEY environment variable.');
    }
    
    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }

  /**
   * Make an HTTP request to the Cursor AI API with retry logic
   * @param {Object} config - Axios request configuration
   * @returns {Promise<Object>} - API response data
   */
  async request(config) {
    let retries = 0;
    
    while (true) {
      try {
        const response = await this.client.request(config);
        return response.data;
      } catch (error) {
        // Determine if this is a network error that should be retried
        const isNetworkError = !error.response && error.code !== 'ECONNABORTED';
        // Or a rate limit error (429) which should also be retried
        const isRateLimitError = error.response && error.response.status === 429;
        
        if ((isNetworkError || isRateLimitError) && retries < this.maxRetries) {
          retries++;
          // Calculate exponential backoff with jitter
          const delay = Math.min(
            (Math.pow(2, retries) * 1000) + (Math.random() * 1000),
            30000 // Maximum backoff of 30 seconds
          );
          
          console.warn(`Request failed, retrying in ${Math.round(delay / 1000)}s (attempt ${retries}/${this.maxRetries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Handle errors more gracefully
        if (error.response) {
          // The server responded with an error status
          throw new ResponseError(
            `API Error: ${error.response.status} ${error.response.statusText}`,
            error.response
          );
        } else if (error.request) {
          // The request was made but no response was received
          throw new NetworkError(
            'Network Error: No response received from server',
            error
          );
        } else {
          // Something happened in setting up the request
          throw new Error(`Request Configuration Error: ${error.message}`);
        }
      }
    }
  }

  /**
   * Retrieve a template by ID
   * @param {string} templateId - ID of the template to retrieve
   * @returns {Promise<Object>} - Template data
   */
  async getTemplate(templateId) {
    return this.request({
      method: 'get',
      url: `/templates/${templateId}`
    });
  }

  /**
   * List available templates
   * @param {Object} options - Query parameters
   * @param {number} options.limit - Maximum number of templates to return
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.category - Filter by category
   * @returns {Promise<Object>} - List of templates
   */
  async listTemplates(options = {}) {
    return this.request({
      method: 'get',
      url: '/templates',
      params: options
    });
  }

  /**
   * Create a new template
   * @param {Object} template - Template data
   * @param {string} template.sessionId - Session ID in format M#.S# (e.g., M5.S2)
   * @param {string} template.type - Template type ('handoff' or 'summary')
   * @param {string} template.content - Template content in markdown format
   * @param {string} [template.name] - Optional name for the template
   * @param {string} [template.source] - Optional source of the template
   * @param {string} [template.status] - Optional status ('draft', 'active', etc.)
   * @returns {Promise<Object>} - Created template
   */
  async createTemplate(template) {
    // Validate required fields
    if (!template.sessionId) {
      throw new Error('sessionId is required and must be in format M#.S# (e.g., M5.S2)');
    }
    if (!template.type || !['handoff', 'summary'].includes(template.type)) {
      throw new Error('type is required and must be either "handoff" or "summary"');
    }
    if (!template.content) {
      throw new Error('content is required');
    }
    
    // Validate sessionId format
    if (!template.sessionId.match(/^[A-Z]\d+\.[A-Z]\d+$/)) {
      throw new Error('Invalid sessionId format. Must be in format M#.S# (e.g., M5.S2)');
    }
    
    return this.request({
      method: 'post',
      url: '/templateExchangeCreateTemplate',
      data: template
    });
  }

  /**
   * Update an existing template
   * @param {string} templateId - ID of the template to update
   * @param {Object} template - Template data
   * @returns {Promise<Object>} - Updated template
   */
  async updateTemplate(templateId, template) {
    return this.request({
      method: 'put',
      url: `/templates/${templateId}`,
      data: template
    });
  }

  /**
   * Delete a template
   * @param {string} templateId - ID of the template to delete
   * @returns {Promise<Object>} - Deletion confirmation
   */
  async deleteTemplate(templateId) {
    return this.request({
      method: 'delete',
      url: `/templates/${templateId}`
    });
  }

  /**
   * Search for templates
   * @param {string} query - Search query
   * @param {Object} options - Additional search options
   * @returns {Promise<Object>} - Search results
   */
  async searchTemplates(query, options = {}) {
    return this.request({
      method: 'get',
      url: '/templates/search',
      params: {
        q: query,
        ...options
      }
    });
  }
}

module.exports = CursorAIClient; 