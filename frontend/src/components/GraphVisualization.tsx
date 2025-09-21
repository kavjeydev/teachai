"use client";

import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import coseBilkent from "cytoscape-cose-bilkent";
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

// Register cytoscape extensions
cytoscape.use(dagre);
cytoscape.use(coseBilkent);

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

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  chatId,
  baseUrl,
}) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
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
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [relationshipType, setRelationshipType] =
    useState<string>("RELATES_TO");
  const [relationshipProperties, setRelationshipProperties] = useState<
    Record<string, any>
  >({});

  // Layout options
  const [currentLayout, setCurrentLayout] = useState<
    "dagre" | "cose-bilkent" | "circle" | "grid"
  >("dagre");

  // Initialize Cytoscape
  useEffect(() => {
    if (!cyRef.current) return;

    setIsInitializing(true);
    setLoadingProgress(10);

    cyInstance.current = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(displayLabel)",
            "text-valign": "center",
            "text-halign": "center",
            color: "#ffffff",
            "font-size": "12px",
            "font-weight": "bold",
            "text-outline-width": 2,
            "text-outline-color": "#000000",
            width: 60,
            height: 60,
            "border-width": 2,
            "border-color": "#ffffff",
            "text-wrap": "wrap",
            "text-max-width": "80px",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 4,
            "border-color": "#ff6b6b",
            "background-color": "#ff6b6b",
          },
        },
        {
          selector: "node.creating-relationship",
          style: {
            "border-width": 4,
            "border-color": "#4CAF50",
            "background-color": "#4CAF50",
          },
        },
        {
          selector: "node.relationship-source",
          style: {
            "border-width": 4,
            "border-color": "#2196F3",
            "background-color": "#2196F3",
          },
        },
        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "data(color)",
            "target-arrow-color": "data(color)",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(type)",
            "font-size": "10px",
            "text-rotation": "autorotate",
            "text-margin-y": -10,
            "text-outline-width": 1,
            "text-outline-color": "#ffffff",
          },
        },
        {
          selector: "edge[type='NEXT']",
          style: {
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            width: 2,
            "line-style": "dashed",
          },
        },
        {
          selector: "edge[type='EXPLAINS']",
          style: {
            "line-color": "#4CAF50",
            "target-arrow-color": "#4CAF50",
            width: 4,
          },
        },
        {
          selector: "edge[type='SUPPORTS']",
          style: {
            "line-color": "#2196F3",
            "target-arrow-color": "#2196F3",
            width: 4,
          },
        },
        {
          selector: "edge[type='CONTRADICTS']",
          style: {
            "line-color": "#F44336",
            "target-arrow-color": "#F44336",
            width: 4,
          },
        },
        {
          selector: "edge[type='ELABORATES']",
          style: {
            "line-color": "#FF9800",
            "target-arrow-color": "#FF9800",
            width: 3,
          },
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#ff6b6b",
            "target-arrow-color": "#ff6b6b",
            width: 4,
          },
        },
      ],
      layout: {
        name: "dagre",
      } as any,
    });

    // Event handlers
    cyInstance.current.on("tap", "node", (evt) => {
      const node = evt.target;
      const nodeData = node.data();
      const nodeId = nodeData.id;

      if (creatingRelationship) {
        if (!sourceNode) {
          // First node selected as source
          setSourceNode(nodeId);
          cyInstance.current?.nodes().removeClass("relationship-source");
          node.addClass("relationship-source");
          toast.success(
            "Source node selected. Click another node to create relationship.",
          );
        } else if (sourceNode !== nodeId) {
          // Second node selected as target
          setTargetNode(nodeId);
          cyInstance.current?.nodes().removeClass("creating-relationship");
          node.addClass("creating-relationship");
          toast.success(
            "Target node selected! Configure relationship in the sidebar.",
          );
        } else {
          toast.error("Cannot create relationship to the same node.");
        }
      } else {
        // Normal node selection
        const fullNodeData = graphData.nodes.find((n) => n.id === nodeData.id);
        if (fullNodeData) {
          setSelectedNode(fullNodeData);
          setSelectedRelationship(null);
        }
      }
    });

    // Double-click handler for editing nodes
    cyInstance.current.on("dbltap", "node", (evt) => {
      if (creatingRelationship) return; // Don't edit during relationship creation

      const node = evt.target;
      const nodeData = node.data();
      const fullNodeData = graphData.nodes.find((n) => n.id === nodeData.id);

      if (fullNodeData) {
        setEditingNode(fullNodeData);
        setEditForm({ ...fullNodeData.properties });
        setSelectedNode(fullNodeData);
        toast.info(
          "Double-clicked to edit node. Modify properties in the sidebar.",
        );
      }
    });

    cyInstance.current.on("tap", "edge", (evt) => {
      const edge = evt.target;
      const edgeData = edge.data();

      // Find the full relationship data
      const fullRelData = graphData.relationships.find(
        (r) => r.id === edgeData.id,
      );
      if (fullRelData) {
        setSelectedRelationship(fullRelData);
        setSelectedNode(null);
      }
    });

    cyInstance.current.on("tap", (evt) => {
      if (evt.target === cyInstance.current) {
        if (creatingRelationship) {
          cancelRelationshipCreation();
        } else {
          setSelectedNode(null);
          setSelectedRelationship(null);
          setEditingNode(null);
        }
      }
    });

    setLoadingProgress(100);
    setIsInitializing(false);

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
      }
    };
  }, []);

  // Load graph data
  const loadGraphData = async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    try {
      setLoadingProgress(20);
      const response = await fetch(`${baseUrl}graph_data/${chatId}`);
      if (!response.ok) {
        // throw new Error("Failed to load graph data");
      }

      setLoadingProgress(40);
      const data: GraphData = await response.json();
      setLoadingProgress(60);
      setGraphData(data);

      // Convert to Cytoscape format
      const cytoscapeElements = [
        ...data.nodes.map((node) => ({
          data: {
            id: node.id,
            displayLabel: getNodeDisplayLabel(node),
            color: getNodeColor(node.labels[0]),
            ...node.properties,
          },
        })),
        ...data.relationships.map((rel) => ({
          data: {
            id: rel.id,
            source: rel.source,
            target: rel.target,
            type: rel.type,
            color: getRelationshipColor(rel.type),
            ...rel.properties,
          },
        })),
      ];

      if (cyInstance.current) {
        setLoadingProgress(80);
        cyInstance.current.elements().remove();
        cyInstance.current.add(cytoscapeElements);
        setLoadingProgress(90);
        applyLayout();
        setLoadingProgress(100);
      }

      // Silently load data - no toast needed
    } catch (error) {
      // toast.error("Failed to load graph data");
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
    }
  };

  // Helper functions
  const getNodeDisplayLabel = (node: GraphNode): string => {
    if (node.properties.text) {
      return node.properties.text.substring(0, 20) + "...";
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

  const applyLayout = () => {
    if (!cyInstance.current) return;

    const layoutConfigs: Record<string, any> = {
      dagre: {
        name: "dagre",
        directed: true,
        padding: 10,
        spacingFactor: 1.2,
      },
      "cose-bilkent": {
        name: "cose-bilkent",
        animate: true,
        animationDuration: 1000,
        randomize: false,
        nodeRepulsion: 4500,
        idealEdgeLength: 50,
      },
      circle: {
        name: "circle",
        animate: true,
        animationDuration: 1000,
      },
      grid: {
        name: "grid",
        animate: true,
        animationDuration: 1000,
        cols: Math.ceil(Math.sqrt(graphData.nodes.length)),
      },
    };

    cyInstance.current.layout(layoutConfigs[currentLayout]).run();
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
      const response = await fetch(`${baseUrl}update_node/${editingNode.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update node");
      }

      toast.success("Node updated successfully");
      setEditingNode(null);
      loadGraphData(); // Reload to get updated data
    } catch (error) {
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

      toast.success("Node deleted successfully");
      setSelectedNode(null);
      loadGraphData(); // Reload to get updated data
    } catch (error) {
      toast.error("Failed to delete node");
    }
  };

  // Relationship creation functions
  const startRelationshipCreation = () => {
    setCreatingRelationship(true);
    setSourceNode(null);
    setTargetNode(null);
    setRelationshipType("RELATES_TO");
    setRelationshipProperties({});
    if (cyInstance.current) {
      cyInstance.current
        .nodes()
        .removeClass("relationship-source creating-relationship");
    }
    toast.success("Click on a node to start creating a relationship.");
  };

  const cancelRelationshipCreation = () => {
    setCreatingRelationship(false);
    setSourceNode(null);
    setTargetNode(null);
    if (cyInstance.current) {
      cyInstance.current
        .nodes()
        .removeClass("relationship-source creating-relationship");
    }
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

      toast.success("Relationship created successfully!");
      cancelRelationshipCreation();
      loadGraphData(); // Reload to show the new relationship
    } catch (error) {
      toast.error("Failed to create relationship");
    }
  };

  // Graph controls
  const handleZoomIn = () => {
    if (cyInstance.current) {
      cyInstance.current.zoom(cyInstance.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyInstance.current) {
      cyInstance.current.zoom(cyInstance.current.zoom() * 0.8);
    }
  };

  const handleCenter = () => {
    if (cyInstance.current) {
      cyInstance.current.fit();
    }
  };

  // Load data on mount
  useEffect(() => {
    loadGraphData();
  }, [chatId]);

  // Apply layout when it changes
  useEffect(() => {
    applyLayout();
  }, [currentLayout]);

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
            value={currentLayout}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCurrentLayout(e.target.value as any)
            }
            className="px-3 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-sm"
          >
            <option value="dagre">Hierarchical</option>
            <option value="cose-bilkent">Force-directed</option>
            <option value="circle">Circle</option>
            <option value="grid">Grid</option>
          </select>
        </div>

        {/* Graph Container */}
        <div
          ref={cyRef}
          className="w-full h-full bg-gray-50 dark:bg-gray-900 relative"
          style={{ minHeight: "600px" }}
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
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-80 border-l bg-white dark:bg-gray-800 p-4 overflow-y-auto">
        {/* Edit Node Panel - Show at top when editing */}
        {editingNode && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Edit Node</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(editForm).map(([key, value]) => (
                <div key={key}>
                  <Label>{key}</Label>
                  {key === "text" ||
                  (typeof value === "string" && value.length > 50) ? (
                    <Textarea
                      value={String(value)}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [key]: e.target.value })
                      }
                      className="mt-1"
                      rows={4}
                    />
                  ) : (
                    <Input
                      value={String(value)}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [key]: e.target.value })
                      }
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button onClick={handleSaveNode}>Save</Button>
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
            <CardContent className="space-y-4">
              <div>
                <Label>ID</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedNode.id}
                </p>
              </div>

              <div>
                <Label>Labels</Label>
                <div className="flex gap-1 mt-1">
                  {selectedNode.labels.map((label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Properties</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(selectedNode.properties).map(
                    ([key, value]) => (
                      <div key={key}>
                        <Label className="text-xs">{key}</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                          {typeof value === "string" && value.length > 100
                            ? `${value.substring(0, 100)}...`
                            : String(value)}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedRelationship && (
          <Card>
            <CardHeader>
              <CardTitle>Relationship Details</CardTitle>
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

        {!selectedNode && !selectedRelationship && (
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
                  Click on nodes or relationships to view details and perform
                  operations.
                </p>

                <div className="mt-4">
                  <Label className="text-sm font-semibold">
                    Relationship Types:
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
                      <div className="w-4 h-0.5 bg-gray-400 border-dashed"></div>
                      <span>NEXT - Sequential order</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Node Modal/Panel */}
        {editingNode && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Edit Node</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(editForm).map(([key, value]) => (
                <div key={key}>
                  <Label>{key}</Label>
                  {key === "text" ||
                  (typeof value === "string" && value.length > 50) ? (
                    <Textarea
                      value={String(value)}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [key]: e.target.value })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      value={String(value)}
                      onChange={(e) =>
                        setEditForm({ ...editForm, [key]: e.target.value })
                      }
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button onClick={handleSaveNode}>Save</Button>
                <Button variant="outline" onClick={() => setEditingNode(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GraphVisualization;
