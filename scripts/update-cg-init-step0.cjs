const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('/Users/benoitarchambault/Documents/firebase credential_Karmacash/karmacash-6e8f5-firebase-adminsdk-fbsvc-c1e711941b.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'karmacash-6e8f5.firebasestorage.app'
});

const db = admin.firestore();

async function updateCGAccessModuleInit() {
  try {
    console.log('🔄 Updating CG_Access_Module_Init with Step 0...');
    
    // Get the current document
    const docRef = db.collection('priming').doc('CG_Access_Module_Init');
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.error('❌ CG_Access_Module_Init document not found!');
      process.exit(1);
    }
    
    const currentData = doc.data();
    console.log('✅ Found document, current version:', currentData.version || 'unknown');
    
    // Create the updated initialization_protocol with Step 0
    const updatedProtocol = {
      step_0_mcp_health_check: {
        name: 'MCP Server Health Check',
        description: 'Verify MCP servers are running for tool availability',
        critical: true,
        command: '/Users/benoitarchambault/Desktop/KarmaCash/scripts/cg-mcp-init.sh',
        expected_outputs: {
          healthy: {
            exit_code: 0,
            message: '✅ MCP HEALTHY: All servers are running',
            action: 'Proceed with normal initialization'
          },
          warning: {
            exit_code: 1,
            message: '⚠️ MCP WARNING: Some servers not running',
            action: 'Document missing servers, proceed with caution'
          },
          critical: {
            exit_code: 2,
            message: '🚨 MCP CRITICAL: No/few servers running',
            action: 'Block implementation, require manual intervention'
          }
        },
        health_check_reporting: {
          include_in_summary: true,
          format: {
            mcp_server_status: {
              check_timestamp: '[ISO timestamp]',
              servers_running: '[count]/6',
              health_status: 'HEALTHY|WARNING|CRITICAL',
              missing_servers: ['list of not running servers'],
              automated_launch: 'success|failed|not_attempted',
              manual_intervention_required: 'boolean'
            }
          }
        },
        fallback_instructions: [
          'If CRITICAL and automated launch fails:',
          '1. Report: "MCP servers require manual launch"',
          '2. Specify which servers are missing',
          '3. Include command: /scripts/launch-mcp-terminal.sh',
          '4. Note: "HD intervention required for MCP server startup"'
        ]
      },
      ...currentData.initialization_protocol
    };
    
    // Update the document
    await docRef.update({
      initialization_protocol: updatedProtocol,
      version: 'v1.1',
      last_updated: admin.firestore.FieldValue.serverTimestamp(),
      update_notes: 'Added Step 0: MCP Server Health Check to ensure tool availability before CG initialization'
    });
    
    console.log('✅ Successfully updated CG_Access_Module_Init with Step 0!');
    console.log('');
    console.log('📋 Updated initialization sequence:');
    console.log('0. MCP Server Health Check (NEW)');
    console.log('1. Get Current Continuity Pointer');
    console.log('2. Load Current Session Continuity');
    console.log('3. Load CG Protocol Essentials');
    console.log('4. Access Protocol Essentials Content');
    console.log('5. Load CG Priming');
    console.log('6. Comprehensive System Health Check');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating document:', error);
    process.exit(1);
  }
}

updateCGAccessModuleInit();