#!/usr/bin/env node

/**
 * Template Exchange System - Cursor AI Installer
 *
 * This script installs the Template Exchange System for seamless use in Cursor AI.
 * It will create a .cursorrc file that automatically loads the commands when Cursor starts.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

// Get the absolute path to the current script
const CURRENT_DIR = __dirname;
const LOADER_PATH = path.join(CURRENT_DIR, 'load-templates.js');

// Path to user's home directory
const HOME_DIR = os.homedir();
const CURSOR_RC_PATH = path.join(HOME_DIR, '.cursorrc');

/**
 * Add the loader to .cursorrc file
 */
function installCursorExtension() {
  console.log(chalk.cyan('Installing Template Exchange System for Cursor AI...'));

  // Create or append to .cursorrc
  try {
    let cursorRcContent = '';
    let existingContent = '';

    // Check if .cursorrc already exists
    if (fs.existsSync(CURSOR_RC_PATH)) {
      existingContent = fs.readFileSync(CURSOR_RC_PATH, 'utf8');
      
      // Check if the template exchange is already installed
      if (existingContent.includes('load-templates.js')) {
        console.log(chalk.yellow('Template Exchange System is already installed in .cursorrc'));
        return;
      }
    }

    // Add loader to .cursorrc
    cursorRcContent = existingContent + `
// Template Exchange System
try {
  require('${LOADER_PATH.replace(/\\/g, '\\\\')}');
} catch (error) {
  console.log('Could not load Template Exchange System:', error.message);
}
`;

    // Write to .cursorrc
    fs.writeFileSync(CURSOR_RC_PATH, cursorRcContent);
    console.log(chalk.green('✓ Template Exchange System installed successfully!'));
    console.log(chalk.green('✓ Cursor will now automatically load Template Exchange commands when started.'));
    console.log(chalk.cyan('\nYou can now use the following commands directly in Cursor:'));
    console.log('  - fetchHandoff(sessionId)');
    console.log('  - submitSummary(sessionId, content)');
    console.log('  - showHelp()');
    console.log(chalk.cyan('\nExample: await fetchHandoff(\'M7.S6\')'));
  } catch (error) {
    console.error(chalk.red('Error installing Template Exchange System:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Run the installer
installCursorExtension(); 