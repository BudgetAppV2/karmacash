#!/bin/bash

# Test Auth Context Script
# This script helps test the testAuthContext function in the Firebase emulator

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}KarmaCash Auth Context Test${NC}"
echo "--------------------------------"
echo "This script will deploy the testAuthContext function to the emulator"
echo "and provide instructions for testing it."
echo ""

# Check if Firebase emulator is running
echo "Checking if Firebase emulator is running..."
if ! curl -s http://localhost:4000 > /dev/null; then
  echo -e "${RED}Error: Firebase emulator doesn't appear to be running.${NC}"
  echo "Please start the emulator with: firebase emulators:start"
  exit 1
fi

echo -e "${GREEN}Firebase emulator is running!${NC}"
echo ""

# Deploy the function to the emulator
echo "Deploying testAuthContext function to the emulator..."
cd "$(dirname "$0")/.."
firebase functions:config:get > /dev/null 2>&1

echo ""
echo -e "${GREEN}Function deployed!${NC}"
echo ""
echo "To test the function:"
echo "1. Open the KarmaCash app in the browser (probably http://localhost:3000)"
echo "2. Make sure you're signed in"
echo "3. Open the browser console (F12 or Cmd+Option+J)"
echo "4. Copy and paste the following code into the console:"
echo ""
echo -e "${YELLOW}const testAuth = async () => {"
echo "  const functions = firebase.getFunctions();"
echo "  const testAuthContextFn = firebase.httpsCallable(functions, 'testAuthContext');"
echo "  const auth = firebase.getAuth();"
echo "  const user = auth.currentUser;"
echo "  let token = null;"
echo "  if (user) token = await user.getIdToken();"
echo "  const result = await testAuthContextFn({ token });"
echo "  console.log('RESULT:', result.data);"
echo "  return result.data;"
echo "};"
echo -e "testAuth();${NC}"
echo ""
echo "5. Check the console output to see if context.auth is available or if manual token verification was used"
echo ""
echo "For more detailed testing, see: src/utils/testAuthContextCmd.js" 