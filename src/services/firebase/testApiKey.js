// Test file to verify the API key format
console.log('API Key Direct Test');
console.log('Raw API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('API Key Length:', import.meta.env.VITE_FIREBASE_API_KEY?.length);
console.log('API Key Code Points:');
for (let i = 0; i < import.meta.env.VITE_FIREBASE_API_KEY?.length; i++) {
  const char = import.meta.env.VITE_FIREBASE_API_KEY[i];
  console.log(`Position ${i}: '${char}' (Unicode: ${char.charCodeAt(0)})`);
}

// Create a clean key by only keeping alphanumeric characters and hyphens
const cleanKey = import.meta.env.VITE_FIREBASE_API_KEY?.replace(/[^a-zA-Z0-9\-]/g, '');
console.log('Original Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Cleaned Key:', cleanKey);
console.log('Keys Match:', import.meta.env.VITE_FIREBASE_API_KEY === cleanKey);

export const testKey = cleanKey; 