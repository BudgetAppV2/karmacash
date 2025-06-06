/**
 * CK Fallback System
 * Maintains current priming system as reliable fallback during CK Access Module transition
 * Ensures zero disruption to HD workflows during production integration
 */

class CKFallbackSystem {
  constructor(options = {}) {
    this.isActive = false;
    this.fallbackReason = null;
    this.activationCount = 0;
    this.lastActivation = null;
    
    // Fallback configuration
    this.config = {
      autoFallbackEnabled: options.autoFallbackEnabled !== false,
      fallbackTimeout: options.fallbackTimeout || 5000, // 5 seconds
      maxRetries: options.maxRetries || 3,
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      ...options
    };

    // Current priming system (simplified representation)
    this.currentPrimingSystem = {
      primingDocuments: {
        'CG_Priming_v1': {
          available: true,
          content: 'Standard CG priming content',
          tokenSize: 8500,
          lastAccessed: null
        }
      },
      handoffTemplates: {
        'standard_implementation': {
          available: true,
          template: 'Standard CG Implementation Handoff template',
          sections: ['Project Context', 'Task Details', 'Technical Requirements']
        },
        'research_analysis': {
          available: true,
          template: 'Research and Analysis template',
          sections: ['Research Scope', 'Investigation Parameters']
        }
      },
      validationProtocols: {
        'basic_validation': {
          available: true,
          criteria: ['Task Definition', 'Deliverables', 'Success Criteria'],
          checklistItems: 8
        }
      }
    };

    // Fallback metrics
    this.metrics = {
      totalActivations: 0,
      successfulFallbacks: 0,
      failedFallbacks: 0,
      averageFallbackTime: 0,
      lastHealthCheck: null,
      systemReliability: 100
    };

    // Health monitoring
    this.healthStatus = {
      primingSystemHealthy: true,
      templatesAccessible: true,
      validationWorking: true,
      lastCheck: new Date().toISOString()
    };
  }

  // ==================== FALLBACK ACTIVATION ====================

  /**
   * Activate fallback system with specified reason
   * @param {string} reason - Reason for fallback activation
   * @param {Object} context - Context information
   * @returns {Object} Fallback activation result
   */
  activateFallback(reason, context = {}) {
    this.isActive = true;
    this.fallbackReason = reason;
    this.activationCount++;
    this.lastActivation = new Date().toISOString();
    this.metrics.totalActivations++;

    console.warn(`🔄 CK Fallback System ACTIVATED: ${reason}`);

    return {
      status: 'fallback_active',
      reason: reason,
      activationTime: this.lastActivation,
      context: context,
      availableServices: this._getAvailableFallbackServices(),
      message: 'Fallback system active - using current priming system'
    };
  }

  /**
   * Deactivate fallback system and return to CK Access Module
   * @param {Object} options - Deactivation options
   * @returns {Object} Deactivation result
   */
  deactivateFallback(options = {}) {
    if (!this.isActive) {
      return { status: 'not_active', message: 'Fallback system was not active' };
    }

    this.isActive = false;
    const wasActive = this.fallbackReason;
    this.fallbackReason = null;

    console.log('✅ CK Fallback System DEACTIVATED - returning to CK Access Module');

    return {
      status: 'ck_access_restored',
      previousReason: wasActive,
      deactivationTime: new Date().toISOString(),
      activationDuration: this._calculateActivationDuration(),
      message: 'CK Access Module restored - fallback deactivated'
    };
  }

  // ==================== FALLBACK SERVICES ====================

  /**
   * Get CK guidance using fallback priming system
   * @param {string} moduleType - Type of guidance needed
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Fallback guidance content
   */
  async getFallbackGuidance(moduleType, context = {}) {
    if (!this.isActive) {
      throw new Error('Fallback system not active - use CK Access Module instead');
    }

    try {
      const startTime = Date.now();

      let guidance;
      switch (moduleType) {
        case 'handoff_templates':
          guidance = this._getFallbackHandoffTemplates(context);
          break;
        case 'validation_protocols':
          guidance = this._getFallbackValidationProtocols(context);
          break;
        case 'task_generation':
          guidance = this._getFallbackTaskGeneration(context);
          break;
        case 'priming':
        default:
          guidance = this._getFallbackPriming(context);
          break;
      }

      const responseTime = Date.now() - startTime;
      this.metrics.successfulFallbacks++;
      this._updateResponseTimeMetrics(responseTime);

      return {
        ...guidance,
        fallbackMetadata: {
          providedBy: 'ck_fallback_system',
          moduleType: moduleType,
          responseTime: responseTime,
          activationReason: this.fallbackReason,
          reliable: true
        }
      };

    } catch (error) {
      this.metrics.failedFallbacks++;
      throw new Error(`Fallback guidance failed: ${error.message}`);
    }
  }

  /**
   * Generate handoff using fallback templates
   * @param {string} taskTitle - Task title
   * @param {Object} taskDetails - Task details
   * @param {Object} options - Generation options
   * @returns {Object} Generated handoff using fallback system
   */
  generateFallbackHandoff(taskTitle, taskDetails, options = {}) {
    if (!this.isActive) {
      throw new Error('Fallback system not active');
    }

    const templateType = options.templateType || 'standard_implementation';
    const template = this.currentPrimingSystem.handoffTemplates[templateType];

    if (!template || !template.available) {
      throw new Error(`Fallback template ${templateType} not available`);
    }

    return {
      title: `Fallback Handoff: ${taskTitle}`,
      template: template.template,
      sections: this._buildFallbackHandoffSections(taskDetails, template, options),
      taskId: taskDetails.id,
      generatedAt: new Date().toISOString(),
      fallbackMetadata: {
        reason: this.fallbackReason,
        templateUsed: templateType,
        reliable: true,
        note: 'Generated using proven fallback system - full functionality maintained'
      }
    };
  }

  /**
   * Validate task using fallback validation protocols
   * @param {Object} task - Task to validate
   * @param {Object} context - Validation context
   * @returns {Object} Validation results using fallback system
   */
  validateTaskWithFallback(task, context = {}) {
    if (!this.isActive) {
      throw new Error('Fallback system not active');
    }

    const validationProtocol = this.currentPrimingSystem.validationProtocols.basic_validation;
    
    if (!validationProtocol.available) {
      throw new Error('Fallback validation protocol not available');
    }

    const validationResults = {
      taskId: task.id,
      validationMethod: 'fallback_basic_protocol',
      results: validationProtocol.criteria.map(criterion => ({
        criterion: criterion,
        status: this._evaluateFallbackCriterion(task, criterion),
        notes: `Validated using fallback system`
      })),
      validatedAt: new Date().toISOString(),
      fallbackMetadata: {
        reason: this.fallbackReason,
        protocolUsed: 'basic_validation',
        reliable: true
      }
    };

    // Calculate overall status
    const passedCriteria = validationResults.results.filter(r => r.status === 'pass').length;
    const totalCriteria = validationResults.results.length;
    
    if (passedCriteria === totalCriteria) {
      validationResults.overallStatus = 'pass';
    } else if (passedCriteria >= totalCriteria * 0.75) {
      validationResults.overallStatus = 'conditional_pass';
    } else {
      validationResults.overallStatus = 'needs_improvement';
    }

    return validationResults;
  }

  // ==================== HEALTH MONITORING ====================

  /**
   * Perform health check on fallback system
   * @returns {Object} Health status report
   */
  performHealthCheck() {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      components: {},
      issues: []
    };

    // Check priming system
    try {
      healthCheck.components.primingSystem = {
        status: 'healthy',
        documentsAvailable: Object.keys(this.currentPrimingSystem.primingDocuments).length,
        lastCheck: new Date().toISOString()
      };
      this.healthStatus.primingSystemHealthy = true;
    } catch (error) {
      healthCheck.components.primingSystem = { status: 'unhealthy', error: error.message };
      healthCheck.issues.push('Priming system inaccessible');
      this.healthStatus.primingSystemHealthy = false;
    }

    // Check templates
    try {
      const availableTemplates = Object.values(this.currentPrimingSystem.handoffTemplates)
        .filter(t => t.available).length;
      
      healthCheck.components.templates = {
        status: 'healthy',
        availableTemplates: availableTemplates,
        totalTemplates: Object.keys(this.currentPrimingSystem.handoffTemplates).length
      };
      this.healthStatus.templatesAccessible = true;
    } catch (error) {
      healthCheck.components.templates = { status: 'unhealthy', error: error.message };
      healthCheck.issues.push('Templates inaccessible');
      this.healthStatus.templatesAccessible = false;
    }

    // Check validation protocols
    try {
      const availableProtocols = Object.values(this.currentPrimingSystem.validationProtocols)
        .filter(p => p.available).length;
      
      healthCheck.components.validation = {
        status: 'healthy',
        availableProtocols: availableProtocols,
        totalProtocols: Object.keys(this.currentPrimingSystem.validationProtocols).length
      };
      this.healthStatus.validationWorking = true;
    } catch (error) {
      healthCheck.components.validation = { status: 'unhealthy', error: error.message };
      healthCheck.issues.push('Validation protocols inaccessible');
      this.healthStatus.validationWorking = false;
    }

    // Determine overall health
    if (healthCheck.issues.length === 0) {
      healthCheck.overall = 'healthy';
      this.metrics.systemReliability = 100;
    } else if (healthCheck.issues.length <= 1) {
      healthCheck.overall = 'degraded';
      this.metrics.systemReliability = 75;
    } else {
      healthCheck.overall = 'unhealthy';
      this.metrics.systemReliability = 25;
    }

    this.healthStatus.lastCheck = healthCheck.timestamp;
    this.metrics.lastHealthCheck = healthCheck.timestamp;

    return healthCheck;
  }

  /**
   * Get comprehensive fallback system metrics
   * @returns {Object} Complete fallback system metrics
   */
  getFallbackMetrics() {
    return {
      status: {
        isActive: this.isActive,
        reason: this.fallbackReason,
        activationCount: this.activationCount,
        lastActivation: this.lastActivation
      },
      performance: {
        ...this.metrics,
        reliability: this.metrics.systemReliability,
        successRate: this._calculateSuccessRate()
      },
      health: this.healthStatus,
      services: {
        primingSystem: this.currentPrimingSystem.primingDocuments ? 'available' : 'unavailable',
        templates: Object.keys(this.currentPrimingSystem.handoffTemplates).length,
        validationProtocols: Object.keys(this.currentPrimingSystem.validationProtocols).length
      }
    };
  }

  // ==================== PRIVATE METHODS ====================

  _getAvailableFallbackServices() {
    return {
      priming: this.healthStatus.primingSystemHealthy,
      handoffGeneration: this.healthStatus.templatesAccessible,
      taskValidation: this.healthStatus.validationWorking,
      metrics: true,
      healthMonitoring: true
    };
  }

  _getFallbackPriming(context) {
    const primingDoc = this.currentPrimingSystem.primingDocuments['CG_Priming_v1'];
    primingDoc.lastAccessed = new Date().toISOString();
    
    return {
      document_id: 'CG_Priming_v1_Fallback',
      title: 'CG Priming - Fallback System',
      content: primingDoc.content,
      tokenSize: primingDoc.tokenSize,
      reliable: true,
      context: context
    };
  }

  _getFallbackHandoffTemplates(context) {
    const templates = Object.entries(this.currentPrimingSystem.handoffTemplates)
      .filter(([_, template]) => template.available)
      .map(([id, template]) => ({
        id: id,
        template: template.template,
        sections: template.sections,
        available: true
      }));

    return {
      document_id: 'Handoff_Templates_Fallback',
      title: 'Handoff Templates - Fallback System',
      templates: templates,
      totalTemplates: templates.length,
      context: context
    };
  }

  _getFallbackValidationProtocols(context) {
    const protocols = Object.entries(this.currentPrimingSystem.validationProtocols)
      .filter(([_, protocol]) => protocol.available)
      .map(([id, protocol]) => ({
        id: id,
        criteria: protocol.criteria,
        checklistItems: protocol.checklistItems,
        available: true
      }));

    return {
      document_id: 'Validation_Protocols_Fallback',
      title: 'Validation Protocols - Fallback System',
      protocols: protocols,
      totalProtocols: protocols.length,
      context: context
    };
  }

  _getFallbackTaskGeneration(context) {
    return {
      document_id: 'Task_Generation_Fallback',
      title: 'Task Generation - Fallback System',
      guidelines: [
        'Use clear, specific task titles',
        'Include comprehensive descriptions',
        'Define success criteria',
        'Specify testing requirements'
      ],
      templates: ['Basic task template', 'Implementation task template'],
      context: context
    };
  }

  _buildFallbackHandoffSections(taskDetails, template, options) {
    const sections = {};

    template.sections.forEach(sectionName => {
      switch (sectionName) {
        case 'Project Context':
          sections.projectContext = {
            phase: options.milestone || 'Current Phase',
            sessionGoal: options.sessionGoal || 'Task Implementation',
            milestone: options.milestone || 'Current Milestone'
          };
          break;
        case 'Task Details':
          sections.taskDetails = {
            taskId: taskDetails.id,
            priority: taskDetails.priority || 'medium',
            dependencies: taskDetails.dependencies || [],
            description: taskDetails.description || 'Task implementation required'
          };
          break;
        case 'Technical Requirements':
          sections.technicalRequirements = {
            deliverables: taskDetails.deliverables || ['Implementation'],
            specifications: ['Follow project standards', 'Include comprehensive testing'],
            note: 'Using fallback system - refer to existing patterns'
          };
          break;
      }
    });

    return sections;
  }

  _evaluateFallbackCriterion(task, criterion) {
    switch (criterion) {
      case 'Task Definition':
        return (task.title && task.description) ? 'pass' : 'needs_improvement';
      case 'Deliverables':
        return (task.deliverables && task.deliverables.length > 0) ? 'pass' : 'needs_improvement';
      case 'Success Criteria':
        return task.successCriteria ? 'pass' : 'needs_improvement';
      default:
        return 'pass'; // Default to pass for basic validation
    }
  }

  _calculateActivationDuration() {
    if (!this.lastActivation) return 0;
    return Date.now() - new Date(this.lastActivation).getTime();
  }

  _updateResponseTimeMetrics(responseTime) {
    const currentAvg = this.metrics.averageFallbackTime;
    const totalResponses = this.metrics.successfulFallbacks;
    
    this.metrics.averageFallbackTime = totalResponses === 1 ? 
      responseTime : 
      ((currentAvg * (totalResponses - 1)) + responseTime) / totalResponses;
  }

  _calculateSuccessRate() {
    const total = this.metrics.successfulFallbacks + this.metrics.failedFallbacks;
    return total > 0 ? (this.metrics.successfulFallbacks / total) * 100 : 100;
  }
}

// Factory function for CK Fallback System
function createCKFallbackSystem(options = {}) {
  return new CKFallbackSystem(options);
}

// Export for ES modules
export { CKFallbackSystem, createCKFallbackSystem };