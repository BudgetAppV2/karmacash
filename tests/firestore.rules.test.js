import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestContext,
} from '@firebase/rules-unit-testing';
import fs from 'fs';
import { Timestamp } from 'firebase/firestore';

// Define test user UIDs
const OWNER_UID = 'owner_user';
const EDITOR_UID = 'editor_user';
const VIEWER_UID = 'viewer_user';
const NON_MEMBER_UID = 'non_member_user';
const TEST_USER_ID = 'test_user_123';
const OTHER_USER_ID = 'other_user_123';

// Sample budget ID and other test data
const BUDGET_ID = 'test_budget_123';
const CATEGORY_ID = 'test_category_123';
const TRANSACTION_ID = 'test_transaction_123';
const TEST_BUDGET_MEMBERSHIP_ID = 'test_budget_456';

describe('Firestore Security Rules', () => {
  let testEnv;

  // Setup before all tests
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "karma-cash-test",
      firestore: {
        rules: fs.readFileSync("tests/simplified.rules", "utf8"),
        // The Firebase emulator port from firebase.json
        host: "localhost",
        port: 8085
      }
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  // Clear Firestore data between tests
  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  // Function to create test contexts for different users
  function getContext(uid = null) {
    return uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext();
  }

  // Helper function to set up a test budget with members
  async function setupTestBudget() {
    // Use admin instance correctly
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      
      await adminDb.collection('budgets').doc(BUDGET_ID).set({
        name: 'Test Budget',
        ownerId: OWNER_UID,
        currency: 'CAD',
        version: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        members: {
          [OWNER_UID]: { role: 'owner' },
          [EDITOR_UID]: { role: 'editor' },
          [VIEWER_UID]: { role: 'viewer' }
        }
      });
    });
  }

  // Function to setup a test category under a budget
  async function setupTestCategory() {
    await setupTestBudget();
    
    // Use admin instance correctly
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      
      await adminDb
        .collection('budgets')
        .doc(BUDGET_ID)
        .collection('categories')
        .doc(CATEGORY_ID)
        .set({
          name: 'Test Category',
          type: 'expense',
          budgetId: BUDGET_ID,
          createdByUserId: OWNER_UID,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isDefault: false
        });
    });
  }

  // Test suite for budget access
  describe('/budgets/{budgetId}', () => {
    beforeEach(setupTestBudget);

    it('should ALLOW owner to read a budget', async () => {
      const ownerContext = getContext(OWNER_UID);
      await assertSucceeds(
        ownerContext.firestore().collection('budgets').doc(BUDGET_ID).get()
      );
    });

    it('should ALLOW editor to read a budget', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertSucceeds(
        editorContext.firestore().collection('budgets').doc(BUDGET_ID).get()
      );
    });

    it('should ALLOW viewer to read a budget', async () => {
      const viewerContext = getContext(VIEWER_UID);
      await assertSucceeds(
        viewerContext.firestore().collection('budgets').doc(BUDGET_ID).get()
      );
    });

    it('should DENY non-member to read a budget', async () => {
      const nonMemberContext = getContext(NON_MEMBER_UID);
      await assertFails(
        nonMemberContext.firestore().collection('budgets').doc(BUDGET_ID).get()
      );
    });

    it('should DENY unauthenticated user to read a budget', async () => {
      const unauthContext = getContext();
      await assertFails(
        unauthContext.firestore().collection('budgets').doc(BUDGET_ID).get()
      );
    });

    it('should ALLOW authenticated user to create a budget with valid data', async () => {
      const newUserContext = getContext('new_user_123');
      await assertSucceeds(
        newUserContext.firestore().collection('budgets').doc('new_budget_id').set({
          name: 'My New Budget',
          ownerId: 'new_user_123',
          currency: 'CAD',
          version: 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          members: {
            'new_user_123': { role: 'owner' }
          }
        })
      );
    });

    it('should DENY creating a budget with missing required fields', async () => {
      const newUserContext = getContext('new_user_123');
      await assertFails(
        newUserContext.firestore().collection('budgets').doc('new_budget_id').set({
          name: 'My New Budget',
          // Missing ownerId, currency, version, members
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      );
    });

    it('should DENY creating a budget with incorrect owner', async () => {
      const newUserContext = getContext('new_user_123');
      await assertFails(
        newUserContext.firestore().collection('budgets').doc('new_budget_id').set({
          name: 'My New Budget',
          ownerId: 'different_user', // Not the authenticated user
          currency: 'CAD',
          version: 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          members: {
            'new_user_123': { role: 'owner' }
          }
        })
      );
    });

    it('should ALLOW owner to update budget', async () => {
      const ownerContext = getContext(OWNER_UID);
      await assertSucceeds(
        ownerContext.firestore().collection('budgets').doc(BUDGET_ID).update({
          name: 'Updated Budget Name',
          updatedAt: Timestamp.now()
        })
      );
    });

    it('should ALLOW editor to update non-critical budget fields', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertSucceeds(
        editorContext.firestore().collection('budgets').doc(BUDGET_ID).update({
          name: 'Updated By Editor',
          updatedAt: Timestamp.now()
        })
      );
    });

    it('should DENY editor from updating members field', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertFails(
        editorContext.firestore().collection('budgets').doc(BUDGET_ID).update({
          members: {
            [OWNER_UID]: { role: 'owner' },
            [EDITOR_UID]: { role: 'owner' }, // Trying to promote self to owner
            [VIEWER_UID]: { role: 'viewer' }
          },
          updatedAt: Timestamp.now()
        })
      );
    });

    it('should ALLOW owner to delete budget', async () => {
      const ownerContext = getContext(OWNER_UID);
      await assertSucceeds(
        ownerContext.firestore().collection('budgets').doc(BUDGET_ID).delete()
      );
    });

    it('should DENY editor from deleting budget', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertFails(
        editorContext.firestore().collection('budgets').doc(BUDGET_ID).delete()
      );
    });
  });

  // Test suite for categories subcollection
  describe('/budgets/{budgetId}/categories/{categoryId}', () => {
    beforeEach(setupTestCategory);

    it('should ALLOW budget members to read categories', async () => {
      // Test different roles
      for (const uid of [OWNER_UID, EDITOR_UID, VIEWER_UID]) {
        const context = getContext(uid);
        await assertSucceeds(
          context
            .firestore()
            .collection('budgets')
            .doc(BUDGET_ID)
            .collection('categories')
            .doc(CATEGORY_ID)
            .get()
        );
      }
    });

    it('should DENY non-members from reading categories', async () => {
      const nonMemberContext = getContext(NON_MEMBER_UID);
      await assertFails(
        nonMemberContext
          .firestore()
          .collection('budgets')
          .doc(BUDGET_ID)
          .collection('categories')
          .doc(CATEGORY_ID)
          .get()
      );
    });

    it('should ALLOW editor to create a category with valid data', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertSucceeds(
        editorContext
          .firestore()
          .collection('budgets')
          .doc(BUDGET_ID)
          .collection('categories')
          .doc('new_category_id')
          .set({
            name: 'New Category',
            type: 'expense',
            budgetId: BUDGET_ID,
            createdByUserId: EDITOR_UID,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          })
      );
    });

    it('should DENY viewer from creating a category', async () => {
      const viewerContext = getContext(VIEWER_UID);
      await assertFails(
        viewerContext
          .firestore()
          .collection('budgets')
          .doc(BUDGET_ID)
          .collection('categories')
          .doc('new_category_id')
          .set({
            name: 'New Category',
            type: 'expense',
            budgetId: BUDGET_ID,
            createdByUserId: VIEWER_UID,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          })
      );
    });

    it('should DENY creating a category with missing required fields', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertFails(
        editorContext
          .firestore()
          .collection('budgets')
          .doc(BUDGET_ID)
          .collection('categories')
          .doc('new_category_id')
          .set({
            // Missing name
            type: 'expense',
            budgetId: BUDGET_ID,
            createdByUserId: EDITOR_UID,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          })
      );
    });

    it('should DENY creating a category with incorrect createdByUserId', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertFails(
        editorContext
          .firestore()
          .collection('budgets')
          .doc(BUDGET_ID)
          .collection('categories')
          .doc('new_category_id')
          .set({
            name: 'New Category',
            type: 'expense',
            budgetId: BUDGET_ID,
            createdByUserId: OWNER_UID, // Not the current user
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          })
      );
    });

    it('should ALLOW editor to update a category', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertSucceeds(
        editorContext
          .firestore()
          .collection('budgets')
          .doc(BUDGET_ID)
          .collection('categories')
          .doc(CATEGORY_ID)
          .update({
            name: 'Updated Category Name',
            lastEditedByUserId: EDITOR_UID,
            updatedAt: Timestamp.now()
          })
      );
    });

    it('should DENY updating a category without lastEditedByUserId', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertFails(
        editorContext
          .firestore()
          .collection('budgets')
          .doc(BUDGET_ID)
          .collection('categories')
          .doc(CATEGORY_ID)
          .update({
            name: 'Updated Category Name',
            // Missing lastEditedByUserId
            updatedAt: Timestamp.now()
          })
      );
    });

    it('should DENY editor from modifying createdByUserId or createdAt', async () => {
      const editorContext = getContext(EDITOR_UID);
      await assertFails(
        editorContext
          .firestore()
          .collection('budgets')
          .doc(BUDGET_ID)
          .collection('categories')
          .doc(CATEGORY_ID)
          .update({
            name: 'Updated Category',
            createdByUserId: EDITOR_UID, // Trying to change creator
            lastEditedByUserId: EDITOR_UID,
            updatedAt: Timestamp.now()
          })
      );
    });
  });

  // Test suite for user collection
  describe('/users/{userId}', () => {
    // Set up test users before each test
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        
        // Create test users
        await adminDb.collection('users').doc(TEST_USER_ID).set({
          displayName: 'Test User',
          email: 'test@example.com'
        });
        
        await adminDb.collection('users').doc(OTHER_USER_ID).set({
          displayName: 'Other User',
          email: 'other@example.com'
        });
      });
    });
    
    it('should ALLOW user to read their own document', async () => {
      const userContext = getContext(TEST_USER_ID);
      await assertSucceeds(
        userContext.firestore().collection('users').doc(TEST_USER_ID).get()
      );
    });

    it('should DENY user from reading another user\'s document', async () => {
      const userContext = getContext(TEST_USER_ID);
      await assertFails(
        userContext.firestore().collection('users').doc(OTHER_USER_ID).get()
      );
    });

    it('should ALLOW user to update their own document', async () => {
      const userContext = getContext(TEST_USER_ID);
      await assertSucceeds(
        userContext.firestore().collection('users').doc(TEST_USER_ID).update({
          displayName: 'Updated Name'
        })
      );
    });

    it('should DENY unauthenticated access to user document', async () => {
      const unauthContext = getContext();
      await assertFails(
        unauthContext.firestore().collection('users').doc(TEST_USER_ID).get()
      );
    });
  });

  // Test suite for budget memberships subcollection
  describe('/users/{userId}/budgetMemberships/{budgetId}', () => {
    beforeEach(async () => {
      // Set up a test user with a budget membership using security rules disabled
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        
        // Create test user
        await adminDb.collection('users').doc(TEST_USER_ID).set({
          displayName: 'Test User',
          email: 'test@example.com'
        });

        // Add budget membership
        await adminDb
          .collection('users')
          .doc(TEST_USER_ID)
          .collection('budgetMemberships')
          .doc(TEST_BUDGET_MEMBERSHIP_ID)
          .set({
            budgetId: TEST_BUDGET_MEMBERSHIP_ID,
            role: 'editor',
            budgetName: 'Test Budget',
            createdAt: Timestamp.now()
          });
      });
    });

    it('should ALLOW user to read their own budget memberships', async () => {
      const userContext = getContext(TEST_USER_ID);
      await assertSucceeds(
        userContext
          .firestore()
          .collection('users')
          .doc(TEST_USER_ID)
          .collection('budgetMemberships')
          .doc(TEST_BUDGET_MEMBERSHIP_ID)
          .get()
      );
    });

    it('should DENY user from reading another user\'s budget memberships', async () => {
      const otherUserContext = getContext(OTHER_USER_ID);
      await assertFails(
        otherUserContext
          .firestore()
          .collection('users')
          .doc(TEST_USER_ID)
          .collection('budgetMemberships')
          .doc(TEST_BUDGET_MEMBERSHIP_ID)
          .get()
      );
    });

    it('should DENY direct creation of budget membership', async () => {
      const userContext = getContext(TEST_USER_ID);
      await assertFails(
        userContext
          .firestore()
          .collection('users')
          .doc(TEST_USER_ID)
          .collection('budgetMemberships')
          .doc('new_budget_id')
          .set({
            budgetId: 'new_budget_id',
            role: 'editor',
            budgetName: 'New Budget',
            createdAt: Timestamp.now()
          })
      );
    });

    it('should DENY direct update of budget membership', async () => {
      const userContext = getContext(TEST_USER_ID);
      await assertFails(
        userContext
          .firestore()
          .collection('users')
          .doc(TEST_USER_ID)
          .collection('budgetMemberships')
          .doc(TEST_BUDGET_MEMBERSHIP_ID)
          .update({
            role: 'owner' // Trying to promote self
          })
      );
    });

    it('should ALLOW user to delete their own budget membership', async () => {
      const userContext = getContext(TEST_USER_ID);
      await assertSucceeds(
        userContext
          .firestore()
          .collection('users')
          .doc(TEST_USER_ID)
          .collection('budgetMemberships')
          .doc(TEST_BUDGET_MEMBERSHIP_ID)
          .delete()
      );
    });
  });

  // Basic test to verify testing setup works
  it('setup test works', () => {
    expect(true).toBe(true);
  });

  // More focused test to verify emulator connection
  it('should connect to the emulator and verify authentication context', async () => {
    const userContext = getContext('test_user');
    expect(userContext).toBeDefined();
    expect(typeof userContext.firestore).toBe('function');
  });
}); 