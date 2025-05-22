/**
 * Tests for the Template Exchange data model
 */

const { TemplateSchema, TemplateModel } = require('../models/template-exchange-schema');
const { Timestamp } = require('firebase-admin/firestore');

// Mock Firestore
const mockFirestore = () => {
  const documents = {};
  const queryResults = [];
  
  const mockDoc = (id) => ({
    id,
    get: jest.fn().mockResolvedValue({
      id,
      exists: !!documents[id],
      data: () => documents[id],
    }),
    update: jest.fn().mockImplementation(data => {
      documents[id] = { ...documents[id], ...data };
      return Promise.resolve({ writeTime: new Date() });
    }),
  });
  
  const collection = {
    doc: jest.fn().mockImplementation(id => mockDoc(id)),
    add: jest.fn().mockImplementation(data => {
      const id = `mock-doc-${Date.now()}`;
      documents[id] = data;
      return Promise.resolve(mockDoc(id));
    }),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    startAfter: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      forEach: callback => {
        queryResults.forEach(callback);
      },
    }),
  };
  
  // For testing specific query scenarios
  const setQueryResults = results => {
    queryResults.length = 0;
    results.forEach(item => queryResults.push(item));
  };
  
  return {
    collection: jest.fn().mockReturnValue(collection),
    documents,
    setQueryResults,
    mockCollection: collection,
  };
};

describe('TemplateModel', () => {
  let db;
  let templateModel;
  
  beforeEach(() => {
    jest.clearAllMocks();
    db = mockFirestore();
    templateModel = new TemplateModel(db);
    
    // Mock the getRandomShard method to return a predictable value for testing
    templateModel.getRandomShard = jest.fn().mockReturnValue('a');
  });
  
  describe('create', () => {
    it('should create a valid template document', async () => {
      const now = Timestamp.now();
      const templateData = {
        sessionId: 'M5.S4',
        type: 'handoff',
        content: 'Test template content',
        status: 'draft'
      };
      
      // Mock the validate method
      templateModel.validate = jest.fn();
      
      await templateModel.create(templateData);
      
      // Validate was called
      expect(templateModel.validate).toHaveBeenCalledWith(templateData);
      
      // Collection add was called with the expected data
      const addArgs = db.mockCollection.add.mock.calls[0][0];
      expect(addArgs).toMatchObject({
        ...templateData,
        shard: 'a',
      });
      
      // Timestamps were added
      expect(addArgs.createdAt).toBeDefined();
      expect(addArgs.updatedAt).toBeDefined();
      
      // Default metadata was added
      expect(addArgs.metadata).toEqual({
        version: 1
      });
    });
  });
  
  describe('update', () => {
    it('should update an existing template document', async () => {
      const templateId = 'test-id';
      const updateData = {
        content: 'Updated content',
        status: 'active',
        createdAt: 'Should not be included', // This should be filtered out
        shard: 'b',                          // This should be filtered out
      };
      
      await templateModel.update(templateId, updateData);
      
      // Check document reference was correctly obtained
      expect(db.mockCollection.doc).toHaveBeenCalledWith(templateId);
      
      // Check update was called with correct data
      const docRef = db.mockCollection.doc.mock.results[0].value;
      expect(docRef.update).toHaveBeenCalled();
      
      const updateArgs = docRef.update.mock.calls[0][0];
      
      // Ensure createdAt was removed
      expect(updateArgs.createdAt).toBeUndefined();
      
      // Ensure shard was removed
      expect(updateArgs.shard).toBeUndefined();
      
      // Ensure updatedAt was added
      expect(updateArgs.updatedAt).toBeDefined();
      
      // Ensure other fields were preserved
      expect(updateArgs.content).toBe('Updated content');
      expect(updateArgs.status).toBe('active');
    });
  });
  
  describe('getById', () => {
    it('should retrieve a template document by ID', async () => {
      const templateId = 'test-id';
      
      await templateModel.getById(templateId);
      
      // Check document reference was correctly obtained
      expect(db.mockCollection.doc).toHaveBeenCalledWith(templateId);
      
      // Check get was called
      const docRef = db.mockCollection.doc.mock.results[0].value;
      expect(docRef.get).toHaveBeenCalled();
    });
  });
  
  describe('getBySessionId', () => {
    it('should query templates by session ID across all shards', async () => {
      const sessionId = 'M5.S4';
      
      // Mock the query response
      const mockDocSnapshot = {
        id: 'test-id',
        data: () => ({
          sessionId,
          type: 'handoff',
          content: 'Test content',
        }),
      };
      
      db.setQueryResults([mockDocSnapshot]);
      
      await templateModel.getBySessionId(sessionId);
      
      // Verify query construction - should have 3 queries for 3 shards
      expect(db.mockCollection.where).toHaveBeenCalledTimes(3);
      
      // Check first call parameters - these should follow the pattern for all 3 calls
      const whereCall1 = db.mockCollection.where.mock.calls[0];
      const whereCall2 = db.mockCollection.where.mock.calls[1];
      
      // First where should be on shard field
      expect(whereCall1[0]).toBe('shard');
      expect(whereCall1[1]).toBe('==');
      
      // Second where should be on sessionId field
      expect(whereCall2[0]).toBe('sessionId');
      expect(whereCall2[1]).toBe('==');
      expect(whereCall2[2]).toBe(sessionId);
    });
  });
  
  describe('getByType', () => {
    it('should query templates by type with pagination', async () => {
      const type = 'handoff';
      const limit = 5;
      
      // Mock the query response
      const mockDocSnapshots = [
        {
          id: 'test-id-1',
          data: () => ({
            type,
            updatedAt: { toMillis: () => 1000 },
          }),
        },
        {
          id: 'test-id-2',
          data: () => ({
            type,
            updatedAt: { toMillis: () => 2000 },
          }),
        },
      ];
      
      db.setQueryResults(mockDocSnapshots);
      
      await templateModel.getByType(type, limit);
      
      // Verify query construction - should have 3 queries for 3 shards
      expect(db.mockCollection.where).toHaveBeenCalledTimes(6); // 2 where clauses × 3 shards
      expect(db.mockCollection.orderBy).toHaveBeenCalledTimes(3); // 3 shards
      expect(db.mockCollection.limit).toHaveBeenCalledTimes(3); // 3 shards
      
      // Check query parameters
      const whereCall1 = db.mockCollection.where.mock.calls[0]; // First where of first shard
      const whereCall2 = db.mockCollection.where.mock.calls[1]; // Second where of first shard
      const orderByCall = db.mockCollection.orderBy.mock.calls[0];
      const limitCall = db.mockCollection.limit.mock.calls[0];
      
      // First where should be on shard field
      expect(whereCall1[0]).toBe('shard');
      expect(whereCall1[1]).toBe('==');
      
      // Second where should be on type field
      expect(whereCall2[0]).toBe('type');
      expect(whereCall2[1]).toBe('==');
      expect(whereCall2[2]).toBe(type);
      
      // Order by should be on updatedAt field
      expect(orderByCall[0]).toBe('updatedAt');
      expect(orderByCall[1]).toBe('desc');
      
      // Limit should match the provided limit
      expect(limitCall[0]).toBe(limit);
    });
  });
  
  describe('validate', () => {
    it('should throw an error for missing required fields', () => {
      // Missing sessionId, type, content, status
      const invalidData = {
        // No required fields
      };
      
      expect(() => {
        templateModel.validate(invalidData);
      }).toThrow(/Required field.*is missing/);
    });
    
    it('should throw an error for invalid sessionId format', () => {
      const invalidData = {
        sessionId: 'invalid-format', // Should be like M5.S4
        type: 'handoff',
        content: 'Test content',
        status: 'draft',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        shard: 'a',
      };
      
      expect(() => {
        templateModel.validate(invalidData);
      }).toThrow(/Field 'sessionId' failed validation/);
    });
    
    it('should throw an error for invalid type', () => {
      const invalidData = {
        sessionId: 'M5.S4',
        type: 'invalid-type', // Should be 'handoff' or 'summary'
        content: 'Test content',
        status: 'draft',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        shard: 'a',
      };
      
      expect(() => {
        templateModel.validate(invalidData);
      }).toThrow(/Field 'type' failed validation/);
    });
    
    it('should throw an error for invalid status', () => {
      const invalidData = {
        sessionId: 'M5.S4',
        type: 'handoff',
        content: 'Test content',
        status: 'invalid-status', // Should be 'draft', 'active', or 'archived'
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        shard: 'a',
      };
      
      expect(() => {
        templateModel.validate(invalidData);
      }).toThrow(/Field 'status' failed validation/);
    });
    
    it('should throw an error for content exceeding max length', () => {
      // Create content that exceeds the 50000 character limit
      const longContent = 'a'.repeat(50001);
      
      const invalidData = {
        sessionId: 'M5.S4',
        type: 'handoff',
        content: longContent, // Too long
        status: 'draft',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        shard: 'a',
      };
      
      expect(() => {
        templateModel.validate(invalidData);
      }).toThrow(/Field 'content' exceeds maximum length/);
    });
    
    it('should validate a correct template object', () => {
      const validData = {
        sessionId: 'M5.S4',
        type: 'handoff',
        content: 'Valid test content',
        status: 'draft',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        shard: 'a',
        metadata: {
          source: 'cursor',
          tags: ['test'],
          version: 1,
        },
      };
      
      // Should not throw any errors
      expect(() => {
        templateModel.validate(validData);
      }).not.toThrow();
    });
  });
}); 