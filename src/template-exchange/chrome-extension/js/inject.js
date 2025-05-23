/**
 * Template Exchange - Inject Script
 * 
 * This script is injected into the page context by the content script.
 * It can access the page's JavaScript environment directly.
 */

(function() {
  // Notify content script that injection is working
  window.postMessage({
    type: 'TEMPLATE_EXCHANGE_INJECTED',
    status: 'success'
  }, '*');
  
  // Listen for messages from the content script
  window.addEventListener('message', (event) => {
    // Make sure the message is from our extension
    if (event.data && event.data.type && event.data.type.startsWith('TEMPLATE_EXCHANGE_')) {
      handleMessage(event.data);
    }
  });
  
  // Handle messages from content script
  function handleMessage(message) {
    switch (message.type) {
      case 'TEMPLATE_EXCHANGE_INSERT_HANDOFF':
        insertHandoffIntoEditor(message.content);
        break;
      
      case 'TEMPLATE_EXCHANGE_EXTRACT_SUMMARY':
        extractSummaryFromEditor();
        break;
      
      case 'TEMPLATE_EXCHANGE_DETECT_SESSION':
        detectSessionId();
        break;
    }
  }
  
  // Insert handoff into the editor
  function insertHandoffIntoEditor(content) {
    try {
      // Try to find Google AI Studio editor
      const editor = document.querySelector('textarea[placeholder*="Send a message"], textarea.prompt-textarea');
      
      if (editor) {
        // Set the value
        editor.value = content;
        
        // Trigger input event to update any bindings
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Focus the editor
        editor.focus();
        
        // Notify content script of success
        window.postMessage({
          type: 'TEMPLATE_EXCHANGE_INSERT_RESULT',
          status: 'success'
        }, '*');
      } else {
        // Notify content script of failure
        window.postMessage({
          type: 'TEMPLATE_EXCHANGE_INSERT_RESULT',
          status: 'error',
          message: 'Could not find editor element'
        }, '*');
      }
    } catch (error) {
      // Notify content script of error
      window.postMessage({
        type: 'TEMPLATE_EXCHANGE_INSERT_RESULT',
        status: 'error',
        message: error.message
      }, '*');
    }
  }
  
  // Extract summary from the editor or conversation
  function extractSummaryFromEditor() {
    try {
      // Try to find the editor
      const editor = document.querySelector('textarea[placeholder*="Send a message"], textarea.prompt-textarea');
      
      if (editor && editor.value) {
        // If there's content in the editor, use that
        window.postMessage({
          type: 'TEMPLATE_EXCHANGE_EXTRACT_RESULT',
          status: 'success',
          content: editor.value
        }, '*');
        return;
      }
      
      // If no editor content, try to find the last AI response
      const aiResponses = document.querySelectorAll('.ai-response, .ai-message');
      if (aiResponses && aiResponses.length > 0) {
        const lastResponse = aiResponses[aiResponses.length - 1];
        const content = lastResponse.textContent.trim();
        
        window.postMessage({
          type: 'TEMPLATE_EXCHANGE_EXTRACT_RESULT',
          status: 'success',
          content: content
        }, '*');
        return;
      }
      
      // If nothing found, return an error
      window.postMessage({
        type: 'TEMPLATE_EXCHANGE_EXTRACT_RESULT',
        status: 'error',
        message: 'No content found to extract'
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'TEMPLATE_EXCHANGE_EXTRACT_RESULT',
        status: 'error',
        message: error.message
      }, '*');
    }
  }
  
  // Detect session ID from page content
  function detectSessionId() {
    try {
      // Get all text from the page
      const pageText = document.body.innerText;
      
      // Look for session ID pattern (e.g., M7.S6)
      const match = pageText.match(/([A-Z]\d+\.[A-Z]\d+)/);
      
      if (match) {
        window.postMessage({
          type: 'TEMPLATE_EXCHANGE_SESSION_DETECTED',
          status: 'success',
          sessionId: match[1]
        }, '*');
      } else {
        window.postMessage({
          type: 'TEMPLATE_EXCHANGE_SESSION_DETECTED',
          status: 'error',
          message: 'No session ID found'
        }, '*');
      }
    } catch (error) {
      window.postMessage({
        type: 'TEMPLATE_EXCHANGE_SESSION_DETECTED',
        status: 'error',
        message: error.message
      }, '*');
    }
  }
  
  // Run session detection on injection
  detectSessionId();
})(); 