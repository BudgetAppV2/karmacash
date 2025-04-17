const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Simple log sink function
exports.logSink = functions.https.onRequest((request, response) => {
  console.log('Log sink function called');
  response.status(200).send('Logged successfully');
}); 