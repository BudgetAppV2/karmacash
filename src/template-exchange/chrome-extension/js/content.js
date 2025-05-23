/**
 * Template Exchange - Content Script
 * 
 * This script injects the Template Exchange functionality into Google AI Studio.
 * It adds UI elements and handles communication with the background script.
 */

// Main container for our UI elements
let templateExchangeContainer = null;

// Session ID extraction regex
const sessionIdRegex = /([A-Z]\d+\.[A-Z]\d+)/;

// Initialize the content script
function initialize() {
  console.log('Template Exchange content script initialized');
  
  // Check if we're on Google AI Studio
  if (!window.location.href.includes('ai.google.dev')) {
    return;
  }
  
  // Wait for page to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUI);
  } else {
    setupUI();
  }
}

// Check authentication status
async function checkAuthentication() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
      resolve(response && response.isAuthenticated);
    });
  });
}

// Setup UI elements
async function setupUI() {
  // First, check if we're authenticated
  const isAuthenticated = await checkAuthentication();
  
  // Create and inject our UI container
  templateExchangeContainer = document.createElement('div');
  templateExchangeContainer.className = 'template-exchange-container';
  document.body.appendChild(templateExchangeContainer);
  
  // Add authentication UI if needed
  if (!isAuthenticated) {
    addAuthenticationUI();
    return;
  }
  
  // Add main UI
  addMainUI();
  
  // Setup event listeners for page changes (for SPA navigation)
  observePageChanges();
}

// Add authentication UI
function addAuthenticationUI() {
  templateExchangeContainer.innerHTML = `
    <div class="template-exchange-auth">
      <div class="template-exchange-header">
        <h2>Template Exchange</h2>
        <p>Please enter your API key to continue</p>
      </div>
      <div class="template-exchange-form">
        <input type="password" id="template-exchange-api-key" placeholder="API Key">
        <button id="template-exchange-auth-button">Authenticate</button>
      </div>
      <div id="template-exchange-auth-status"></div>
    </div>
  `;
  
  // Add event listener for authentication button
  document.getElementById('template-exchange-auth-button').addEventListener('click', async () => {
    const apiKey = document.getElementById('template-exchange-api-key').value.trim();
    if (!apiKey) {
      showAuthStatus('Please enter a valid API key', true);
      return;
    }
    
    showAuthStatus('Authenticating...', false);
    
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'storeApiKey', apiKey }, resolve);
      });
      
      if (response && response.success) {
        showAuthStatus('Authentication successful!', false);
        setTimeout(() => {
          // Refresh the UI to show main interface
          templateExchangeContainer.innerHTML = '';
          addMainUI();
        }, 1000);
      } else {
        showAuthStatus('Authentication failed: ' + (response.error || 'Unknown error'), true);
      }
    } catch (error) {
      showAuthStatus('Authentication failed: ' + error.message, true);
    }
  });
}

// Show authentication status message
function showAuthStatus(message, isError) {
  const statusEl = document.getElementById('template-exchange-auth-status');
  statusEl.textContent = message;
  statusEl.className = isError ? 'error' : 'success';
}

// Add main UI elements
function addMainUI() {
  // Add the sidebar button
  addSidebarButton();
  
  // Add the sidebar container (initially hidden)
  const sidebar = document.createElement('div');
  sidebar.id = 'template-exchange-sidebar';
  sidebar.className = 'template-exchange-sidebar hidden';
  
  sidebar.innerHTML = `
    <div class="template-exchange-sidebar-header">
      <h2>Template Exchange</h2>
      <button id="template-exchange-close-sidebar" aria-label="Close">×</button>
    </div>
    <div class="template-exchange-tabs">
      <button id="template-exchange-tab-handoff" class="active">Handoffs</button>
      <button id="template-exchange-tab-summary">Summaries</button>
    </div>
    <div class="template-exchange-tab-content">
      <div id="template-exchange-handoffs" class="active">
        <div class="template-exchange-section">
          <h3>Current Session</h3>
          <div class="template-exchange-current-session">
            <div id="template-exchange-current-session-id">No session detected</div>
            <div class="template-exchange-actions">
              <button id="template-exchange-fetch-current" disabled>Fetch Handoff</button>
              <button id="template-exchange-submit-current" disabled>Submit Summary</button>
            </div>
          </div>
        </div>
        <div class="template-exchange-section">
          <h3>Other Sessions</h3>
          <div class="template-exchange-form">
            <input type="text" id="template-exchange-session-id" placeholder="Session ID (e.g., M7.S6)">
            <button id="template-exchange-fetch">Fetch Handoff</button>
          </div>
        </div>
      </div>
      <div id="template-exchange-summaries">
        <div class="template-exchange-section">
          <h3>Submit Summary</h3>
          <div class="template-exchange-form">
            <input type="text" id="template-exchange-summary-session-id" placeholder="Session ID (e.g., M7.S6)">
            <textarea id="template-exchange-summary-content" placeholder="Enter your summary here..."></textarea>
            <button id="template-exchange-submit">Submit Summary</button>
          </div>
        </div>
      </div>
    </div>
    <div id="template-exchange-status"></div>
  `;
  
  templateExchangeContainer.appendChild(sidebar);
  
  // Add event listeners
  document.getElementById('template-exchange-close-sidebar').addEventListener('click', toggleSidebar);
  
  document.getElementById('template-exchange-tab-handoff').addEventListener('click', () => {
    switchTab('handoff');
  });
  
  document.getElementById('template-exchange-tab-summary').addEventListener('click', () => {
    switchTab('summary');
  });
  
  document.getElementById('template-exchange-fetch').addEventListener('click', () => {
    const sessionId = document.getElementById('template-exchange-session-id').value.trim();
    fetchTemplate(sessionId);
  });
  
  document.getElementById('template-exchange-submit').addEventListener('click', () => {
    const sessionId = document.getElementById('template-exchange-summary-session-id').value.trim();
    const content = document.getElementById('template-exchange-summary-content').value.trim();
    submitTemplate(sessionId, content);
  });
  
  document.getElementById('template-exchange-fetch-current').addEventListener('click', () => {
    const sessionId = document.getElementById('template-exchange-current-session-id').textContent.trim();
    if (sessionId && sessionId !== 'No session detected') {
      fetchTemplate(sessionId);
    }
  });
  
  document.getElementById('template-exchange-submit-current').addEventListener('click', () => {
    const sessionId = document.getElementById('template-exchange-current-session-id').textContent.trim();
    if (sessionId && sessionId !== 'No session detected') {
      // Open the summary tab and pre-fill the session ID
      switchTab('summary');
      document.getElementById('template-exchange-summary-session-id').value = sessionId;
      document.getElementById('template-exchange-summary-content').focus();
    }
  });
  
  // Detect current session ID
  detectSessionId();
}

// Add sidebar button
function addSidebarButton() {
  const button = document.createElement('button');
  button.id = 'template-exchange-button';
  button.className = 'template-exchange-button';
  button.setAttribute('aria-label', 'Template Exchange');
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      <path d="M9 14l3-3 3 3"></path>
      <path d="M12 11v6"></path>
    </svg>
  `;
  
  templateExchangeContainer.appendChild(button);
  
  button.addEventListener('click', toggleSidebar);
}

// Toggle sidebar visibility
function toggleSidebar() {
  const sidebar = document.getElementById('template-exchange-sidebar');
  sidebar.classList.toggle('hidden');
}

// Switch between tabs
function switchTab(tab) {
  // Update tab buttons
  document.getElementById('template-exchange-tab-handoff').classList.toggle('active', tab === 'handoff');
  document.getElementById('template-exchange-tab-summary').classList.toggle('active', tab === 'summary');
  
  // Update tab content
  document.getElementById('template-exchange-handoffs').classList.toggle('active', tab === 'handoff');
  document.getElementById('template-exchange-summaries').classList.toggle('active', tab === 'summary');
}

// Detect session ID from URL or page content
function detectSessionId() {
  // Check URL first
  const url = window.location.href;
  let match = url.match(sessionIdRegex);
  
  if (!match) {
    // Check page content
    const pageText = document.body.innerText;
    match = pageText.match(sessionIdRegex);
  }
  
  if (match) {
    const sessionId = match[1];
    document.getElementById('template-exchange-current-session-id').textContent = sessionId;
    document.getElementById('template-exchange-fetch-current').disabled = false;
    document.getElementById('template-exchange-submit-current').disabled = false;
    
    // Also prefill the session ID in the form fields
    document.getElementById('template-exchange-session-id').value = sessionId;
    document.getElementById('template-exchange-summary-session-id').value = sessionId;
  }
}

// Fetch template from the background script
async function fetchTemplate(sessionId) {
  if (!sessionId) {
    showStatus('Please enter a valid session ID', true);
    return;
  }
  
  if (!sessionId.match(/^[A-Z]\d+\.[A-Z]\d+$/)) {
    showStatus('Invalid session ID format. Expected format: M1.S2', true);
    return;
  }
  
  showStatus(`Fetching handoff for session ${sessionId}...`, false);
  
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        action: 'fetchTemplate', 
        sessionId,
        type: 'handoff'
      }, resolve);
    });
    
    if (response.error) {
      showStatus(`Failed to fetch handoff: ${response.error}`, true);
      return;
    }
    
    if (response.template) {
      showStatus('Handoff template fetched successfully!', false);
      
      // Insert the template into the active conversation or clipboard
      insertHandoff(response.template.content);
    } else {
      showStatus('No handoff template found for this session', true);
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, true);
  }
}

// Insert handoff into active conversation
function insertHandoff(content) {
  // Try to find the input field in Google AI Studio
  const inputField = document.querySelector('textarea[placeholder*="Send a message"], textarea.prompt-textarea');
  
  if (inputField) {
    // Insert the content into the input field
    inputField.value = content;
    inputField.focus();
    
    // Dispatch input event to trigger any listeners
    inputField.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // Fall back to clipboard if input field not found
    navigator.clipboard.writeText(content)
      .then(() => {
        showStatus('Handoff copied to clipboard! Paste it into the input area.', false);
      })
      .catch(err => {
        showStatus('Could not copy to clipboard: ' + err.message, true);
      });
  }
}

// Submit template to the background script
async function submitTemplate(sessionId, content) {
  if (!sessionId) {
    showStatus('Please enter a valid session ID', true);
    return;
  }
  
  if (!sessionId.match(/^[A-Z]\d+\.[A-Z]\d+$/)) {
    showStatus('Invalid session ID format. Expected format: M1.S2', true);
    return;
  }
  
  if (!content) {
    showStatus('Please enter summary content', true);
    return;
  }
  
  showStatus(`Submitting summary for session ${sessionId}...`, false);
  
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        action: 'submitTemplate', 
        sessionId,
        content,
        type: 'summary'
      }, resolve);
    });
    
    if (response.error) {
      showStatus(`Failed to submit summary: ${response.error}`, true);
      return;
    }
    
    showStatus('Summary submitted successfully!', false);
    
    // Clear the form
    document.getElementById('template-exchange-summary-content').value = '';
  } catch (error) {
    showStatus(`Error: ${error.message}`, true);
  }
}

// Show status message
function showStatus(message, isError) {
  const statusEl = document.getElementById('template-exchange-status');
  statusEl.textContent = message;
  statusEl.className = isError ? 'error' : 'success';
  
  // Clear the status after a few seconds
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = '';
  }, 5000);
}

// Observe page changes for SPA navigation
function observePageChanges() {
  // Create an observer to detect URL changes and new content
  const observer = new MutationObserver(debounce(() => {
    detectSessionId();
  }, 500));
  
  // Start observing the document body for changes
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Also check on history changes for SPA navigation
  window.addEventListener('popstate', () => {
    setTimeout(detectSessionId, 500);
  });
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize the content script
initialize(); 