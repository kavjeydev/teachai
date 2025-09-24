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
  reasoningContext?: any[];
  refreshTrigger?: number; // Add refresh trigger prop
}

const GraphVisualizationNVL: React.FC<GraphVisualizationProps> = ({
  chatId,
  baseUrl,
  reasoningContext,
  refreshTrigger,
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  // Relationship creation state
  const [creatingRelationship, setCreatingRelationship] = useState(false);
  const creatingRelationshipRef = useRef(false);
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const sourceNodeRef = useRef<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const targetNodeRef = useRef<string | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<string>("RELATES_TO");
  const [relationshipProperties, setRelationshipProperties] = useState<
    Record<string, any>
  >({});
  const [customRelationshipTypes, setCustomRelationshipTypes] = useState<string[]>([]);

  // Load custom relationship types from localStorage on mount
  useEffect(() => {
    const savedTypes = localStorage.getItem('customRelationshipTypes');
    if (savedTypes) {
      try {
        setCustomRelationshipTypes(JSON.parse(savedTypes));
      } catch (error) {
        console.warn('Failed to parse custom relationship types from localStorage:', error);
      }
    }
  }, []);

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

    setIsInitializing(true);
    setLoadingProgress(10);

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
        },
        {
          onError: (error: Error) => {
            console.error("NVL Error:", error);
            toast.error("Graph visualization error");
            setIsInitializing(false);
          },
        },
      );

      setLoadingProgress(50);

      // Set up interaction handlers
      const dragInteraction = new DragNodeInteraction(nvlInstance.current);
      const panInteraction = new PanInteraction(nvlInstance.current);
      const zoomInteraction = new ZoomInteraction(nvlInstance.current);
      const hoverInteraction = new HoverInteraction(nvlInstance.current);
      const clickInteraction = new ClickInteraction(nvlInstance.current);

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

      // DISABLED: ClickInteraction seems to have issues with event handling
      // Using manual event listeners instead
      // clickInteraction.updateCallback("onNodeClick", (node: any) => {
      //   console.log("🖱️ Node clicked:", node);
      //   handleNodeClick(node);
      // });

      // clickInteraction.updateCallback("onRelationshipClick", (relationship: any) => {
      //   console.log("🖱️ Relationship clicked:", relationship);
      //   handleRelationshipClick(relationship);
      // });

      // clickInteraction.updateCallback("onCanvasClick", () => {
      //   console.log("🖱️ Canvas clicked - should only happen when clicking empty space");
      //   if (creatingRelationshipRef.current) {
      //     console.log("🚫 Canceling relationship creation due to canvas click");
      //     cancelRelationshipCreation();
      //   } else {
      //     setSelectedNode(null);
      //     setSelectedRelationship(null);
      //     setEditingNode(null);
      //   }
      // });

      // Set up manual event listeners using NVL's getHits method
      if (nvlRef.current) {
        // Single click handler
        nvlRef.current.addEventListener("click", (evt: MouseEvent) => {
          console.log("🖱️ Click event triggered");
          const { nvlTargets } = nvlInstance.current.getHits(evt);

          if (nvlTargets.nodes.length > 0) {
            // Node clicked
            const node = nvlTargets.nodes[0];
            console.log("🔍 Node clicked:", node.id);
            handleNodeClick(node.data || node);
          } else if (nvlTargets.relationships.length > 0) {
            // Relationship clicked
            const rel = nvlTargets.relationships[0];
            console.log("🔗 Relationship clicked - full object:", rel);
            console.log("🔗 Relationship ID:", rel.id);
            console.log("🔗 Relationship data:", rel.data);
            handleRelationshipClick(rel.data || rel);
          } else {
            // Canvas clicked
            console.log("🖱️ Canvas clicked");
            if (creatingRelationshipRef.current) {
              console.log("🚫 Canceling relationship creation");
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
      setLoadingProgress(100);
      setIsInitializing(false);
    } catch (error) {
      console.error("Error initializing NVL:", error);
      toast.error("Failed to initialize graph visualization");
      setIsInitializing(false);
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
    console.log("🖱️ Node clicked:", nodeEventData);
    console.log("🔗 Creating relationship (state):", creatingRelationship);
    console.log("🔗 Creating relationship (ref):", creatingRelationshipRef.current);

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

    console.log("🆔 Resolved node ID:", nodeId);

    if (!nodeId) {
      console.log("❌ No node ID found");
      return;
    }

    if (creatingRelationshipRef.current) {
      console.log("🎯 Calling handleRelationshipNodeClick with:", nodeId);
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

    console.log("🔗 handleRelationshipClick received:", relEventData);
    console.log("🔗 relEventData.data:", relEventData.data);
    console.log("🔗 relEventData.id:", relEventData.id);

    // Extract the actual relationship data - try multiple approaches
    let relData = null;
    let relId = null;

    if (relEventData.data) {
      // Event wrapper format
      relData = relEventData.data;
      relId = relData?.id;
    } else {
      // Direct relationship data format
      relData = relEventData;
      relId = relEventData?.id;
    }

    console.log("🔗 Resolved relationship data:", relData);
    console.log("🔗 Resolved relationship ID:", relId);

    if (!relId) {
      console.log("❌ No relationship ID found");
      return;
    }

    // Find the relationship in our graph data
    const fullRelData = graphData.relationships.find((r) => r.id === relId);

    console.log("🔍 Looking for relationship with ID:", relId);
    console.log("🔍 Available relationships:", graphData.relationships.map(r => ({ id: r.id, type: r.type })));
    console.log("🔍 Found relationship data:", fullRelData);

    if (fullRelData) {
      setSelectedRelationship(fullRelData);
      setSelectedNode(null);
      setEditingNode(null);
      setEditingRelationship(null);
      toast.success("Relationship selected - view details in sidebar");
    } else {
      // If we can't find it in our graph data, create a temporary one from NVL data
      console.log("⚠️ Relationship not found in graphData, creating from NVL data");
      const tempRelData = {
        id: relId,
        source: relData.from,
        target: relData.to,
        type: relData.captions?.[0]?.value || relData.properties?.type || "UNKNOWN",
        properties: relData.properties || {}
      };
      console.log("🔧 Created temporary relationship data:", tempRelData);
      setSelectedRelationship(tempRelData);
      setSelectedNode(null);
      setEditingNode(null);
      setEditingRelationship(null);
      toast.success("Relationship selected - view details in sidebar");
    }
  };

  // Handle relationship creation node clicks
  const handleRelationshipNodeClick = (nodeId: string) => {
    console.log("🎯 handleRelationshipNodeClick called with:", nodeId);
    console.log("🎯 Current sourceNode (state):", sourceNode);
    console.log("🎯 Current sourceNode (ref):", sourceNodeRef.current);
    console.log("🎯 Current targetNode (state):", targetNode);
    console.log("🎯 Current targetNode (ref):", targetNodeRef.current);
    console.log("🎯 Checking conditions:");
    console.log("🎯   !sourceNodeRef.current =", !sourceNodeRef.current);
    console.log("🎯   sourceNodeRef.current !== nodeId =", sourceNodeRef.current !== nodeId);

    if (!sourceNodeRef.current) {
      console.log("🔵 Setting source node to:", nodeId);
      setSourceNode(nodeId);
      sourceNodeRef.current = nodeId;

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
    } else if (sourceNodeRef.current !== nodeId) {
      console.log("🟢 Setting target node to:", nodeId);
      setTargetNode(nodeId);
      targetNodeRef.current = nodeId;

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
      console.log("❌ Cannot create relationship to the same node");
      toast.error("Cannot create relationship to the same node.");
    }
  };

  // Load graph data
  const loadGraphData = async () => {
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      console.log(
        "🔍 Loading graph data from:",
        `${baseUrl}graph_data/${chatId}`,
      );

      if (!baseUrl) {
        throw new Error(
          "Backend URL not configured. Please set NEXT_PUBLIC_BASE_URL environment variable.",
        );
      }

      setLoadingProgress(20);

      const response = await fetch(`${baseUrl}graph_data/${chatId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Backend error:", errorText);

        // Silently handle errors - no toast spam

        throw new Error(
          `Failed to load graph data: ${response.status} ${errorText}`,
        );
      }

      setLoadingProgress(40);

      const data: GraphData = await response.json();

      if (!data.nodes || data.nodes.length === 0) {
        // Silently handle empty data - no warning needed
        setGraphData({ nodes: [], relationships: [] });
        setLoadingProgress(100);
        return;
      }

      setLoadingProgress(60);
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
          setLoadingProgress(80);
          // Clear existing graph data first to ensure deleted nodes are removed
          console.log("🧹 Clearing existing graph data...");

          // Get current nodes and relationships to remove them
          try {
            const currentNodes = nvlInstance.current.getNodes();
            const currentRels = nvlInstance.current.getRelationships();

            if (currentNodes && currentNodes.length > 0) {
              const nodeIds = currentNodes.map((node: any) => node.id);
              console.log("🗑️ Removing existing nodes:", nodeIds);
              nvlInstance.current.removeNodesWithIds(nodeIds);
            }

            if (currentRels && currentRels.length > 0) {
              const relIds = currentRels.map((rel: any) => rel.id);
              console.log("🗑️ Removing existing relationships:", relIds);
              nvlInstance.current.removeRelationshipsWithIds(relIds);
            }
          } catch (clearError) {
            console.warn("⚠️ Error clearing existing graph data:", clearError);
            console.log("🔄 Proceeding with data update anyway...");
          }

          setLoadingProgress(90);
          // Add the fresh data from the backend
          console.log("📊 Adding fresh graph data...", {
            nodes: nvlNodes.length,
            relationships: nvlRelationships.length,
          });
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
            setLoadingProgress(100);
          }, 1000);
        } catch (renderError) {
          console.error("Error rendering NVL graph:", renderError);
          console.log("🔄 Trying fallback approach without clearing...");

          // Fallback: just update the graph without clearing
          try {
            nvlInstance.current.addAndUpdateElementsInGraph(
              nvlNodes,
              nvlRelationships,
            );
            console.log("✅ Fallback graph update successful");
          } catch (fallbackError) {
            console.error("❌ Fallback also failed:", fallbackError);
            toast.error("Failed to render graph data");
          }
        }
      }

      // console.log("✅ Graph data loaded and rendered successfully");
      // Only show success toast on manual refresh, not on automatic refresh
      if (!refreshTrigger) {
        // toast.success("Graph data loaded successfully");
      }
    } catch (error) {
      console.error("Error loading graph data:", error);

      if (error instanceof Error) {
        if (error.message.includes("Backend URL not configured")) {
          toast.error(
            "Backend not configured. Please set up your environment variables.",
          );
        } else if (error.message.includes("Failed to fetch")) {
          toast.error(
            "Cannot connect to backend. Make sure it's running on " + baseUrl,
          );
        } else {
          toast.error("Failed to load graph data: " + error.message);
        }
      } else {
        toast.error("Failed to load graph data");
      }
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
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
    console.log("🚀 Starting relationship creation");
    setCreatingRelationship(true);
    creatingRelationshipRef.current = true;
    setSourceNode(null);
    sourceNodeRef.current = null;
    setTargetNode(null);
    targetNodeRef.current = null;
    setRelationshipType("RELATES_TO");
    setRelationshipProperties({});
    toast.success("Click on a node to start creating a relationship.");
    console.log("✅ Relationship creation state set to true");
  };

  const cancelRelationshipCreation = () => {
    // Reset visual feedback
    if (nvlInstance.current && (sourceNodeRef.current || targetNodeRef.current)) {
      nvlInstance.current.deselectAll();
      // Don't reload the graph - just reset the colors manually
      // The graph reload was causing the state to reset
    }

    setCreatingRelationship(false);
    creatingRelationshipRef.current = false;
    setSourceNode(null);
    sourceNodeRef.current = null;
    setTargetNode(null);
    targetNodeRef.current = null;
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to create relationship`);
      }

      const newRelationship = await response.json();

      // Add custom relationship type to the list if it's not already there
      const defaultTypes = ["RELATES_TO", "DEPENDS_ON", "CONTAINS", "REFERENCES", "SIMILAR_TO"];
      if (!defaultTypes.includes(relationshipType) && !customRelationshipTypes.includes(relationshipType)) {
        const newCustomTypes = [...customRelationshipTypes, relationshipType];
        setCustomRelationshipTypes(newCustomTypes);
        // Save to localStorage for persistence
        localStorage.setItem('customRelationshipTypes', JSON.stringify(newCustomTypes));
      }

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
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to create relationship: ${errorMessage}`);
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to delete relationship`);
      }

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
    } catch (error) {
      console.error("Error deleting relationship:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to delete relationship: ${errorMessage}`);
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

  // Highlight reasoning context nodes
  const highlightReasoningNodes = () => {
    if (
      !reasoningContext ||
      !nvlInstance.current ||
      !backendIdToNvlId ||
      !graphData.nodes
    )
      return;

    try {
      // Get the chunk IDs that were used in reasoning
      const usedChunkIds = reasoningContext.map((ctx) => ctx.chunk_id);
      console.log("🎯 Highlighting chunk IDs:", usedChunkIds);
      console.log(
        "📊 Available graph nodes:",
        graphData.nodes.map((n) => n.id),
      );
      console.log("🔗 Backend to NVL mapping:", backendIdToNvlId);

      // Check for exact matches
      const exactMatches = usedChunkIds.filter((chunkId) =>
        graphData.nodes.some((node) => node.id === chunkId),
      );
      console.log("✅ Exact ID matches found:", exactMatches);

      // Check for partial matches (in case IDs are slightly different)
      const partialMatches = usedChunkIds.map((chunkId) => {
        const matchingNode = graphData.nodes.find(
          (node) => node.id.includes(chunkId) || chunkId.includes(node.id),
        );
        return { chunkId, matchingNode: matchingNode?.id };
      });
      console.log("🔍 Partial matches:", partialMatches);

      // Create updated nodes array with highlighting
      const updatedNodes = graphData.nodes.map((node) => {
        // Try multiple matching strategies
        const isExactMatch = usedChunkIds.includes(node.id);
        const isPartialMatch = usedChunkIds.some(
          (chunkId) => node.id.includes(chunkId) || chunkId.includes(node.id),
        );
        const isReasoningNode = isExactMatch || isPartialMatch;

        if (isReasoningNode) {
          console.log(
            `🎯 Highlighting node: ${node.id} (${getNodeDisplayLabel(node)}) - Match type: ${isExactMatch ? "exact" : "partial"}`,
          );
        }

        const updatedNode = {
          id: node.id,
          captions: [{ value: getNodeDisplayLabel(node) }],
          size: isReasoningNode
            ? 150 // Make it even larger to be more visible
            : node.labels.includes("Document")
              ? 80
              : 60,
          color: isReasoningNode ? "#ff1493" : getNodeColor(node.labels[0]), // Bright pink for maximum visibility
          properties: {
            ...node.properties,
            labels: node.labels.join(", "),
            backendId: node.id,
            isReasoning: isReasoningNode,
          },
        };

        return updatedNode;
      });

      const highlightedCount = updatedNodes.filter(
        (n) =>
          usedChunkIds.includes(n.id) ||
          usedChunkIds.some(
            (chunkId) => n.id.includes(chunkId) || chunkId.includes(n.id),
          ),
      ).length;

      console.log(
        `📊 Total nodes: ${updatedNodes.length}, Actually highlighted: ${highlightedCount}`,
      );

      // Update the graph with highlighted nodes
      const nvlRelationships = graphData.relationships.map((rel) => ({
        id: rel.id,
        from: rel.source,
        to: rel.target,
        captions: [{ value: rel.type }],
        properties: {
          ...rel.properties,
          type: rel.type,
        },
      }));

      console.log("🔄 Updating graph with highlighted nodes...");
      nvlInstance.current.addAndUpdateElementsInGraph(
        updatedNodes,
        nvlRelationships,
      );

      // Force a visual refresh
      if (nvlInstance.current.refresh) {
        console.log("🔄 Forcing graph refresh...");
        nvlInstance.current.refresh();
      }

      // Try alternative update methods
      if (nvlInstance.current.render) {
        console.log("🔄 Forcing graph render...");
        nvlInstance.current.render();
      }

      // Focus on the highlighted nodes
      if (usedChunkIds.length > 0) {
        // Try to select the first highlighted node to make it more visible
        const firstHighlightedNodeId = usedChunkIds[0];
        console.log("Attempting to select/focus node:", firstHighlightedNodeId);

        setTimeout(() => {
          // Try different methods to focus on the node
          if (nvlInstance.current.selectNode) {
            nvlInstance.current.selectNode(firstHighlightedNodeId);
          }
          if (nvlInstance.current.focusOnNode) {
            nvlInstance.current.focusOnNode(firstHighlightedNodeId);
          }
          if (nvlInstance.current.centerOnNode) {
            nvlInstance.current.centerOnNode(firstHighlightedNodeId);
          }
        }, 500);
      }

      console.log(`Highlighted ${usedChunkIds.length} reasoning nodes`);
    } catch (error) {
      console.error("Error highlighting reasoning nodes:", error);
    }
  };

  // Trigger highlighting when reasoning context changes
  useEffect(() => {
    if (reasoningContext && reasoningContext.length > 0) {
      console.log(
        "Triggering node highlighting for context:",
        reasoningContext,
      );
      console.log("Backend to NVL ID mapping:", backendIdToNvlId);

      // Add a small delay to ensure the graph is fully loaded
      setTimeout(() => {
        highlightReasoningNodes();
      }, 1500);
    }
  }, [reasoningContext, backendIdToNvlId]);

  // Trigger graph refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log("🔄 Graph refresh triggered:", refreshTrigger);
      console.log("🔄 Reloading graph data due to context deletion...");
      loadGraphData();
    }
  }, [refreshTrigger]);

  // Debug state changes
  useEffect(() => {
    console.log("🔄 State changed - sourceNode:", sourceNode, "targetNode:", targetNode);
  }, [sourceNode, targetNode]);

  return (
    <div className="flex h-full w-full">
      {/* Main Graph Area */}
      <div className="flex-1 relative">
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              onClick={loadGraphData}
              disabled={isLoading}
              size="sm"
              title="Refresh graph data"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading && <span className="ml-2 text-xs">Loading...</span>}
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
                title="Create a new relationship between two nodes"
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
            className="px-3 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
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
          className="w-full h-full bg-gray-50 dark:bg-gray-900 relative"
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
          {/* Loading Overlay */}
          {(isInitializing || isLoading) && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  {isInitializing ? "Initializing graph..." : "Loading graph data..."}
                </p>
                <div className="w-48 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mx-auto">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {loadingProgress}%
                </p>
              </div>
            </div>
          )}

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
          <Card className="mb-4 border-green-200 dark:border-green-800">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="text-green-800 dark:text-green-200">Create Relationship</CardTitle>
              <p className="text-sm text-green-600 dark:text-green-300">
                {!sourceNode && !targetNode && "Step 1: Click on a node to select as source"}
                {sourceNode && !targetNode && "Step 2: Click on another node to select as target"}
                {sourceNode && targetNode && "Step 3: Configure and create the relationship"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-3 rounded border ${sourceNode ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'}`}>
                <Label className="flex items-center gap-2">
                  Source Node
                  {sourceNode && <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Selected</Badge>}
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {sourceNode
                    ? (() => {
                        const node = graphData.nodes.find(n => n.id === sourceNode);
                        return node ? `${node.properties.text?.substring(0, 30) || node.properties.id || sourceNode}...` : `Node ${sourceNode}`;
                      })()
                    : "Click a node to select source"}
                </p>
              </div>

              <div className={`p-3 rounded border ${targetNode ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'}`}>
                <Label className="flex items-center gap-2">
                  Target Node
                  {targetNode && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Selected</Badge>}
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {targetNode
                    ? (() => {
                        const node = graphData.nodes.find(n => n.id === targetNode);
                        return node ? `${node.properties.text?.substring(0, 30) || node.properties.id || targetNode}...` : `Node ${targetNode}`;
                      })()
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
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[
                        ...["RELATES_TO", "DEPENDS_ON", "CONTAINS", "REFERENCES", "SIMILAR_TO"],
                        ...customRelationshipTypes
                      ].map(type => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          className={`h-6 text-xs ${
                            customRelationshipTypes.includes(type)
                              ? 'border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20'
                              : ''
                          }`}
                          onClick={() => setRelationshipType(type)}
                          title={customRelationshipTypes.includes(type) ? 'Custom relationship type' : 'Default relationship type'}
                        >
                          {type}
                          {customRelationshipTypes.includes(type) && (
                            <span className="ml-1 text-purple-500">✨</span>
                          )}
                        </Button>
                      ))}
                    </div>
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
                    title="Edit relationship"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteRelationship}
                    title="Delete relationship"
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
                      Relationship Types:
                    </Label>
                    <div className="mt-2 space-y-1 text-xs">
                      {/* Default Types */}
                      {["RELATES_TO", "DEPENDS_ON", "CONTAINS", "REFERENCES", "SIMILAR_TO"].map((type, index) => {
                        const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500"];
                        return (
                          <div key={type} className="flex items-center gap-2">
                            <div className={`w-4 h-0.5 ${colors[index]}`}></div>
                            <span>{type} - Default type</span>
                          </div>
                        );
                      })}

                      {/* Custom Types */}
                      {customRelationshipTypes.map((type, index) => (
                        <div key={`custom-${type}`} className="flex items-center gap-2">
                          <div className="w-4 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                          <span className="flex items-center gap-1">
                            {type} - Custom type <span className="text-purple-500">✨</span>
                          </span>
                        </div>
                      ))}

                      {/* AI-Generated Types */}
                      {graphData.relationships.length > 0 && (
                        <>
                          {Array.from(new Set(graphData.relationships.map(r => r.type)))
                            .filter(type =>
                              !["RELATES_TO", "DEPENDS_ON", "CONTAINS", "REFERENCES", "SIMILAR_TO"].includes(type) &&
                              !customRelationshipTypes.includes(type)
                            )
                            .map(type => (
                              <div key={`ai-${type}`} className="flex items-center gap-2">
                                <div className="w-4 h-0.5 bg-gradient-to-r from-green-400 to-blue-500"></div>
                                <span className="flex items-center gap-1">
                                  {type} - AI-generated <span className="text-green-500">🤖</span>
                                </span>
                              </div>
                            ))
                          }
                        </>
                      )}

                      {/* Show message if no types exist */}
                      {customRelationshipTypes.length === 0 && graphData.relationships.length === 0 && (
                        <div className="text-gray-500 italic">
                          Create relationships to see your custom types here
                        </div>
                      )}
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
