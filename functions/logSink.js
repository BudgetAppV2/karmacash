const functions = require('firebase-functions/v2');
const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const cors = require('cors')({ origin: true });

// Define custom levels matching frontend
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
    ai_context: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'grey',
    ai_context: 'magenta'
  }
};

// Create formatter for JSON structured logs
const logFormatter = winston.format.combine(
  winston.format.timestamp(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

// Base directory for logs - in Cloud Functions, use /tmp for ephemeral storage
const LOG_DIR = process.env.NODE_ENV === 'production' 
  ? path.join('/tmp', 'logs')
  : path.join(__dirname, 'logs');

// Create rotating file transports
const fileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(LOG_DIR, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormatter
});

const aiContextTransport = new winston.transports.DailyRotateFile({
  filename: path.join(LOG_DIR, 'ai-context-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // Keep AI context logs longer
  format: logFormatter,
  level: 'ai_context'
});

// Create logger with custom format
const logger = winston.createLogger({
  levels: customLevels.levels,
  format: logFormatter,
  defaultMeta: { service: 'karmacash' },
  transports: [
    // Console for Function logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ colors: customLevels.colors }),
        winston.format.simple()
      )
    }),
    fileTransport,
    aiContextTransport
  ]
});

// Cloud Function to receive logs
exports.logSink = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      // Require POST method
      if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
      }

      // Get log entries from request body
      const logEntries = request.body;
      if (!Array.isArray(logEntries)) {
        response.status(400).send('Expected array of log entries');
        return;
      }

      // Process each log entry
      for (const entry of logEntries) {
        const { level, message, metadata = {} } = entry;
        
        // Only accept valid log levels
        if (!level || !message || !customLevels.levels.hasOwnProperty(level)) {
          continue;
        }
        
        // Write to Winston logger
        logger.log(level, message, metadata);
      }

      response.status(200).send({ success: true });
    } catch (error) {
      console.error('Error processing logs:', error);
      response.status(500).send('Error processing logs');
    }
  });
}); 