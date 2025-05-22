/**
 * Authentication Middleware for Template Exchange API
 * 
 * This middleware handles API key validation for all API requests.
 * It checks if the request contains a valid API key in the 'x-api-key' header.
 */

const admin = require('firebase-admin');

// Constants
const API_KEY_COLLECTION = 'config';
const API_KEY_DOCUMENT = 'api_keys';
const API_KEY_FIELD = 'key';
const API_KEY_HEADER = 'x-api-key';

// Cache for API keys to reduce Firestore reads
let apiKeyCache = {
  key: null,
  expiresAt: 0
};

// Cache duration in milliseconds (15 minutes)
const CACHE_DURATION_MS = 15 * 60 * 1000;

/**
 * Validate the API key from Firestore
 * @param {string} apiKey - The API key to validate
 * @returns {Promise<boolean>} - True if the API key is valid
 */
async function validateApiKey(apiKey) {
  try {
    // Check cache first
    const now = Date.now();
    if (apiKeyCache.key === apiKey && apiKeyCache.expiresAt > now) {
      return true;
    }
    
    // If not in cache or expired, check Firestore
    const db = admin.firestore();
    const apiKeyDoc = await db.collection(API_KEY_COLLECTION).doc(API_KEY_DOCUMENT).get();
    
    if (!apiKeyDoc.exists) {
      console.warn('API key document not found');
      return false;
    }
    
    const storedKey = apiKeyDoc.data()[API_KEY_FIELD];
    const isValid = apiKey === storedKey;
    
    // Update cache if valid
    if (isValid) {
      apiKeyCache = {
        key: apiKey,
        expiresAt: now + CACHE_DURATION_MS
      };
    }
    
    return isValid;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
}

/**
 * Authentication middleware for API requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
module.exports = async (req, res, next) => {
  try {
    // Check for Firebase Authentication first
    if (req.auth) {
      // Request is already authenticated via Firebase Auth
      return next();
    }
    
    // Check for API key
    const apiKey = req.headers[API_KEY_HEADER];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing API key. Please provide an API key in the x-api-key header.'
      });
    }
    
    // Validate the API key
    const isValid = await validateApiKey(apiKey);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key.'
      });
    }
    
    // API key is valid, proceed
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication.'
    });
  }
}; 