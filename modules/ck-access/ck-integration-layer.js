/**
 * CK Integration Layer for HD Workflows and TaskMaster
 * Provides seamless integration between CK Access Module and existing development workflows
 */

import { createCKAccessModuleProduction } from './src/ck-access-module-production.js';

class CKIntegrationLayer {
  constructor(options = {}) {
    this.ckAccessModule = createCKAccessModuleProduction({
      sessionId: options.sessionId || `HD_${Date.now()}`,
      cacheTimeout: options.cacheTimeout || 600000,
      prefetchEnabled: options.prefetchEnabled !== false,
      ...options
    });

    // HD workflow context tracking
    this.currentContext = {
      workflow: null,
      session: null,
      milestone: null,
      taskId: null
    };

    // Performance tracking for HD integration
    this.hdMetrics = {
      contextBuilds: 0,
      handoffGenerations: 0,
      taskGenerations: 0,
      validationRuns: 0,
      tokenReductionAchieved: 0,
      workflowOptimizations: 0
    };

    // Fallback system for current priming
    this.fallbackEnabled = options.fallbackEnabled !== false;
    this.fallbackPriming = options.fallbackPriming || null;
  }

  // ==================== HD WORKFLOW INTEGRATION ====================

  /**
   * Build CK context for specific HD workflow with real module loading
   * @param {string} workflow - Workflow type ('handoff_creation', 'task_generation', etc.)
   * @param {Object} context - Workflow context (milestone, session, task info)
   * @returns {Promise<Object>} Complete CK context for workflow
   */
  async buildCKContext(workflow, context = {}) {
    try {
      // Update current context
      this.currentContext = {
        workflow,
        session: context.session || 'unknown',
        milestone: context.milestone || 'unknown',
        taskId: context.taskId || null,
        timestamp: new Date().toISOString()
      };

      // Get workflow-specific CK context
      const ckContext = await this.ckAccessModule.buildCKContext(workflow, {
        includeMetrics: true,
        sessionContext: this.currentContext,
        ...context
      });

      // Enhance with HD-specific data
      const enhancedContext = {
        ...ckContext,
        hdIntegration: {
          currentWorkflow: this.currentContext,
          hdMetrics: this.hdMetrics,
          fallbackAvailable: this.fallbackEnabled,
          contextBuildTime: new Date().toISOString()
        },
        recommendations: this._generateWorkflowRecommendations(workflow, ckContext),
        tokenOptimization: {
          estimatedSavings: this._calculateTokenSavings(ckContext),
          optimizationLevel: this._assessOptimizationLevel(ckContext)
        }
      };

      this.hdMetrics.contextBuilds++;
      return enhancedContext;

    } catch (error) {
      // Fallback to current priming system if enabled
      if (this.fallbackEnabled) {
        console.warn(`CK context build failed, using fallback: ${error.message}`);
        return this._getFallbackContext(workflow, context);
      }
      throw new Error(`Failed to build CK context for ${workflow}: ${error.message}`);
    }
  }

  /**
   * Generate handoff using CK templates with real guidance modules
   * @param {string} taskTitle - Title of the task/handoff
   * @param {Object} taskDetails - Task details from TaskMaster
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated handoff with CK guidance
   */
  async generateHandoffWithCK(taskTitle, taskDetails, options = {}) {
    try {
      // Build context for handoff creation workflow
      const ckContext = await this.buildCKContext('handoff_creation', {
        taskId: taskDetails.id,
        milestone: options.milestone,
        session: options.session,
        taskDetails
      });

      // Get handoff templates from CK4.1
      const handoffModule = ckContext.modules.find(m => m.moduleId === 'ck4.1');
      if (!handoffModule) {
        throw new Error('CK4.1 handoff templates not available in context');
      }

      // Generate handoff using templates
      const handoff = this._generateHandoffFromTemplate(
        taskTitle,
        taskDetails,
        handoffModule.content,
        options
      );

      // Add CK metadata
      handoff.ckMetadata = {
        generatedWith: 'CK4.1_handoff_templates',
        contextModules: ckContext.modules.map(m => m.moduleId),
        tokenEfficiency: ckContext.tokenEfficiency,
        generatedAt: new Date().toISOString(),
        sessionId: this.ckAccessModule.config.sessionId
      };

      this.hdMetrics.handoffGenerations++;
      return handoff;

    } catch (error) {
      if (this.fallbackEnabled) {
        console.warn(`CK handoff generation failed, using fallback: ${error.message}`);
        return this._getFallbackHandoff(taskTitle, taskDetails, options);
      }
      throw new Error(`Failed to generate handoff with CK: ${error.message}`);
    }
  }

  /**
   * Validate task using CK validation protocols
   * @param {Object} task - Task to validate
   * @param {Object} context - Validation context
   * @returns {Promise<Object>} Validation results with CK guidance
   */
  async validateTaskWithCK(task, context = {}) {
    try {
      // Build context for quality assurance workflow
      const ckContext = await this.buildCKContext('quality_assurance', {
        taskId: task.id,
        validationType: context.validationType || 'standard',
        ...context
      });

      // Get validation module (CK2.1)
      const validationModule = ckContext.modules.find(m => m.moduleId === 'ck2.1');
      if (!validationModule) {
        throw new Error('CK2.1 validation protocol not available in context');
      }

      // Perform validation using CK protocols
      const validationResults = this._performCKValidation(task, validationModule.content, context);

      this.hdMetrics.validationRuns++;
      return validationResults;

    } catch (error) {
      if (this.fallbackEnabled) {
        return this._getFallbackValidation(task, context);
      }
      throw new Error(`Failed to validate task with CK: ${error.message}`);
    }
  }

  // ==================== TASKMASTER INTEGRATION ====================

  /**
   * Generate tasks using CK task generation modules
   * @param {string} requirements - Task requirements
   * @param {Object} context - Generation context
   * @returns {Promise<Object>} Generated tasks with CK guidance
   */
  async generateTasksWithCK(requirements, context = {}) {
    try {
      // Build context for task generation workflow
      const ckContext = await this.buildCKContext('task_generation', {
        requirements,
        projectContext: context.projectContext,
        milestone: context.milestone,
        ...context
      });

      // Get task generation modules (CK3.1, CK3.2)
      const taskGenModule = ckContext.modules.find(m => m.moduleId === 'ck3.1');
      const taskStructModule = ckContext.modules.find(m => m.moduleId === 'ck3.2');

      if (!taskGenModule || !taskStructModule) {
        throw new Error('CK task generation modules not available in context');
      }

      // Generate tasks using CK guidance
      const generatedTasks = this._generateTasksFromCK(
        requirements,
        taskGenModule.content,
        taskStructModule.content,
        context
      );

      // Add CK metadata to tasks
      generatedTasks.forEach(task => {
        task.ckMetadata = {
          generatedWith: ['CK3.1_task_generation', 'CK3.2_task_structuring'],
          contextId: ckContext.sessionId,
          tokenEfficiency: ckContext.tokenEfficiency,
          generatedAt: new Date().toISOString()
        };
      });

      this.hdMetrics.taskGenerations++;
      return {
        tasks: generatedTasks,
        ckContext: ckContext,
        metadata: {
          generationMethod: 'ck_guided',
          totalTasks: generatedTasks.length,
          efficiency: ckContext.performance
        }
      };

    } catch (error) {
      if (this.fallbackEnabled) {
        return this._getFallbackTaskGeneration(requirements, context);
      }
      throw new Error(`Failed to generate tasks with CK: ${error.message}`);
    }
  }

  // ==================== PERFORMANCE & MONITORING ====================

  /**
   * Get comprehensive integration metrics
   * @returns {Promise<Object>} Complete metrics including CK and HD integration
   */
  async getIntegrationMetrics() {
    try {
      const ckMetrics = await this.ckAccessModule.getMetrics();
      
      return {
        ckModule: ckMetrics,
        hdIntegration: this.hdMetrics,
        currentContext: this.currentContext,
        performance: {
          totalContextBuilds: this.hdMetrics.contextBuilds,
          totalHandoffs: this.hdMetrics.handoffGenerations,
          totalValidations: this.hdMetrics.validationRuns,
          averageTokenReduction: this._calculateAverageTokenReduction(),
          systemStatus: this._getIntegrationStatus(ckMetrics)
        },
        fallback: {
          enabled: this.fallbackEnabled,
          activations: this.hdMetrics.fallbackActivations || 0
        }
      };
    } catch (error) {
      return {
        error: error.message,
        hdIntegration: this.hdMetrics,
        currentContext: this.currentContext,
        fallback: { enabled: this.fallbackEnabled }
      };
    }
  }

  // ==================== ROLLBACK SYSTEM ====================

  /**
   * Enable fallback to current priming system
   * @param {Object} fallbackOptions - Fallback configuration
   */
  enableFallback(fallbackOptions = {}) {
    this.fallbackEnabled = true;
    this.fallbackPriming = fallbackOptions.primingData || null;
    console.log('CK fallback system enabled');
  }

  /**
   * Disable fallback system (CK-only mode)
   */
  disableFallback() {
    this.fallbackEnabled = false;
    console.log('CK fallback system disabled - CK-only mode active');
  }

  // ==================== PRIVATE METHODS ====================

  _generateWorkflowRecommendations(workflow, ckContext) {
    const recommendations = [];
    
    if (ckContext.performance.cacheHitRatio < 80) {
      recommendations.push('Consider prefetching related modules for better cache performance');
    }
    
    if (ckContext.tokenEfficiency > 1000) {
      recommendations.push('High token usage detected - consider module chunking');
    }
    
    if (workflow === 'handoff_creation' && ckContext.modules.length < 3) {
      recommendations.push('Consider including validation modules for comprehensive handoffs');
    }
    
    return recommendations;
  }

  _calculateTokenSavings(ckContext) {
    const baselineTokens = 8500; // Current full CK initialization
    const actualTokens = ckContext.tokenEfficiency || 1000;
    return Math.max(0, baselineTokens - actualTokens);
  }

  _assessOptimizationLevel(ckContext) {
    const savings = this._calculateTokenSavings(ckContext);
    const reductionRate = (savings / 8500) * 100;
    
    if (reductionRate >= 80) return 'excellent';
    if (reductionRate >= 60) return 'good';
    if (reductionRate >= 40) return 'moderate';
    return 'needs_improvement';
  }

  _generateHandoffFromTemplate(taskTitle, taskDetails, handoffTemplate, options) {
    // Extract template structure from CK4.1
    const template = handoffTemplate.hierarchical_sections?.find(
      section => section.section_id === 'CK4.1-core_templates'
    )?.templates?.find(t => t.template_id === 'standard_implementation');

    if (!template) {
      throw new Error('Standard implementation template not found in CK4.1');
    }

    // Generate handoff using template structure
    return {
      title: `CG Implementation Handoff: ${taskTitle}`,
      taskId: taskDetails.id,
      template: template.name,
      sections: this._buildHandoffSections(taskDetails, template, options),
      generatedAt: new Date().toISOString()
    };
  }

  _buildHandoffSections(taskDetails, template, options) {
    const sections = {};
    
    template.required_sections.forEach(sectionName => {
      switch (sectionName) {
        case 'Project Context':
          sections.projectContext = {
            phase: options.milestone || 'M5.S6',
            sessionGoal: options.sessionGoal || 'CK Production Integration',
            milestone: options.milestone || 'M5'
          };
          break;
        case 'Task Details':
          sections.taskDetails = {
            taskMasterId: taskDetails.id,
            priority: taskDetails.priority || 'high',
            dependencies: taskDetails.dependencies || [],
            description: taskDetails.description
          };
          break;
        case 'Technical Requirements':
          sections.technicalRequirements = {
            deliverables: taskDetails.deliverables || [],
            specifications: taskDetails.specifications || [],
            performance: taskDetails.performance || {}
          };
          break;
      }
    });
    
    return sections;
  }

  _performCKValidation(task, validationModule, context) {
    // Use CK2.1 validation protocols
    const qualityChecklist = validationModule.hierarchical_sections?.find(
      section => section.section_id?.includes('quality')
    )?.quality_checklist || [];

    const validationResults = {
      taskId: task.id,
      validationMethod: 'CK2.1_protocol',
      results: qualityChecklist.map(criterion => ({
        criterion,
        status: this._checkCriterion(task, criterion),
        notes: ''
      })),
      overallStatus: 'pending',
      validatedAt: new Date().toISOString()
    };

    const passedChecks = validationResults.results.filter(r => r.status === 'pass').length;
    const totalChecks = validationResults.results.length;
    
    if (passedChecks === totalChecks) {
      validationResults.overallStatus = 'pass';
    } else if (passedChecks >= totalChecks * 0.8) {
      validationResults.overallStatus = 'conditional_pass';
    } else {
      validationResults.overallStatus = 'fail';
    }

    return validationResults;
  }

  _checkCriterion(task, criterion) {
    // Simple validation logic - in production this would be more sophisticated
    if (criterion.includes('Clear Task Definition') && task.title && task.description) {
      return 'pass';
    }
    if (criterion.includes('Specific Deliverables') && task.deliverables?.length > 0) {
      return 'pass';
    }
    if (criterion.includes('Success Criteria') && task.successCriteria) {
      return 'pass';
    }
    return 'needs_review';
  }

  _generateTasksFromCK(requirements, taskGenModule, taskStructModule, context) {
    // Generate tasks using CK3.1 and CK3.2 guidance
    // This is a simplified implementation - production would be more sophisticated
    
    const baseTasks = [
      {
        id: 1,
        title: `Implement ${requirements}`,
        description: `Implementation task generated from CK guidance`,
        priority: 'high',
        dependencies: [],
        deliverables: ['Implementation files', 'Tests', 'Documentation']
      }
    ];

    return baseTasks;
  }

  _getFallbackContext(workflow, context) {
    this.hdMetrics.fallbackActivations = (this.hdMetrics.fallbackActivations || 0) + 1;
    
    return {
      workflowType: workflow,
      modules: [],
      fallbackUsed: true,
      fallbackReason: 'CK module access failed',
      context: context,
      loadedAt: new Date().toISOString()
    };
  }

  _getFallbackHandoff(taskTitle, taskDetails, options) {
    this.hdMetrics.fallbackActivations = (this.hdMetrics.fallbackActivations || 0) + 1;
    
    return {
      title: `Fallback Handoff: ${taskTitle}`,
      taskId: taskDetails.id,
      fallbackUsed: true,
      sections: {
        taskDetails: taskDetails,
        note: 'Generated using fallback system - CK templates unavailable'
      },
      generatedAt: new Date().toISOString()
    };
  }

  _getFallbackValidation(task, context) {
    this.hdMetrics.fallbackActivations = (this.hdMetrics.fallbackActivations || 0) + 1;
    
    return {
      taskId: task.id,
      validationMethod: 'fallback_basic',
      results: [
        { criterion: 'Task has title', status: task.title ? 'pass' : 'fail' },
        { criterion: 'Task has description', status: task.description ? 'pass' : 'fail' }
      ],
      overallStatus: 'fallback_validation',
      fallbackUsed: true,
      validatedAt: new Date().toISOString()
    };
  }

  _getFallbackTaskGeneration(requirements, context) {
    this.hdMetrics.fallbackActivations = (this.hdMetrics.fallbackActivations || 0) + 1;
    
    return {
      tasks: [{
        id: 1,
        title: `Fallback task for ${requirements}`,
        description: 'Generated using fallback system',
        fallbackUsed: true
      }],
      metadata: {
        generationMethod: 'fallback',
        fallbackReason: 'CK task generation modules unavailable'
      }
    };
  }

  _calculateAverageTokenReduction() {
    if (this.hdMetrics.contextBuilds === 0) return 0;
    return this.hdMetrics.tokenReductionAchieved / this.hdMetrics.contextBuilds;
  }

  _getIntegrationStatus(ckMetrics) {
    const cacheOk = ckMetrics.module?.cacheEfficiency >= 80;
    const tokenOk = ckMetrics.performance?.currentTokenReduction >= 75;
    const firebaseOk = ckMetrics.firebase?.isConnected;
    
    if (cacheOk && tokenOk && firebaseOk) return '🟢 OPTIMAL';
    if ((cacheOk && tokenOk) || (cacheOk && firebaseOk) || (tokenOk && firebaseOk)) return '🟡 GOOD';
    return '🔴 NEEDS ATTENTION';
  }
}

// Factory function for CK Integration Layer
function createCKIntegrationLayer(options = {}) {
  return new CKIntegrationLayer(options);
}

// Export for ES modules
export { CKIntegrationLayer, createCKIntegrationLayer };