/**
 * Template Exchange - Background Service Worker
 * 
 * This background script handles API calls to the Template Exchange System
 * and manages the authentication flow.
 */

// Base API URL for Template Exchange
const API_BASE_URL = 'https://us-central1-karmacash-6e8f5.cloudfunctions.net';

// Store for API keys and templates
let apiKey = null;

// Initialize the extension
async function initialize() {
  console.log('Template Exchange extension initialized');
  
  // Load API key from storage
  try {
    const data = await chrome.storage.local.get('templateExchangeApiKey');
    apiKey = data.templateExchangeApiKey || null;
    
    if (apiKey) {
      console.log('API key loaded from storage');
      
      // Verify the API key works
      const isHealthy = await checkHealth();
      if (!isHealthy) {
        console.warn('API key validation failed - will need to re-authenticate');
        apiKey = null;
        await chrome.storage.local.remove('templateExchangeApiKey');
      }
    }
  } catch (error) {
    console.error('Failed to load API key:', error);
  }
}

// Check the health of the API connection
async function checkHealth() {
  try {
    const response = await makeApiRequest('/templateExchangeHealthCheck', 'GET');
    return response && response.status === 'ok';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

// Make API request to Template Exchange
async function makeApiRequest(endpoint, method, data = null) {
  try {
    if (!apiKey) {
      throw new Error('No API key available. Please authenticate first.');
    }
    
    const url = API_BASE_URL + endpoint;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Clear invalid API key
        apiKey = null;
        await chrome.storage.local.remove('templateExchangeApiKey');
        throw new Error('Authentication failed. Please re-authenticate.');
      }
      
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Store API key
async function storeApiKey(key) {
  try {
    apiKey = key;
    await chrome.storage.local.set({ templateExchangeApiKey: key });
    return { success: true };
  } catch (error) {
    console.error('Failed to store API key:', error);
    return { success: false, error: error.message };
  }
}

// Fetch template by session ID and type
async function fetchTemplate(sessionId, type = 'handoff') {
  try {
    if (!sessionId.match(/^[A-Z]\d+\.[A-Z]\d+$/)) {
      throw new Error('Invalid session ID format. Expected format: M1.S2');
    }
    
    const response = await makeApiRequest(`/templateExchangeGetTemplate/${sessionId}?type=${type}`, 'GET');
    return response;
  } catch (error) {
    console.error(`Failed to fetch ${type} template:`, error);
    throw error;
  }
}

// Submit a template
async function submitTemplate(sessionId, content, type = 'summary') {
  try {
    if (!sessionId.match(/^[A-Z]\d+\.[A-Z]\d+$/)) {
      throw new Error('Invalid session ID format. Expected format: M1.S2');
    }
    
    if (!content) {
      throw new Error('Content is required');
    }
    
    const templateData = {
      sessionId,
      type,
      content,
      status: 'active',
      source: 'google_ai_studio_extension'
    };
    
    const response = await makeApiRequest('/templateExchangeCreateTemplate', 'POST', templateData);
    return response;
  } catch (error) {
    console.error(`Failed to submit ${type} template:`, error);
    throw error;
  }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'checkAuth':
          sendResponse({ isAuthenticated: !!apiKey });
          break;
          
        case 'storeApiKey':
          const result = await storeApiKey(message.apiKey);
          sendResponse(result);
          break;
          
        case 'fetchTemplate':
          const template = await fetchTemplate(message.sessionId, message.type);
          sendResponse({ success: true, template });
          break;
          
        case 'submitTemplate':
          const submission = await submitTemplate(message.sessionId, message.content, message.type);
          sendResponse({ success: true, template: submission });
          break;
          
        case 'checkHealth':
          const isHealthy = await checkHealth();
          sendResponse({ success: isHealthy });
          break;
          
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  })();
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// Initialize the extension when installed
initialize(); 