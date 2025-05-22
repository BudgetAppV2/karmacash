/**
 * Cursor AI Template Exchange Extension
 * 
 * This script integrates with Cursor AI's interface to provide
 * template exchange functionality directly within the application.
 * 
 * Usage:
 * 1. Import this script in Cursor AI
 * 2. Use the provided APIs to interact with templates
 */

(function(window) {
  'use strict';

  // Configuration - replace with your actual Template Exchange API URL
  const CONFIG = {
    API_BASE_URL: 'https://karmacash-6e8f5.web.app/api',
    TEMPLATES_ENDPOINT: '/templateExchangeListTemplates',
    GET_TEMPLATE_ENDPOINT: '/templateExchangeGetTemplate',
    CREATE_TEMPLATE_ENDPOINT: '/templateExchangeCreateTemplate',
    STORAGE_KEY_API_KEY: 'cursor_template_exchange_api_key'
  };

  // Template Exchange Client
  class TemplateExchangeClient {
    constructor(apiKey) {
      this.apiKey = apiKey || localStorage.getItem(CONFIG.STORAGE_KEY_API_KEY);
      
      if (!this.apiKey) {
        throw new Error('API key is required for Template Exchange. Use setApiKey() to set one.');
      }
    }

    /**
     * Set the API key to use for requests
     * @param {string} apiKey - The API key to use
     */
    setApiKey(apiKey) {
      this.apiKey = apiKey;
      localStorage.setItem(CONFIG.STORAGE_KEY_API_KEY, apiKey);
    }

    /**
     * Make a request to the Template Exchange API
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} - API response
     */
    async request(endpoint, options = {}) {
      const url = CONFIG.API_BASE_URL + endpoint;
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers
        },
        ...options
      };

      // If there's a body, stringify it
      if (options.body && typeof options.body === 'object') {
        requestOptions.body = JSON.stringify(options.body);
      }

      try {
        // Implement retry logic with exponential backoff
        let retries = 0;
        const maxRetries = 3;
        
        while (true) {
          try {
            const response = await fetch(url, requestOptions);
            
            // Check if response is OK
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const error = new Error(`API Error: ${response.status} ${response.statusText}`);
              error.status = response.status;
              error.data = errorData;
              throw error;
            }
            
            return await response.json();
          } catch (error) {
            // Only retry on network errors or rate limiting
            const isNetworkError = error.message.includes('NetworkError') || 
                                 error.message.includes('Failed to fetch');
            const isRateLimitError = error.status === 429;
            
            if ((isNetworkError || isRateLimitError) && retries < maxRetries) {
              retries++;
              const delay = Math.min(Math.pow(2, retries) * 1000, 10000);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            throw error;
          }
        }
      } catch (error) {
        console.error('Template Exchange API Error:', error);
        throw error;
      }
    }

    /**
     * List all available templates
     * @param {Object} options - Filter options
     * @returns {Promise<Array>} - List of templates
     */
    async listTemplates(options = {}) {
      const queryParams = new URLSearchParams();
      
      if (options.category) queryParams.append('category', options.category);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      return this.request(`${CONFIG.TEMPLATES_ENDPOINT}${queryString}`);
    }

    /**
     * Get a specific template by ID
     * @param {string} templateId - Template ID
     * @returns {Promise<Object>} - Template data
     */
    async getTemplate(templateId) {
      return this.request(`${CONFIG.GET_TEMPLATE_ENDPOINT}?id=${encodeURIComponent(templateId)}`);
    }

    /**
     * Create a new template
     * @param {Object} template - Template data
     * @returns {Promise<Object>} - Created template
     */
    async createTemplate(template) {
      return this.request(CONFIG.CREATE_TEMPLATE_ENDPOINT, {
        method: 'POST',
        body: template
      });
    }

    /**
     * Import the current Cursor AI prompt as a template
     * @returns {Promise<Object>} - Created template
     */
    async importCurrentPrompt() {
      try {
        // Get the current prompt from Cursor AI
        const currentPrompt = window.cursorAI?.getCurrentPrompt?.() || {};
        
        if (!currentPrompt.content) {
          throw new Error('No active prompt found in Cursor AI');
        }
        
        // Create template object
        const template = {
          name: prompt('Enter a name for this template:', 'My Template'),
          description: prompt('Enter a description (optional):', ''),
          content: currentPrompt.content,
          category: prompt('Enter a category (optional):', 'General'),
          tags: prompt('Enter tags separated by commas (optional):', '')
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
        };
        
        // Submit the template
        return this.createTemplate(template);
      } catch (error) {
        console.error('Failed to import current prompt:', error);
        throw error;
      }
    }

    /**
     * Apply a template to the current Cursor AI prompt
     * @param {string} templateId - Template ID
     * @returns {Promise<boolean>} - Success status
     */
    async applyTemplate(templateId) {
      try {
        const template = await this.getTemplate(templateId);
        
        if (!template || !template.content) {
          throw new Error('Invalid template or template content');
        }
        
        // Check if Cursor AI API is available
        if (!window.cursorAI?.setPrompt) {
          throw new Error('Cursor AI API not available');
        }
        
        // Apply the template to the current prompt
        window.cursorAI.setPrompt(template.content);
        return true;
      } catch (error) {
        console.error('Failed to apply template:', error);
        throw error;
      }
    }
  }

  /**
   * Initialize the Template Exchange extension
   * @param {string} apiKey - Optional API key
   * @returns {TemplateExchangeClient} - Client instance
   */
  function initTemplateExchange(apiKey) {
    try {
      // Create client instance
      const client = new TemplateExchangeClient(apiKey);
      
      // Register with Cursor AI extension system if available
      if (window.cursorAI?.registerExtension) {
        window.cursorAI.registerExtension('templateExchange', {
          name: 'Template Exchange',
          version: '1.0.0',
          description: 'Access and share templates with the Template Exchange system',
          client: client,
          
          // Add UI commands
          commands: [
            {
              id: 'list-templates',
              name: 'List Templates',
              handler: async () => {
                const templates = await client.listTemplates();
                return templates;
              }
            },
            {
              id: 'apply-template',
              name: 'Apply Template',
              handler: async (templateId) => {
                if (!templateId) {
                  const templates = await client.listTemplates();
                  
                  if (!templates || !templates.length) {
                    throw new Error('No templates available');
                  }
                  
                  // Create a selection UI
                  const selectedIndex = prompt(
                    `Select template (0-${templates.length - 1}):\n${
                      templates.map((t, i) => `${i}: ${t.name}`).join('\n')
                    }`,
                    '0'
                  );
                  
                  if (selectedIndex === null) return false;
                  
                  const index = parseInt(selectedIndex, 10);
                  if (isNaN(index) || index < 0 || index >= templates.length) {
                    throw new Error('Invalid selection');
                  }
                  
                  templateId = templates[index].id;
                }
                
                return client.applyTemplate(templateId);
              }
            },
            {
              id: 'save-template',
              name: 'Save Current Prompt as Template',
              handler: async () => {
                return client.importCurrentPrompt();
              }
            }
          ]
        });
      }
      
      return client;
    } catch (error) {
      console.error('Failed to initialize Template Exchange:', error);
      throw error;
    }
  }

  // Expose the API to window
  window.TemplateExchange = {
    init: initTemplateExchange,
    Client: TemplateExchangeClient
  };

  // Auto-initialize if API key is already stored
  const storedApiKey = localStorage.getItem(CONFIG.STORAGE_KEY_API_KEY);
  if (storedApiKey) {
    try {
      window.templateExchangeClient = initTemplateExchange(storedApiKey);
      console.log('Template Exchange initialized successfully');
    } catch (error) {
      console.warn('Auto-initialization of Template Exchange failed:', error.message);
    }
  }

})(window); 