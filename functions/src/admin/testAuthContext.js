const functions = require('firebase-functions');
const admin = require('firebase-admin');
const logger = require('../../utils/logger');

/**
 * Test function to validate auth context propagation in Firebase Emulators
 * This helps understand if context.auth is properly passed or if manual token verification is needed
 */
exports.testAuthContext = functions.https.onCall(async (data, context) => {
  // Log initial data for debugging
  logger.info('testAuthContext called (onCall)', { 
    hasAuth: !!context.auth,
    authUid: context.auth?.uid,
    dataToken: !!data?.token,
    directCall: !!data?.directCall,
    userIdProvided: !!data?.userId,
    isEmulator: !!data?.isEmulator,
    contextKeys: Object.keys(context || {})
  });
  
  // Determine auth source and userId
  let userId = null;
  let authSource = 'none';
  
  // Try context.auth first (normal way)
  if (context.auth) {
    userId = context.auth.uid;
    authSource = 'context.auth';
    logger.info('Using context.auth', { userId });
  } 
  // Fall back to manual token verification
  else if (data?.token) {
    try {
      logger.info('Attempting manual token verification', { tokenLength: data.token.length });
      
      const decodedToken = await admin.auth().verifyIdToken(data.token);
      userId = decodedToken.uid;
      authSource = 'manual token verification';
      
      logger.info('Manual token verification successful', { userId, decoded: decodedToken });
    } catch (error) {
      logger.error('Token verification failed', { 
        error: error.toString(), 
        code: error.code 
      });
    }
  } else {
    logger.warn('No authentication method available');
  }
  
  // Return detailed information
  return {
    success: !!userId,
    userId,
    authSource,
    contextAuthPresent: !!context.auth,
    manualTokenProvided: !!data?.token,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    emulator: process.env.FUNCTIONS_EMULATOR === 'true',
    function_type: 'onCall'
  };
});

// Add an HTTP version for direct testing
exports.testAuthContextHTTP = functions.https.onRequest(async (req, res) => {
  // Log all available information
  logger.info('testAuthContextHTTP called (onRequest)', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    query: req.query,
    ip: req.ip
  });
  
  // Try to get auth from Authorization header
  let userId = null;
  let authSource = 'none';
  let decodedToken = null;
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      logger.info('Attempting to verify token from Authorization header', {
        tokenPreview: idToken.substring(0, 20) + '...'
      });
      
      decodedToken = await admin.auth().verifyIdToken(idToken);
      userId = decodedToken.uid;
      authSource = 'Authorization header';
      
      logger.info('Token verification successful', { userId, decoded: decodedToken });
    } catch (error) {
      logger.error('Token verification failed', {
        error: error.toString(),
        code: error.code,
        message: error.message
      });
    }
  } else {
    logger.warn('No Authorization Bearer token found in headers');
  }
  
  // Return detailed information
  res.json({
    success: !!userId,
    userId,
    authSource,
    decodedToken,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    emulator: process.env.FUNCTIONS_EMULATOR === 'true',
    function_type: 'onRequest',
    headers: req.headers
  });
}); 