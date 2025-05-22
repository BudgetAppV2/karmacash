#!/usr/bin/env node

/**
 * Cursor AI Extension
 * 
 * This script establishes global functions for direct use by Cursor AI.
 * It exposes the template exchange functionality directly in the global scope
 * so Cursor can call these functions without any manual setup.
 */

const templateExchange = require('./cursor-ai-commands');
const chalk = require('chalk');

// Help message for displaying usage information
const helpMessage = `
${chalk.bold.cyan('Template Exchange System - Cursor AI Extension')}

${chalk.bold('Available Commands:')}

  ${chalk.green('fetchHandoff(sessionId)')}
    Fetches a handoff template from Google AI Studio.
    ${chalk.dim('- sessionId: String in format M#.S# (e.g., "M5.S4")')}
    ${chalk.dim('- Returns: Promise resolving to template content')}
    ${chalk.dim('Example: await fetchHandoff("M7.S3")')}

  ${chalk.green('submitSummary(sessionId, content)')}
    Submits a summary back to Google AI Studio.
    ${chalk.dim('- sessionId: String in format M#.S# (e.g., "M5.S4")')}
    ${chalk.dim('- content: String containing the summary content')}
    ${chalk.dim('- Returns: Promise resolving to submission result')}
    ${chalk.dim('Example: await submitSummary("M7.S3", "Implementation completed...")')}

  ${chalk.green('storeApiKey(apiKey)')}
    Stores your API key securely for future use.
    ${chalk.dim('- apiKey: String containing your API key')}
    ${chalk.dim('- Returns: Promise resolving to true if successful')}
    ${chalk.dim('Example: await storeApiKey("your-api-key-here")')}

  ${chalk.green('listTemplates([options])')}
    Lists templates from the exchange system.
    ${chalk.dim('- options: Optional object with filters: { type, status }')}
    ${chalk.dim('- Returns: Promise resolving to array of templates')}
    ${chalk.dim('Example: await listTemplates({ type: "handoff" })')}

  ${chalk.green('checkHealth()')}
    Checks if the template exchange system is operational.
    ${chalk.dim('- Returns: Promise resolving to boolean')}
    ${chalk.dim('Example: const isHealthy = await checkHealth()')}

  ${chalk.green('showHelp()')}
    Shows this help message.
    ${chalk.dim('Example: showHelp()')}
`;

/**
 * Displays help information about available commands
 */
function showHelp() {
  console.log(helpMessage);
}

// If this script is executed directly from the command line, show the help
if (require.main === module) {
  showHelp();
  process.exit(0);
}

// Export the functions for import in other modules
module.exports = {
  fetchHandoff: templateExchange.fetchHandoff,
  submitSummary: templateExchange.submitSummary,
  storeApiKey: templateExchange.storeApiKey,
  listTemplates: templateExchange.listTemplates,
  checkHealth: templateExchange.checkHealth,
  showHelp
};

// Make functions available globally if in Node.js REPL or similar environment
// This allows direct use without requiring the module
if (typeof global !== 'undefined') {
  global.fetchHandoff = templateExchange.fetchHandoff;
  global.submitSummary = templateExchange.submitSummary;
  global.storeApiKey = templateExchange.storeApiKey;
  global.listTemplates = templateExchange.listTemplates;
  global.checkHealth = templateExchange.checkHealth;
  global.showHelp = showHelp;
  
  // For direct Cursor access - do not default to mock mode
  // USE_MOCK_MODE can be set explicitly if needed for testing
  
  // Add autoload message
  if (process.env.NODE_ENV !== 'test') {
    console.log(chalk.green('✓ Template Exchange commands loaded. You can now use:'));
    console.log(chalk.cyan('  fetchHandoff(sessionId)'));
    console.log(chalk.cyan('  submitSummary(sessionId, content)'));
    console.log(chalk.cyan('  and more... Type showHelp() for details'));
  }
} 