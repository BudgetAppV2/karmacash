#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== KarmaCash Firebase Emulator Setup ===${NC}"
echo -e "${BLUE}This script will start the Firebase emulators for local development.${NC}"
echo

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Firebase CLI not found. Please install it globally:${NC}"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Start the emulators
echo -e "${BLUE}Starting Firebase emulators...${NC}"
echo -e "${YELLOW}Emulator UI will be available at: ${NC}http://localhost:4055"
echo -e "${YELLOW}Auth Emulator: ${NC}http://localhost:9099"
echo -e "${YELLOW}Firestore Emulator: ${NC}http://localhost:8085"
echo -e "${YELLOW}Functions Emulator: ${NC}http://localhost:5001"
echo
echo -e "${BLUE}Press Ctrl+C to stop the emulators when done.${NC}"
echo

# Start the emulators
firebase emulators:start

# Note: To run the app with emulators, use:
# npm run dev:emulators 