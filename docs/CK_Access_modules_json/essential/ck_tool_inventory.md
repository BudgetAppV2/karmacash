# CK Tool Inventory: Complete MCP Ecosystem

## Firebase Integration (Document & Storage Management)
### Firestore Operations
- `firestore_get_document_by_id`: Retrieve specific document
- `firestore_set_document_with_id`: Create/update document with custom ID
- `firestore_list_documents`: Query collections with filters
- `firestore_update_document_by_id`: Update specific fields
- `firestore_delete_document_by_id`: Remove documents

### Storage Operations  
- `storage_upload`: Upload files to Firebase Storage
- `storage_get_file_info`: Get file metadata and download URLs
- `storage_list_files`: List files in directory paths
- `storage_upload_from_url`: Upload from external URLs

## TaskMaster Integration (Project Management)
### Task Information
- `get_tasks`: List all tasks with status and details
- `get_task`: Get specific task by ID
- `next_task`: Find next available task for handoff

### Task Management
- `set_task_status`: Update task status (pending, done, in-progress)
- `add_task`: Create new tasks with priorities and dependencies
- `update_task`: Modify existing task details
- `expand_task`: Generate subtasks for complex tasks
- `analyze_project_complexity`: Assess task complexity scores

## Desktop Commander (Direct Project Access)
### File Operations
- `read_file`: Read file contents (text, images, URLs)
- `write_file`: Create/update files (with chunking for large files)
- `read_multiple_files`: Read several files simultaneously
- `edit_block`: Surgical text replacements in files

### Directory Management
- `list_directory`: Get detailed file/directory listings
- `create_directory`: Create new directories
- `move_file`: Move or rename files and directories
- `search_files`: Find files by name patterns
- `get_file_info`: Get file metadata (size, dates, permissions)

### Code Operations
- `search_code`: Text/code pattern search using ripgrep
- `execute_command`: Run terminal commands with timeout
- `read_output`: Get output from running processes
- `list_processes`: View all running processes
## Browser Development Tools (Live Environment Monitoring)
### Debugging Tools
- `getConsoleLogs`: Retrieve browser console logs
- `getConsoleErrors`: Get console error messages
- `getNetworkErrors`: Check network request failures
- `runDebuggerMode`: Enable comprehensive debugging
- `takeScreenshot`: Capture current browser state

### Performance Analysis
- `runPerformanceAudit`: Analyze page performance metrics
- `runAccessibilityAudit`: Check accessibility compliance
- `runSEOAudit`: Evaluate SEO optimization
- `runBestPracticesAudit`: Validate development best practices
- `runNextJSAudit`: Framework-specific performance analysis

## Knowledge & Development Tools
### Memory Graph (Knowledge Management)
- `create_entities`: Create task/project entities with observations
- `create_relations`: Link entities with relationship types
- `read_graph`: Access complete knowledge graph
- `search_nodes`: Find entities by query
- `add_observations`: Track progress and insights

### Content & Research
- `artifacts`: Create reusable content and documents
- `repl`: Execute JavaScript for analysis and calculations
- `web_search`: Search web for current information
- `web_fetch`: Retrieve specific web page content
- `resolve-library-id`: Find Context7-compatible library IDs
- `get-library-docs`: Access up-to-date library documentation

## Bible Access Module (Foundational Guidance)
### Document Access
- `getBibleSection`: Get foundational documents (B#.#)
- `searchBibleContent`: Search across foundational content
- `getCrossReferences`: Find related guidance sections
- `buildBibleContext`: Create comprehensive guidance context
- `getBiblePerformanceMetrics`: Access system performance data

## CK Module Access (On-Demand Loading)
### New Optimized System
- `getCKModule`: Load specific CK guidance modules by ID
- **Keyword Triggers**: handoff, validation, task, technical, planning
- **Smart Loading**: Primary/secondary module hierarchy
- **Performance**: <5s essential, <10s standard, <15s complex modules

## Tool Usage Guidelines for Handoffs
**When creating handoffs, specify:**
- **Required Tools**: Which MCP tools CG will need
- **Project Access**: Absolute paths for Desktop Commander
- **Performance Monitoring**: Browser tools for live debugging
- **Knowledge Integration**: Memory graph for task tracking
- **Foundational References**: Bible Access for guidance standards