# Custom Scoping System Guide

## Overview

The Trainly Custom Scoping System allows developers to define custom attributes (scopes) for segmenting data within their RAG applications. This is perfect for multi-tenant applications, playlist-based systems, workspace-based apps, or any scenario where you need to filter data by custom attributes.

## Key Concepts

### What are Scopes?

Scopes are custom attributes you can attach to your documents and chunks in the knowledge graph. They allow you to:

- **Segment Data**: Keep data for different users, workspaces, or projects separate
- **Filter Queries**: Only retrieve data relevant to a specific scope
- **Multi-tenant Apps**: Build apps where each user/tenant has isolated data
- **Flexible Architecture**: Define any custom attributes you need

### Example Use Cases

1. **AI Playlist App**: Use `playlist_id` to keep songs and data specific to each playlist
2. **Workspace App**: Use `workspace_id` and `project_id` to organize team data
3. **Multi-tenant SaaS**: Use `tenant_id` and `user_id` to isolate customer data
4. **Educational Platform**: Use `course_id` and `module_id` to organize learning materials

## API Endpoints

### 1. Configure Scopes

Define custom scopes for your chat/app.

**Endpoint**: `POST /v1/{chat_id}/scopes/configure`

**Headers**:

```
Authorization: Bearer <your_api_key>
Content-Type: application/json
```

**Request Body**:

```json
{
  "scopes": [
    {
      "name": "playlist_id",
      "type": "string",
      "required": true,
      "description": "ID of the playlist this document belongs to"
    },
    {
      "name": "workspace_id",
      "type": "string",
      "required": false,
      "description": "Optional workspace identifier"
    },
    {
      "name": "is_public",
      "type": "boolean",
      "required": false,
      "description": "Whether this content is publicly accessible"
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "message": "Scope configuration saved successfully",
  "chat_id": "your_chat_id",
  "scopes": [
    {
      "name": "playlist_id",
      "type": "string",
      "required": true,
      "description": "ID of the playlist this document belongs to"
    }
  ]
}
```

### 2. Get Scope Configuration

Retrieve the current scope configuration.

**Endpoint**: `GET /v1/{chat_id}/scopes`

**Headers**:

```
Authorization: Bearer <your_api_key>
```

**Response**:

```json
{
  "chat_id": "your_chat_id",
  "scopes": [
    {
      "name": "playlist_id",
      "type": "string",
      "required": true,
      "description": "ID of the playlist this document belongs to"
    }
  ]
}
```

### 3. Upload File with Scopes

Upload a document with custom scope values.

**Endpoint**: `POST /v1/{chat_id}/upload_with_scopes`

**Headers**:

```
Authorization: Bearer <your_api_key>
```

**Form Data**:

```
file: <your_file.pdf>
scope_values: {"playlist_id": "playlist_123", "workspace_id": "workspace_456"}
```

**Response**:

```json
{
  "success": true,
  "filename": "document.pdf",
  "file_id": "chat_xxxxx_document.pdf_1234567890",
  "chat_id": "your_chat_id",
  "scope_values": {
    "playlist_id": "playlist_123",
    "workspace_id": "workspace_456"
  },
  "size_bytes": 12345,
  "message": "File uploaded successfully with custom scope values"
}
```

### 4. Query with Scope Filters

Query your knowledge base with scope filters.

**Endpoint**: `POST /v1/{chat_id}/answer_question`

**Headers**:

```
Authorization: Bearer <your_api_key>
Content-Type: application/json
```

**Request Body**:

```json
{
  "question": "What are the best practices for API design?",
  "scope_filters": {
    "playlist_id": "playlist_123",
    "workspace_id": "workspace_456"
  },
  "selected_model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response**:

```json
{
  "answer": "Based on your playlist documents...",
  "context": [
    {
      "chunk_id": "...",
      "chunk_text": "...",
      "score": 0.95
    }
  ],
  "chat_id": "your_chat_id",
  "model": "gpt-4o-mini",
  "usage": {...}
}
```

### 5. Delete Scope Configuration

Clear all scope configurations (doesn't remove existing scope data from nodes).

**Endpoint**: `DELETE /v1/{chat_id}/scopes`

**Headers**:

```
Authorization: Bearer <your_api_key>
```

**Response**:

```json
{
  "success": true,
  "message": "Scope configuration cleared",
  "chat_id": "your_chat_id"
}
```

## Complete Example: Building a Playlist App

### Step 1: Configure Scopes

```bash
curl -X POST https://api.trainlyai.com/v1/your_chat_id/scopes/configure \
  -H "Authorization: Bearer tk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "scopes": [
      {
        "name": "playlist_id",
        "type": "string",
        "required": true,
        "description": "ID of the playlist"
      },
      {
        "name": "user_id",
        "type": "string",
        "required": true,
        "description": "Owner of the playlist"
      }
    ]
  }'
```

### Step 2: Upload Documents for Different Playlists

```bash
# Upload to Playlist 1
curl -X POST https://api.trainlyai.com/v1/your_chat_id/upload_with_scopes \
  -H "Authorization: Bearer tk_your_api_key" \
  -F "file=@playlist1_songs.pdf" \
  -F 'scope_values={"playlist_id": "playlist_001", "user_id": "user_123"}'

# Upload to Playlist 2
curl -X POST https://api.trainlyai.com/v1/your_chat_id/upload_with_scopes \
  -H "Authorization: Bearer tk_your_api_key" \
  -F "file=@playlist2_songs.pdf" \
  -F 'scope_values={"playlist_id": "playlist_002", "user_id": "user_123"}'
```

### Step 3: Query Specific Playlist

```bash
# Query only Playlist 1
curl -X POST https://api.trainlyai.com/v1/your_chat_id/answer_question \
  -H "Authorization: Bearer tk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What songs are in this playlist?",
    "scope_filters": {
      "playlist_id": "playlist_001"
    }
  }'
```

The response will ONLY include data from `playlist_001`, ensuring complete data isolation between playlists.

## Scope Types

### String Type

```json
{
  "name": "playlist_id",
  "type": "string",
  "required": true
}
```

- Used for: IDs, names, categories
- Max length: 255 characters
- Example values: `"playlist_123"`, `"workspace_abc"`

### Number Type

```json
{
  "name": "priority_level",
  "type": "number",
  "required": false
}
```

- Used for: Numeric identifiers, priorities, levels
- Accepts: integers and floats
- Example values: `1`, `42`, `3.14`

### Boolean Type

```json
{
  "name": "is_public",
  "type": "boolean",
  "required": false
}
```

- Used for: flags, toggles
- Accepts: `true` or `false`
- Example values: `true`, `false`

## Validation Rules

1. **Scope Names**:
   - Must start with a letter
   - Can contain: letters, numbers, underscores, hyphens
   - Max length: 64 characters
   - Examples: `playlist_id`, `workspace-id`, `userId123`

2. **Required Scopes**:
   - If a scope is marked `required: true`, you MUST provide it when uploading files
   - Queries can filter by any scope, required or not

3. **Type Validation**:
   - Values must match the defined type
   - String values are automatically sanitized
   - Number values must be valid numbers
   - Boolean values must be true/false

## Best Practices

### 1. Plan Your Scope Hierarchy

Think about how your data will be organized:

- **Tenant > Workspace > Project**: `tenant_id`, `workspace_id`, `project_id`
- **User > Playlist > Song**: `user_id`, `playlist_id`
- **Course > Module > Lesson**: `course_id`, `module_id`, `lesson_id`

### 2. Use Required Scopes for Critical Isolation

Mark scopes as `required: true` if they're essential for data isolation:

```json
{
  "name": "tenant_id",
  "type": "string",
  "required": true // Ensures every document belongs to a tenant
}
```

### 3. Combine Scopes for Fine-Grained Control

You can filter by multiple scopes simultaneously:

```json
{
  "scope_filters": {
    "tenant_id": "tenant_123",
    "workspace_id": "workspace_456",
    "is_public": false
  }
}
```

### 4. Keep Scope Names Consistent

Use consistent naming conventions:

- ✅ `user_id`, `playlist_id`, `workspace_id`
- ❌ `userId`, `PlaylistID`, `workspace-Id`

### 5. Document Your Scopes

Add descriptions to help your team understand each scope:

```json
{
  "name": "playlist_id",
  "type": "string",
  "required": true,
  "description": "Unique identifier for the AI playlist. Used to isolate songs and recommendations per playlist."
}
```

## Migration Guide

### Adding Scopes to Existing Chat

If you have existing data without scopes:

1. **Configure the scopes** (as shown above)
2. **New uploads** will include scopes
3. **Existing data** won't have scope attributes (will be excluded from filtered queries)
4. **Option**: Re-upload existing documents with appropriate scope values

### Updating Existing Nodes (Advanced)

If you need to add scopes to existing nodes, you can use Neo4j directly:

```cypher
// Add scope to all documents in a chat
MATCH (d:Document {chatId: 'your_chat_id'})
SET d.playlist_id = 'default_playlist'

// Add scope to all chunks
MATCH (c:Chunk {chatId: 'your_chat_id'})
SET c.playlist_id = 'default_playlist'
```

## Limitations & Notes

1. **In-Memory Storage**: Current implementation stores scope configs in memory. In production, these would be persisted to a database (Convex).

2. **Backward Compatibility**: Existing endpoints work without scopes. Scopes are optional and additive.

3. **Query Performance**: Filtering by scopes is efficient as it's done at the Neo4j query level before embedding comparisons.

4. **Scope Changes**: Changing scope configuration doesn't affect existing nodes. You'll need to re-upload documents or update nodes manually.

## Troubleshooting

### "Required scope 'playlist_id' is missing"

**Solution**: Make sure to provide all required scopes when uploading:

```bash
-F 'scope_values={"playlist_id": "playlist_123"}'
```

### "Invalid scope name"

**Solution**: Ensure scope names follow the naming rules (start with letter, alphanumeric + underscore/hyphen only)

### No results when querying with scope filters

**Possible causes**:

- Documents weren't uploaded with those scope values
- Scope values don't match (case-sensitive)
- No documents match the filter criteria

**Debug**: Try querying without scope filters first to see if documents exist.

## Support

For questions or issues with the Custom Scoping System:

1. Check this documentation
2. Review the API response error messages
3. Contact support with your `chat_id` and scope configuration

## Examples in Different Languages

### Python

```python
import requests

# Configure scopes
response = requests.post(
    f"https://api.trainlyai.com/v1/{chat_id}/scopes/configure",
    headers={"Authorization": f"Bearer {api_key}"},
    json={
        "scopes": [
            {
                "name": "playlist_id",
                "type": "string",
                "required": True
            }
        ]
    }
)

# Upload with scopes
files = {"file": open("document.pdf", "rb")}
data = {"scope_values": json.dumps({"playlist_id": "playlist_123"})}
response = requests.post(
    f"https://api.trainlyai.com/v1/{chat_id}/upload_with_scopes",
    headers={"Authorization": f"Bearer {api_key}"},
    files=files,
    data=data
)

# Query with scope filters
response = requests.post(
    f"https://api.trainlyai.com/v1/{chat_id}/answer_question",
    headers={"Authorization": f"Bearer {api_key}"},
    json={
        "question": "What are the best practices?",
        "scope_filters": {"playlist_id": "playlist_123"}
    }
)
```

### JavaScript/TypeScript

```typescript
// Configure scopes
const configResponse = await fetch(
  `https://api.trainlyai.com/v1/${chatId}/scopes/configure`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scopes: [
        {
          name: "playlist_id",
          type: "string",
          required: true,
        },
      ],
    }),
  },
);

// Upload with scopes
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append(
  "scope_values",
  JSON.stringify({
    playlist_id: "playlist_123",
  }),
);

const uploadResponse = await fetch(
  `https://api.trainlyai.com/v1/${chatId}/upload_with_scopes`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  },
);

// Query with scope filters
const queryResponse = await fetch(
  `https://api.trainlyai.com/v1/${chatId}/answer_question`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: "What are the best practices?",
      scope_filters: {
        playlist_id: "playlist_123",
      },
    }),
  },
);
```

---

**Last Updated**: October 2025
**Version**: 1.0
