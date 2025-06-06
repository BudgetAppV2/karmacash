/**
 * Complete CK System Validator
 * Validates real token reduction and performance with actual Firebase data
 * Tests complete CK optimization system end-to-end
 */

import { createCKInitializationSystem } from './ck-initialization-system.js';

class CompleteCKSystemValidator {
  constructor() {
    this.ckSystem = null;
    this.validationResults = {
      tokenReduction: {
        baseline: 8500,
        actual: 0,
        reduction: 0,
        targetMet: false
      },
      performance: {
        initializationTime: 0,
        guidanceRetrievalTime: 0,
        handoffGenerationTime: 0,
        cacheHitRatio: 0,
        targetsMet: false
      },
      functionality: {
        initializationSuccessful: false,
        guidanceAccessWorking: false,
        handoffGenerationWorking: false,
        fallbackSystemWorking: false,
        hdWorkflowCompatible: false
      },
      overall: {
        productionReady: false,
        recommendedDeployment: false,
        issuesFound: [],
        achievements: []
      }
    };
  }

  async runCompleteValidation() {
    console.log('🔍 Starting Complete CK System Validation...\n');

    try {
      // Phase 1: System Initialization Validation
      await this.validateSystemInitialization();

      // Phase 2: Real Token Reduction Validation
      await this.validateTokenReduction();

      // Phase 3: Performance Validation
      await this.validatePerformanceTargets();

      // Phase 4: Functionality Validation
      await this.validateSystemFunctionality();

      // Phase 5: HD Workflow Integration Validation
      await this.validateHDWorkflowIntegration();

      // Phase 6: Production Readiness Assessment
      await this.assessProductionReadiness();

      this.generateValidationReport();

    } catch (error) {
      console.error('❌ Complete validation failed:', error);
      this.validationResults.overall.issuesFound.push(`Validation failure: ${error.message}`);
    }

    return this.validationResults;
  }

  async validateSystemInitialization() {
    console.log('🚀 Phase 1: System Initialization Validation...');

    try {
      const startTime = Date.now();
      
      // Initialize CK system
      this.ckSystem = createCKInitializationSystem({
        sessionId: 'VALIDATION_' + Date.now(),
        milestone: 'M5',
        session: 'S6',
        enableFallback: true,
        tokenTarget: 1500
      });

      const initResult = await this.ckSystem.initializeCK();
      const initTime = Date.now() - startTime;

      if (initResult.success) {
        console.log('✅ System initialization successful');
        this.validationResults.functionality.initializationSuccessful = true;
        this.validationResults.performance.initializationTime = initTime;
        this.validationResults.overall.achievements.push('System initialization successful');
      } else {
        throw new Error('System initialization failed');
      }

    } catch (error) {
      console.log('❌ System initialization failed:', error.message);
      this.validationResults.overall.issuesFound.push(`Initialization: ${error.message}`);
    }
  }

  async validateTokenReduction() {
    console.log('📊 Phase 2: Token Reduction Validation...');

    try {
      const systemMetrics = await this.ckSystem.getSystemMetrics();
      
      this.validationResults.tokenReduction = {
        baseline: systemMetrics.metrics.baselineTokens,
        actual: systemMetrics.metrics.actualTokens || systemMetrics.performance.tokenUsage,
        reduction: systemMetrics.targets.tokenReductionActual,
        targetMet: systemMetrics.targets.tokenReductionActual >= 80
      };

      if (this.validationResults.tokenReduction.targetMet) {
        console.log(`✅ Token reduction target met: ${this.validationResults.tokenReduction.reduction.toFixed(1)}%`);
        this.validationResults.overall.achievements.push(`${this.validationResults.tokenReduction.reduction.toFixed(1)}% token reduction achieved`);
      } else {
        console.log(`⚠️  Token reduction below target: ${this.validationResults.tokenReduction.reduction.toFixed(1)}% (target: 80%+)`);
        this.validationResults.overall.issuesFound.push('Token reduction below 80% target');
      }

    } catch (error) {
      console.log('❌ Token reduction validation failed:', error.message);
      this.validationResults.overall.issuesFound.push(`Token validation: ${error.message}`);
    }
  }

  async validatePerformanceTargets() {
    console.log('⚡ Phase 3: Performance Targets Validation...');

    try {
      // Test guidance retrieval performance
      const guidanceStart = Date.now();
      const guidance = await this.ckSystem.getCKGuidance('handoff_creation', {
        taskId: 9,
        milestone: 'M5'
      });
      const guidanceTime = Date.now() - guidanceStart;

      // Test handoff generation performance
      const handoffStart = Date.now();
      const handoff = await this.ckSystem.createCKHandoff(
        'Test Performance Validation',
        {
          id: 9,
          title: 'Test task for performance validation',
          description: 'Validation test task',
          priority: 'high'
        },
        { milestone: 'M5', session: 'S6' }
      );
      const handoffTime = Date.now() - handoffStart;

      // Get overall system metrics
      const systemMetrics = await this.ckSystem.getSystemMetrics();

      this.validationResults.performance = {
        initializationTime: this.validationResults.performance.initializationTime,
        guidanceRetrievalTime: guidanceTime,
        handoffGenerationTime: handoffTime,
        cacheHitRatio: systemMetrics.targets.cacheHitActual || 0,
        targetsMet: guidanceTime < 2000 && handoffTime < 3000 && systemMetrics.targets.cacheHitActual >= 70
      };

      if (this.validationResults.performance.targetsMet) {
        console.log('✅ Performance targets met');
        console.log(`   - Guidance Retrieval: ${guidanceTime}ms`);
        console.log(`   - Handoff Generation: ${handoffTime}ms`);
        console.log(`   - Cache Hit Ratio: ${this.validationResults.performance.cacheHitRatio.toFixed(1)}%`);
        this.validationResults.overall.achievements.push('Performance targets met');
      } else {
        console.log('⚠️  Performance targets not fully met');
        this.validationResults.overall.issuesFound.push('Performance targets not met');
      }

    } catch (error) {
      console.log('❌ Performance validation failed:', error.message);
      this.validationResults.overall.issuesFound.push(`Performance: ${error.message}`);
    }
  }

  async validateSystemFunctionality() {
    console.log('🔧 Phase 4: System Functionality Validation...');

    try {
      // Test guidance access
      const guidance = await this.ckSystem.getCKGuidance('quality_assurance');
      if (guidance && guidance.modules) {
        console.log('✅ Guidance access working');
        this.validationResults.functionality.guidanceAccessWorking = true;
      }

      // Test handoff generation
      const handoff = await this.ckSystem.createCKHandoff(
        'Functionality Test',
        { id: 'test', title: 'Test', description: 'Test handoff', priority: 'medium' }
      );
      if (handoff && handoff.title) {
        console.log('✅ Handoff generation working');
        this.validationResults.functionality.handoffGenerationWorking = true;
      }

      // Test fallback system
      if (this.ckSystem.fallbackSystem) {
        const fallbackHealth = this.ckSystem.fallbackSystem.performHealthCheck();
        if (fallbackHealth.overall !== 'unhealthy') {
          console.log('✅ Fallback system working');
          this.validationResults.functionality.fallbackSystemWorking = true;
        }
      }

    } catch (error) {
      console.log('❌ Functionality validation encountered issues:', error.message);
      this.validationResults.overall.issuesFound.push(`Functionality: ${error.message}`);
    }
  }

  async validateHDWorkflowIntegration() {
    console.log('🤝 Phase 5: HD Workflow Integration Validation...');

    try {
      // Test HD consultation workflow
      const hdGuidance = await this.ckSystem.getCKGuidance('quality_assurance', {
        requiresHDValidation: true,
        workflowType: 'hd_consultation'
      });

      // Test that handoffs include proper HD validation protocols
      const hdHandoff = await this.ckSystem.createCKHandoff(
        'HD Integration Test',
        {
          id: 'hd_test',
          title: 'HD workflow integration test',
          description: 'Test HD workflow compatibility',
          priority: 'high'
        },
        { includeHDValidation: true }
      );

      if (hdGuidance && hdHandoff) {
        console.log('✅ HD workflow integration compatible');
        this.validationResults.functionality.hdWorkflowCompatible = true;
        this.validationResults.overall.achievements.push('HD workflow integration validated');
      } else {
        throw new Error('HD workflow integration validation failed');
      }

    } catch (error) {
      console.log('❌ HD workflow integration validation failed:', error.message);
      this.validationResults.overall.issuesFound.push(`HD Integration: ${error.message}`);
    }
  }

  async assessProductionReadiness() {
    console.log('🎯 Phase 6: Production Readiness Assessment...');

    const functionality = this.validationResults.functionality;
    const performance = this.validationResults.performance;
    const tokenReduction = this.validationResults.tokenReduction;

    // Calculate readiness score
    const functionalityScore = Object.values(functionality).filter(Boolean).length;
    const maxFunctionalityScore = Object.keys(functionality).length;
    const functionalityPercent = (functionalityScore / maxFunctionalityScore) * 100;

    const readinessFactors = {
      functionality: functionalityPercent >= 80,
      performance: performance.targetsMet,
      tokenReduction: tokenReduction.targetMet,
      noBlockingIssues: this.validationResults.overall.issuesFound.length === 0
    };

    const readinessScore = Object.values(readinessFactors).filter(Boolean).length;
    const maxReadinessScore = Object.keys(readinessFactors).length;
    const overallReadiness = (readinessScore / maxReadinessScore) * 100;

    this.validationResults.overall.productionReady = overallReadiness >= 75;
    this.validationResults.overall.recommendedDeployment = overallReadiness >= 85;

    if (this.validationResults.overall.productionReady) {
      console.log(`✅ System production ready (${overallReadiness.toFixed(1)}% readiness)`);
      this.validationResults.overall.achievements.push('Production readiness achieved');
    } else {
      console.log(`⚠️  System needs improvements (${overallReadiness.toFixed(1)}% readiness)`);
      this.validationResults.overall.issuesFound.push('System not production ready');
    }
  }

  generateValidationReport() {
    console.log('\n📈 COMPLETE CK SYSTEM VALIDATION REPORT');
    console.log('='.repeat(60));

    // Token Reduction Results
    console.log('\n🎯 TOKEN REDUCTION VALIDATION:');
    console.log(`Baseline Tokens: ${this.validationResults.tokenReduction.baseline}`);
    console.log(`Actual Tokens: ${this.validationResults.tokenReduction.actual}`);
    console.log(`Reduction Achieved: ${this.validationResults.tokenReduction.reduction.toFixed(1)}%`);
    console.log(`Target Met (80%+): ${this.validationResults.tokenReduction.targetMet ? '✅ YES' : '❌ NO'}`);

    // Performance Results
    console.log('\n⚡ PERFORMANCE VALIDATION:');
    console.log(`Initialization Time: ${this.validationResults.performance.initializationTime}ms`);
    console.log(`Guidance Retrieval: ${this.validationResults.performance.guidanceRetrievalTime}ms`);
    console.log(`Handoff Generation: ${this.validationResults.performance.handoffGenerationTime}ms`);
    console.log(`Cache Hit Ratio: ${this.validationResults.performance.cacheHitRatio.toFixed(1)}%`);
    console.log(`Performance Targets Met: ${this.validationResults.performance.targetsMet ? '✅ YES' : '❌ NO'}`);

    // Functionality Results
    console.log('\n🔧 FUNCTIONALITY VALIDATION:');
    Object.entries(this.validationResults.functionality).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${status} ${label}`);
    });

    // Overall Assessment
    console.log('\n🎯 PRODUCTION READINESS:');
    console.log(`Production Ready: ${this.validationResults.overall.productionReady ? '✅ YES' : '❌ NO'}`);
    console.log(`Recommended for Deployment: ${this.validationResults.overall.recommendedDeployment ? '✅ YES' : '⚠️  WITH IMPROVEMENTS'}`);

    // Achievements
    if (this.validationResults.overall.achievements.length > 0) {
      console.log('\n🏆 ACHIEVEMENTS:');
      this.validationResults.overall.achievements.forEach(achievement => {
        console.log(`✅ ${achievement}`);
      });
    }

    // Issues Found
    if (this.validationResults.overall.issuesFound.length > 0) {
      console.log('\n⚠️  ISSUES IDENTIFIED:');
      this.validationResults.overall.issuesFound.forEach(issue => {
        console.log(`❌ ${issue}`);
      });
    }

    // Deployment Recommendation
    console.log('\n🚀 DEPLOYMENT RECOMMENDATION:');
    if (this.validationResults.overall.recommendedDeployment) {
      console.log('🟢 READY FOR IMMEDIATE DEPLOYMENT');
      console.log('   All critical targets met, system validated for production use');
    } else if (this.validationResults.overall.productionReady) {
      console.log('🟡 READY FOR STAGED DEPLOYMENT');
      console.log('   System functional but may benefit from optimization');
    } else {
      console.log('🔴 REQUIRES IMPROVEMENTS BEFORE DEPLOYMENT');
      console.log('   Address identified issues before production deployment');
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Export for use in other test files
export { CompleteCKSystemValidator };

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CompleteCKSystemValidator();
  validator.runCompleteValidation().then(results => {
    process.exit(results.overall.productionReady ? 0 : 1);
  }).catch(error => {
    console.error('Validation runner failed:', error);
    process.exit(1);
  });
}