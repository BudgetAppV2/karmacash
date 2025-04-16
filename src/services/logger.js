// src/services/logger.js

import { getAuth } from 'firebase/auth'; // For getting current user

// Define log levels
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
  AI_CONTEXT: 5,
  SILENT: Infinity // To disable logging if needed
};

// Map level names to numerical values for comparison
const levelNames = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
  trace: LogLevel.TRACE,
  ai_context: LogLevel.AI_CONTEXT,
};

// Helper function to get current user
const getCurrentUser = () => {
  const auth = getAuth();
  return auth.currentUser;
};

// Set the active log level based on environment
const configuredLevelName = (import.meta.env.VITE_LOG_LEVEL || (import.meta.env.DEV ? 'debug' : 'warn')).toLowerCase();
const ACTIVE_LOG_LEVEL = levelNames[configuredLevelName] ?? LogLevel.INFO;

// Simple session ID
const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);

// Buffer for logs before sending to backend
let logBuffer = [];
let bufferTimeout = null;
const BUFFER_MAX_SIZE = 20; // Send after 20 entries
const BUFFER_TIMEOUT_MS = 10000; // Send after 10 seconds max

// Backend log sink endpoint (Cloud Function URL)
const LOG_SINK_URL = import.meta.env.VITE_LOG_SINK_URL || '/api/logSink';

async function sendLogsToServer() {
  if (logBuffer.length === 0) return;

  const logsToSend = [...logBuffer];
  logBuffer = []; // Clear buffer immediately
  clearTimeout(bufferTimeout);
  bufferTimeout = null;

  try {
    await fetch(LOG_SINK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logsToSend),
      keepalive: true // Attempt delivery on unload
    });
  } catch (error) {
    console.error('Failed to send logs to server:', error);
    // Fallback: store in localStorage temporarily if available
    try {
      const storedLogs = JSON.parse(localStorage.getItem('pendingLogs') || '[]');
      localStorage.setItem('pendingLogs', JSON.stringify([...storedLogs, ...logsToSend]));
    } catch (e) {
      // If localStorage fails, at least try to show in console
      console.error('Failed to store logs locally:', e);
    }
  }
}

// Check for and send any logs stored in localStorage
function sendStoredLogs() {
  try {
    const storedLogs = JSON.parse(localStorage.getItem('pendingLogs') || '[]');
    if (storedLogs.length > 0) {
      localStorage.removeItem('pendingLogs');
      logBuffer.push(...storedLogs);
      sendLogsToServer();
    }
  } catch (e) {
    console.error('Failed to recover stored logs:', e);
  }
}

// Call on app init
sendStoredLogs();

// Central log function
function log(level, component, operation, message, metadata = {}) {
  if (level < ACTIVE_LOG_LEVEL) return; // Skip logging if below active level

  const user = getCurrentUser();

  // Prepare log entry matching the structure expected by the backend
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: Object.keys(LogLevel).find(key => LogLevel[key] === level)?.toLowerCase() || 'unknown',
    message,
    metadata: {
      component: component || 'UnknownComponent',
      operation: operation || 'unknownOperation',
      userId: user ? user.uid : 'anonymous',
      sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...metadata
    }
  };

  // Output to console for local dev debugging
  const levelName = logEntry.level;
  const consoleMethod = console[levelName] || console.log;
  consoleMethod(`[${logEntry.timestamp}] ${levelName.toUpperCase()} (${logEntry.metadata.component}.${logEntry.metadata.operation}): ${message}`, logEntry.metadata);

  // Add to buffer and schedule sending
  logBuffer.push(logEntry);

  if (logBuffer.length >= BUFFER_MAX_SIZE) {
    sendLogsToServer();
  } else if (!bufferTimeout) {
    bufferTimeout = setTimeout(sendLogsToServer, BUFFER_TIMEOUT_MS);
  }
}

// Add event listener to try sending logs before page close
window.addEventListener('beforeunload', sendLogsToServer);

// Export logger methods with consistent interface
const logger = {
  error: (component, operation, message, metadata) => log(LogLevel.ERROR, component, operation, message, metadata),
  warn: (component, operation, message, metadata) => log(LogLevel.WARN, component, operation, message, metadata),
  info: (component, operation, message, metadata) => log(LogLevel.INFO, component, operation, message, metadata),
  debug: (component, operation, message, metadata) => log(LogLevel.DEBUG, component, operation, message, metadata),
  trace: (component, operation, message, metadata) => log(LogLevel.TRACE, component, operation, message, metadata),
  aiContext: (component, operation, message, metadata) => log(LogLevel.AI_CONTEXT, component, operation, message, metadata)
};

export default logger;