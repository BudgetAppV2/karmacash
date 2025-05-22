/**
 * Tests for Firestore configuration
 */

const { firestoreConfig, COLLECTION_CONFIG } = require('../firebase/firestore-config');
const { TemplateModel } = require('../models/template-exchange-schema');

describe('Firestore Configuration', () => {
  // Mock Firestore
  const mockFirestore = () => {
    const mockCollection = {
      doc: jest.fn().mockReturnValue({
        set: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      }),
    };
    
    const mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
      settings: jest.fn(),
      _settings: {},
    };
    
    return { db: mockDb, mockCollection };
  };
  
  describe('initialization', () => {
    it('should initialize with default settings', () => {
      // Arrange
      const { db: mockDb } = mockFirestore();
      jest.spyOn(firestoreConfig, 'getDb').mockReturnValue(mockDb);
      
      // Create a new instance to test
      const config = { ...firestoreConfig };
      config.db = mockDb;
      
      // Act
      const result = config.initialize();
      
      // Assert
      expect(result).toBeDefined();
      expect(result.db).toBe(mockDb);
      expect(result.templateModel).toBeInstanceOf(TemplateModel);
    });
    
    it('should initialize with custom settings', () => {
      // Arrange
      const { db: mockDb } = mockFirestore();
      jest.spyOn(firestoreConfig, 'getDb').mockReturnValue(mockDb);
      
      // Create a new instance to test
      const config = { ...firestoreConfig };
      config.db = mockDb;
      
      // Act
      const result = config.initialize({
        cacheSizeOverride: 100,
        persistenceOverride: false,
      });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.db).toBe(mockDb);
      expect(result.templateModel).toBeInstanceOf(TemplateModel);
    });
  });
  
  describe('collection initialization', () => {
    it('should ensure templates collection exists', async () => {
      // Arrange
      const { db: mockDb, mockCollection } = mockFirestore();
      
      // Create a new instance to test
      const config = { ...firestoreConfig };
      config.db = mockDb;
      config.initialized = true;
      
      // Act
      await config.ensureTemplatesCollection();
      
      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith(COLLECTION_CONFIG.NAME);
      expect(mockCollection.doc).toHaveBeenCalledWith('_temp_init');
    });
    
    it('should throw error if not initialized', async () => {
      // Arrange
      const config = { ...firestoreConfig };
      config.initialized = false;
      
      // Act & Assert
      await expect(config.ensureTemplatesCollection()).rejects.toThrow(
        'Firestore not initialized'
      );
    });
  });
  
  describe('performance configuration', () => {
    it('should configure performance settings', async () => {
      // Arrange
      const { db: mockDb } = mockFirestore();
      
      // Create a new instance to test
      const config = { ...firestoreConfig };
      config.db = mockDb;
      config.initialized = true;
      
      // Act
      await config.configurePerformance({
        cacheSizeMB: 100,
        syncTimeout: 5000,
      });
      
      // Assert
      expect(mockDb.settings).toHaveBeenCalled();
    });
    
    it('should throw error if not initialized', async () => {
      // Arrange
      const config = { ...firestoreConfig };
      config.initialized = false;
      
      // Act & Assert
      await expect(config.configurePerformance()).rejects.toThrow(
        'Firestore not initialized'
      );
    });
  });
  
  describe('collection config constants', () => {
    it('should have the expected collection configuration values', () => {
      // Assert
      expect(COLLECTION_CONFIG.NAME).toBe('templates');
      expect(COLLECTION_CONFIG.SHARDS).toEqual(['a', 'b', 'c']);
      expect(COLLECTION_CONFIG.CACHE_SIZE).toBe(50);
      expect(COLLECTION_CONFIG.PERSISTENCE).toBe(true);
      expect(COLLECTION_CONFIG.SYNCHRONIZE_TIMEOUT).toBe(10000);
    });
  });
}); 