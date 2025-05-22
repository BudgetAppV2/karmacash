/**
 * Mocks for testing
 */

const sinon = require('sinon');

/**
 * Create a mock Express request object
 * @param {Object} options - Options to override default values
 * @returns {Object} - Mock request object
 */
function mockRequest(options = {}) {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    method: options.method || 'GET',
    path: options.path || '',
    ...options
  };
}

/**
 * Create a mock Express response object
 * @returns {Object} - Mock response object with spies
 */
function mockResponse() {
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis(),
    set: sinon.stub().returnsThis(),
    end: sinon.stub().returnsThis(),
    redirect: sinon.stub().returnsThis()
  };
  return res;
}

/**
 * Create a mock Firestore document snapshot
 * @param {string} id - Document ID
 * @param {Object} data - Document data
 * @param {boolean} exists - Whether the document exists
 * @returns {Object} - Mock document snapshot
 */
function mockDocumentSnapshot(id, data, exists = true) {
  return {
    id,
    exists,
    data: () => exists ? data : undefined,
    ref: {
      path: `collection/${id}`
    }
  };
}

/**
 * Create a mock Firestore query snapshot
 * @param {Array<Object>} docs - Array of document snapshots
 * @returns {Object} - Mock query snapshot
 */
function mockQuerySnapshot(docs = []) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (callback) => docs.forEach(callback)
  };
}

/**
 * Create a mock Firestore timestamp
 * @param {Date} date - JavaScript Date object
 * @returns {Object} - Mock Firestore timestamp
 */
function mockTimestamp(date = new Date()) {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: (other) => other && other.toMillis() === date.getTime()
  };
}

module.exports = {
  mockRequest,
  mockResponse,
  mockDocumentSnapshot,
  mockQuerySnapshot,
  mockTimestamp
}; 