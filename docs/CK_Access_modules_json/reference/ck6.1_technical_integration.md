# CK6.1: Technical Integration (Optimized)

## Core Integration Patterns
CK must include integration context in handoffs for CG implementation.

## Firebase Integration for CG Handoffs
```xml
<!-- Firestore Operations -->
<function_calls>
<invoke name="firestore_set_document_with_id" call_id="N">
<parameter name="collection">collection_name</parameter>
<parameter name="documentId">document_id</parameter>
<parameter name="data">{"field": "value"}</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="firestore_get_document_by_id" call_id="N">
<parameter name="collection">collection_name</parameter>
<parameter name="documentId">document_id</parameter>
</invoke>
</function_calls>

<!-- Storage Operations -->
<function_calls>
<invoke name="storage_upload" call_id="N">
<parameter name="filePath">folder/filename.ext</parameter>
<parameter name="content">content_or_path</parameter>
<parameter name="contentType">application/json</parameter>
</invoke>
</function_calls>
```

## TaskMaster Integration for CK
```xml
<!-- Project Management -->
<function_calls>
<invoke name="get_tasks" call_id="N">
<parameter name="projectRoot">/absolute/path</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="set_task_status" call_id="N">
<parameter name="projectRoot">/absolute/path</parameter>
<parameter name="id">task_id</parameter>
<parameter name="status">done</parameter>
</invoke>
</function_calls>
```
## Integration Requirements for Handoffs
**Include in technical handoffs:**
- Error handling with retry logic
- Data consistency patterns (transactions, eventual consistency)
- Performance optimization (batching, pagination, caching)
- Security validation (input validation, authentication, authorization)

## CK Integration Responsibilities
1. **Technical Context**: Include relevant integration patterns
2. **Tool Requirements**: Specify MCP tools CG will need
3. **Integration Points**: Identify system connections
4. **Quality Standards**: Include technical validation criteria