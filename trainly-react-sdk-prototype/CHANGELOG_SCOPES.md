# Changelog - Custom Scopes Support

## Version 1.4.2 (October 2025)

### 🎨 Simplified API + Component Updates

Simplified the API by enhancing the main `ask()` function to accept optional parameters instead of creating separate functions. Also added scope filtering to the `<TrainlyChat />` component.

### API Changes

#### `ask(question, options?)` - Enhanced

- **UPDATED**: Now accepts optional parameters for citations and scope filtering
- Single function for all query needs - cleaner and more intuitive
- Signature: `ask(question, { includeCitations?, scope_filters? })`
- Returns: `Promise<{ answer: string; citations?: Citation[] }>`
- Examples:

  ```typescript
  const { ask } = useTrainly();

  // Simple query
  const result = await ask("What are the features?");
  console.log(result.answer);

  // Query with citations
  const result = await ask("Show me details", {
    includeCitations: true,
  });
  console.log(result.answer, result.citations);

  // Query with scope filtering
  const result = await ask("What's in my playlist?", {
    scope_filters: { playlist_id: "xyz123" },
  });

  // Query with both
  const result = await ask("Show everything", {
    includeCitations: true,
    scope_filters: { workspace_id: "acme" },
  });
  ```

#### `<TrainlyChat />` Component

- **NEW**: Added `scopeFilters` prop to filter all queries through the chat UI
- Component now manages its own message state internally
- Automatically applies scope filters to every message sent
- Example:

  ```typescript
  // Chat UI that only queries specific playlist
  <TrainlyChat
    scopeFilters={{ playlist_id: "playlist_123" }}
    showCitations={true}
    height="600px"
  />
  ```

### Breaking Changes

None - fully backward compatible. Legacy `askWithCitations()` function still works but is deprecated in favor of `ask(question, { includeCitations: true })`.

---

## Version 1.4.1 (October 2025)

### 🎯 New Feature: Scope Filtering for Queries

Added support for filtering query results by custom scope values, enabling users to query only specific segments of their data.

### API Changes

#### `ask(question, options?)`

- **NEW**: Added `scope_filters` option to filter query results
- Only retrieves chunks/documents matching ALL specified scope values
- Example:

  ```typescript
  // Query only documents from a specific playlist
  await ask("What are the features?", {
    scope_filters: { playlist_id: "playlist_123" },
  });

  // Query with multiple filters
  await ask("Show updates", {
    scope_filters: {
      workspace_id: "acme_corp",
      project: "alpha",
    },
  });
  ```

#### `<TrainlyChat />` Component

- **NEW**: Added `scopeFilters` prop to filter all chat queries
- All messages sent through the chat UI will automatically use the specified scope filters
- Example:

  ```typescript
  // Chat UI that only queries specific playlist data
  <TrainlyChat
    scopeFilters={{ playlist_id: "playlist_123" }}
    showCitations={true}
  />
  ```

### Backend Updates

- Added `scope_filters` parameter to `/v1/me/chats/query` endpoint
- Query results now respect scope filters via Neo4j WHERE clauses
- Empty scope_filters = search all user's data

### Documentation

- Updated README with scope filtering examples and use cases
- Added complete `ask()` API reference to SCOPES_GUIDE.md
- Emphasized "Zero Configuration" approach - no pre-setup needed

### Breaking Changes

None - fully backward compatible.

---

## Version 1.4.0 (October 2025)

### 🎉 New Feature: Custom Scopes Support

Added support for custom scopes, allowing developers to segment their data with custom attributes like `playlist_id`, `workspace_id`, `tenant_id`, etc.

### API Changes

#### `upload(file, scopeValues?)`

- **NEW**: Added optional `scopeValues` parameter
- Allows tagging uploaded files with custom attributes
- Example:
  ```typescript
  await upload(file, {
    playlist_id: "playlist_123",
    user_id: "user_456",
  });
  ```

#### `bulkUploadFiles(files, scopeValues?)`

- **NEW**: Added optional `scopeValues` parameter
- Applies the same scopes to all files in the bulk upload
- Example:
  ```typescript
  await bulkUploadFiles([file1, file2, file3], {
    workspace_id: "workspace_789",
    project_id: "project_001",
  });
  ```

### Type Updates

#### `TrainlyContextValue`

```typescript
interface TrainlyContextValue {
  upload: (
    file: File,
    scopeValues?: Record<string, string | number | boolean>,
  ) => Promise<UploadResult>;
  bulkUploadFiles: (
    files: File[],
    scopeValues?: Record<string, string | number | boolean>,
  ) => Promise<BulkUploadResult>;
  // ... other methods
}
```

### Backend Support

Both V1 OAuth endpoints now accept `scope_values`:

- `POST /v1/me/chats/files/upload` - Accepts `scope_values` as form parameter
- `POST /v1/me/chats/files/upload-bulk` - Accepts `scope_values` as form parameter

### Usage Examples

#### Basic Upload with Scopes

```typescript
import { useTrainly } from '@trainly/react';

function MyComponent() {
  const { upload } = useTrainly();

  const handleUpload = async (file: File) => {
    const result = await upload(file, {
      playlist_id: "playlist_123",
      user_id: "user_456",
      is_public: false
    });
    console.log('Uploaded with scopes:', result);
  };

  return <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />;
}
```

#### Bulk Upload with Scopes

```typescript
import { useTrainly } from '@trainly/react';

function BulkUploader() {
  const { bulkUploadFiles } = useTrainly();

  const handleBulkUpload = async (files: FileList) => {
    const result = await bulkUploadFiles(
      Array.from(files),
      {
        workspace_id: "workspace_789",
        project_id: "project_001",
        category: "documentation"
      }
    );
    console.log(`Uploaded ${result.successful_uploads} files with scopes`);
  };

  return (
    <input
      type="file"
      multiple
      onChange={(e) => handleBulkUpload(e.target.files)}
    />
  );
}
```

#### Using with TrainlyUpload Component

```typescript
import { TrainlyUpload } from '@trainly/react';

function MyApp() {
  const handleUploadSuccess = (result) => {
    console.log('File uploaded:', result);
  };

  return (
    <TrainlyUpload
      onSuccess={handleUploadSuccess}
      scopeValues={{
        playlist_id: "playlist_123",
        tenant_id: "tenant_456"
      }}
    />
  );
}
```

### Breaking Changes

**None!** The `scopeValues` parameter is optional and defaults to `{}` (no scopes), maintaining full backward compatibility with v1.3.x.

### Migration Guide

No migration needed! If you want to use scopes:

1. Configure scopes in your Trainly dashboard (API Settings → Custom Scopes)
2. Pass `scopeValues` when uploading:
   ```typescript
   await upload(file, { your_scope: "value" });
   ```
3. Query with scope filters via the backend API

### Important Notes

- Scope values must match the configured scope types (string, number, or boolean)
- Required scopes must be provided when uploading
- Scopes apply to both Document and Chunk nodes in Neo4j
- Backward compatible - existing code works without changes

### Full Documentation

See the main project documentation:

- `CUSTOM_SCOPING_GUIDE.md` - Complete guide
- `SCOPING_QUICK_REFERENCE.md` - Quick start
- `SCOPING_UI_GUIDE.md` - UI configuration guide

---

**Version**: 1.4.0
**Release Date**: October 2025
**Status**: ✅ Production Ready
