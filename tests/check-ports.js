import net from 'net';

// Ports to check (from firebase.json)
const portsToCheck = [
  { port: 8085, name: 'Firestore Emulator' },
  { port: 4055, name: 'Emulator UI' },
  { port: 4455, name: 'Emulator Hub' },
  { port: 4555, name: 'Logging Emulator' }
];

// Function to check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is free
    });
    
    server.listen(port, '127.0.0.1');
  });
}

// Check all ports
async function checkPorts() {
  console.log('Checking ports for Firebase Emulator Suite...');
  
  let allFree = true;
  
  for (const { port, name } of portsToCheck) {
    const inUse = await isPortInUse(port);
    
    if (inUse) {
      console.log(`❌ Port ${port} (${name}) is already in use`);
      allFree = false;
    } else {
      console.log(`✅ Port ${port} (${name}) is available`);
    }
  }
  
  if (allFree) {
    console.log('\n✨ All ports are available. Firebase Emulator Suite can start.');
  } else {
    console.log('\n⚠️ Some ports are in use. You may need to:');
    console.log('  1. Stop other processes using these ports');
    console.log('  2. Or modify port numbers in firebase.json');
    console.log('  3. Then update the corresponding ports in tests/firestore.rules.test.js');
  }
}

checkPorts().catch(console.error); 