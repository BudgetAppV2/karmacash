# Template Exchange Data Model Documentation

This document defines the schema and design decisions for the Firebase Firestore database used in the Template Exchange System, which facilitates the exchange of templates between Google AI Studio and Cursor AI.

## Collection Structure

The primary collection for this system is `templates`, which stores all template documents.

## Template Document Schema

Each template document has the following structure:

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `sessionId` | String | Unique identifier for the session (e.g., "M5.S4") | Required, follows pattern `^[A-Z][0-9]+\.[A-Z][0-9]+$` |
| `type` | String | Type of template | Required, either "handoff" or "summary" |
| `content` | String | Content of the template | Required, max length 50,000 characters |
| `createdAt` | Timestamp | Creation time | Required, server timestamp |
| `updatedAt` | Timestamp | Last update time | Required, server timestamp |
| `status` | String | Status of the template | Required, one of: "draft", "active", "archived" |
| `shard` | String | Shard for query distribution | Required, one of: "a", "b", "c" |
| `metadata` | Map | Additional metadata | Optional |
| `metadata.source` | String | Source platform | Optional, either "google_ai_studio" or "cursor" |
| `metadata.createdBy` | String | User who created the template | Optional |
| `metadata.tags` | Array<String> | Tags for categorization | Optional |
| `metadata.version` | Number | Version number | Optional, defaults to 1 |

## Indexing Strategy

The following composite indexes are configured to optimize query performance:

1. `shard` (ASC), `sessionId` (ASC), `updatedAt` (DESC)
   - Supports efficient querying of templates by session ID with time-based sorting

2. `shard` (ASC), `type` (ASC), `updatedAt` (DESC)
   - Supports efficient querying of templates by type with time-based sorting

3. `shard` (ASC), `status` (ASC), `updatedAt` (DESC)
   - Supports efficient querying of templates by status with time-based sorting

4. `shard` (ASC), `metadata.source` (ASC), `updatedAt` (DESC)
   - Supports efficient querying of templates by source with time-based sorting

5. `shard` (ASC), `type` (ASC), `status` (ASC), `updatedAt` (DESC)
   - Supports complex queries combining type and status filters

## Sharding Strategy

To avoid hot spots and the 500 writes/second limitation for collections with sequential timestamp values, the templates collection uses a sharding approach:

- Each document is assigned a random shard value ("a", "b", or "c")
- Queries span across all shards, combining and sorting results in memory
- This approach distributes writes across multiple logical shards, supporting up to 1500 writes/second

## Security Rules

Security rules for the templates collection enforce:

1. Data validation for all fields according to the schema
2. Authentication requirements (either user authentication or API key)
3. Immutability of certain fields after creation (`createdAt`, `shard`)
4. Server timestamp validation for `createdAt` and `updatedAt`

## API Model

The TemplateModel class provides the following methods for interacting with templates:

| Method | Description | Parameters |
|--------|-------------|------------|
| `create(data)` | Create a new template | `data`: Template data |
| `update(id, data)` | Update an existing template | `id`: Document ID, `data`: Updated data |
| `getById(id)` | Get a template by ID | `id`: Document ID |
| `getBySessionId(sessionId)` | Query templates by session ID | `sessionId`: Session ID |
| `getByType(type, limit, startAfter)` | Query templates by type with pagination | `type`: Template type, `limit`: Result limit, `startAfter`: Pagination cursor |

## Usage Examples

### Creating a Template

```javascript
const { getTemplateModel } = require('./firebase/firebase');

async function createTemplate() {
  const templateModel = getTemplateModel();
  
  const templateData = {
    sessionId: 'M5.S4',
    type: 'handoff',
    content: 'Template content here...',
    status: 'draft',
    metadata: {
      source: 'google_ai_studio',
      tags: ['prompt', 'example']
    }
  };
  
  try {
    const docRef = await templateModel.create(templateData);
    console.log('Template created with ID:', docRef.id);
    return docRef;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}
```

### Querying Templates

```javascript
const { getTemplateModel } = require('./firebase/firebase');

async function getTemplatesBySession(sessionId) {
  const templateModel = getTemplateModel();
  
  try {
    const templates = await templateModel.getBySessionId(sessionId);
    console.log(`Found ${templates.length} templates for session ${sessionId}`);
    return templates.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error querying templates:', error);
    throw error;
  }
}
```

## Design Decisions and Best Practices

1. **Flat Schema**: We use a flat schema rather than deeply nested objects to simplify querying and indexing.

2. **Sharding**: We implement sharding to avoid write limitations and distribute load.

3. **Server Timestamps**: We use server timestamps to ensure consistent time values and simplify synchronization.

4. **Required Fields**: Critical fields are marked as required and have strict validation rules.

5. **Optional Metadata**: Flexible metadata allows for extension without schema changes.

6. **Pagination Support**: Query methods support pagination for handling large result sets efficiently.

7. **Field Validation**: Both client-side (in the model) and server-side (in security rules) validation is implemented.

8. **Optimistic Concurrency**: The `updatedAt` timestamp helps detect and manage concurrent updates.

## Future Enhancements

Potential enhancements to consider:

1. Add versioning support with dedicated subcollection for version history
2. Implement soft delete with status field rather than physical document deletion
3. Add caching layer for frequently accessed templates
4. Implement batch operations for bulk template management 