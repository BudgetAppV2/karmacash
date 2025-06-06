# CG Automation Tools Documentation

## Overview

The CG (Code Generator) Automation Tools are a comprehensive suite of production-ready scripts designed to automate foundational document processing for the KarmaCash PWA project. These tools implement enhanced B1 methodology with CG-specific optimizations for reliable, scalable document management.

## Tool Suite

### 1. upload-cg-raw.js
**Purpose**: Raw document upload to Firebase Storage with production-grade validation

**Key Features**:
- Production-ready file upload with comprehensive validation
- Batch upload capabilities for multiple documents
- Enhanced metadata generation with CG-specific fields
- Error handling and recovery mechanisms
- Performance optimized with rate limiting
- Detailed upload reporting and logging

**Usage**:
```bash
# Single file upload
node upload-cg-raw.js docs/B1.1.md b1

# Batch upload
node upload-cg-raw.js docs/ b1 --batch foundational

# With custom document type
node upload-cg-raw.js docs/workflow.md b7 workflow_documentation
```

**Input Requirements**:
- File path (absolute or relative)
- Section identifier (b1, b2, b7, etc.)
- Optional: document type (defaults to 'foundational')

**Output**:
- Upload result with success/failure status
- Storage path and download URL
- Comprehensive metadata including file size, hash, timestamps
- Performance metrics and error details

### 2. create-cg-metadata.js
**Purpose**: Enhanced Firestore metadata creation for uploaded documents

**Key Features**:
- Comprehensive CG processing pipeline status tracking
- Enhanced metadata structure with quality metrics
- Production-grade validation and error handling
- Batch metadata creation capabilities
- Integration hooks for CK system compatibility
- Quality assurance tracking and versioning

**Usage**:
```bash
# Single metadata creation
node create-cg-metadata.js '{"success":true,"storagePath":"cg/sections/b1/raw/B1.1.md",...}'

# Batch metadata creation
node create-cg-metadata.js --batch upload-results.json

# With additional information
node create-cg-metadata.js uploadResult.json '{"tags":["important"],"keywords":["workflow"]}'
```

**Input Requirements**:
- Upload result JSON (from upload-cg-raw.js)
- Optional: additional metadata (tags, keywords, custom fields)

**Output**:
- Metadata creation result with document ID
- Complete metadata structure with CG processing status
- Validation results and error handling
- Performance timing and success metrics

### 3. migrate-b7-to-cg.js
**Purpose**: Migration of existing B7 workflow documentation to CG processing system

**Key Features**:
- Comprehensive B7 document discovery and migration
- Enhanced metadata transformation for CG compatibility
- Chunk and optimized file migration with validation
- Cross-reference mapping and updating
- Detailed migration logging and reporting
- Production-grade error handling and recovery

**Usage**:
```bash
# Full B7 migration
node migrate-b7-to-cg.js

# Migration generates comprehensive report automatically
```

**Input Requirements**:
- Existing B7 documents in bible/sections/b7/
- Access to Firebase Storage and Firestore
- Service account credentials

**Output**:
- Migration report with success/failure statistics
- Migrated documents in cg/sections/b7/ structure
- Enhanced metadata in cg_storage_metadata collection
- Updated cross-references in cg_cross_references collection
- Detailed migration log for troubleshooting

### 4. process-cg-complete.js
**Purpose**: End-to-end processing of CG documents through complete pipeline

**Key Features**:
- Comprehensive content analysis with semantic understanding
- Intelligent chunking based on document structure
- Optimization processing for handoff compatibility
- Cross-reference mapping and validation
- Metadata updates with completion tracking
- Parallel processing capabilities for efficiency

**Usage**:
```bash
# Process all CG documents
node process-cg-complete.js

# Process specific section
node process-cg-complete.js --section b7

# Force reprocessing
node process-cg-complete.js --force
```

**Input Requirements**:
- CG documents with completed raw upload and metadata
- Valid CG metadata in cg_storage_metadata collection
- Firebase Storage and Firestore access

**Output**:
- Complete processing through all pipeline stages
- Analysis files in cg/sections/*/analysis/
- Chunk files in cg/sections/*/chunks/
- Optimized JSON in cg/sections/*/optimized/
- Cross-references in cg_cross_references collection
- Updated metadata with completion status

### 5. validate-cg-performance.js
**Purpose**: Comprehensive validation and performance testing of all CG tools

**Key Features**:
- Functionality validation for all CG tools
- Performance benchmarking against production standards
- Reliability testing with error scenarios
- Data integrity validation across all stages
- Comprehensive reporting with recommendations
- Production readiness assessment

**Usage**:
```bash
# Run complete validation suite
node validate-cg-performance.js

# Generates detailed validation report automatically
```

**Input Requirements**:
- All CG automation tools in working condition
- Firebase connectivity and permissions
- Test data for benchmarking

**Output**:
- Comprehensive validation report
- Performance benchmarks and comparisons
- Reliability and integrity test results
- Production readiness assessment
- Recommendations for improvements

## Architecture & Design

### CG Processing Pipeline

1. **Raw Upload** (upload-cg-raw.js)
   - File validation and upload to Firebase Storage
   - Enhanced metadata generation
   - Error handling and logging

2. **Metadata Creation** (create-cg-metadata.js)
   - Comprehensive metadata structure in Firestore
   - Processing pipeline status initialization
   - Quality metrics tracking

3. **Complete Processing** (process-cg-complete.js)
   - Content analysis and semantic understanding
   - Intelligent chunking and optimization
   - Cross-reference mapping and validation

4. **Validation & QA** (validate-cg-performance.js)
   - Functionality and performance validation
   - Reliability and integrity testing
   - Production readiness assessment

### Data Structures

#### CG Metadata Schema
```json
{
  "id": "B1_1_Project_Vision_Goals",
  "section": "b1",
  "subsection": "project_vision_goals",
  "fileName": "B1.1_Project_Vision_Goals.md",
  "documentType": "foundational",
  "storagePath": "cg/sections/b1/raw/B1.1_Project_Vision_Goals.md",
  "cgProcessingStatus": {
    "raw": { "completed": true, "timestamp": "2025-06-02T..." },
    "metadata": { "completed": true, "timestamp": "2025-06-02T..." },
    "analysis": { "completed": false, "timestamp": null },
    "chunks": { "completed": false, "count": 0 },
    "optimized": { "completed": false, "timestamp": null },
    "crossReferences": { "completed": false, "count": 0 },
    "validation": { "completed": false, "timestamp": null }
  },
  "cgMethodology": {
    "version": "CG-v1.0",
    "basedOn": "B1-enhanced",
    "stages": ["raw-upload", "metadata-creation", "semantic-analysis", "intelligent-chunking", "optimization-processing", "cross-reference-mapping", "performance-validation"]
  }
}
```

#### Storage Structure
```
cg/
├── sections/
│   ├── b1/
│   │   ├── raw/           # Original documents
│   │   ├── analysis/      # Content analysis results
│   │   ├── chunks/        # Intelligent chunks
│   │   └── optimized/     # Optimized JSON structures
│   ├── b2/
│   ├── b7/
│   └── ...
```

#### Firestore Collections
- `cg_storage_metadata` - Document metadata and processing status
- `cg_cross_references` - Cross-reference mappings and relationships

## Production Standards

### Quality Gates
1. **Functionality**: All tools must pass functionality validation
2. **Performance**: Must meet performance benchmarks (95% success rate)
3. **Reliability**: Error handling and recovery mechanisms tested
4. **Integrity**: Data consistency and cross-reference accuracy validated

### Performance Benchmarks
- Upload time: < 5 seconds per file
- Metadata creation: < 2 seconds per document
- Processing time: < 30 seconds per document
- Success rate: ≥ 95% for all operations

### Error Handling
- Comprehensive input validation
- Graceful error recovery and logging
- Detailed error reporting with context
- Retry mechanisms for transient failures

### Security
- Firebase security rules compliance
- Input sanitization and validation
- Secure credential handling
- Access control and permissions

## Integration with CK Workflow

### Handoff Compatibility
- All processed documents are CK handoff-ready
- Optimized JSON structures support CK requirements
- Metadata includes CK integration hooks
- Cross-references enable CK navigation

### Continuity Support
- Processing status enables session continuity
- Detailed metadata supports CK planning
- Validation results guide CK decisions
- Performance metrics inform CK optimization

## Monitoring & Maintenance

### Logging
- Comprehensive operation logging
- Performance metrics collection
- Error tracking and analysis
- Success rate monitoring

### Reporting
- Detailed processing reports
- Performance benchmark comparisons
- Validation results and recommendations
- Migration status and completion tracking

### Maintenance
- Regular validation runs recommended
- Performance monitoring in production
- Error log analysis and resolution
- Tool updates and enhancements

## Troubleshooting

### Common Issues
1. **Upload Failures**: Check file permissions, network connectivity, Firebase config
2. **Metadata Errors**: Validate input JSON structure, check Firestore permissions
3. **Processing Timeouts**: Verify document size, check processing resources
4. **Validation Failures**: Review error logs, check dependencies, validate configuration

### Debug Mode
- Enable detailed logging with environment variables
- Use validation tool for comprehensive health checks
- Check Firebase console for detailed error messages
- Review generated reports for failure analysis

## Next Steps

1. **Production Deployment**: Deploy validated tools to production environment
2. **Monitoring Setup**: Implement production monitoring and alerting
3. **Performance Optimization**: Continuous performance improvement based on metrics
4. **Feature Enhancement**: Add new features based on CK feedback and requirements

## Support

For technical support and questions:
- Review generated reports and logs
- Check Firebase console for detailed error information
- Use validation tool for comprehensive health assessment
- Refer to B1 methodology documentation for context