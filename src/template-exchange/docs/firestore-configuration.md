# Firestore Configuration for Template Exchange System

This document describes the configuration of the Firestore database for the Template Exchange System, including security rules, indexes, and performance optimizations.

## Collection Structure

The system uses a single collection called `templates` to store all template documents. 

### Sharding Strategy

To avoid the 500 writes/second limitation of Firestore, we implement a sharding strategy:

- Each document is assigned a random shard value ('a', 'b', or 'c')
- Queries are executed across all shards, and results are combined
- This approach allows up to 1500 writes/second (3 shards × 500 writes/shard)

## Security Rules

Firestore security rules are configured to:

1. **Authentication**: Allow access only with valid API key or Firebase Authentication
2. **Data Validation**: Enforce the schema defined in `template-exchange-schema.js`
3. **Field Protection**: Prevent modification of immutable fields like `createdAt` and `shard`

### API Key Authentication

Access to the templates collection requires either:

- A valid Firebase Authentication token, OR
- A valid API key provided in the `x-api-key` HTTP header

API keys are stored in the `config/api_keys` document and validated server-side.

### Data Validation

The security rules validate the following:

- **sessionId**: Must match the pattern `^[A-Z][0-9]+\.[A-Z][0-9]+$`
- **type**: Must be either 'handoff' or 'summary'
- **status**: Must be one of 'draft', 'active', or 'archived'
- **content**: Must be a string, limited to 50,000 characters
- **timestamps**: Must be valid Firestore timestamps
- **shard**: Must be one of the valid shard values ('a', 'b', 'c')

## Indexes

The following indexes are configured to optimize query performance:

1. **Session ID Queries**: 
   - Fields: `shard` (ASC), `sessionId` (ASC), `updatedAt` (DESC)

2. **Type Queries**: 
   - Fields: `shard` (ASC), `type` (ASC), `updatedAt` (DESC)

3. **Status Queries**: 
   - Fields: `shard` (ASC), `status` (ASC), `updatedAt` (DESC)

4. **Source Queries**: 
   - Fields: `shard` (ASC), `metadata.source` (ASC), `updatedAt` (DESC)

5. **Combined Type and Status Queries**: 
   - Fields: `shard` (ASC), `type` (ASC), `status` (ASC), `updatedAt` (DESC)

## Performance Optimizations

The Firestore configuration includes the following performance optimizations:

### Caching

- **Memory Cache**: Default of 50MB, configurable via options
- **Persistence**: Enabled by default for offline access (can be disabled)
- **Cache Headers**: Configured for optimal HTTP caching on static assets

### Query Optimization

- **Limit Results**: All queries use limits to avoid retrieving too many documents
- **Paginated Queries**: Support for paginated results using `startAfter`
- **Efficient Filtering**: Queries are structured to use the configured indexes

### Network Timeout

- A default synchronization timeout of 10 seconds is configured
- This timeout can be adjusted based on network conditions

## API Key Management

API keys are managed through the `scripts/create-api-key.js` utility:

```bash
# Generate a new API key
node src/template-exchange/scripts/create-api-key.js [path/to/serviceAccountKey.json]
```

The generated key should be securely stored and used in API requests via the `x-api-key` header.

## Configuration Files

- **firestore.rules**: Contains the security rules for the Firestore database
- **firestore.indexes.json**: Defines the indexes for optimizing queries
- **firebase.json**: Contains Firebase project configuration, including caching parameters
- **firestore-config.js**: JavaScript module for initializing and configuring Firestore

## Usage in Application

The Firestore configuration is integrated into the application through the `firebase.js` utility file, which provides functions for:

- **Initialization**: `initializeFirebase(serviceAccount, options)`
- **Database Access**: `getDb()`
- **Template Model Access**: `getTemplateModel()`
- **Collection Configuration Access**: `getCollectionConfig()`

## Testing Configuration

To test the Firestore configuration:

1. Ensure the security rules are properly configured using the Firebase console or CLI
2. Verify that unauthorized access is properly denied
3. Validate that authorized access with a valid API key works correctly
4. Confirm that data validation is working by attempting to insert invalid data
5. Test query performance with larger datasets 