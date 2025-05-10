/**
 * Test Auth Context Command
 * 
 * This is a utility script to test the testAuthContext function from the browser console.
 * To use it:
 * 1. Copy and paste all the content of this file into the browser console
 * 2. Run the testAuthContext() function from the console
 */

/**
 * Test the auth context propagation in Firebase callable functions
 * @returns {Promise<void>}
 */
async function testAuthContext() {
  try {
    console.log('Testing auth context propagation...');
    
    // Import adminService if needed
    const adminService = window.KarmaCash?.services?.adminService || 
                         await import('/src/services/firebase/adminService.js');
    
    if (!adminService || !adminService.testAuthContext) {
      console.error('Could not find adminService.testAuthContext function');
      console.log('Attempting direct implementation...');
      
      // Direct implementation if module import fails
      const { getFunctions, httpsCallable } = window.firebase.functions;
      const { getAuth } = window.firebase.auth;
      
      const functions = getFunctions();
      const testAuthContextFn = httpsCallable(functions, 'testAuthContext');
      
      // Get current user
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.error('No authenticated user found!');
        console.log('Please sign in and try again.');
        return;
      }
      
      // Get token for manual verification
      const token = await user.getIdToken();
      console.log('Got token length:', token.length);
      
      // Call the function with the token
      const result = await testAuthContextFn({ token });
      console.log('Auth context test result:', result.data);
      
      return result.data;
    }
    
    // Use the imported function
    const result = await adminService.testAuthContext();
    
    console.log('✅ Auth context test completed!');
    console.log('Result:', result);
    
    console.log('Summary:');
    console.log(`- Auth source: ${result.authSource}`);
    console.log(`- User ID: ${result.userId}`);
    console.log(`- Context auth present: ${result.contextAuthPresent}`);
    console.log(`- Manual token provided: ${result.manualTokenProvided}`);
    console.log(`- Environment: ${result.environment}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error testing auth context:', error);
    throw error;
  }
}

// Display instructions for use
console.log('========================================');
console.log('Auth Context Test Utility Loaded!');
console.log('Run testAuthContext() to test auth context propagation');
console.log('========================================'); 