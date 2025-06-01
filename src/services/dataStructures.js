/**
 * Optimized Data Structures for Large Datasets
 * 
 * High-performance data structures and algorithms for handling 1000+ transactions
 * Includes indexing, virtual scrolling, and memory-efficient operations
 */

/**
 * B-Tree implementation for fast sorted operations
 */
class BTree {
  constructor(degree = 100) {
    this.degree = degree;
    this.root = new BTreeNode();
    this.size = 0;
  }

  insert(key, value) {
    if (this.root.isFull()) {
      const newRoot = new BTreeNode();
      newRoot.children.push(this.root);
      newRoot.splitChild(0);
      this.root = newRoot;
    }
    this.root.insertNonFull(key, value);
    this.size++;
  }

  search(key) {
    return this.root.search(key);
  }

  range(minKey, maxKey) {
    const results = [];
    this.root.rangeSearch(minKey, maxKey, results);
    return results;
  }

  getSize() {
    return this.size;
  }
}

class BTreeNode {
  constructor() {
    this.keys = [];
    this.values = [];
    this.children = [];
    this.isLeaf = true;
  }

  isFull() {
    return this.keys.length === 199; // 2 * degree - 1
  }

  search(key) {
    let i = 0;
    while (i < this.keys.length && key > this.keys[i]) {
      i++;
    }

    if (i < this.keys.length && key === this.keys[i]) {
      return this.values[i];
    }

    if (this.isLeaf) {
      return null;
    }

    return this.children[i].search(key);
  }

  insertNonFull(key, value) {
    let i = this.keys.length - 1;

    if (this.isLeaf) {
      this.keys.push(null);
      this.values.push(null);

      while (i >= 0 && key < this.keys[i]) {
        this.keys[i + 1] = this.keys[i];
        this.values[i + 1] = this.values[i];
        i--;
      }

      this.keys[i + 1] = key;
      this.values[i + 1] = value;
    } else {
      while (i >= 0 && key < this.keys[i]) {
        i--;
      }
      i++;

      if (this.children[i].isFull()) {
        this.splitChild(i);
        if (key > this.keys[i]) {
          i++;
        }
      }
      this.children[i].insertNonFull(key, value);
    }
  }

  splitChild(index) {
    const fullChild = this.children[index];
    const newChild = new BTreeNode();
    newChild.isLeaf = fullChild.isLeaf;

    const midIndex = 99; // degree - 1

    newChild.keys = fullChild.keys.splice(midIndex + 1);
    newChild.values = fullChild.values.splice(midIndex + 1);

    if (!fullChild.isLeaf) {
      newChild.children = fullChild.children.splice(midIndex + 1);
    }

    this.children.splice(index + 1, 0, newChild);
    this.keys.splice(index, 0, fullChild.keys[midIndex]);
    this.values.splice(index, 0, fullChild.values[midIndex]);

    fullChild.keys.splice(midIndex);
    fullChild.values.splice(midIndex);
  }

  rangeSearch(minKey, maxKey, results) {
    let i = 0;
    while (i < this.keys.length) {
      if (!this.isLeaf) {
        this.children[i].rangeSearch(minKey, maxKey, results);
      }

      if (this.keys[i] >= minKey && this.keys[i] <= maxKey) {
        results.push({ key: this.keys[i], value: this.values[i] });
      }

      if (this.keys[i] > maxKey) {
        break;
      }

      i++;
    }

    if (!this.isLeaf && i < this.children.length) {
      this.children[i].rangeSearch(minKey, maxKey, results);
    }
  }
}

/**
 * Optimized Transaction Index for fast lookups
 */
class TransactionIndex {
  constructor() {
    this.indices = {
      byDate: new BTree(),
      byCategory: new Map(),
      byAmount: new BTree(),
      byType: new Map(),
      byUser: new Map()
    };
    this.transactions = [];
    this.nextId = 0;
  }

  addTransaction(transaction) {
    const id = this.nextId++;
    const indexedTransaction = { ...transaction, _id: id };
    
    this.transactions[id] = indexedTransaction;
    
    // Index by date (timestamp for fast range queries)
    const dateKey = new Date(transaction.date).getTime();
    this.indices.byDate.insert(dateKey, id);
    
    // Index by category
    const categoryId = transaction.categoryId || 'uncategorized';
    if (!this.indices.byCategory.has(categoryId)) {
      this.indices.byCategory.set(categoryId, []);
    }
    this.indices.byCategory.get(categoryId).push(id);
    
    // Index by amount
    const amountKey = Math.abs(transaction.amount);
    this.indices.byAmount.insert(amountKey, id);
    
    // Index by type
    const type = transaction.type || 'unknown';
    if (!this.indices.byType.has(type)) {
      this.indices.byType.set(type, []);
    }
    this.indices.byType.get(type).push(id);
    
    // Index by user
    const userId = transaction.userId;
    if (!this.indices.byUser.has(userId)) {
      this.indices.byUser.set(userId, []);
    }
    this.indices.byUser.get(userId).push(id);
    
    return id;
  }

  getTransactionsByDateRange(startDate, endDate) {
    const startKey = new Date(startDate).getTime();
    const endKey = new Date(endDate).getTime();
    
    const results = this.indices.byDate.range(startKey, endKey);
    return results.map(result => this.transactions[result.value]);
  }

  getTransactionsByCategory(categoryId) {
    const ids = this.indices.byCategory.get(categoryId) || [];
    return ids.map(id => this.transactions[id]);
  }

  getTransactionsByAmountRange(minAmount, maxAmount) {
    const results = this.indices.byAmount.range(minAmount, maxAmount);
    return results.map(result => this.transactions[result.value]);
  }

  getTransactionsByType(type) {
    const ids = this.indices.byType.get(type) || [];
    return ids.map(id => this.transactions[id]);
  }

  getTransactionsByUser(userId) {
    const ids = this.indices.byUser.get(userId) || [];
    return ids.map(id => this.transactions[id]);
  }

  // Complex query combining multiple indices
  query(filters = {}) {
    let candidateIds = null;

    // Start with the most selective filter
    if (filters.userId) {
      candidateIds = new Set(this.indices.byUser.get(filters.userId) || []);
    } else if (filters.categoryId) {
      candidateIds = new Set(this.indices.byCategory.get(filters.categoryId) || []);
    } else if (filters.type) {
      candidateIds = new Set(this.indices.byType.get(filters.type) || []);
    } else {
      // If no selective filter, start with all transactions
      candidateIds = new Set(Object.keys(this.transactions).map(Number));
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      const dateResults = this.getTransactionsByDateRange(filters.startDate, filters.endDate);
      const dateIds = new Set(dateResults.map(t => t._id));
      candidateIds = new Set([...candidateIds].filter(id => dateIds.has(id)));
    }

    // Apply amount range filter
    if (filters.minAmount !== undefined && filters.maxAmount !== undefined) {
      const amountResults = this.getTransactionsByAmountRange(filters.minAmount, filters.maxAmount);
      const amountIds = new Set(amountResults.map(t => t._id));
      candidateIds = new Set([...candidateIds].filter(id => amountIds.has(id)));
    }

    // Apply remaining filters
    const results = [...candidateIds]
      .map(id => this.transactions[id])
      .filter(transaction => {
        if (filters.categoryId && transaction.categoryId !== filters.categoryId) return false;
        if (filters.type && transaction.type !== filters.type) return false;
        if (filters.description && !transaction.description?.toLowerCase().includes(filters.description.toLowerCase())) return false;
        return true;
      });

    return results;
  }

  getSize() {
    return this.transactions.length;
  }

  clear() {
    this.indices.byDate = new BTree();
    this.indices.byCategory.clear();
    this.indices.byAmount = new BTree();
    this.indices.byType.clear();
    this.indices.byUser.clear();
    this.transactions = [];
    this.nextId = 0;
  }
}

/**
 * Virtual Scrolling Implementation for Large Lists
 */
class VirtualScrollManager {
  constructor(options = {}) {
    this.itemHeight = options.itemHeight || 60;
    this.containerHeight = options.containerHeight || 400;
    this.buffer = options.buffer || 5;
    this.data = [];
    this.visibleRange = { start: 0, end: 0 };
    this.scrollTop = 0;
  }

  setData(data) {
    this.data = data;
    this.updateVisibleRange();
  }

  updateScrollPosition(scrollTop) {
    this.scrollTop = scrollTop;
    this.updateVisibleRange();
  }

  updateVisibleRange() {
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(this.containerHeight / this.itemHeight),
      this.data.length
    );

    this.visibleRange = {
      start: Math.max(0, visibleStart - this.buffer),
      end: Math.min(this.data.length, visibleEnd + this.buffer)
    };
  }

  getVisibleItems() {
    return this.data.slice(this.visibleRange.start, this.visibleRange.end);
  }

  getVisibleRange() {
    return this.visibleRange;
  }

  getTotalHeight() {
    return this.data.length * this.itemHeight;
  }

  getOffsetY() {
    return this.visibleRange.start * this.itemHeight;
  }
}

/**
 * Memory-Efficient Aggregation Engine
 */
class AggregationEngine {
  constructor() {
    this.aggregators = new Map();
    this.streamingAggregators = new Map();
  }

  // Register a streaming aggregator for real-time calculations
  registerStreamingAggregator(name, initialValue, updateFn, finalizeFn = null) {
    this.streamingAggregators.set(name, {
      value: initialValue,
      update: updateFn,
      finalize: finalizeFn || (v => v),
      count: 0
    });
  }

  // Process transaction in streaming fashion
  processTransaction(transaction) {
    for (const [name, aggregator] of this.streamingAggregators) {
      aggregator.value = aggregator.update(aggregator.value, transaction, aggregator.count);
      aggregator.count++;
    }
  }

  // Get final aggregated results
  getResults() {
    const results = {};
    for (const [name, aggregator] of this.streamingAggregators) {
      results[name] = aggregator.finalize(aggregator.value, aggregator.count);
    }
    return results;
  }

  // Memory-efficient batch processing for large datasets
  processBatch(transactions, batchSize = 1000) {
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Process batch
      batch.forEach(transaction => this.processTransaction(transaction));
      
      // Allow garbage collection between batches
      if (i % (batchSize * 10) === 0) {
        // Force garbage collection hint (if available)
        if (typeof global !== 'undefined' && global.gc) {
          global.gc();
        }
      }
    }
  }

  reset() {
    for (const aggregator of this.streamingAggregators.values()) {
      aggregator.count = 0;
    }
  }

  clear() {
    this.streamingAggregators.clear();
  }
}

/**
 * Data Compression Utilities
 */
class DataCompressor {
  // Compress transaction data by removing redundant information
  static compressTransactions(transactions) {
    if (!transactions.length) return { compressed: [], dictionary: {} };

    // Build dictionary of common values
    const dictionary = {
      categories: new Map(),
      users: new Map(),
      types: new Map(),
      descriptions: new Map()
    };

    // First pass: build dictionaries
    transactions.forEach(transaction => {
      this._addToDictionary(dictionary.categories, transaction.categoryId);
      this._addToDictionary(dictionary.users, transaction.userId);
      this._addToDictionary(dictionary.types, transaction.type);
      this._addToDictionary(dictionary.descriptions, transaction.description);
    });

    // Convert maps to arrays for storage
    const dictionaryArrays = {
      categories: Array.from(dictionary.categories.keys()),
      users: Array.from(dictionary.users.keys()),
      types: Array.from(dictionary.types.keys()),
      descriptions: Array.from(dictionary.descriptions.keys())
    };

    // Second pass: compress using dictionary indices
    const compressed = transactions.map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: dictionary.categories.get(transaction.categoryId),
      userId: dictionary.users.get(transaction.userId),
      type: dictionary.types.get(transaction.type),
      description: dictionary.descriptions.get(transaction.description)
    }));

    return { compressed, dictionary: dictionaryArrays };
  }

  // Decompress transaction data
  static decompressTransactions(compressedData) {
    const { compressed, dictionary } = compressedData;
    
    return compressed.map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: dictionary.categories[transaction.categoryId],
      userId: dictionary.users[transaction.userId],
      type: dictionary.types[transaction.type],
      description: dictionary.descriptions[transaction.description]
    }));
  }

  static _addToDictionary(map, value) {
    if (value && !map.has(value)) {
      map.set(value, map.size);
    }
  }

  // Delta compression for time series data
  static compressTimeSeries(data) {
    if (!data.length) return [];

    const compressed = [data[0]]; // First value stored as-is
    
    for (let i = 1; i < data.length; i++) {
      const delta = {
        timestamp: data[i].timestamp - data[i-1].timestamp,
        amount: data[i].amount - data[i-1].amount
      };
      compressed.push(delta);
    }

    return compressed;
  }

  static decompressTimeSeries(compressed) {
    if (!compressed.length) return [];

    const decompressed = [compressed[0]]; // First value as-is
    
    for (let i = 1; i < compressed.length; i++) {
      const previous = decompressed[i-1];
      const current = {
        timestamp: previous.timestamp + compressed[i].timestamp,
        amount: previous.amount + compressed[i].amount
      };
      decompressed.push(current);
    }

    return decompressed;
  }
}

/**
 * Performance Monitor for Large Dataset Operations
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.activeOperations = new Map();
  }

  startOperation(name) {
    const id = `${name}_${Date.now()}_${Math.random()}`;
    this.activeOperations.set(id, {
      name,
      startTime: performance.now(),
      memoryStart: this._getMemoryUsage()
    });
    return id;
  }

  endOperation(id) {
    const operation = this.activeOperations.get(id);
    if (!operation) return null;

    const duration = performance.now() - operation.startTime;
    const memoryEnd = this._getMemoryUsage();
    const memoryDelta = memoryEnd - operation.memoryStart;

    this.activeOperations.delete(id);

    // Update metrics
    if (!this.metrics.has(operation.name)) {
      this.metrics.set(operation.name, {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        totalMemoryDelta: 0,
        averageMemoryDelta: 0
      });
    }

    const metric = this.metrics.get(operation.name);
    metric.count++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.count;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.totalMemoryDelta += memoryDelta;
    metric.averageMemoryDelta = metric.totalMemoryDelta / metric.count;

    return {
      duration,
      memoryDelta,
      name: operation.name
    };
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  _getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  clear() {
    this.metrics.clear();
    this.activeOperations.clear();
  }
}

// Export all optimized data structures
export {
  BTree,
  TransactionIndex,
  VirtualScrollManager,
  AggregationEngine,
  DataCompressor,
  PerformanceMonitor
};

// Export factory function for creating optimized data manager
export function createOptimizedDataManager(options = {}) {
  return {
    index: new TransactionIndex(),
    virtualScroll: new VirtualScrollManager(options.virtualScroll),
    aggregator: new AggregationEngine(),
    compressor: DataCompressor,
    monitor: new PerformanceMonitor()
  };
}