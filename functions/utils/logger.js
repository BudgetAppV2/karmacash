const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Define the log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Define the log directory
const logDir = path.join(__dirname, '../logs');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'karmacash-functions' },
  transports: [
    // File transport for all levels
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'functions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    // File transport for errors
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(logDir, 'errors-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Add console transport in development environment
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger; 