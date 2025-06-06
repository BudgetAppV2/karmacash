# CK7.1: Firebase Storage (Optimized)

## Firebase Storage Access for CG Handoffs
CK must include storage access context when handoffs involve file operations.

## Storage Operations
```xml
<!-- Upload File -->
<function_calls>
<invoke name="storage_upload" call_id="N">
<parameter name="filePath">folder/filename.ext</parameter>
<parameter name="content">file_content_or_local_path</parameter>
<parameter name="contentType">application/json</parameter>
</invoke>
</function_calls>

<!-- Get File Info -->
<function_calls>
<invoke name="storage_get_file_info" call_id="N">
<parameter name="filePath">folder/filename.ext</parameter>
</invoke>
</function_calls>

<!-- List Files -->
<function_calls>
<invoke name="storage_list_files" call_id="N">
<parameter name="directoryPath">folder_path</parameter>
</invoke>
</function_calls>
```

## Storage Patterns for Handoffs
**When to include storage context:**
- Document upload/download requirements
- File organization and naming conventions
- Access permissions and security considerations
- Integration with other Firebase services

## Best Practices for CG Implementation
- Use descriptive file paths and naming conventions
- Include proper metadata for file organization
- Handle upload failures gracefully with retry logic
- Validate file types and sizes before upload
- Implement proper error handling for storage operations

## Integration with Document Management
- Store large documents in Firebase Storage
- Reference storage files from Firestore documents
- Use download URLs for accessing stored content
- Maintain file versioning for important documents