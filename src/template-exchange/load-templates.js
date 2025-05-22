/**
 * Template Exchange System Loader
 * 
 * This is a simplified loader for Cursor AI to access Template Exchange commands.
 * Just require this file once to make all template commands available globally.
 * 
 * Example usage in Cursor:
 * require('/Users/benoitarchambault/Desktop/KarmaCash/src/template-exchange/load-templates.js')
 * await fetchHandoff('M7.S6')
 */

// Load the extension module that exports all commands globally
require('./scripts/cursor-ai-extension');

// Print a friendly message for the user
console.log('✅ Template Exchange System loaded!');
console.log('You can now use:');
console.log('  - fetchHandoff(sessionId)      // Get a handoff template');
console.log('  - submitSummary(sessionId, content)  // Submit your implementation summary');
console.log('  - showHelp()                   // Show all available commands');
console.log('\nExample: await fetchHandoff(\'M7.S6\')');

// For easier usage in scripts
module.exports = {
  fetchHandoff: global.fetchHandoff,
  submitSummary: global.submitSummary,
  listTemplates: global.listTemplates,
  checkHealth: global.checkHealth,
  storeApiKey: global.storeApiKey,
  showHelp: global.showHelp
}; 