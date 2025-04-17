// Using Firebase Functions V1 API
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const logger = require('./utils/logger');

admin.initializeApp();

// User creation function - creates default categories
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    const userId = user.uid;
    logger.info('Creating default categories for new user', { userId });
    
    // Default categories with proper styling based on Zen/Tranquility theme
    const defaultCategories = [
      { name: 'Alimentation', icon: 'restaurant', color: '#919A7F', order: 1, type: 'expense' }, // Sage green
      { name: 'Transport', icon: 'directions_car', color: '#568E8D', order: 2, type: 'expense' }, // Muted teal
      { name: 'Logement', icon: 'home', color: '#919A7F', order: 3, type: 'expense' }, // Sage green
      { name: 'Divertissement', icon: 'movie', color: '#568E8D', order: 4, type: 'expense' }, // Muted teal
      { name: 'Shopping', icon: 'shopping_cart', color: '#919A7F', order: 5, type: 'expense' }, // Sage green
      { name: 'Services', icon: 'power', color: '#568E8D', order: 6, type: 'expense' }, // Muted teal
      { name: 'Santé', icon: 'favorite', color: '#C17C74', order: 7, type: 'expense' }, // Soft terra cotta
      { name: 'Éducation', icon: 'school', color: '#A58D7F', order: 8, type: 'expense' }, // Taupe
      { name: 'Salaire', icon: 'work', color: '#568E8D', order: 9, type: 'income' }, // Muted teal
      { name: 'Cadeaux', icon: 'card_giftcard', color: '#919A7F', order: 10, type: 'income' }, // Sage green
      { name: 'Investissements', icon: 'trending_up', color: '#568E8D', order: 11, type: 'income' }, // Muted teal
      { name: 'Autres Revenus', icon: 'attach_money', color: '#919A7F', order: 12, type: 'income' } // Sage green
    ];
    
    const batch = admin.firestore().batch();
    
    // Add each default category
    for (const category of defaultCategories) {
      const categoryRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('categories')
        .doc();
      
      batch.set(categoryRef, {
        ...category,
        userId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    logger.info('Default categories created successfully', { 
      userId, 
      count: defaultCategories.length 
    });
    
    return null;
  } catch (error) {
    logger.error('Error in onUserCreated function', { 
      userId: user.uid,
      error: error.message,
      stack: error.stack
    });
    return null;
  }
});

// Simple log sink function
exports.logSink = functions.https.onRequest((request, response) => {
  console.log('Log sink function called');
  response.status(200).send('Logged successfully');
}); 