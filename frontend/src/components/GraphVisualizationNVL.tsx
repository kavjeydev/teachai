"use client";

import React, { useEffect, useRef, useState } from "react";
import { NVL } from "@neo4j-nvl/base";
import {
  ClickInteraction,
  DragNodeInteraction,
  PanInteraction,
  ZoomInteraction,
  HoverInteraction,
} from "@neo4j-nvl/interaction-handlers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "./textarea";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

interface GraphRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

interface GraphVisualizationProps {
  chatId: string;
  baseUrl: string;
}

const GraphVisualizationNVL: React.FC<GraphVisualizationProps> = ({
  chatId,
  baseUrl,
}) => {
  const nvlRef = useRef<HTMLDivElement>(null);
  const nvlInstance = useRef<any>(null);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    relationships: [],
  });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedRelationship, setSelectedRelationship] =
    useState<GraphRelationship | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  // Relationship creation state
  const [creatingRelationship, setCreatingRelationship] = useState(false);
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<string>("RELATES_TO");
  const [relationshipProperties, setRelationshipProperties] = useState<
    Record<string, any>
  >({});

  // Relationship editing state
  const [editingRelationship, setEditingRelationship] =
    useState<GraphRelationship | null>(null);
  const [relationshipEditForm, setRelationshipEditForm] = useState<
    Record<string, any>
  >({});

  // ID mapping to handle NVL's internal IDs vs our backend IDs
  const [nvlIdToBackendId, setNvlIdToBackendId] = useState<
    Record<string, string>
  >({});
  const [backendIdToNvlId, setBackendIdToNvlId] = useState<
    Record<string, string>
  >({});

  // Initialize NVL with interaction handlers
  useEffect(() => {
    if (!nvlRef.current) return;

    try {
      // Initialize NVL with performance-optimized configuration
      nvlInstance.current = new NVL(
        nvlRef.current,
        [], // Initial empty nodes
        [], // Initial empty relationships
        {
          layout: "forceDirected",
          allowDynamicMinZoom: true,
          maxZoom: 3,
          minZoom: 0.1,
          renderer: "webgl", // Use WebGL for better performance
          relationshipThreshold: 0.5, // Hide relationships when zoomed out for performance
          nodeThreshold: 0.3, // Hide node labels when zoomed out
          enableNodeDragging: true,
          enablePanning: true,
          enableZooming: true,
          // Performance optimizations
          animationDuration: 200, // Faster animations
          stabilizationIterations: 50, // Fewer layout iterations
        },
        {
          onError: (error: Error) => {
            console.error("NVL Error:", error);
            toast.error("Graph visualization error");
          },
        },
      );

      // Set up interaction handlers
      const dragInteraction = new DragNodeInteraction(nvlInstance.current);
      const panInteraction = new PanInteraction(nvlInstance.current);
      const zoomInteraction = new ZoomInteraction(nvlInstance.current);
      const hoverInteraction = new HoverInteraction(nvlInstance.current);

      // Configure drag interactions with optimized debouncing
      let dragTimeout: NodeJS.Timeout;
      let dragCount = 0;

      dragInteraction.updateCallback("onDrag", (nodes: any[]) => {
        dragCount++;
        // Only log every 10th drag event to reduce console spam

        // Clear previous timeout
        clearTimeout(dragTimeout);

        // Set new timeout to update positions after drag stops
        dragTimeout = setTimeout(() => {
          // Only show toast for significant drags to reduce UI noise
          if (dragCount > 5) {
            toast.success("Node positions saved", { duration: 1000 });
          }
          dragCount = 0; // Reset counter
        }, 800); // Longer delay to ensure drag is really finished
      });

      // Set up manual event listeners using NVL's getHits method
      if (nvlRef.current) {
        // Single click handler
        nvlRef.current.addEventListener("click", (evt: MouseEvent) => {
          const { nvlTargets } = nvlInstance.current.getHits(evt);

          if (nvlTargets.nodes.length > 0) {
            // Node clicked
            const node = nvlTargets.nodes[0];
            handleNodeClick(node.data);
          } else if (nvlTargets.relationships.length > 0) {
            // Relationship clicked
            const rel = nvlTargets.relationships[0];
            handleRelationshipClick(rel.data);
          } else {
            // Canvas clicked
            if (creatingRelationship) {
              cancelRelationshipCreation();
            } else {
              setSelectedNode(null);
              setSelectedRelationship(null);
              setEditingNode(null);
            }
          }
        });

        // Double click handler
        nvlRef.current.addEventListener("dblclick", (evt: MouseEvent) => {
          const { nvlTargets } = nvlInstance.current.getHits(evt);

          if (nvlTargets.nodes.length > 0) {
            const node = nvlTargets.nodes[0];
            handleNodeDoubleClick(node.data);
          }
        });
      }
    } catch (error) {
      console.error("Error initializing NVL:", error);
      toast.error("Failed to initialize graph visualization");
      return;
    }

    return () => {
      if (nvlInstance.current) {
        nvlInstance.current.destroy();
      }
    };
  }, []);

  // Event handler functions for NVL
  const handleNodeClick = (nodeEventData: any) => {
    // For single clicks, the node data might be in different places
    let nodeData, nodeId;

    if (nodeEventData.data) {
      // Event wrapper format
      nodeData = nodeEventData.data;
      nodeId = nodeData?.id;
    } else {
      // Direct node data format
      nodeData = nodeEventData;
      nodeId = nodeEventData?.id;
    }

    if (!nodeId) {
      return;
    }

    if (creatingRelationship) {
      handleRelationshipNodeClick(nodeId);
    } else {
      // Try multiple approaches to find the node data
      let fullNodeData = null;

      // Approach 1: Use ID mapping
      const backendId = nvlIdToBackendId[nodeId];

      if (backendId) {
        fullNodeData = graphData.nodes.find((n) => n.id === backendId);
      }

      // Approach 2: If graphData is empty but we have NVL node data, use it directly
      if (
        !fullNodeData &&
        graphData.nodes.length === 0 &&
        nodeEventData.properties
      ) {
        fullNodeData = {
          id: nodeEventData.properties.backendId || nodeId,
          labels: nodeEventData.properties.labels
            ? nodeEventData.properties.labels.split(", ")
            : ["Unknown"],
          properties: nodeEventData.properties,
        };
      }

      if (fullNodeData) {
        setSelectedNode(fullNodeData);
        setSelectedRelationship(null);
        setEditingNode(null);
        setEditingRelationship(null);

        // Visual feedback - highlight selected node
        if (nvlInstance.current) {
          // Deselect all nodes first
          nvlInstance.current.deselectAll();
          // Select the clicked node
          const selectedNodeUpdate = {
            id: nodeId,
            selected: true,
            captions: [{ value: getNodeDisplayLabel(fullNodeData) }],
            size: fullNodeData.labels.includes("Document") ? 80 : 60,
            color: getNodeColor(fullNodeData.labels[0]),
          };
          nvlInstance.current.addAndUpdateElementsInGraph(
            [selectedNodeUpdate],
            [],
          );
        }
      }
    }
  };

  const handleNodeDoubleClick = (nodeEventData: any) => {
    if (creatingRelationship) {
      return;
    }

    // For double-clicks, the data is directly in the event (not in .data property)
    const nodeId = nodeEventData?.id;

    if (!nodeId) {
      toast.error("Could not identify node for editing");
      return;
    }

    // Try multiple approaches to find the node data for editing
    let fullNodeData = null;

    // Approach 1: Use ID mapping
    const backendId = nvlIdToBackendId[nodeId];

    if (backendId) {
      fullNodeData = graphData.nodes.find((n) => n.id === backendId);
    }

    // Approach 2: If graphData is empty but we have NVL node data, use it directly
    if (
      !fullNodeData &&
      graphData.nodes.length === 0 &&
      nodeEventData.properties
    ) {
      fullNodeData = {
        id: nodeEventData.properties.backendId || nodeId,
        labels: nodeEventData.properties.labels
          ? nodeEventData.properties.labels.split(", ")
          : ["Unknown"],
        properties: nodeEventData.properties,
      };
    }

    if (fullNodeData) {
      setEditingNode(fullNodeData);
      setEditForm({ ...fullNodeData.properties });
      setSelectedNode(fullNodeData);

      // Clear other states
      setSelectedRelationship(null);
      setCreatingRelationship(false);
      setEditingRelationship(null);

      toast.success("Edit mode activated! Modify properties in sidebar.");
    } else {
      toast.error("Could not find node data for editing");
    }
  };

  const handleRelationshipClick = (relEventData: any) => {
    if (creatingRelationship) return;

    // Extract the actual relationship data
    const relData = relEventData.data;
    const relId = relData?.id;

    if (!relId) {
      return;
    }

    const fullRelData = graphData.relationships.find((r) => r.id === relId);

    if (fullRelData) {
      setSelectedRelationship(fullRelData);
      setSelectedNode(null);
      setEditingNode(null);
      setEditingRelationship(null);
      toast.success("Relationship selected - view details in sidebar");
    }
  };

  // Handle relationship creation node clicks
  const handleRelationshipNodeClick = (nodeId: string) => {
    if (!sourceNode) {
      setSourceNode(nodeId);

      // Visual feedback - highlight source node
      if (nvlInstance.current) {
        const sourceNodeUpdate = {
          id: nodeId,
          selected: true,
          color: "#2196F3", // Blue for source
        };
        nvlInstance.current.addAndUpdateElementsInGraph([sourceNodeUpdate], []);
      }

      toast.success(
        "Source node selected (blue). Click another node to create relationship.",
      );
    } else if (sourceNode !== nodeId) {
      setTargetNode(nodeId);

      // Visual feedback - highlight target node
      if (nvlInstance.current) {
        const targetNodeUpdate = {
          id: nodeId,
          selected: true,
          color: "#4CAF50", // Green for target
        };
        nvlInstance.current.addAndUpdateElementsInGraph([targetNodeUpdate], []);
      }

      toast.success(
        "Target node selected (green)! Configure relationship in the sidebar.",
      );
    } else {
      toast.error("Cannot create relationship to the same node.");
    }
  };

  // Load graph data
  const loadGraphData = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}graph_data/${chatId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Backend error:", errorText);
        throw new Error(
          `Failed to load graph data: ${response.status} ${errorText}`,
        );
      }

      const data: GraphData = await response.json();

      if (!data.nodes || data.nodes.length === 0) {
        toast.warning(
          "No graph data found for this chat. Upload a file first.",
        );
        setGraphData({ nodes: [], relationships: [] });
        return;
      }

      setGraphData(data);

      // Convert to NVL format with proper captions and properties
      // Use the backend node ID directly to maintain consistency
      const nvlNodes = data.nodes.map((node) => ({
        id: node.id, // Use the backend ID directly
        captions: [{ value: getNodeDisplayLabel(node) }],
        size: node.labels.includes("Document") ? 80 : 60,
        color: getNodeColor(node.labels[0]),
        properties: {
          ...node.properties,
          labels: node.labels.join(", "),
          backendId: node.id, // Store the backend ID for reference
        },
      }));

      const nvlRelationships = data.relationships.map((rel) => ({
        id: rel.id,
        from: rel.source,
        to: rel.target,
        captions: [{ value: rel.type }], // Use captions array for relationship labels
        color: getRelationshipColor(rel.type),
        width: getRelationshipWidth(rel.type),
        properties: {
          ...rel.properties,
          type: rel.type, // Store original type
        },
      }));

      if (nvlInstance.current) {
        try {
          // Use the correct NVL API method
          nvlInstance.current.addAndUpdateElementsInGraph(
            nvlNodes,
            nvlRelationships,
          );

          // Debug: Check what NVL actually has after rendering and create ID mapping
          setTimeout(() => {
            const nvlNodes = nvlInstance.current.getNodes();
            const nvlRels = nvlInstance.current.getRelationships();

            // Create ID mapping between NVL internal IDs and our backend IDs
            const nvlToBackend: Record<string, string> = {};
            const backendToNvl: Record<string, string> = {};

            nvlNodes.forEach((nvlNode: any) => {
              // Try to find the corresponding backend node
              const backendNode = data.nodes.find(
                (n) =>
                  n.properties.id === nvlNode.properties?.id ||
                  n.id === nvlNode.properties?.backendId,
              );

              if (backendNode) {
                nvlToBackend[nvlNode.id] = backendNode.id;
                backendToNvl[backendNode.id] = nvlNode.id;
              }
            });

            setNvlIdToBackendId(nvlToBackend);
            setBackendIdToNvlId(backendToNvl);
          }, 1000);
        } catch (renderError) {
          console.error("Error rendering NVL graph:", renderError);
          toast.error("Failed to render graph data");
        }
      }

      toast.success("Graph data loaded successfully");
    } catch (error) {
      console.error("Error loading graph data:", error);
      toast.error("Failed to load graph data");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getNodeDisplayLabel = (node: GraphNode): string => {
    if (node.properties.text) {
      return node.properties.text.substring(0, 30) + "...";
    }
    if (node.properties.id) {
      return node.properties.id.toString();
    }
    return node.labels[0] || "Node";
  };

  const getNodeColor = (label: string): string => {
    const colors: Record<string, string> = {
      Document: "#4CAF50",
      Chunk: "#2196F3",
      Person: "#FF9800",
      Organization: "#9C27B0",
      Location: "#F44336",
      Event: "#607D8B",
      default: "#757575",
    };
    return colors[label] || colors.default;
  };

  const getRelationshipColor = (type: string): string => {
    const colors: Record<string, string> = {
      NEXT: "#cccccc",
      HAS_CHUNK: "#666666",
      EXPLAINS: "#4CAF50",
      SUPPORTS: "#2196F3",
      CONTRADICTS: "#F44336",
      ELABORATES: "#FF9800",
      INTRODUCES: "#9C27B0",
      CONCLUDES: "#607D8B",
      REFERENCES: "#795548",
      DEPENDS_ON: "#E91E63",
      FOLLOWS: "#00BCD4",
      COMPARES: "#FFEB3B",
      EXEMPLIFIES: "#8BC34A",
      default: "#cccccc",
    };
    return colors[type] || colors.default;
  };

  const getRelationshipWidth = (type: string): number => {
    const widths: Record<string, number> = {
      NEXT: 2,
      HAS_CHUNK: 3,
      EXPLAINS: 4,
      SUPPORTS: 4,
      CONTRADICTS: 4,
      ELABORATES: 3,
      default: 3,
    };
    return widths[type] || widths.default;
  };

  // Relationship creation functions
  const startRelationshipCreation = () => {
    setCreatingRelationship(true);
    setSourceNode(null);
    setTargetNode(null);
    setRelationshipType("RELATES_TO");
    setRelationshipProperties({});
    toast.success("Click on a node to start creating a relationship.");
  };

  const cancelRelationshipCreation = () => {
    // Reset visual feedback
    if (nvlInstance.current && (sourceNode || targetNode)) {
      nvlInstance.current.deselectAll();
      // Reload the graph to reset colors
      loadGraphData();
    }

    setCreatingRelationship(false);
    setSourceNode(null);
    setTargetNode(null);
    toast.info("Relationship creation cancelled.");
  };

  const saveRelationship = async () => {
    if (!sourceNode || !targetNode) {
      toast.error("Please select both source and target nodes.");
      return;
    }

    try {
      const response = await fetch(`${baseUrl}create_relationship`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_id: sourceNode,
          target_id: targetNode,
          relationship_type: relationshipType,
          properties: relationshipProperties,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create relationship");
      }

      const newRelationship = await response.json();

      // Update local state
      setGraphData((prev) => ({
        ...prev,
        relationships: [...prev.relationships, newRelationship],
      }));

      // Update NVL visualization immediately
      if (nvlInstance.current) {
        const nvlRelationship = {
          id: newRelationship.id,
          from: newRelationship.source,
          to: newRelationship.target,
          captions: [{ value: newRelationship.type }],
          color: getRelationshipColor(newRelationship.type),
          width: getRelationshipWidth(newRelationship.type),
          properties: {
            ...newRelationship.properties,
            type: newRelationship.type,
          },
        };

        nvlInstance.current.addAndUpdateElementsInGraph([], [nvlRelationship]);
      }

      toast.success("Relationship created successfully!");
      cancelRelationshipCreation();
    } catch (error) {
      console.error("Error creating relationship:", error);
      toast.error("Failed to create relationship");
    }
  };

  // Node operations
  const handleEditNode = () => {
    if (!selectedNode) return;
    setEditingNode(selectedNode);
    setEditForm({ ...selectedNode.properties });
  };

  const handleSaveNode = async () => {
    if (!editingNode) return;

    try {
      // Only send the text field for update
      const updateData = {
        text: editForm.text,
      };

      const response = await fetch(`${baseUrl}update_node/${editingNode.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update node");
      }

      // Update the local state with only the text change
      const updatedNode = {
        ...editingNode,
        properties: {
          ...editingNode.properties,
          text: editForm.text,
        },
      };
      setSelectedNode(updatedNode);

      // Update the graph data state
      setGraphData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === editingNode.id ? updatedNode : n,
        ),
      }));

      // Update the visual representation in NVL
      if (nvlInstance.current) {
        const updatedNvlNode = {
          id: editingNode.id,
          captions: [{ value: getNodeDisplayLabel(updatedNode) }],
          size: updatedNode.labels.includes("Document") ? 80 : 60,
          color: getNodeColor(updatedNode.labels[0]),
          properties: {
            ...editForm,
            labels: updatedNode.labels.join(", "),
          },
        };

        nvlInstance.current.addAndUpdateElementsInGraph([updatedNvlNode], []);
      }

      toast.success("Node updated successfully");
      setEditingNode(null);
    } catch (error) {
      console.error("Error updating node:", error);
      toast.error("Failed to update node");
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;

    if (
      !confirm(
        "Are you sure you want to delete this node? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}delete_node/${selectedNode.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete node");
      }

      // Update local state
      setGraphData((prev) => ({
        nodes: prev.nodes.filter((n) => n.id !== selectedNode.id),
        relationships: prev.relationships.filter(
          (r) => r.source !== selectedNode.id && r.target !== selectedNode.id,
        ),
      }));

      // Update NVL visualization
      if (nvlInstance.current) {
        nvlInstance.current.removeNodesWithIds([selectedNode.id]);
      }

      toast.success("Node deleted successfully");
      setSelectedNode(null);
    } catch (error) {
      console.error("Error deleting node:", error);
      toast.error("Failed to delete node");
    }
  };

  // Relationship operations
  const handleEditRelationship = () => {
    if (!selectedRelationship) return;
    setEditingRelationship(selectedRelationship);
    setRelationshipEditForm({
      type: selectedRelationship.type,
      ...selectedRelationship.properties,
    });
  };

  const handleSaveRelationship = async () => {
    if (!editingRelationship) return;

    try {
      // For now, we'll update the relationship type and properties
      // Note: Neo4j doesn't allow changing relationship type directly,
      // so we'd need to delete and recreate. For properties, we can update.

      const response = await fetch(
        `${baseUrl}update_relationship/${editingRelationship.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(relationshipEditForm),
        },
      );

      if (response.ok) {
        // Update local state
        const updatedRel = {
          ...editingRelationship,
          properties: relationshipEditForm,
          type: relationshipEditForm.type || editingRelationship.type,
        };
        setSelectedRelationship(updatedRel);

        setGraphData((prev) => ({
          ...prev,
          relationships: prev.relationships.map((r) =>
            r.id === editingRelationship.id ? updatedRel : r,
          ),
        }));

        // Update NVL visualization
        if (nvlInstance.current) {
          const updatedNvlRel = {
            id: editingRelationship.id,
            from: editingRelationship.source,
            to: editingRelationship.target,
            captions: [{ value: updatedRel.type }],
            color: getRelationshipColor(updatedRel.type),
            width: getRelationshipWidth(updatedRel.type),
            properties: relationshipEditForm,
          };

          nvlInstance.current.addAndUpdateElementsInGraph([], [updatedNvlRel]);
        }

        toast.success("Relationship updated successfully");
        setEditingRelationship(null);
      } else {
        toast.error("Failed to update relationship");
      }
    } catch (error) {
      console.error("Error updating relationship:", error);
      toast.error("Failed to update relationship");
    }
  };

  const handleDeleteRelationship = async () => {
    if (!selectedRelationship) return;

    if (!confirm("Are you sure you want to delete this relationship?")) {
      return;
    }

    try {
      const response = await fetch(
        `${baseUrl}delete_relationship/${selectedRelationship.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        // Update local state
        setGraphData((prev) => ({
          ...prev,
          relationships: prev.relationships.filter(
            (r) => r.id !== selectedRelationship.id,
          ),
        }));

        // Update NVL visualization
        if (nvlInstance.current) {
          nvlInstance.current.removeRelationshipsWithIds([
            selectedRelationship.id,
          ]);
        }

        toast.success("Relationship deleted successfully");
        setSelectedRelationship(null);
      } else {
        toast.error("Failed to delete relationship");
      }
    } catch (error) {
      console.error("Error deleting relationship:", error);
      toast.error("Failed to delete relationship");
    }
  };

  // Graph controls using correct NVL API
  const handleZoomIn = () => {
    if (nvlInstance.current) {
      const currentZoom = nvlInstance.current.getScale();
      nvlInstance.current.setZoom(currentZoom * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (nvlInstance.current) {
      const currentZoom = nvlInstance.current.getScale();
      nvlInstance.current.setZoom(currentZoom * 0.8);
    }
  };

  const handleCenter = () => {
    if (nvlInstance.current) {
      nvlInstance.current.fit();
    }
  };

  const handleLayout = (layoutType: string) => {
    if (nvlInstance.current) {
      const layoutMap: Record<string, string> = {
        hierarchical: "hierarchical",
        force: "forceDirected",
        circular: "forceDirected", // NVL might not have circular
        grid: "forceDirected", // NVL might not have grid
      };
      nvlInstance.current.setLayout(layoutMap[layoutType] || "forceDirected");
    }
  };

  // Load data on mount
  useEffect(() => {
    loadGraphData();
  }, [chatId]);

  return (
    <div className="flex h-full w-full">
      {/* Main Graph Area */}
      <div className="flex-1 relative">
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex gap-2">
            <Button onClick={loadGraphData} disabled={isLoading} size="sm">
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button onClick={handleZoomIn} size="sm" variant="outline">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button onClick={handleZoomOut} size="sm" variant="outline">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button onClick={handleCenter} size="sm" variant="outline">
              <Target className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            {!creatingRelationship ? (
              <Button
                onClick={startRelationshipCreation}
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Relationship
              </Button>
            ) : (
              <Button
                onClick={cancelRelationshipCreation}
                size="sm"
                variant="destructive"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Layout Controls */}
        <div className="absolute top-4 right-4 z-10">
          <select
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleLayout(e.target.value)
            }
            className="px-3 py-1 border rounded bg-white text-sm"
          >
            <option value="hierarchical">Hierarchical</option>
            <option value="force">Force-directed</option>
            <option value="circular">Circular</option>
            <option value="grid">Grid</option>
          </select>
        </div>

        {/* Graph Container */}
        <div
          ref={nvlRef}
          className="w-full h-full bg-gray-50 dark:bg-gray-900"
          style={{
            minHeight: "600px",
            height: "100%",
            width: "100%",
            position: "relative",
            // Performance optimizations
            willChange: "transform",
            transform: "translateZ(0)", // Force hardware acceleration
            backfaceVisibility: "hidden",
          }}
        >
          {/* Status Panel - Bottom Right */}
          <div className="absolute bottom-4 right-4 z-10">
            <Card className="w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${nvlInstance.current ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  Graph Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Nodes
                    </Label>
                    <p className="font-mono">{graphData.nodes.length}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Relationships
                    </Label>
                    <p className="font-mono">
                      {graphData.relationships.length}
                    </p>
                  </div>
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    Loading...
                  </div>
                )}

                {selectedNode && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <Label className="text-xs text-blue-700 dark:text-blue-300">
                      Selected Node
                    </Label>
                    <p className="font-mono text-xs truncate">
                      {selectedNode.properties.id}
                    </p>
                  </div>
                )}

                {editingNode && (
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                    <Label className="text-xs text-orange-700 dark:text-orange-300">
                      Editing
                    </Label>
                    <p className="font-mono text-xs truncate">
                      {editingNode.properties.id}
                    </p>
                  </div>
                )}

                {creatingRelationship && (
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <Label className="text-xs text-green-700 dark:text-green-300">
                      Creating Relationship
                    </Label>
                    <div className="text-xs">
                      {sourceNode && <p>Source: {sourceNode}</p>}
                      {targetNode && <p>Target: {targetNode}</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-80 border-l bg-white dark:bg-gray-800 p-4 overflow-y-auto">
        {/* Edit Node Panel - Show at top when editing */}
        {editingNode && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Edit Node Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-semibold">Text Content</Label>
                <Textarea
                  value={editForm.text || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, text: e.target.value })
                  }
                  className="mt-1"
                  rows={6}
                  placeholder="Enter node text content..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Edit the text content of this node. Other properties are
                  read-only.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveNode} className="flex-1">
                  Save Text
                </Button>
                <Button variant="outline" onClick={() => setEditingNode(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Relationship Creation Panel */}
        {creatingRelationship && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Create Relationship</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Source Node</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {sourceNode
                    ? `Node ${sourceNode}`
                    : "Click a node to select source"}
                </p>
              </div>

              <div>
                <Label>Target Node</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {targetNode
                    ? `Node ${targetNode}`
                    : "Click another node to select target"}
                </p>
              </div>

              {sourceNode && targetNode && (
                <>
                  <div>
                    <Label>Relationship Type</Label>
                    <Input
                      value={relationshipType}
                      onChange={(e) => setRelationshipType(e.target.value)}
                      placeholder="RELATES_TO"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Properties (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(relationshipProperties, null, 2)}
                      onChange={(e) => {
                        try {
                          setRelationshipProperties(
                            JSON.parse(e.target.value || "{}"),
                          );
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      placeholder='{"weight": 1.0, "description": "related"}'
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveRelationship} className="flex-1">
                      Create Relationship
                    </Button>
                    <Button
                      onClick={cancelRelationshipCreation}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {selectedNode && !editingNode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Node Details</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleEditNode}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteNode}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label className="font-semibold">Neo4j ID</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                  {selectedNode.id}
                </p>
              </div>

              <div>
                <Label className="font-semibold">Labels</Label>
                <div className="flex gap-1 mt-1">
                  {selectedNode.labels.map((label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Chat ID */}
              {selectedNode.properties.chatId && (
                <div>
                  <Label className="font-semibold">Chat ID</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                    {selectedNode.properties.chatId}
                  </p>
                </div>
              )}

              {/* Node ID */}
              {selectedNode.properties.id && (
                <div>
                  <Label className="font-semibold">Node ID</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                    {selectedNode.properties.id}
                  </p>
                </div>
              )}

              {/* Text Content */}
              {selectedNode.properties.text && (
                <div>
                  <Label className="font-semibold">Text Content</Label>
                  <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm max-h-32 overflow-y-auto">
                    {selectedNode.properties.text}
                  </div>
                </div>
              )}

              {/* Embedding (truncated) */}
              {selectedNode.properties.embedding && (
                <div>
                  <Label className="font-semibold">Embedding Vector</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    [
                    {Array.isArray(selectedNode.properties.embedding)
                      ? `${selectedNode.properties.embedding
                          .slice(0, 5)
                          .map((n) => n.toFixed(3))
                          .join(
                            ", ",
                          )}... (${selectedNode.properties.embedding.length} dimensions)`
                      : "Vector data available"}
                    ]
                  </p>
                </div>
              )}

              {/* Other Properties */}
              <div>
                <Label className="font-semibold">Other Properties</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(selectedNode.properties)
                    .filter(
                      ([key]) =>
                        !["chatId", "id", "text", "embedding"].includes(key),
                    )
                    .map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-xs font-medium">{key}</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                          {typeof value === "string" && value.length > 100
                            ? `${value.substring(0, 100)}...`
                            : String(value)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Relationship Editing Panel */}
        {editingRelationship && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Edit Relationship</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Relationship Type</Label>
                <Input
                  value={relationshipEditForm.type || ""}
                  onChange={(e) =>
                    setRelationshipEditForm({
                      ...relationshipEditForm,
                      type: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {Object.entries(relationshipEditForm)
                .filter(([key]) => key !== "type")
                .map(([key, value]) => (
                  <div key={key}>
                    <Label>{key}</Label>
                    <Input
                      value={String(value)}
                      onChange={(e) =>
                        setRelationshipEditForm({
                          ...relationshipEditForm,
                          [key]: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                ))}

              <div className="flex gap-2">
                <Button onClick={handleSaveRelationship}>Save</Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingRelationship(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedRelationship && !editingRelationship && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Relationship Details</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditRelationship}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteRelationship}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedRelationship.type}
                </p>
              </div>

              <div>
                <Label>From → To</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedRelationship.source} → {selectedRelationship.target}
                </p>
              </div>

              {Object.keys(selectedRelationship.properties).length > 0 && (
                <div>
                  <Label>Properties</Label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(selectedRelationship.properties).map(
                      ([key, value]) => (
                        <div key={key}>
                          <Label className="text-xs">{key}</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {String(value)}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedNode &&
          !selectedRelationship &&
          !creatingRelationship &&
          !editingNode &&
          !editingRelationship && (
            <Card>
              <CardHeader>
                <CardTitle>Graph Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Nodes:</strong> {graphData.nodes.length}
                  </p>
                  <p className="text-sm">
                    <strong>Relationships:</strong>{" "}
                    {graphData.relationships.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                    <strong>Single-click</strong> nodes or relationships to view
                    details.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <strong>Double-click</strong> nodes to edit their properties
                    directly.
                  </p>

                  <div className="mt-4">
                    <Label className="text-sm font-semibold">
                      AI Relationship Types:
                    </Label>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-green-500"></div>
                        <span>EXPLAINS - Explanatory relationship</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-500"></div>
                        <span>SUPPORTS - Supporting evidence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-red-500"></div>
                        <span>CONTRADICTS - Opposing information</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-orange-500"></div>
                        <span>ELABORATES - Additional details</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-gray-400"></div>
                        <span>NEXT - Sequential (fallback only)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
};

export default GraphVisualizationNVL;
