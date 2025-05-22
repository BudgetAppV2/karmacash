/**
 * Template Exchange System - Web Interface
 * 
 * This is the main JavaScript file for the Template Exchange web interface.
 * It handles interactions with the Firebase Cloud Functions API for templates.
 */

import firebaseConfig from './firebase-config.js';

// API constants
const API_BASE_URL = 'https://us-central1-karmacash-6e8f5.cloudfunctions.net';
const ENDPOINTS = {
  healthCheck: `${API_BASE_URL}/templateExchangeHealthCheck`,
  listTemplates: `${API_BASE_URL}/templateExchangeListTemplates`,
  getTemplate: `${API_BASE_URL}/templateExchangeGetTemplate`,
  createTemplate: `${API_BASE_URL}/templateExchangeCreateTemplate`,
};

// DOM Elements
const templateForm = document.getElementById('templateForm');
const sessionIdInput = document.getElementById('sessionId');
const templateTypeSelect = document.getElementById('templateType');
const templateContentTextarea = document.getElementById('templateContent');
const submitButton = document.getElementById('submitButton');
const formStatus = document.getElementById('formStatus');
const typeFilter = document.getElementById('typeFilter');
const refreshButton = document.getElementById('refreshButton');
const templatesList = document.getElementById('templatesList');
const loadMoreButton = document.getElementById('loadMoreButton');
const templateModal = document.getElementById('templateModal');
const modalTitle = document.getElementById('modalTitle');
const modalCreated = document.getElementById('modalCreated');
const modalStatus = document.getElementById('modalStatus');
const modalContent = document.getElementById('modalContent');
const copyBtn = document.getElementById('copyBtn');
const deleteBtn = document.getElementById('deleteBtn');
const closeBtn = document.querySelector('.close');

// Global state
let lastTemplateId = null;
let apiKey = null;

// Initialize the application
async function init() {
  console.log('Initializing Template Exchange Web Interface...');
  
  // Get API key from localStorage or prompt user
  apiKey = localStorage.getItem('templateExchangeApiKey');
  
  if (!apiKey) {
    apiKey = prompt('Please enter your Template Exchange API Key:');
    if (apiKey) {
      localStorage.setItem('templateExchangeApiKey', apiKey);
    } else {
      showError('API Key is required to use this application.');
      return;
    }
  }
  
  // Check API health
  try {
    const response = await fetch(ENDPOINTS.healthCheck);
    if (!response.ok) {
      throw new Error(`API Health Check failed: ${response.status}`);
    }
    console.log('API Health Check: OK');
  } catch (error) {
    console.error('API Health Check failed:', error);
    showError('Failed to connect to the Template Exchange API. Please try again later.');
  }
  
  // Load initial templates
  loadTemplates();
  
  // Set up event listeners
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
  // Form submission
  templateForm.addEventListener('submit', handleTemplateSubmit);
  
  // Template filtering
  typeFilter.addEventListener('change', () => loadTemplates());
  
  // Refresh button
  refreshButton.addEventListener('click', () => loadTemplates());
  
  // Load more button
  loadMoreButton.addEventListener('click', loadMoreTemplates);
  
  // Modal close button
  closeBtn.addEventListener('click', closeModal);
  
  // Copy button
  copyBtn.addEventListener('click', copyTemplateContent);
  
  // Delete button
  deleteBtn.addEventListener('click', handleDeleteTemplate);
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === templateModal) {
      closeModal();
    }
  });
}

// Load templates with optional filtering
async function loadTemplates() {
  try {
    // Show loading state
    templatesList.innerHTML = '<tr><td colspan="4" class="loading-message">Loading templates...</td></tr>';
    loadMoreButton.style.display = 'none';
    
    // Build API URL with filters
    let url = ENDPOINTS.listTemplates;
    
    const type = typeFilter.value;
    if (type !== 'all') {
      url += `?type=${type}`;
    }
    
    // Fetch templates
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load templates: ${response.status}`);
    }
    
    const data = await response.json();
    renderTemplates(data);
  } catch (error) {
    console.error('Error loading templates:', error);
    templatesList.innerHTML = `<tr><td colspan="4" class="error">Error loading templates: ${error.message}</td></tr>`;
  }
}

// Load more templates (pagination)
async function loadMoreTemplates() {
  if (!lastTemplateId) return;
  
  try {
    loadMoreButton.textContent = 'Loading...';
    loadMoreButton.disabled = true;
    
    // Build API URL with filters and pagination
    let url = `${ENDPOINTS.listTemplates}?startAfter=${lastTemplateId}`;
    
    const type = typeFilter.value;
    if (type !== 'all') {
      url += `&type=${type}`;
    }
    
    // Fetch more templates
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load more templates: ${response.status}`);
    }
    
    const data = await response.json();
    appendTemplates(data);
  } catch (error) {
    console.error('Error loading more templates:', error);
    loadMoreButton.textContent = 'Error - Try Again';
  } finally {
    loadMoreButton.disabled = false;
  }
}

// Render templates in the table
function renderTemplates(data) {
  if (!data || !data.templates || data.templates.length === 0) {
    templatesList.innerHTML = '<tr><td colspan="4" class="loading-message">No templates found</td></tr>';
    loadMoreButton.style.display = 'none';
    lastTemplateId = null;
    return;
  }
  
  const templates = data.templates;
  let html = '';
  
  templates.forEach(template => {
    const date = new Date(template.updatedAt || template.createdAt).toLocaleString();
    html += `
      <tr data-id="${template.id}">
        <td>${template.sessionId}</td>
        <td>${template.type}</td>
        <td>${date}</td>
        <td>
          <button class="view-btn" data-action="view" data-id="${template.id}">View</button>
        </td>
      </tr>
    `;
  });
  
  templatesList.innerHTML = html;
  
  // Set up view button event listeners
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => viewTemplate(btn.dataset.id));
  });
  
  // Update pagination state
  lastTemplateId = templates[templates.length - 1].id;
  loadMoreButton.style.display = data.pagination && data.pagination.hasMore ? 'block' : 'none';
  loadMoreButton.textContent = 'Load More';
}

// Append more templates to the existing table
function appendTemplates(data) {
  if (!data || !data.templates || data.templates.length === 0) {
    loadMoreButton.style.display = 'none';
    return;
  }
  
  const templates = data.templates;
  let html = templatesList.innerHTML;
  
  templates.forEach(template => {
    const date = new Date(template.updatedAt || template.createdAt).toLocaleString();
    html += `
      <tr data-id="${template.id}">
        <td>${template.sessionId}</td>
        <td>${template.type}</td>
        <td>${date}</td>
        <td>
          <button class="view-btn" data-action="view" data-id="${template.id}">View</button>
        </td>
      </tr>
    `;
  });
  
  templatesList.innerHTML = html;
  
  // Set up view button event listeners
  document.querySelectorAll('.view-btn').forEach(btn => {
    if (!btn.hasAttribute('data-event-bound')) {
      btn.addEventListener('click', () => viewTemplate(btn.dataset.id));
      btn.setAttribute('data-event-bound', 'true');
    }
  });
  
  // Update pagination state
  lastTemplateId = templates[templates.length - 1].id;
  loadMoreButton.style.display = data.pagination && data.pagination.hasMore ? 'block' : 'none';
  loadMoreButton.textContent = 'Load More';
}

// View template details in modal
async function viewTemplate(id) {
  try {
    // Show loading state in modal
    modalTitle.textContent = 'Loading template...';
    modalCreated.textContent = '';
    modalStatus.textContent = '';
    modalContent.textContent = '';
    openModal();
    
    // Fetch template details
    const response = await fetch(`${ENDPOINTS.getTemplate}/${id}`, {
      headers: {
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status}`);
    }
    
    const template = await response.json();
    
    // Populate modal
    modalTitle.textContent = `${template.sessionId} (${template.type})`;
    modalCreated.textContent = new Date(template.createdAt).toLocaleString();
    modalStatus.textContent = template.status || 'active';
    modalContent.textContent = template.content;
    
    // Set up delete button
    deleteBtn.dataset.id = template.id;
    deleteBtn.dataset.sessionId = template.sessionId;
  } catch (error) {
    console.error('Error viewing template:', error);
    modalTitle.textContent = 'Error';
    modalContent.textContent = `Failed to load template: ${error.message}`;
  }
}

// Handle template form submission
async function handleTemplateSubmit(event) {
  event.preventDefault();
  
  // Get form values
  const sessionId = sessionIdInput.value.trim();
  const type = templateTypeSelect.value;
  const content = templateContentTextarea.value.trim();
  
  // Validate session ID format
  if (!sessionId.match(/^[A-Z]\d+\.[A-Z]\d+$/)) {
    showFormError('Invalid session ID format. Expected format: M1.S2');
    return;
  }
  
  // Show loading state
  submitButton.disabled = true;
  formStatus.className = 'status loading';
  formStatus.textContent = 'Submitting template...';
  formStatus.style.display = 'block';
  
  try {
    // Send API request
    const response = await fetch(ENDPOINTS.createTemplate, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        sessionId,
        type,
        content
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    // Show success and reset form
    formStatus.className = 'status success';
    formStatus.textContent = 'Template submitted successfully!';
    
    // Reset form after delay
    setTimeout(() => {
      templateForm.reset();
      formStatus.style.display = 'none';
      submitButton.disabled = false;
      
      // Refresh template list
      loadTemplates();
    }, 2000);
  } catch (error) {
    console.error('Error submitting template:', error);
    showFormError(`Failed to submit template: ${error.message}`);
    submitButton.disabled = false;
  }
}

// Handle template deletion
async function handleDeleteTemplate() {
  const id = deleteBtn.dataset.id;
  const sessionId = deleteBtn.dataset.sessionId;
  
  if (!id) return;
  
  const confirmDelete = confirm(`Are you sure you want to delete the template for session ${sessionId}?`);
  if (!confirmDelete) return;
  
  try {
    // Note: Delete functionality is not implemented in the backend yet
    // This is just a placeholder for future implementation
    alert('Delete functionality is not implemented yet.');
    
    // For now, just close the modal and refresh
    closeModal();
    loadTemplates();
  } catch (error) {
    console.error('Error deleting template:', error);
    alert(`Failed to delete template: ${error.message}`);
  }
}

// Copy template content to clipboard
function copyTemplateContent() {
  const content = modalContent.textContent;
  
  // Use modern clipboard API
  navigator.clipboard.writeText(content)
    .then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard. Please copy manually.');
    });
}

// Open modal
function openModal() {
  templateModal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Close modal
function closeModal() {
  templateModal.style.display = 'none';
  document.body.style.overflow = 'auto'; // Enable scrolling
}

// Show form error
function showFormError(message) {
  formStatus.className = 'status error';
  formStatus.textContent = message;
  formStatus.style.display = 'block';
}

// Show general error
function showError(message) {
  alert(message);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 