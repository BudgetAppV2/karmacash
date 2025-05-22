# Template Exchange System Documentation

This document provides comprehensive technical guidance for implementing the Firebase-based template exchange system to streamline communication between Google AI Studio and Cursor AI. This will serve as a reference for Cursor AI when implementing the various components.

## 1. System Overview

### Purpose
To automate the exchange of templates/handoffs between Google AI Studio and Cursor AI, eliminating manual copy-paste operations and preserving formatting.

### Architecture
```
┌─────────────────┐           ┌────────────────────┐           ┌────────────────┐
│  Google AI      │           │                    │           │                │
│  Studio         │◄──────────┤     Firebase       │◄──────────┤    Cursor AI   │
│  (Chrome Ext)   │           │                    │           │                │
└─────────────────┘           └────────────────────┘           └────────────────┘
      ▲                                  ▲                             ▲
      │                                  │                             │
      └──────────────────────►┌────────────────────┐◄─────────────────┘
                              │  Web Interface     │
                              │  (Admin Portal)    │
                              └────────────────────┘
```

### Core Components
1. **Firebase Backend**: Firestore database, Cloud Functions, Firebase Hosting
2. **Web Interface**: Simple admin portal for direct template management
3. **Chrome Extension**: For Google AI Studio integration
4. **Cursor AI Commands**: For programmatic API access

## 2. Data Model Reference

### Firestore Collection Schema

**Collection: `templates`**

| Field | Type | Description |
|-------|------|-------------|
| sessionId | String | Unique identifier for the session (e.g., "M5.S4") |
| type | String | Type of template ("handoff" or "summary") |
| content | String | The actual template content in markdown format |
| timestamp | Timestamp | When the template was created/updated |
| status | String | Status of the template ("pending", "completed") |

**Example Document**
```json
{
  "sessionId": "M5.S4",
  "type": "handoff",
  "content": "# Task Objective: Implement feature X\n## Details: ...",
  "timestamp": "2025-05-21T14:30:00Z",
  "status": "pending"
}
```

### API Endpoints

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/templates/:sessionId` | GET | Fetch template by session ID | sessionId (URL param), type (query param) |
| `/api/templates` | POST | Create/update template | sessionId, type, content (body) |
| `/api/templates` | GET | List all templates | type, status (query params) |

## 3. Chrome Extension Implementation Guide

### Project Structure
```
/chrome-extension/
├── manifest.json           # Extension configuration
├── background.js           # Background script for Firebase communication
├── content-script.js       # Script to interact with Google AI Studio
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic
└── assets/
    └── icons/              # Extension icons (16, 48, 128px)
```

### manifest.json Reference

```json
{
  "manifest_version": 3,
  "name": "AI Template Exchange",
  "version": "1.0.0",
  "description": "Exchange templates between Google AI Studio and Firebase",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://aistudio.google.com/*",
    "https://YOUR-FIREBASE-PROJECT.web.app/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://aistudio.google.com/*"],
      "js": ["content-script.js"]
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon16.png",
      "48": "assets/icons/icon48.png",
      "128": "assets/icons/icon128.png"
    }
  },
  "icons": {
    "16": "assets/icons/icon16.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png"
  }
}
```

### Google AI Studio UI Element Selectors

*Note: These are placeholder selectors. You'll need to inspect the actual Google AI Studio page to find the correct selectors.*

```javascript
// Input area where the user types their prompt
const INPUT_SELECTOR = '.gemini-chat-conversation-input';

// Submit button
const SUBMIT_BUTTON_SELECTOR = '.gemini-chat-submit-button';

// Output/response area
const OUTPUT_SELECTOR = '.gemini-chat-conversation-turn-response';
```

### Content Script Implementation

```javascript
// content-script.js
// This script runs in the context of the Google AI Studio page

// Function to inject template into Google AI Studio input
function injectTemplate(templateContent) {
  const inputArea = document.querySelector(INPUT_SELECTOR);
  if (!inputArea) {
    console.error('Could not find input area in Google AI Studio');
    return false;
  }
  
  // Set the value
  inputArea.value = templateContent;
  
  // Dispatch input event to trigger any listeners
  const inputEvent = new Event('input', { bubbles: true });
  inputArea.dispatchEvent(inputEvent);
  
  return true;
}

// Function to extract content from Google AI Studio
function extractContent() {
  const outputArea = document.querySelector(OUTPUT_SELECTOR);
  if (!outputArea) {
    console.error('Could not find output area in Google AI Studio');
    return null;
  }
  
  return outputArea.textContent;
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.action === 'inject') {
    const success = injectTemplate(message.content);
    sendResponse({ success });
  } 
  else if (message.action === 'extract') {
    const content = extractContent();
    sendResponse({ content });
  }
  
  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Notify when the content script has loaded
console.log('AI Template Exchange content script loaded');
```

### Background Script Implementation

```javascript
// background.js
// Handles communication with Firebase

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase when the extension loads
let firebaseInitialized = false;

async function initializeFirebase() {
  if (!firebaseInitialized) {
    await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
    await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
    
    firebase.initializeApp(firebaseConfig);
    firebaseInitialized = true;
    console.log('Firebase initialized');
  }
}

// Function to fetch template from Firebase
async function fetchTemplate(sessionId, type = 'handoff') {
  await initializeFirebase();
  
  try {
    const db = firebase.firestore();
    const query = db.collection('templates')
      .where('sessionId', '==', sessionId)
      .where('type', '==', type)
      .orderBy('timestamp', 'desc')
      .limit(1);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.error(`No ${type} found for session ${sessionId}`);
      return null;
    }
    
    const doc = snapshot.docs[0];
    return doc.data();
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}

// Function to save template to Firebase
async function saveTemplate(sessionId, type, content) {
  await initializeFirebase();
  
  try {
    const db = firebase.firestore();
    const templateRef = db.collection('templates').doc();
    
    await templateRef.set({
      sessionId,
      type,
      content,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });
    
    return { success: true, id: templateRef.id };
  } catch (error) {
    console.error('Error saving template:', error);
    return { success: false, error: error.message };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'fetchTemplate') {
    fetchTemplate(message.sessionId, message.type)
      .then(template => sendResponse(template))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates we'll send response asynchronously
  }
  
  if (message.action === 'saveTemplate') {
    saveTemplate(message.sessionId, message.type, message.content)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// Initialize Firebase when the background script loads
initializeFirebase();
```

### Popup UI Implementation

```html
<!-- popup.html -->
<!DOCTYPE html>
<html>
<head>
  <title>AI Template Exchange</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h1>Template Exchange</h1>
    
    <div class="section">
      <h2>Fetch Template</h2>
      <div class="form-group">
        <label for="sessionId">Session ID:</label>
        <input type="text" id="sessionId" placeholder="e.g., M5.S4">
      </div>
      <div class="form-group">
        <label>Template Type:</label>
        <div class="radio-group">
          <input type="radio" id="typeHandoff" name="templateType" value="handoff" checked>
          <label for="typeHandoff">Handoff</label>
          
          <input type="radio" id="typeSummary" name="templateType" value="summary">
          <label for="typeSummary">Summary</label>
        </div>
      </div>
      <button id="fetchButton">Fetch & Inject</button>
      <div id="fetchStatus" class="status"></div>
    </div>
    
    <div class="section">
      <h2>Extract & Save</h2>
      <div class="form-group">
        <label for="saveSessionId">Session ID:</label>
        <input type="text" id="saveSessionId" placeholder="e.g., M5.S4">
      </div>
      <div class="form-group">
        <label>Template Type:</label>
        <div class="radio-group">
          <input type="radio" id="saveTypeHandoff" name="saveTemplateType" value="handoff">
          <label for="saveTypeHandoff">Handoff</label>
          
          <input type="radio" id="saveTypeSummary" name="saveTemplateType" value="summary" checked>
          <label for="saveTypeSummary">Summary</label>
        </div>
      </div>
      <button id="extractButton">Extract & Save</button>
      <div id="saveStatus" class="status"></div>
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

```javascript
// popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const sessionIdInput = document.getElementById('sessionId');
  const fetchButton = document.getElementById('fetchButton');
  const fetchStatus = document.getElementById('fetchStatus');
  
  const saveSessionIdInput = document.getElementById('saveSessionId');
  const extractButton = document.getElementById('extractButton');
  const saveStatus = document.getElementById('saveStatus');
  
  // Fetch and inject template
  fetchButton.addEventListener('click', async () => {
    const sessionId = sessionIdInput.value.trim();
    if (!sessionId) {
      fetchStatus.textContent = 'Please enter a Session ID';
      fetchStatus.className = 'status error';
      return;
    }
    
    const type = document.querySelector('input[name="templateType"]:checked').value;
    
    fetchStatus.textContent = 'Fetching template...';
    fetchStatus.className = 'status loading';
    
    try {
      // 1. Fetch template from Firebase (via background script)
      chrome.runtime.sendMessage(
        { action: 'fetchTemplate', sessionId, type },
        async (response) => {
          if (response && response.content) {
            fetchStatus.textContent = 'Template found, injecting...';
            
            // 2. Send template content to the content script for injection
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(
                tabs[0].id, 
                { action: 'inject', content: response.content },
                (injectionResult) => {
                  if (injectionResult && injectionResult.success) {
                    fetchStatus.textContent = 'Template injected successfully!';
                    fetchStatus.className = 'status success';
                  } else {
                    fetchStatus.textContent = 'Failed to inject template';
                    fetchStatus.className = 'status error';
                  }
                }
              );
            });
          } else {
            fetchStatus.textContent = `No ${type} found for session ${sessionId}`;
            fetchStatus.className = 'status error';
          }
        }
      );
    } catch (error) {
      fetchStatus.textContent = `Error: ${error.message}`;
      fetchStatus.className = 'status error';
    }
  });
  
  // Extract and save template
  extractButton.addEventListener('click', async () => {
    const sessionId = saveSessionIdInput.value.trim();
    if (!sessionId) {
      saveStatus.textContent = 'Please enter a Session ID';
      saveStatus.className = 'status error';
      return;
    }
    
    const type = document.querySelector('input[name="saveTemplateType"]:checked').value;
    
    saveStatus.textContent = 'Extracting content...';
    saveStatus.className = 'status loading';
    
    try {
      // 1. Extract content from Google AI Studio
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'extract' },
          (result) => {
            if (result && result.content) {
              saveStatus.textContent = 'Content extracted, saving...';
              
              // 2. Save to Firebase
              chrome.runtime.sendMessage(
                { 
                  action: 'saveTemplate', 
                  sessionId, 
                  type, 
                  content: result.content 
                },
                (saveResult) => {
                  if (saveResult && saveResult.success) {
                    saveStatus.textContent = 'Template saved successfully!';
                    saveStatus.className = 'status success';
                  } else {
                    saveStatus.textContent = 'Failed to save template';
                    saveStatus.className = 'status error';
                  }
                }
              );
            } else {
              saveStatus.textContent = 'Failed to extract content';
              saveStatus.className = 'status error';
            }
          }
        );
      });
    } catch (error) {
      saveStatus.textContent = `Error: ${error.message}`;
      saveStatus.className = 'status error';
    }
  });
});
```

```css
/* popup.css */
body {
  width: 400px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
}

.container {
  padding: 16px;
}

h1 {
  font-size: 18px;
  color: #333;
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

h2 {
  font-size: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
}

.section {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

input[type="text"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.radio-group {
  display: flex;
  gap: 16px;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

button:hover {
  background-color: #3367d6;
}

.status {
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.loading {
  background-color: #e8f0fe;
  color: #1967d2;
}

.success {
  background-color: #e6f4ea;
  color: #137333;
}

.error {
  background-color: #fce8e6;
  color: #c5221f;
}
```

## 4. Cursor AI Integration Guide

### Command Implementation Structure

```javascript
// This would be implemented in your Cursor AI environment

// Function to fetch a handoff template by session ID
async function fetchHandoff(sessionId) {
  try {
    const response = await fetch(`https://YOUR-FIREBASE-PROJECT.web.app/api/templates/${sessionId}?type=handoff`, {
      headers: {
        'x-api-key': 'YOUR_API_KEY'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch handoff: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error fetching handoff:', error);
    return null;
  }
}

// Function to submit a summary
async function submitSummary(sessionId, content) {
  try {
    const response = await fetch('https://YOUR-FIREBASE-PROJECT.web.app/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY'
      },
      body: JSON.stringify({
        sessionId,
        type: 'summary',
        content
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit summary: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting summary:', error);
    return { success: false, error: error.message };
  }
}

// Command handler
async function handleCommand(command) {
  const parts = command.split(' ');
  
  if (parts[0] === 'fetch-handoff' && parts.length >= 2) {
    const sessionId = parts[1];
    console.log(`Fetching handoff for session ${sessionId}...`);
    
    const content = await fetchHandoff(sessionId);
    if (content) {
      console.log('Handoff successfully retrieved:');
      console.log('------------------------');
      console.log(content);
      console.log('------------------------');
      return content;
    } else {
      console.error(`No handoff found for session ${sessionId}`);
      return null;
    }
  }
  
  if (parts[0] === 'submit-summary' && parts.length >= 2) {
    const sessionId = parts[1];
    
    // For simplicity, we're assuming the current editor content is the summary
    // You'd need to adapt this based on how Cursor AI allows accessing content
    const content = getCurrentEditorContent();
    
    console.log(`Submitting summary for session ${sessionId}...`);
    const result = await submitSummary(sessionId, content);
    
    if (result.success) {
      console.log('Summary successfully submitted!');
      return true;
    } else {
      console.error(`Failed to submit summary: ${result.error}`);
      return false;
    }
  }
  
  console.error('Unknown command or missing parameters');
  return null;
}

// Helper function (example - adapt to Cursor AI's actual API)
function getCurrentEditorContent() {
  // This is a placeholder - you would need to implement this 
  // based on how Cursor AI provides access to the editor content
  return "Implementation summary content goes here";
}
```

## 5. Firebase Cloud Functions Reference

### Template API Functions

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

admin.initializeApp();

// Middleware for API key validation
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // In production, use a secure method to validate API keys
  // This is just a simple example
  if (!apiKey || apiKey !== 'YOUR_API_KEY') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Get template by session ID
exports.getTemplate = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Validate API key
    if (!validateApiKey(req, res, () => {})) return;
    
    try {
      const sessionId = req.params[0].split('/')[2]; // Extract sessionId from path
      const type = req.query.type || 'handoff';
      
      const db = admin.firestore();
      const query = db.collection('templates')
        .where('sessionId', '==', sessionId)
        .where('type', '==', type)
        .orderBy('timestamp', 'desc')
        .limit(1);
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        return res.status(404).json({ 
          error: `No ${type} found for session ${sessionId}` 
        });
      }
      
      const doc = snapshot.docs[0];
      return res.status(200).json(doc.data());
    } catch (error) {
      console.error('Error getting template:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// Create/update template
exports.createTemplate = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Validate API key
    if (!validateApiKey(req, res, () => {})) return;
    
    // Validate method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
      const { sessionId, type, content } = req.body;
      
      // Validate required fields
      if (!sessionId || !type || !content) {
        return res.status(400).json({ 
          error: 'Missing required fields: sessionId, type, content' 
        });
      }
      
      // Validate type
      if (type !== 'handoff' && type !== 'summary') {
        return res.status(400).json({ 
          error: 'Type must be either "handoff" or "summary"' 
        });
      }
      
      const db = admin.firestore();
      const templateRef = db.collection('templates').doc();
      
      await templateRef.set({
        sessionId,
        type,
        content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
      });
      
      return res.status(201).json({ 
        success: true, 
        id: templateRef.id,
        message: `${type} for session ${sessionId} saved successfully`
      });
    } catch (error) {
      console.error('Error creating template:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// List templates (with optional filtering)
exports.listTemplates = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Validate API key
    if (!validateApiKey(req, res, () => {})) return;
    
    try {
      const type = req.query.type;
      const status = req.query.status;
      
      const db = admin.firestore();
      let query = db.collection('templates');
      
      // Apply filters if provided
      if (type) {
        query = query.where('type', '==', type);
      }
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      // Sort by timestamp descending
      query = query.orderBy('timestamp', 'desc');
      
      const snapshot = await query.get();
      
      const templates = [];
      snapshot.forEach(doc => {
        templates.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return res.status(200).json(templates);
    } catch (error) {
      console.error('Error listing templates:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});
```

## 6. Web Interface Implementation Reference

### Web Interface Structure

```
/public/
├── index.html         # Main application HTML
├── styles.css         # Core styles
├── app.js             # Application logic
└── firebase-config.js # Firebase configuration
```

### Firebase Configuration

```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
```

### Main Application Logic

```javascript
// app.js
document.addEventListener('DOMContentLoaded', function() {
  // Form elements
  const templateForm = document.getElementById('templateForm');
  const sessionIdInput = document.getElementById('sessionId');
  const typeSelect = document.getElementById('templateType');
  const contentTextarea = document.getElementById('templateContent');
  const submitButton = document.getElementById('submitButton');
  const formStatus = document.getElementById('formStatus');
  
  // Templates list elements
  const templatesList = document.getElementById('templatesList');
  const typeFilter = document.getElementById('typeFilter');
  const refreshButton = document.getElementById('refreshButton');
  
  // Submit template form
  templateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sessionId = sessionIdInput.value.trim();
    const type = typeSelect.value;
    const content = contentTextarea.value.trim();
    
    if (!sessionId || !content) {
      formStatus.textContent = 'Please fill all required fields';
      formStatus.className = 'status error';
      return;
    }
    
    submitButton.disabled = true;
    formStatus.textContent = 'Saving template...';
    formStatus.className = 'status loading';
    
    try {
      await db.collection('templates').add({
        sessionId,
        type,
        content,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
      });
      
      formStatus.textContent = 'Template saved successfully!';
      formStatus.className = 'status success';
      
      // Reset form
      sessionIdInput.value = '';
      contentTextarea.value = '';
      
      // Refresh the templates list
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      formStatus.textContent = `Error: ${error.message}`;
      formStatus.className = 'status error';
    } finally {
      submitButton.disabled = false;
    }
  });
  
  // Load templates
  async function loadTemplates() {
    templatesList.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    
    try {
      const selectedType = typeFilter.value;
      
      let query = db.collection('templates')
        .orderBy('timestamp', 'desc');
      
      if (selectedType !== 'all') {
        query = query.where('type', '==', selectedType);
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        templatesList.innerHTML = '<tr><td colspan="4">No templates found</td></tr>';
        return;
      }
      
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const date = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'N/A';
        
        html += `
          <tr>
            <td>${data.sessionId}</td>
            <td>${data.type}</td>
            <td>${date}</td>
            <td>
              <button class="view-btn" data-id="${doc.id}">View</button>
              <button class="delete-btn" data-id="${doc.id}">Delete</button>
            </td>
          </tr>
        `;
      });
      
      templatesList.innerHTML = html;
      
      // Add event listeners for view/delete buttons
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', viewTemplate);
      });
      
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteTemplate);
      });
    } catch (error) {
      console.error('Error loading templates:', error);
      templatesList.innerHTML = `<tr><td colspan="4">Error: ${error.message}</td></tr>`;
    }
  }
  
  // View template
  async function viewTemplate(e) {
    const templateId = e.target.getAttribute('data-id');
    
    try {
      const doc = await db.collection('templates').doc(templateId).get();
      
      if (!doc.exists) {
        alert('Template not found');
        return;
      }
      
      const data = doc.data();
      
      // Create modal to display template content
      const modal = document.createElement('div');
      modal.className = 'modal';
      
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      
      modalContent.innerHTML = `
        <span class="close">&times;</span>
        <h2>Template: ${data.sessionId} (${data.type})</h2>
        <div class="template-metadata">
          <p><strong>Created:</strong> ${data.timestamp ? data.timestamp.toDate().toLocaleString() : 'N/A'}</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <div class="template-content">
          <pre>${data.content}</pre>
        </div>
        <div class="modal-actions">
          <button id="copyBtn">Copy to Clipboard</button>
        </div>
      `;
      
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
      
      // Close button
      const closeBtn = modal.querySelector('.close');
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Copy button
      const copyBtn = modal.querySelector('#copyBtn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(data.content)
          .then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy to Clipboard';
            }, 2000);
          })
          .catch(err => {
            console.error('Error copying text:', err);
            copyBtn.textContent = 'Failed to copy';
            setTimeout(() => {
              copyBtn.textContent = 'Copy to Clipboard';
            }, 2000);
          });
      });
      
      // Close modal when clicking outside
      window.addEventListener('click', (event) => {
        if (event.target === modal) {
          document.body.removeChild(modal);
        }
      });
    } catch (error) {
      console.error('Error viewing template:', error);
      alert(`Error: ${error.message}`);
    }
  }
  
  // Delete template
  async function deleteTemplate(e) {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    const templateId = e.target.getAttribute('data-id');
    
    try {
      await db.collection('templates').doc(templateId).delete();
      
      alert('Template deleted successfully');
      
      // Refresh the templates list
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(`Error: ${error.message}`);
    }
  }
  
  // Filter change event
  typeFilter.addEventListener('change', loadTemplates);
  
  // Refresh button
  refreshButton.addEventListener('click', loadTemplates);
  
  // Initial load
  loadTemplates();
});
```

### HTML Structure

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template Exchange System</title>
  <link rel="stylesheet" href="styles.css">
  
  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
  
  <!-- Application Scripts -->
  <script src="firebase-config.js"></script>
  <script src="app.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <h1>Template Exchange System</h1>
    </header>
    
    <main>
      <section class="form-section">
        <h2>Submit Template</h2>
        <form id="templateForm">
          <div class="form-group">
            <label for="sessionId">Session ID:</label>
            <input type="text" id="sessionId" required placeholder="e.g., M5.S4">
          </div>
          
          <div class="form-group">
            <label for="templateType">Template Type:</label>
            <select id="templateType" required>
              <option value="handoff">Handoff</option>
              <option value="summary">Summary</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="templateContent">Content:</label>
            <textarea id="templateContent" required rows="10" placeholder="Paste template content here..."></textarea>
          </div>
          
          <button type="submit" id="submitButton">Submit Template</button>
          <div id="formStatus" class="status"></div>
        </form>
      </section>
      
      <section class="templates-section">
        <h2>Templates</h2>
        
        <div class="templates-header">
          <div class="filter-group">
            <label for="typeFilter">Filter by type:</label>
            <select id="typeFilter">
              <option value="all">All Types</option>
              <option value="handoff">Handoff</option>
              <option value="summary">Summary</option>
            </select>
          </div>
          
          <button id="refreshButton">Refresh</button>
        </div>
        
        <div class="templates-table-container">
          <table class="templates-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Type</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="templatesList">
              <tr>
                <td colspan="4">Loading...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
    
    <footer>
      <p>&copy; 2025 KarmaCash - Template Exchange System</p>
    </footer>
  </div>
</body>
</html>
```

### CSS Styling

```css
/* styles.css */
:root {
  --primary-color: #4285f4;
  --primary-dark: #3367d6;
  --success-color: #0f9d58;
  --warning-color: #f4b400;
  --error-color: #db4437;
  --text-color: #202124;
  --background-color: #f8f9fa;
  --border-color: #dadce0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

h1 {
  color: var(--primary-color);
}

h2 {
  margin-bottom: 20px;
  color: var(--text-color);
}

main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 900px) {
  main {
    grid-template-columns: 1fr;
  }
}

section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

input[type="text"],
select,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
}

textarea {
  resize: vertical;
}

button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

button:hover {
  background-color: var(--primary-dark);
}

button:disabled {
  background-color: var(--border-color);
  cursor: not-allowed;
}

.status {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
}

.loading {
  background-color: #e8f0fe;
  color: var(--primary-color);
}

.success {
  background-color: #e6f4ea;
  color: var(--success-color);
}

.error {
  background-color: #fce8e6;
  color: var(--error-color);
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group select {
  width: auto;
}

.templates-table-container {
  overflow-x: auto;
}

.templates-table {
  width: 100%;
  border-collapse: collapse;
}

.templates-table th,
.templates-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.templates-table th {
  background-color: #f1f3f4;
  font-weight: 500;
}

.templates-table tr:hover {
  background-color: #f8f9fa;
}

.templates-table button {
  padding: 5px 10px;
  margin-right: 5px;
  font-size: 12px;
}

.view-btn {
  background-color: var(--primary-color);
}

.delete-btn {
  background-color: var(--error-color);
}

/* Modal styles */
.modal {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: white;
  margin: 50px auto;
  padding: 20px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
}

.template-metadata {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}

.template-content {
  background-color: #f1f3f4;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.template-content pre {
  white-space: pre-wrap;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

footer {
  margin-top: 40px;
  text-align: center;
  color: #5f6368;
  font-size: 14px;
}
```

## 7. Development and Deployment Workflow

### Local Development Setup

1. **Firebase Project Configuration**
   ```bash
   # Install Firebase tools
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize project
   firebase init
   
   # Select Firestore, Functions, and Hosting
   ```

2. **Chrome Extension Development**
   - Chrome extension work happens in its own folder
   - Use Chrome's "Load unpacked extension" in developer mode for testing
   - Make sure to handle CORS properly for local development

3. **Firebase Emulator for Local Testing**
   ```bash
   # Start Firebase emulators
   firebase emulators:start
   ```

### Deployment Checklist

1. **Firebase Backend Deployment**
   ```bash
   # Deploy everything
   firebase deploy
   
   # Or deploy specific features
   firebase deploy --only firestore
   firebase deploy --only functions
   firebase deploy --only hosting
   ```

2. **Chrome Extension Packaging**
   - Create a .zip file containing all extension files
   - For team use, distribute .zip file for manual installation
   - For public distribution, consider Chrome Web Store submission

3. **Post-Deployment Verification**
   - Test all API endpoints with Postman
   - Verify Chrome extension functionality with Google AI Studio
   - Test Cursor AI integration commands
   - Confirm end-to-end workflow functions correctly

## 8. Security Considerations

1. **API Key Management**
   - Store API keys securely
   - Implement proper authentication for all endpoints
   - Consider environment-specific keys (dev/prod)

2. **Chrome Extension Security**
   - Request minimal permissions
   - Use content security policy (CSP)
   - Secure storage of authentication credentials

3. **Data Access Controls**
   - Implement proper Firestore security rules
   - Validate all inputs server-side
   - Log access attempts for auditing

## 9. Testing Strategies

### Unit Testing

```javascript
// Example Jest test for the fetchTemplate function
test('fetchTemplate returns null for non-existent session', async () => {
  // Mock Firestore response
  jest.spyOn(firebase, 'firestore').mockImplementation(() => ({
    collection: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: true,
        docs: []
      })
    })
  }));
  
  const result = await fetchTemplate('NON_EXISTENT_SESSION');
  expect(result).toBeNull();
});
```

### Integration Testing

Create a test plan covering:
1. Template submission from web interface
2. Template retrieval in Chrome extension
3. Template injection into Google AI Studio
4. Content extraction from Google AI Studio
5. Complete end-to-end workflow timing

### Performance Testing

Measure and optimize:
1. API response times
2. Firebase read/write operations
3. Chrome extension injection/extraction speed
4. End-to-end workflow timing (target: <30 seconds)

## 10. Troubleshooting Guide

### Common Chrome Extension Issues

1. **Content Script Not Running**
   - Check manifest.json permissions
   - Verify content script matches are correct
   - Inspect Console for errors
   - Check if Google AI Studio URL patterns have changed

2. **Firebase Connection Issues**
   - Verify API key is correct
   - Check for CORS issues in Network tab
   - Verify Firebase project configuration

3. **Template Injection Failures**
   - Inspect Google AI Studio DOM structure
   - Update selectors if the UI has changed
   - Try alternative injection methods

### API Troubleshooting

1. **Authentication Failures**
   - Verify API key in requests
   - Check Firestore security rules
   - Ensure proper CORS configuration

2. **Missing Data**
   - Verify collection/document paths
   - Check query parameters
   - Examine Firestore console for data structure

## 11. Future Enhancements

1. **Direct Integration with Google AI Studio API** (if/when available)
2. **Advanced Template Management** (versioning, categories, search)
3. **Team Collaboration Features** (sharing, comments)
4. **Analytics and Usage Metrics** (workflow optimization)
5. **Zapier Integration** for additional automation options

This documentation provides a comprehensive technical reference for implementing the Template Exchange System. Adapt code samples as needed for your specific project requirements.
