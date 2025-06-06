/**
 * TaskMaster-CK Bridge Module
 * Provides seamless integration between TaskMaster AI and CK Access Module
 * Enables on-demand CK guidance access within TaskMaster workflows
 */

import { createCKIntegrationLayer } from './ck-integration-layer.js';

class TaskMasterCKBridge {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.ckIntegration = createCKIntegrationLayer({
      sessionId: `TaskMaster_${Date.now()}`,
      fallbackEnabled: true,
      ...options
    });

    // TaskMaster integration state
    this.taskMasterState = {
      currentTask: null,
      activeWorkflow: null,
      sessionContext: null,
      lastCKAccess: null
    };

    // CK-enhanced TaskMaster metrics
    this.enhancedMetrics = {
      ckGuidedTasks: 0,
      handoffsWithCK: 0,
      validationsWithCK: 0,
      tokenReductionTotal: 0,
      avgPerformanceGain: 0
    };
  }

  // ==================== TASKMASTER INTEGRATION METHODS ====================

  /**
   * Enhance TaskMaster task with CK guidance
   * @param {string|number} taskId - TaskMaster task ID
   * @param {Object} options - Enhancement options
   * @returns {Promise<Object>} Enhanced task with CK guidance
   */
  async enhanceTaskWithCK(taskId, options = {}) {
    try {
      // Get task from TaskMaster (simulated call)
      const task = await this._getTaskMasterTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found in TaskMaster`);
      }

      // Determine workflow type based on task characteristics
      const workflowType = this._determineWorkflowType(task);
      
      // Build CK context for the task
      const ckContext = await this.ckIntegration.buildCKContext(workflowType, {
        taskId: task.id,
        milestone: options.milestone || this._extractMilestone(task),
        session: options.session || this._extractSession(task),
        taskDetails: task
      });

      // Enhance task with CK guidance
      const enhancedTask = {
        ...task,
        ckEnhancement: {
          workflowType,
          guidanceModules: ckContext.modules.map(m => m.moduleId),
          contextId: ckContext.sessionId,
          recommendations: this._generateTaskRecommendations(task, ckContext),
          performanceBoost: this._calculatePerformanceBoost(ckContext),
          enhancedAt: new Date().toISOString()
        },
        ckGuidance: {
          available: true,
          modules: ckContext.modules,
          tokenEfficiency: ckContext.tokenEfficiency,
          cachePerformance: ckContext.performance
        }
      };

      this.enhancedMetrics.ckGuidedTasks++;
      this.taskMasterState.currentTask = enhancedTask;
      this.taskMasterState.lastCKAccess = new Date().toISOString();

      return enhancedTask;

    } catch (error) {
      console.warn(`Failed to enhance task ${taskId} with CK:`, error.message);
      // Return original task without enhancement
      const task = await this._getTaskMasterTask(taskId);
      return {
        ...task,
        ckEnhancement: {
          available: false,
          error: error.message,
          fallbackUsed: true
        }
      };
    }
  }

  /**
   * Generate handoff for TaskMaster task using CK templates
   * @param {string|number} taskId - TaskMaster task ID
   * @param {Object} handoffOptions - Handoff generation options
   * @returns {Promise<Object>} Generated handoff with CK templates
   */
  async generateTaskHandoffWithCK(taskId, handoffOptions = {}) {
    try {
      const task = await this._getTaskMasterTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Generate handoff using CK integration
      const handoff = await this.ckIntegration.generateHandoffWithCK(
        task.title,
        task,
        {
          milestone: handoffOptions.milestone || this._extractMilestone(task),
          session: handoffOptions.session || this._extractSession(task),
          sessionGoal: handoffOptions.sessionGoal,
          ...handoffOptions
        }
      );

      // Add TaskMaster-specific metadata
      handoff.taskMasterIntegration = {
        sourceTaskId: taskId,
        taskStatus: task.status,
        priority: task.priority,
        dependencies: task.dependencies,
        subtasks: task.subtasks || [],
        generatedFor: 'CG_Implementation',
        workflow: 'TaskMaster_to_CG_handoff'
      };

      this.enhancedMetrics.handoffsWithCK++;
      return handoff;

    } catch (error) {
      console.warn(`Failed to generate handoff for task ${taskId}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate TaskMaster task using CK validation protocols
   * @param {string|number} taskId - TaskMaster task ID
   * @param {Object} validationOptions - Validation options
   * @returns {Promise<Object>} Validation results with CK protocols
   */
  async validateTaskWithCK(taskId, validationOptions = {}) {
    try {
      const task = await this._getTaskMasterTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Perform CK-guided validation
      const validation = await this.ckIntegration.validateTaskWithCK(task, {
        validationType: validationOptions.type || 'comprehensive',
        includeSubtasks: validationOptions.includeSubtasks !== false,
        ...validationOptions
      });

      // Add TaskMaster-specific validation criteria
      validation.taskMasterSpecific = {
        taskIdValid: !!task.id,
        dependenciesResolved: this._checkDependencies(task),
        statusAppropriate: this._checkTaskStatus(task),
        prioritySet: !!task.priority,
        subtasksStructured: this._checkSubtaskStructure(task)
      };

      // Calculate overall TaskMaster readiness score
      const tmCriteria = Object.values(validation.taskMasterSpecific);
      const tmScore = tmCriteria.filter(Boolean).length / tmCriteria.length;
      
      validation.taskMasterReadiness = {
        score: tmScore,
        percentage: Math.round(tmScore * 100),
        status: tmScore >= 0.8 ? 'ready' : tmScore >= 0.6 ? 'needs_improvement' : 'not_ready'
      };

      this.enhancedMetrics.validationsWithCK++;
      return validation;

    } catch (error) {
      console.warn(`Failed to validate task ${taskId} with CK:`, error.message);
      throw error;
    }
  }

  /**
   * Update TaskMaster task status with CK performance tracking
   * @param {string|number} taskId - TaskMaster task ID
   * @param {string} status - New status
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result with CK metrics
   */
  async updateTaskStatusWithCK(taskId, status, options = {}) {
    try {
      // Update task status in TaskMaster (simulated)
      const updateResult = await this._updateTaskMasterStatus(taskId, status, options);
      
      // Track CK performance impact
      if (this.taskMasterState.currentTask?.id === taskId) {
        const ckMetrics = await this.ckIntegration.getIntegrationMetrics();
        updateResult.ckPerformanceImpact = {
          tokenReduction: ckMetrics.performance?.averageTokenReduction || 0,
          cacheEfficiency: ckMetrics.ckModule?.module?.cacheEfficiency || 0,
          workflowOptimization: this.enhancedMetrics.ckGuidedTasks > 0
        };
      }

      return updateResult;

    } catch (error) {
      console.warn(`Failed to update task ${taskId} status:`, error.message);
      throw error;
    }
  }

  /**
   * Get CK-enhanced TaskMaster metrics
   * @returns {Promise<Object>} Comprehensive metrics including CK integration
   */
  async getEnhancedTaskMasterMetrics() {
    try {
      const ckMetrics = await this.ckIntegration.getIntegrationMetrics();
      
      return {
        taskMaster: {
          ...this.enhancedMetrics,
          currentTask: this.taskMasterState.currentTask?.id,
          activeWorkflow: this.taskMasterState.activeWorkflow,
          lastCKAccess: this.taskMasterState.lastCKAccess
        },
        ckIntegration: ckMetrics,
        performance: {
          ckAdoptionRate: this._calculateCKAdoptionRate(),
          averageTokenReduction: this._calculateAverageTokenReduction(),
          workflowEfficiencyGain: this._calculateWorkflowEfficiency(),
          systemStatus: this._getOverallSystemStatus(ckMetrics)
        }
      };

    } catch (error) {
      return {
        error: error.message,
        taskMaster: this.enhancedMetrics,
        fallbackActive: true
      };
    }
  }

  // ==================== WORKFLOW AUTOMATION ====================

  /**
   * Auto-enhance next TaskMaster task with CK guidance
   * @param {Object} options - Auto-enhancement options
   * @returns {Promise<Object>} Next task with CK enhancement
   */
  async autoEnhanceNextTask(options = {}) {
    try {
      // Get next task from TaskMaster (simulated)
      const nextTask = await this._getNextTaskMasterTask();
      if (!nextTask) {
        return { message: 'No pending tasks found' };
      }

      // Auto-enhance with CK
      const enhancedTask = await this.enhanceTaskWithCK(nextTask.id, options);
      
      this.taskMasterState.activeWorkflow = 'auto_enhancement';
      return enhancedTask;

    } catch (error) {
      console.warn('Auto-enhancement failed:', error.message);
      return { error: error.message, fallbackUsed: true };
    }
  }

  // ==================== PRIVATE METHODS ====================

  async _getTaskMasterTask(taskId) {
    // Simulate TaskMaster API call
    // In production, this would use actual TaskMaster MCP tools
    return {
      id: taskId,
      title: `Task ${taskId}`,
      description: `Implementation task for ID ${taskId}`,
      status: 'pending',
      priority: 'high',
      dependencies: [],
      subtasks: [],
      details: 'Task details from TaskMaster',
      testStrategy: 'Standard testing approach'
    };
  }

  async _updateTaskMasterStatus(taskId, status, options) {
    // Simulate TaskMaster status update
    // In production, this would use mcp__taskmaster-ai__set_task_status
    return {
      taskId,
      oldStatus: 'pending',
      newStatus: status,
      updatedAt: new Date().toISOString(),
      success: true
    };
  }

  async _getNextTaskMasterTask() {
    // Simulate getting next task
    // In production, this would use mcp__taskmaster-ai__next_task
    return {
      id: Date.now(),
      title: 'Next Pending Task',
      description: 'Auto-selected next task for CK enhancement',
      status: 'pending',
      priority: 'medium'
    };
  }

  _determineWorkflowType(task) {
    // Determine workflow based on task characteristics
    if (task.title?.toLowerCase().includes('handoff') || task.description?.toLowerCase().includes('handoff')) {
      return 'handoff_creation';
    }
    if (task.title?.toLowerCase().includes('validation') || task.title?.toLowerCase().includes('review')) {
      return 'quality_assurance';
    }
    if (task.title?.toLowerCase().includes('task') || task.title?.toLowerCase().includes('generate')) {
      return 'task_generation';
    }
    return 'handoff_creation'; // Default workflow
  }

  _extractMilestone(task) {
    // Extract milestone from task context
    const milestoneMatch = task.title?.match(/M(\d+)/i) || task.description?.match(/M(\d+)/i);
    return milestoneMatch ? `M${milestoneMatch[1]}` : 'M5';
  }

  _extractSession(task) {
    // Extract session from task context
    const sessionMatch = task.title?.match(/S(\d+)/i) || task.description?.match(/S(\d+)/i);
    return sessionMatch ? `S${sessionMatch[1]}` : 'S6';
  }

  _generateTaskRecommendations(task, ckContext) {
    const recommendations = [];
    
    if (ckContext.modules.length > 3) {
      recommendations.push('Consider chunking implementation to reduce complexity');
    }
    
    if (task.dependencies?.length > 2) {
      recommendations.push('Review task dependencies for optimization opportunities');
    }
    
    if (!task.testStrategy) {
      recommendations.push('Add specific testing strategy for better validation');
    }
    
    return recommendations;
  }

  _calculatePerformanceBoost(ckContext) {
    const tokenSavings = ckContext.tokenEfficiency ? (8500 - ckContext.tokenEfficiency) : 0;
    const cacheBoost = ckContext.performance?.cacheHitRatio || 0;
    
    return {
      tokenReduction: Math.max(0, (tokenSavings / 8500) * 100),
      cacheEfficiency: cacheBoost,
      overallBoost: (tokenSavings > 0 && cacheBoost > 50) ? 'significant' : 'moderate'
    };
  }

  _checkDependencies(task) {
    return !task.dependencies || task.dependencies.length === 0 || 
           task.dependencies.every(dep => typeof dep === 'string' || typeof dep === 'number');
  }

  _checkTaskStatus(task) {
    const validStatuses = ['pending', 'in-progress', 'review', 'done', 'cancelled'];
    return validStatuses.includes(task.status);
  }

  _checkSubtaskStructure(task) {
    return !task.subtasks || Array.isArray(task.subtasks);
  }

  _calculateCKAdoptionRate() {
    const totalTasks = this.enhancedMetrics.ckGuidedTasks + 10; // Simulate total tasks
    return (this.enhancedMetrics.ckGuidedTasks / totalTasks) * 100;
  }

  _calculateAverageTokenReduction() {
    return this.enhancedMetrics.ckGuidedTasks > 0 ? 
           this.enhancedMetrics.tokenReductionTotal / this.enhancedMetrics.ckGuidedTasks : 0;
  }

  _calculateWorkflowEfficiency() {
    const ckTasks = this.enhancedMetrics.ckGuidedTasks;
    const handoffs = this.enhancedMetrics.handoffsWithCK;
    const validations = this.enhancedMetrics.validationsWithCK;
    
    return ckTasks > 0 ? ((handoffs + validations) / ckTasks) * 100 : 0;
  }

  _getOverallSystemStatus(ckMetrics) {
    const ckStatus = ckMetrics.performance?.systemStatus || '🔴 UNKNOWN';
    const tmIntegration = this.enhancedMetrics.ckGuidedTasks > 0 ? '🟢' : '🟡';
    
    if (ckStatus.includes('🟢') && tmIntegration === '🟢') return '🟢 OPTIMAL';
    if (ckStatus.includes('🟡') || tmIntegration === '🟡') return '🟡 GOOD';
    return '🔴 NEEDS ATTENTION';
  }
}

// Factory function for TaskMaster-CK Bridge
function createTaskMasterCKBridge(projectRoot, options = {}) {
  return new TaskMasterCKBridge(projectRoot, options);
}

// Export for ES modules
export { TaskMasterCKBridge, createTaskMasterCKBridge };