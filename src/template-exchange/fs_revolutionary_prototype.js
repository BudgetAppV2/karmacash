const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Ensure this path is correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Initializes a new session document in Firestore.
 * @param {string} milestoneName - The name of the current milestone.
 * @param {string[]} focusTaskIds - Array of Task Master IDs for initial focus.
 * @param {string} [customSessionId] - Optional custom ID for the session.
 * @returns {Promise<string>} The ID of the newly created session document.
 */
async function initializeNewSession(milestoneName, focusTaskIds, customSessionId) {
  // Placeholder: Implement logic to create a new session document
  // in the 'sessions' collection according to 'revolutionary_workflow_schema_v1.md'
  console.log(`Initializing new session for milestone: ${milestoneName} with tasks: ${focusTaskIds.join(', ')}`);
  const sessionsRef = db.collection('sessions');
  const newSessionData = {
    milestone_active: milestoneName,
    tasks_focus: focusTaskIds.map(id => ({ task_master_id: id, status: 'pending' })),
    status: 'active',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    current_ck_instance_id: null, // To be set by CK
    last_cg_summary_ref: null,
    active_plan: {
      goal: 'Initial goal pending definition by CK/HD.',
      focus_areas: [],
      tasks_planned: [],
      emergent_tasks: [],
      expected_outcome: 'Initial outcome pending definition.',
      constraints: '',
      status: 'draft'
    },
    history_log: [
      {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        event_type: 'session_created',
        actor: 'prototype_script',
        details: `Session initialized for milestone: ${milestoneName}. Focus tasks: ${focusTaskIds.join(', ')}`
      }
    ]
  };

  try {
    let newSessionRef;
    if (customSessionId) {
      newSessionRef = sessionsRef.doc(customSessionId);
      await newSessionRef.set(newSessionData);
      console.log(`New session created with custom ID: ${customSessionId}`);
      return customSessionId;
    } else {
      newSessionRef = await sessionsRef.add(newSessionData);
      console.log(`New session created with ID: ${newSessionRef.id}`);
      return newSessionRef.id;
    }
  } catch (error) {
    console.error('Error initializing new session:', error);
    throw error;
  }
}

/**
 * Retrieves a CK continuity document from Firestore.
 * @param {string} ckInstanceId - The ID of the CK instance.
 * @returns {Promise<Object|null>} The CK continuity document data or null if not found.
 */
async function getCkContinuity(ckInstanceId) {
  // Placeholder: Implement logic to fetch a document from 'ck_continuity'
  console.log(`Getting CK continuity for instance: ${ckInstanceId}`);
  const docRef = db.collection('ck_continuity').doc(ckInstanceId);
  try {
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log('No CK continuity document found for this instance.');
      return null;
    }
    return doc.data();
  } catch (error) {
    console.error('Error getting CK continuity:', error);
    throw error;
  }
}

/**
 * Updates a CK continuity document in Firestore.
 * @param {string} ckInstanceId - The ID of the CK instance.
 * @param {Object} data - The data to update/set in the document.
 * @returns {Promise<void>}
 */
async function updateCkContinuity(ckInstanceId, data) {
  // Placeholder: Implement logic to update/create a document in 'ck_continuity'
  console.log(`Updating CK continuity for instance: ${ckInstanceId}`);
  const docRef = db.collection('ck_continuity').doc(ckInstanceId);
  const updateData = {
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  try {
    await docRef.set(updateData, { merge: true }); // Use merge:true to create if not exists or update if exists
    console.log(`CK continuity for instance ${ckInstanceId} updated.`);
  } catch (error) {
    console.error('Error updating CK continuity:', error);
    throw error;
  }
}

/**
 * Creates a CG handoff template document in Firestore.
 * @param {string} sessionId - The ID of the current session.
 * @param {Object} handoffData - The handoff data object.
 * @returns {Promise<string>} The ID of the newly created handoff template document.
 */
async function createCgHandoff(sessionId, handoffData) {
  // Placeholder: Implement logic to create a 'ck_to_cg_handoff' template
  // in the 'templates' collection.
  console.log(`Creating CG handoff for session: ${sessionId}`);
  const templateData = {
    sessionId: sessionId,
    type: 'ck_to_cg_handoff',
    source: handoffData.source || 'ck_prototype_script', // Default source
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...handoffData // Spread the rest of the handoff data
  };
  try {
    const docRef = await db.collection('templates').add(templateData);
    console.log(`CG Handoff template created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating CG handoff template:', error);
    throw error;
  }
}

/**
 * Retrieves a CG summary template document from Firestore.
 * @param {string} summaryTemplateId - The ID of the CG summary template.
 * @returns {Promise<Object|null>} The summary template data or null if not found.
 */
async function getCgSummary(summaryTemplateId) {
  // Placeholder: Implement logic to fetch a 'cg_implementation_summary' template
  console.log(`Getting CG summary for template ID: ${summaryTemplateId}`);
  const docRef = db.collection('templates').doc(summaryTemplateId);
  try {
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log('No CG summary template found for this ID.');
      return null;
    }
    const data = doc.data();
    if (data.type !== 'cg_implementation_summary') {
      console.warn('Warning: Fetched template is not of type cg_implementation_summary.');
    }
    return data;
  } catch (error) {
    console.error('Error getting CG summary template:', error);
    throw error;
  }
}

/**
 * Updates specific fields in a session document in Firestore.
 * @param {string} sessionId - The ID of the session to update.
 * @param {Object} statusUpdate - An object containing fields to update (e.g., { status: 'paused', summary_notes: '...' }).
 * @returns {Promise<void>}
 */
async function updateSessionStatus(sessionId, statusUpdate) {
  // Placeholder: Implement logic to update a session document in 'sessions'
  console.log(`Updating session status for session ID: ${sessionId}`);
  const sessionRef = db.collection('sessions').doc(sessionId);
  const updateData = {
    ...statusUpdate,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Ensure nested active_plan updates are merged correctly
  if (statusUpdate.active_plan) {
    for (const key in statusUpdate.active_plan) {
      updateData[`active_plan.${key}`] = statusUpdate.active_plan[key];
    }
    delete updateData.active_plan; // Remove the top-level active_plan to avoid replacing the whole object if not intended
  }

  try {
    await sessionRef.update(updateData);
    console.log(`Session ${sessionId} updated.`);
  } catch (error) {
    console.error(`Error updating session ${sessionId}:`, error);
    throw error;
  }
}

// Basic CLI argument parsing and function execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage: node fs_revolutionary_prototype.js <command> [options]');
    console.log('Commands:');
    console.log('  initializeNewSession <milestoneName> <focusTaskIds_comma_separated> [customSessionId]');
    console.log('  getCkContinuity <ckInstanceId>');
    console.log('  updateCkContinuity <ckInstanceId> <jsonDataString>');
    console.log('  createCgHandoff <sessionId> <jsonDataString_for_handoffData>');
    console.log('  getCgSummary <summaryTemplateId>');
    console.log('  updateSessionStatus <sessionId> <jsonDataString_for_statusUpdate>');
    return;
  }

  try {
    switch (command) {
      case 'initializeNewSession':
        if (args.length < 3) throw new Error('Missing arguments for initializeNewSession');
        const milestoneName = args[1];
        const focusTaskIds = args[2].split(',');
        const customSessionId = args[3]; // Optional
        const newSessionId = await initializeNewSession(milestoneName, focusTaskIds, customSessionId);
        console.log('InitializeNewSession Result:', newSessionId);
        break;

      case 'getCkContinuity':
        if (args.length < 2) throw new Error('Missing ckInstanceId');
        const ckInstanceIdGet = args[1];
        const continuityData = await getCkContinuity(ckInstanceIdGet);
        console.log('GetCkContinuity Result:', continuityData);
        break;

      case 'updateCkContinuity':
        if (args.length < 3) throw new Error('Missing ckInstanceId or jsonDataString');
        const ckInstanceIdUpdate = args[1];
        const continuityJsonData = JSON.parse(args[2]);
        await updateCkContinuity(ckInstanceIdUpdate, continuityJsonData);
        console.log('UpdateCkContinuity Succeeded.');
        break;

      case 'createCgHandoff':
        if (args.length < 3) throw new Error('Missing sessionId or jsonDataString_for_handoffData');
        const sessionIdHandoff = args[1];
        const handoffJsonData = JSON.parse(args[2]);
        const handoffId = await createCgHandoff(sessionIdHandoff, handoffJsonData);
        console.log('CreateCgHandoff Result:', handoffId);
        break;

      case 'getCgSummary':
        if (args.length < 2) throw new Error('Missing summaryTemplateId');
        const summaryTemplateId = args[1];
        const summaryData = await getCgSummary(summaryTemplateId);
        console.log('GetCgSummary Result:', summaryData);
        break;

      case 'updateSessionStatus':
        if (args.length < 3) throw new Error('Missing sessionId or jsonDataString_for_statusUpdate');
        const sessionIdUpdate = args[1];
        const statusUpdateJsonData = JSON.parse(args[2]);
        await updateSessionStatus(sessionIdUpdate, statusUpdateJsonData);
        console.log('UpdateSessionStatus Succeeded.');
        break;

      default:
        console.log(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`Error executing command ${command}:`, error.message);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error in main:', err);
    process.exit(1);
  });
}

module.exports = {
  initializeNewSession,
  getCkContinuity,
  updateCkContinuity,
  createCgHandoff,
  getCgSummary,
  updateSessionStatus,
  admin // Export admin for potential external use or testing
}; 