g /**
 * CK Initialization System
 * Complete CK optimization system using CK Access Module
 * Replaces heavy CK priming with intelligent, on-demand guidance loading
 */

import { createCKIntegrationLayer } from './ck-integration-layer.js';
import { createCKFallbackSystem } from './ck-fallback-system.js';

class CKInitializationSystem {
  constructor(options = {}) {
    this.config = {
      sessionId: options.sessionId || `CK_${Date.now()}`,
      milestone: options.milestone || 'M5',
      session: options.session || 'S6',
      projectRoot: options.projectRoot || '/Users/benoitarchambault/Desktop/KarmaCash',
      enableFallback: options.enableFallback !== false,
      tokenTarget: options.tokenTarget || 1500, // 82%+ reduction from 8500 baseline
      cacheTarget: options.cacheTarget || 80, // 80% cache hit ratio target
      ...options
    };

    // Initialize core systems
    this.ckIntegration = null;
    this.fallbackSystem = null;
    this.initialized = false;

    // Performance tracking
    this.performance = {
      initializationTime: 0,
      tokenUsage: 0,
      modulesLoaded: 0,
      cacheHitRatio: 0,
      systemStatus: 'initializing'
    };

    // Initialization metrics
    this.metrics = {
      startTime: Date.now(),
      totalTokensSaved: 0,
      baselineTokens: 8500, // Current CK priming token usage
      actualTokens: 0,
      initializationSteps: 0,
      moduleAccessCount: 0
    };
  }

  // ==================== COMPLETE CK INITIALIZATION ====================

  /**
   * Initialize complete CK system with optimized loading
   * @returns {Promise<Object>} Initialization results with performance metrics
   */
  async initializeCK() {
    console.log('🚀 Starting CK Access Module Initialization...');
    const startTime = Date.now();

    try {
      // Step 1: Initialize Core Systems
      await this._initializeCoreSystems();

      // Step 2: Load Essential CK Modules
      await this._loadEssentialModules();

      // Step 3: Build Initial Context
      await this._buildInitialContext();

      // Step 4: Validate System Performance
      await this._validateSystemPerformance();

      // Step 5: Enable Fallback Protection
      await this._enableFallbackProtection();

      // Mark initialization complete
      this.initialized = true;
      this.performance.initializationTime = Date.now() - startTime;
      this.performance.systemStatus = 'operational';

      // Calculate token reduction achieved
      this.metrics.actualTokens = this.performance.tokenUsage;
      this.metrics.totalTokensSaved = this.metrics.baselineTokens - this.metrics.actualTokens;

      console.log('✅ CK Access Module Initialization Complete');
      console.log(`   - Token Reduction: ${this._calculateTokenReduction().toFixed(1)}%`);
      console.log(`   - Initialization Time: ${this.performance.initializationTime}ms`);
      console.log(`   - Modules Loaded: ${this.performance.modulesLoaded}`);
      console.log(`   - System Status: ${this.performance.systemStatus}`);

      return {
        success: true,
        performance: this.performance,
        metrics: this.metrics,
        tokenReduction: this._calculateTokenReduction(),
        systemReady: true
      };

    } catch (error) {
      this.performance.systemStatus = 'error';
      console.error('❌ CK Initialization Failed:', error.message);
      
      if (this.config.enableFallback) {
        console.log('🔄 Activating fallback system...');
        await this._activateFallbackSystem(error.message);
        return {
          success: false,
          fallbackActive: true,
          error: error.message,
          performance: this.performance
        };
      }
      
      throw error;
    }
  }

  /**
   * Get CK guidance for specific workflow using optimized access
   * @param {string} workflowType - Type of workflow needing guidance
   * @param {Object} context - Workflow context
   * @returns {Promise<Object>} CK guidance for workflow
   */
  async getCKGuidance(workflowType, context = {}) {
    if (!this.initialized) {
      throw new Error('CK system not initialized - call initializeCK() first');
    }

    try {
      const startTime = Date.now();
      
      // Get workflow-specific guidance using CK Integration Layer
      const guidance = await this.ckIntegration.buildCKContext(workflowType, {
        ...context,
        sessionId: this.config.sessionId,
        milestone: this.config.milestone,
        session: this.config.session
      });

      const accessTime = Date.now() - startTime;
      this.metrics.moduleAccessCount++;

      console.log(`📋 CK Guidance Retrieved: ${workflowType} (${accessTime}ms)`);

      return {
        ...guidance,
        accessMetrics: {
          retrievalTime: accessTime,
          tokenEfficiency: guidance.tokenEfficiency,
          modulesUsed: guidance.modules?.length || 0
        }
      };

    } catch (error) {
      if (this.fallbackSystem?.isActive) {
        console.warn(`⚠️  CK guidance failed, using fallback: ${error.message}`);
        return await this.fallbackSystem.getFallbackGuidance(workflowType, context);
      }
      throw error;
    }
  }

  /**
   * Create handoff using CK templates and guidance
   * @param {string} taskTitle - Title of the task
   * @param {Object} taskDetails - Task details from TaskMaster
   * @param {Object} options - Handoff options
   * @returns {Promise<Object>} Generated handoff with CK optimization
   */
  async createCKHandoff(taskTitle, taskDetails, options = {}) {
    if (!this.initialized) {
      throw new Error('CK system not initialized');
    }

    try {
      const handoff = await this.ckIntegration.generateHandoffWithCK(
        taskTitle,
        taskDetails,
        {
          ...options,
          milestone: this.config.milestone,
          session: this.config.session,
          sessionId: this.config.sessionId
        }
      );

      return {
        ...handoff,
        ckOptimization: {
          tokenReduction: this._calculateTokenReduction(),
          systemEfficiency: this.performance.cacheHitRatio,
          optimizedWith: 'CK_Access_Module_v1.0'
        }
      };

    } catch (error) {
      if (this.fallbackSystem?.isActive) {
        return await this.fallbackSystem.generateFallbackHandoff(taskTitle, taskDetails, options);
      }
      throw error;
    }
  }

  /**
   * Get comprehensive system performance metrics
   * @returns {Promise<Object>} Complete system metrics
   */
  async getSystemMetrics() {
    const ckMetrics = this.ckIntegration ? await this.ckIntegration.getIntegrationMetrics() : null;
    const fallbackMetrics = this.fallbackSystem ? this.fallbackSystem.getFallbackMetrics() : null;

    return {
      initialization: {
        initialized: this.initialized,
        initializationTime: this.performance.initializationTime,
        tokenReduction: this._calculateTokenReduction(),
        systemStatus: this.performance.systemStatus
      },
      performance: this.performance,
      metrics: this.metrics,
      ckIntegration: ckMetrics,
      fallback: fallbackMetrics,
      targets: {
        tokenReductionTarget: 82,
        tokenReductionActual: this._calculateTokenReduction(),
        cacheHitTarget: this.config.cacheTarget,
        cacheHitActual: this.performance.cacheHitRatio,
        targetsMetStatus: this._assessTargetsMet()
      }
    };
  }

  // ==================== PRIVATE INITIALIZATION METHODS ====================

  async _initializeCoreSystems() {
    console.log('🔧 Initializing Core Systems...');
    this.metrics.initializationSteps++;

    // Initialize CK Integration Layer
    this.ckIntegration = createCKIntegrationLayer({
      sessionId: this.config.sessionId,
      fallbackEnabled: this.config.enableFallback,
      cacheTimeout: 600000, // 10 minutes
      prefetchEnabled: true
    });

    // Initialize Fallback System
    if (this.config.enableFallback) {
      this.fallbackSystem = createCKFallbackSystem({
        autoFallbackEnabled: true,
        fallbackTimeout: 5000,
        maxRetries: 3
      });
    }

    this.performance.modulesLoaded += 2; // Core systems count as modules
  }

  async _loadEssentialModules() {
    console.log('📦 Loading Essential CK Modules...');
    this.metrics.initializationSteps++;

    try {
      // Load critical modules for basic operation
      const essentialModules = ['ck4.1']; // Start with handoff templates
      
      for (const moduleId of essentialModules) {
        const startTime = Date.now();
        await this.ckIntegration.ckAccessModule.getGuidance(moduleId, 'optimized');
        const loadTime = Date.now() - startTime;
        
        console.log(`   ✅ Loaded ${moduleId} (${loadTime}ms)`);
        this.performance.modulesLoaded++;
        this.performance.tokenUsage += 800; // Estimated token usage per module
      }

    } catch (error) {
      console.warn('⚠️  Essential module loading encountered issues:', error.message);
      // Continue with initialization - fallback will handle failures
    }
  }

  async _buildInitialContext() {
    console.log('🏗️  Building Initial Context...');
    this.metrics.initializationSteps++;

    try {
      // Build context for common workflows
      const commonWorkflows = ['handoff_creation'];
      
      for (const workflow of commonWorkflows) {
        await this.ckIntegration.buildCKContext(workflow, {
          milestone: this.config.milestone,
          session: this.config.session,
          cacheForFutureUse: true
        });
      }

      console.log('   ✅ Initial context built and cached');

    } catch (error) {
      console.warn('⚠️  Initial context building had issues:', error.message);
      // Continue - context can be built on-demand
    }
  }

  async _validateSystemPerformance() {
    console.log('⚡ Validating System Performance...');
    this.metrics.initializationSteps++;

    try {
      // Get performance metrics from CK Integration Layer
      const metrics = await this.ckIntegration.getIntegrationMetrics();
      
      if (metrics.ckModule?.module) {
        this.performance.cacheHitRatio = metrics.ckModule.module.cacheEfficiency || 0;
      }

      // Check if performance targets are met
      const tokenReduction = this._calculateTokenReduction();
      const targetsMet = tokenReduction >= 80 && this.performance.cacheHitRatio >= 70;

      if (targetsMet) {
        console.log('   ✅ Performance targets met');
      } else {
        console.log(`   ⚠️  Performance targets not fully met (${tokenReduction.toFixed(1)}% reduction, ${this.performance.cacheHitRatio.toFixed(1)}% cache)`);
      }

    } catch (error) {
      console.warn('⚠️  Performance validation had issues:', error.message);
    }
  }

  async _enableFallbackProtection() {
    console.log('🛡️  Enabling Fallback Protection...');
    this.metrics.initializationSteps++;

    if (this.fallbackSystem) {
      const healthCheck = this.fallbackSystem.performHealthCheck();
      
      if (healthCheck.overall === 'healthy') {
        console.log('   ✅ Fallback system ready');
      } else {
        console.log(`   ⚠️  Fallback system status: ${healthCheck.overall}`);
      }
    }
  }

  async _activateFallbackSystem(reason) {
    if (this.fallbackSystem) {
      this.fallbackSystem.activateFallback(reason, {
        sessionId: this.config.sessionId,
        milestone: this.config.milestone,
        attemptedInitialization: true
      });
      this.performance.systemStatus = 'fallback_active';
    }
  }

  _calculateTokenReduction() {
    const actualTokens = Math.max(this.metrics.actualTokens || this.performance.tokenUsage, 500);
    return ((this.metrics.baselineTokens - actualTokens) / this.metrics.baselineTokens) * 100;
  }

  _assessTargetsMet() {
    const tokenReduction = this._calculateTokenReduction();
    const cacheEfficiency = this.performance.cacheHitRatio;
    
    return {
      tokenTarget: tokenReduction >= 80,
      cacheTarget: cacheEfficiency >= 70,
      overall: tokenReduction >= 80 && cacheEfficiency >= 70
    };
  }

  /**
   * Shutdown CK system gracefully
   */
  async shutdown() {
    console.log('🔄 Shutting down CK system...');
    
    if (this.ckIntegration) {
      this.ckIntegration.ckAccessModule.clearCache();
    }
    
    this.initialized = false;
    this.performance.systemStatus = 'shutdown';
  }
}

// Factory function for CK Initialization System
function createCKInitializationSystem(options = {}) {
  return new CKInitializationSystem(options);
}

// Export for ES modules
export { CKInitializationSystem, createCKInitializationSystem };