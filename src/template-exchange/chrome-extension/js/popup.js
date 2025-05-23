/**
 * Template Exchange - Popup Script
 * 
 * This script handles the functionality of the popup UI,
 * including authentication, fetching templates, and submitting summaries.
 */

// DOM elements
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const apiKeyInput = document.getElementById('api-key');
const authButton = document.getElementById('auth-button');
const authStatus = document.getElementById('auth-status');
const fetchSessionInput = document.getElementById('fetch-session-id');
const fetchButton = document.getElementById('fetch-button');
const fetchStatus = document.getElementById('fetch-status');
const submitSessionInput = document.getElementById('submit-session-id');
const submitContentInput = document.getElementById('submit-content');
const submitButton = document.getElementById('submit-button');
const submitStatus = document.getElementById('submit-status');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize the popup
async function initialize() {
  // Check authentication status
  const isAuthenticated = await checkAuthentication();
  
  // Show appropriate section
  if (isAuthenticated) {
    authSection.style.display = 'none';
    mainSection.style.display = 'block';
  } else {
    authSection.style.display = 'block';
    mainSection.style.display = 'none';
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Try to detect and pre-fill session ID from active tab
  detectSessionId();
}

// Check if we're authenticated
async function checkAuthentication() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
      resolve(response && response.isAuthenticated);
    });
  });
}

// Set up event listeners
function setupEventListeners() {
  // Authentication
  authButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus(authStatus, 'Please enter a valid API key', true);
      return;
    }
    
    try {
      showStatus(authStatus, 'Authenticating...', false);
      
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'storeApiKey', apiKey }, resolve);
      });
      
      if (response && response.success) {
        showStatus(authStatus, 'Authentication successful!', false);
        setTimeout(() => {
          authSection.style.display = 'none';
          mainSection.style.display = 'block';
        }, 1000);
      } else {
        showStatus(authStatus, 'Authentication failed: ' + (response.error || 'Unknown error'), true);
      }
    } catch (error) {
      showStatus(authStatus, 'Error: ' + error.message, true);
    }
  });
  
  // Fetch handoff
  fetchButton.addEventListener('click', async () => {
    const sessionId = fetchSessionInput.value.trim();
    if (!sessionId) {
      showStatus(fetchStatus, 'Please enter a valid session ID', true);
      return;
    }
    
    if (!isValidSessionId(sessionId)) {
      showStatus(fetchStatus, 'Invalid session ID format. Expected format: M1.S2', true);
      return;
    }
    
    try {
      showStatus(fetchStatus, `Fetching handoff for session ${sessionId}...`, false);
      
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          action: 'fetchTemplate', 
          sessionId,
          type: 'handoff'
        }, resolve);
      });
      
      if (response.error) {
        showStatus(fetchStatus, `Failed to fetch handoff: ${response.error}`, true);
        return;
      }
      
      if (response.template) {
        showStatus(fetchStatus, 'Handoff template fetched successfully!', false);
        
        // Copy to clipboard
        await navigator.clipboard.writeText(response.template.content);
        showStatus(fetchStatus, 'Handoff copied to clipboard!', false);
      } else {
        showStatus(fetchStatus, 'No handoff template found for this session', true);
      }
    } catch (error) {
      showStatus(fetchStatus, 'Error: ' + error.message, true);
    }
  });
  
  // Submit summary
  submitButton.addEventListener('click', async () => {
    const sessionId = submitSessionInput.value.trim();
    const content = submitContentInput.value.trim();
    
    if (!sessionId) {
      showStatus(submitStatus, 'Please enter a valid session ID', true);
      return;
    }
    
    if (!isValidSessionId(sessionId)) {
      showStatus(submitStatus, 'Invalid session ID format. Expected format: M1.S2', true);
      return;
    }
    
    if (!content) {
      showStatus(submitStatus, 'Please enter your implementation summary', true);
      return;
    }
    
    try {
      showStatus(submitStatus, `Submitting summary for session ${sessionId}...`, false);
      
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          action: 'submitTemplate', 
          sessionId,
          content,
          type: 'summary'
        }, resolve);
      });
      
      if (response.error) {
        showStatus(submitStatus, `Failed to submit summary: ${response.error}`, true);
        return;
      }
      
      showStatus(submitStatus, 'Summary submitted successfully!', false);
      submitContentInput.value = '';
    } catch (error) {
      showStatus(submitStatus, 'Error: ' + error.message, true);
    }
  });
  
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

// Switch between tabs
function switchTab(tabName) {
  // Update active tab
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
  });
  
  // Update active content
  tabContents.forEach(content => {
    const isActive = content.id === `${tabName}-tab`;
    content.classList.toggle('active', isActive);
  });
}

// Show status message
function showStatus(element, message, isError) {
  element.textContent = message;
  element.className = 'status ' + (isError ? 'error' : 'success');
  
  // Auto-hide success messages after a delay
  if (!isError) {
    setTimeout(() => {
      element.className = 'status';
    }, 5000);
  }
}

// Validate session ID format
function isValidSessionId(sessionId) {
  return /^[A-Z]\d+\.[A-Z]\d+$/.test(sessionId);
}

// Detect session ID from active tab
async function detectSessionId() {
  try {
    // Get current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      const activeTab = tabs[0];
      
      // Check URL first
      const sessionIdMatch = activeTab.url.match(/([A-Z]\d+\.[A-Z]\d+)/);
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        fetchSessionInput.value = sessionId;
        submitSessionInput.value = sessionId;
        return;
      }
      
      // If not found in URL, check page content
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          function: () => {
            const bodyText = document.body.innerText;
            const match = bodyText.match(/([A-Z]\d+\.[A-Z]\d+)/);
            return match ? match[1] : null;
          }
        }).then((results) => {
          if (results && results[0] && results[0].result) {
            const sessionId = results[0].result;
            fetchSessionInput.value = sessionId;
            submitSessionInput.value = sessionId;
          }
        });
      } catch (error) {
        // Permission error or other issue - just continue without auto-detection
        console.log('Could not check page content:', error.message);
      }
    }
  } catch (error) {
    console.error('Error detecting session ID:', error);
  }
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', initialize); 