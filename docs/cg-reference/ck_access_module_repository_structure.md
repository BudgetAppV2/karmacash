# CK Access Module Repository Structure Plan

**Document ID**: CG-Structure-M5.S6-CK-Access  
**Date**: 2025-06-01  
**Based On**: Bible Access Module analysis findings  
**Purpose**: Define optimal repository structure for CK Access Module implementation  

---

## Repository Structure Overview

```
modules/ck-access/
├── README.md                           # Module documentation
├── package.json                        # Dependencies and scripts
├── .gitignore                         # Version control exclusions
├── 
├── src/                               # Core implementation
│   ├── ck-access-module.js           # Main module class
│   ├── ck-integration-layer.js       # CK-specific adaptations
│   ├── enhanced-cache-system.js      # Performance optimization
│   ├── ck-mcp-client.js             # Firebase/MCP integration
│   └── utils/
│       ├── naming-conventions.js     # CK naming utility functions
│       ├── content-processors.js     # Content transformation
│       └── performance-monitor.js    # Metrics collection
│
├── config/                           # Configuration files
│   ├── cache-config.js              # Cache settings
│   ├── module-mapping.js            # CK module definitions
│   └── performance-thresholds.js    # Performance targets
│
├── templates/                        # Processing templates
│   ├── ck-guidance-template.json    # Standard guidance structure
│   ├── optimization-template.json   # Content optimization
│   └── metadata-template.json       # Content metadata
│
├── scripts/                          # Automation scripts
│   ├── setup/
│   │   ├── initialize-ck-modules.js  # Setup CK guidance structure
│   │   └── migrate-content.js        # Content migration utilities
│   ├── processing/
│   │   ├── upload-ck-guidance.js     # Upload CK content
│   │   ├── create-optimized.js       # Generate optimized versions
│   │   └── update-cross-refs.js      # Maintain cross-references
│   └── maintenance/
│       ├── cache-analysis.js         # Cache performance analysis
│       ├── performance-report.js     # Generate performance reports
│       └── cleanup-expired.js        # Cache maintenance
│
├── tests/                            # Testing framework
│   ├── unit/
│   │   ├── ck-access-module.test.js  # Core module tests
│   │   ├── cache-system.test.js      # Cache functionality
│   │   └── mcp-client.test.js        # Integration tests
│   ├── integration/
│   │   ├── end-to-end.test.js        # Full workflow tests
│   │   └── performance.test.js       # Performance benchmarks
│   ├── fixtures/
│   │   ├── sample-guidance.md        # Test content
│   │   └── mock-responses.json       # Test data
│   └── test-config.js               # Test configuration
│
├── docs/                            # Documentation
│   ├── api-reference.md             # API documentation
│   ├── usage-guide.md               # Implementation guide
│   ├── performance-tuning.md        # Optimization guide
│   └── troubleshooting.md           # Common issues
│
└── examples/                        # Usage examples
    ├── basic-usage.js               # Simple implementation
    ├── advanced-caching.js          # Performance optimization
    └── integration-example.js       # Full CK integration
```

---

## Core Module Architecture

### 1. Main Module Structure

**File**: `src/ck-access-module.js`

```javascript
class CKAccessModule {
  constructor(mcpClient, options = {}) {
    // Adapted from BibleAccessModule
    // CK-specific configuration and initialization
  }

  // Core functionality
  async getGuidance(moduleId, section = null) { }
  async getCKModuleIndex() { }
  async searchGuidance(query, options = {}) { }
  async buildContext(primaryModule, options = {}) { }
  
  // Performance and monitoring
  getMetrics() { }
  generatePerformanceReport() { }
  clearCache() { }
}
```

**Key Adaptations from Bible Access**:
- Replace `getDocument()` with `getGuidance()`
- Adapt section handling for CK module structure
- Implement CK-specific cross-reference patterns
- Add workflow-aware context building

### 2. CK Integration Layer

**File**: `src/ck-integration-layer.js`

```javascript
class CKIntegrationLayer {
  constructor(coreModule) {
    this.core = coreModule;
    this.workflowPatterns = new Map();
  }

  // CK-specific methods
  async getHandoffTemplate(templateType) { }
  async getValidationProtocol(context) { }
  async getTaskGenerationGuidance(projectType) { }
  async getSessionPlanningGuidance(milestone) { }
  
  // Workflow optimization
  async predictNextModule(currentModule, context) { }
  async batchLoadWorkflow(workflowType) { }
}
```

### 3. Enhanced Cache System

**File**: `src/enhanced-cache-system.js`

```javascript
// Adapted from Bible Access enhanced caching
class CKCacheSystem extends EnhancedCacheSystem {
  constructor(options = {}) {
    super({
      maxCacheSize: options.maxCacheSize || 150, // Larger for CK
      cacheTimeout: options.cacheTimeout || 600000, // 10 minutes
      prefetchEnabled: true,
      ...options
    });
  }

  // CK-specific cache methods
  async getCKGuidanceWithPrefetch(moduleId, retrievalFunction) { }
  async prefetchWorkflowModules(workflowType) { }
  async cacheSessionContext(sessionData) { }
}
```

---

## Configuration Structure

### 1. Module Mapping Configuration

**File**: `config/module-mapping.js`

```javascript
export const CK_MODULE_MAP = {
  // Core CK modules
  initialization: {
    'identity': 'ck1.1_identity_confirmation',
    'tools': 'ck1.2_tool_validation', 
    'context': 'ck1.3_session_context'
  },
  
  validation: {
    'hd_protocol': 'ck2.1_hd_validation_protocol',
    'task_review': 'ck2.2_task_validation',
    'quality_check': 'ck2.3_quality_assurance'
  },
  
  task_management: {
    'generation': 'ck3.1_task_generation',
    'structuring': 'ck3.2_task_structuring',
    'prioritization': 'ck3.3_task_prioritization'
  },
  
  handoffs: {
    'templates': 'ck4.1_handoff_templates',
    'formatting': 'ck4.2_handoff_formatting',
    'validation': 'ck4.3_handoff_validation'
  },
  
  session_management: {
    'planning': 'ck5.1_session_planning',
    'continuity': 'ck5.2_session_continuity',
    'closure': 'ck5.3_session_closure'
  }
};

export const TOPIC_TO_MODULE = {
  'handoffs': ['handoffs.templates', 'handoffs.formatting'],
  'tasks': ['task_management.generation', 'task_management.structuring'],
  'validation': ['validation.hd_protocol', 'validation.task_review'],
  'planning': ['session_management.planning', 'session_management.continuity']
};
```

### 2. Cache Configuration

**File**: `config/cache-config.js`

```javascript
export const CACHE_CONFIG = {
  // Performance targets based on Bible Access analysis
  targets: {
    hitRatio: 0.8,              // 80% target (vs 46.6% current)
    responseTime: 2000,         // 2 seconds max
    initializationTokens: 2000  // <2000 tokens (vs 8000-9600)
  },
  
  // Cache settings
  settings: {
    maxCacheSize: 150,          // Larger than Bible (100)
    cacheTimeout: 600000,       // 10 minutes (vs 5 for Bible)
    prefetchEnabled: true,
    compressionEnabled: true,
    persistentCache: false      // Session-based only
  },
  
  // Module priorities
  priorities: {
    initialization: 3,          // High priority
    validation: 2,              // Medium-high
    handoffs: 2,               // Medium-high
    tasks: 1,                  // Medium
    session_management: 1       // Medium
  }
};
```

---

## Content Organization

### 1. CK Guidance Storage Structure

```
Firebase Storage: ck_guidance/
├── modules/
│   ├── initialization/
│   │   ├── raw/
│   │   │   ├── ck1.1_identity_confirmation.md
│   │   │   ├── ck1.2_tool_validation.md
│   │   │   └── ck1.3_session_context.md
│   │   ├── optimized/
│   │   │   ├── ck1.1_identity_confirmation.optimized.json
│   │   │   ├── ck1.2_tool_validation.optimized.json
│   │   │   └── ck1.3_session_context.optimized.json
│   │   └── chunks/
│   │       ├── ck1.1_identity_confirmation/
│   │       ├── ck1.2_tool_validation/
│   │       └── ck1.3_session_context/
│   │
│   ├── validation/ [similar structure]
│   ├── task_management/ [similar structure]
│   ├── handoffs/ [similar structure]
│   └── session_management/ [similar structure]
│
├── cross_references/          # Firestore collection
├── performance_metrics/       # Performance tracking
└── cache_metadata/           # Cache optimization data
```

### 2. Naming Convention Implementation

**File**: `src/utils/naming-conventions.js`

```javascript
export class CKNamingConventions {
  static buildModuleId(category, subcategory) {
    const categoryMap = {
      'initialization': 'ck1',
      'validation': 'ck2', 
      'task_management': 'ck3',
      'handoffs': 'ck4',
      'session_management': 'ck5'
    };
    
    const categoryCode = categoryMap[category];
    const subCode = this.getSubcategoryCode(category, subcategory);
    
    return `${categoryCode}.${subCode}`;
  }
  
  static buildStoragePath(moduleId, version = 'optimized') {
    const [category, subId] = this.parseModuleId(moduleId);
    const fileName = this.buildFileName(moduleId, version);
    
    return `ck_guidance/modules/${category}/${version}/${fileName}`;
  }
  
  static buildFileName(moduleId, version) {
    const baseName = CK_MODULE_MAP.getBaseName(moduleId);
    return version === 'optimized' 
      ? `${baseName}.optimized.json`
      : `${baseName}.md`;
  }
}
```

---

## Testing Strategy

### 1. Unit Tests Structure

**Performance Baseline Tests**:
```javascript
// tests/unit/performance.test.js
describe('CK Access Module Performance', () => {
  test('initialization under 2000 tokens', async () => {
    const tokens = await measureTokenUsage(() => 
      ckModule.initialize()
    );
    expect(tokens).toBeLessThan(2000);
  });
  
  test('cache hit ratio above 80%', async () => {
    // Simulate usage pattern
    const hitRatio = await simulateWorkflowAccess();
    expect(hitRatio).toBeGreaterThan(0.8);
  });
});
```

### 2. Integration Tests

**End-to-End Workflow Tests**:
```javascript
// tests/integration/workflow.test.js
describe('CK Workflow Integration', () => {
  test('complete handoff workflow', async () => {
    const workflow = await ckModule.loadWorkflow('handoff_creation');
    expect(workflow).toContainModules([
      'handoffs.templates',
      'validation.hd_protocol', 
      'task_management.generation'
    ]);
  });
});
```

---

## Deployment Strategy

### 1. Phased Implementation

**Phase 1: Core Infrastructure**
```bash
# Setup commands
npm run setup:ck-modules        # Initialize module structure
npm run migrate:content         # Migrate existing CK content
npm run test:baseline          # Establish performance baseline
```

**Phase 2: Performance Optimization**
```bash
npm run optimize:cache         # Configure cache system
npm run benchmark:performance  # Validate performance targets
npm run deploy:staging         # Deploy to staging environment
```

**Phase 3: Production Deployment**
```bash
npm run validate:production    # Final validation
npm run deploy:production      # Deploy to production
npm run monitor:metrics        # Enable monitoring
```

### 2. Monitoring Setup

**Performance Monitoring**:
- Cache hit ratio tracking
- Token usage per session
- Response time monitoring
- Memory usage alerts
- Error rate tracking

---

## Migration Plan

### 1. Content Migration

From current CK initialization to modular structure:

```javascript
// scripts/setup/migrate-content.js
const MIGRATION_MAP = {
  'current_ck_priming.md': [
    'ck1.1_identity_confirmation.md',
    'ck1.2_tool_validation.md', 
    'ck2.1_hd_validation_protocol.md',
    'ck4.1_handoff_templates.md'
  ]
};
```

### 2. Validation Process

**Content Integrity Checks**:
- No functionality loss during migration
- All cross-references maintained
- Performance targets achieved
- Backward compatibility preserved

---

## Success Metrics

### 1. Technical Metrics

- **Token Reduction**: 81% reduction achieved (8000+ → <2000)
- **Cache Performance**: 80%+ hit ratio sustained
- **Response Time**: <2s for cached content
- **Conversation Length**: +15 exchanges capacity

### 2. Quality Metrics

- **Zero Regression**: All current CK functionality preserved
- **Enhanced Performance**: Measurable improvement in session efficiency
- **Maintainability**: Clear separation of concerns and modularity
- **Scalability**: Foundation for future CK enhancements

---

This repository structure provides a **production-ready foundation** for the CK Access Module, leveraging the proven patterns from the Bible Access Module while optimizing for CK-specific requirements and performance targets.