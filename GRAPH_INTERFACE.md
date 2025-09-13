# Graph Interface for TeachAI

## Overview

The Graph Interface provides users with granular access to their data stored in Neo4j through an interactive graph visualization. Users can directly interact with nodes and relationships in their knowledge graph, enabling better understanding and manipulation of their data.

## Features

### 🎯 Interactive Graph Visualization

- **Cytoscape.js Integration**: High-performance graph rendering with support for large datasets
- **Multiple Layout Options**:
  - Hierarchical (Dagre)
  - Force-directed (Cose-Bilkent)
  - Circle layout
  - Grid layout
- **Real-time Interaction**: Click nodes and relationships to view details
- **Zoom and Pan**: Navigate large graphs with mouse controls

### 📊 Node Management

- **View Node Details**: Display all properties and metadata
- **Edit Node Properties**: Modify node attributes directly in the interface
- **Delete Nodes**: Remove nodes and their relationships
- **Visual Categorization**: Different colors for different node types (Document, Chunk, etc.)

### 🔗 Relationship Management

- **View Relationships**: See all connections between nodes
- **Relationship Properties**: Access metadata about connections
- **Create New Relationships**: Connect nodes with custom relationship types

### 🎨 Visual Features

- **Color-coded Nodes**:
  - 🟢 Document nodes (green)
  - 🔵 Chunk nodes (blue)
  - 🟠 Person nodes (orange)
  - 🟣 Organization nodes (purple)
  - 🔴 Location nodes (red)
  - ⚫ Event nodes (gray)
- **Interactive Selection**: Visual feedback for selected elements
- **Responsive Design**: Works on desktop and tablet devices

## Usage

### Accessing the Graph Interface

1. Navigate to any chat in your dashboard
2. Click on the **"Graph View"** option in the sidebar (🌐 Network icon)
3. The graph interface will load showing all nodes and relationships for that chat

### Navigation Controls

- **Refresh**: Reload graph data from Neo4j
- **Zoom In/Out**: Adjust graph scale
- **Center**: Fit all nodes in view
- **Layout Selector**: Choose different graph layouts

### Interacting with Nodes

1. **Select a Node**: Click on any node to view its details in the side panel
2. **Edit Properties**:
   - Click the edit button (✏️) in the node details panel
   - Modify properties in the form
   - Click "Save" to update the database
3. **Delete Node**: Click the delete button (🗑️) and confirm deletion

### Working with Relationships

1. **Select a Relationship**: Click on any edge/line between nodes
2. **View Details**: See relationship type and properties
3. **Create Relationships**: Use the API endpoints to programmatically create new connections

## API Endpoints

The graph interface uses these backend endpoints:

### GET `/graph_data/{chat_id}`

Retrieves all nodes and relationships for a specific chat.

**Response:**

```json
{
  "nodes": [
    {
      "id": "123",
      "labels": ["Document"],
      "properties": {
        "id": "doc-1",
        "chatId": "chat-123",
        "filename": "example.pdf"
      }
    }
  ],
  "relationships": [
    {
      "id": "456",
      "source": "123",
      "target": "789",
      "type": "HAS_CHUNK",
      "properties": {
        "order": 0
      }
    }
  ]
}
```

### GET `/node_details/{node_id}`

Get detailed information about a specific node.

### PUT `/update_node/{node_id}`

Update properties of a specific node.

**Request Body:**

```json
{
  "property1": "new_value",
  "property2": "updated_value"
}
```

### DELETE `/delete_node/{node_id}`

Delete a specific node and all its relationships.

### POST `/create_relationship`

Create a new relationship between two nodes.

**Request Body:**

```json
{
  "source_id": "123",
  "target_id": "456",
  "relationship_type": "RELATES_TO",
  "properties": {
    "strength": 0.8
  }
}
```

## Technical Architecture

### Frontend Components

- **GraphVisualization.tsx**: Main graph component using Cytoscape.js
- **Graph Page**: Next.js page at `/dashboard/[chatId]/graph`
- **Sidebar Integration**: Navigation link in the main sidebar

### Backend Integration

- **FastAPI Endpoints**: RESTful API for graph operations
- **Neo4j Driver**: Direct database connectivity
- **CORS Support**: Cross-origin requests enabled

### Dependencies

- `cytoscape`: Core graph visualization library
- `cytoscape-dagre`: Hierarchical layout algorithm
- `cytoscape-cose-bilkent`: Force-directed layout algorithm
- `@types/cytoscape`: TypeScript type definitions

## Data Privacy & Security

- **Chat-Scoped Data**: Users can only access nodes from their own chats
- **Authentication Required**: All API endpoints require user authentication
- **Granular Access**: Users have full control over their data visualization and modification

## Future Enhancements

- **Search and Filter**: Find specific nodes or relationships
- **Export Options**: Save graph visualizations as images
- **Bulk Operations**: Select and modify multiple nodes at once
- **Advanced Layouts**: Additional layout algorithms and customization
- **Real-time Updates**: Live synchronization with database changes
- **Graph Analytics**: Metrics and insights about the knowledge graph

## Troubleshooting

### Common Issues

1. **Graph not loading**: Check if the backend server is running and accessible
2. **Empty graph**: Ensure the chat has uploaded documents and generated nodes
3. **Performance issues**: Try switching to a simpler layout for large graphs
4. **Node updates not saving**: Verify the API endpoints are properly configured

### Performance Tips

- Use the "Hierarchical" layout for large graphs (best performance)
- Limit the number of nodes displayed for very large datasets
- Refresh the graph periodically to ensure data consistency

## Support

For issues or feature requests related to the graph interface, please check the console logs and ensure all dependencies are properly installed.
