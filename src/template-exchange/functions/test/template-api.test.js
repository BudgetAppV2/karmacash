/**
 * Tests for Template API
 */

const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const { mockRequest, mockResponse } = require('./mocks');
const templateService = require('../services/template-service');
const authMiddleware = require('../middleware/auth-middleware');

// Import the express app but stub the middleware to avoid authentication
const express = require('express');
const templateApi = require('../api/template-api');

describe('Template API', () => {
  let req, res, templateServiceStub;
  
  beforeEach(() => {
    // Mock request and response
    req = mockRequest();
    res = mockResponse();
    
    // Stub templateService methods
    templateServiceStub = {
      createTemplate: sinon.stub(templateService, 'createTemplate'),
      getTemplateBySessionId: sinon.stub(templateService, 'getTemplateBySessionId'),
      getTemplateById: sinon.stub(templateService, 'getTemplateById'),
      listTemplates: sinon.stub(templateService, 'listTemplates'),
      updateTemplate: sinon.stub(templateService, 'updateTemplate'),
      deleteTemplate: sinon.stub(templateService, 'deleteTemplate')
    };
    
    // Stub authMiddleware to pass through
    sinon.stub(authMiddleware, 'authenticate').callsFake((req, res, next) => next());
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('GET /api/templates/:sessionId', () => {
    it('should return 400 if session ID is missing', async () => {
      // Arrange
      req.params = {};
      
      // Act
      await templateApi.getTemplate(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].error).to.equal('Bad Request');
    });
    
    it('should return 404 if template is not found', async () => {
      // Arrange
      req.params = { sessionId: 'M1.S1' };
      req.query = { type: 'handoff' };
      templateServiceStub.getTemplateBySessionId.resolves(null);
      
      // Act
      await templateApi.getTemplate(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].error).to.equal('Not Found');
    });
    
    it('should return 200 with template data if found', async () => {
      // Arrange
      req.params = { sessionId: 'M1.S1' };
      req.query = { type: 'handoff' };
      const mockTemplate = {
        id: '123',
        sessionId: 'M1.S1',
        type: 'handoff',
        content: 'Test content',
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() }
      };
      templateServiceStub.getTemplateBySessionId.resolves(mockTemplate);
      
      // Act
      await templateApi.getTemplate(req, res);
      
      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].id).to.equal('123');
    });
  });
  
  describe('POST /api/templates', () => {
    it('should return 400 if required fields are missing', async () => {
      // Arrange
      req.body = { sessionId: 'M1.S1' }; // Missing type and content
      
      // Act
      await templateApi.createTemplate(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].error).to.equal('Bad Request');
    });
    
    it('should return 400 if session ID format is invalid', async () => {
      // Arrange
      req.body = {
        sessionId: 'invalid',
        type: 'handoff',
        content: 'Test content'
      };
      
      // Act
      await templateApi.createTemplate(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].error).to.equal('Bad Request');
    });
    
    it('should return 201 with created template data on success', async () => {
      // Arrange
      req.body = {
        sessionId: 'M1.S1',
        type: 'handoff',
        content: 'Test content'
      };
      const mockResult = {
        id: '123',
        ...req.body,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        message: 'Template created successfully'
      };
      templateServiceStub.createTemplate.resolves(mockResult);
      
      // Act
      await templateApi.createTemplate(req, res);
      
      // Assert
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].id).to.equal('123');
    });
  });
  
  describe('GET /api/templates', () => {
    it('should return 400 if limit is invalid', async () => {
      // Arrange
      req.query = { limit: 'invalid' };
      
      // Act
      await templateApi.listTemplates(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].error).to.equal('Bad Request');
    });
    
    it('should return 200 with templates list on success', async () => {
      // Arrange
      req.query = { type: 'handoff', limit: '10' };
      const mockTemplates = [
        {
          id: '123',
          sessionId: 'M1.S1',
          type: 'handoff',
          content: 'Test content 1',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        },
        {
          id: '456',
          sessionId: 'M1.S2',
          type: 'handoff',
          content: 'Test content 2',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() }
        }
      ];
      templateServiceStub.listTemplates.resolves(mockTemplates);
      
      // Act
      await templateApi.listTemplates(req, res);
      
      // Assert
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0].templates).to.have.lengthOf(2);
    });
  });
}); 