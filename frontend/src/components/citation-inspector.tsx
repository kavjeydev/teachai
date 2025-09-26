"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CitedNode {
  id: string;
  title: string;
  snippet: string;
  properties: Record<string, any>;
  relationships: string[];
  labels: string[];
}

interface CitationInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  citedNodes: CitedNode[];
  onOpenInGraph: (nodeId: string) => void;
  onEditNode?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export const CitationInspector: React.FC<CitationInspectorProps> = ({
  isOpen,
  onClose,
  citedNodes,
  onOpenInGraph,
  onEditNode,
  onDeleteNode,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Reset expanded nodes when citedNodes change
  useEffect(() => {
    setIsLoading(true);
    setExpandedNodes(new Set());

    // Simulate loading time for better UX
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, [citedNodes]);

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Citation Inspector Panel */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 w-96 max-h-[80vh] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Citation Sources
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {citedNodes.length} node{citedNodes.length !== 1 ? "s" : ""}{" "}
              referenced
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="p-4 space-y-4">
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden animate-pulse"
                  >
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                            <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                          </div>
                        </div>
                        <div className="h-7 w-7 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="space-y-2">
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6"></div>
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-4/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              citedNodes.map((node, index) => (
                <div
                  key={node.id}
                  className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                >
                  {/* Node Header */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-zinc-900 dark:text-white truncate">
                          {node.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {node.labels.map((label) => (
                            <span
                              key={label}
                              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-md"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleNodeExpansion(node.id)}
                          className="h-7 w-7 p-0"
                        >
                          {expandedNodes.has(node.id) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Node Content */}
                  <div className="p-3">
                    {/* Snippet */}
                    <div className="mb-3">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {node.snippet}
                      </p>
                    </div>

                    {/* Expanded Details */}
                    {expandedNodes.has(node.id) && (
                      <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        {/* Properties */}
                        {Object.keys(node.properties).length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">
                              Properties
                            </h5>
                            <div className="space-y-1">
                              {Object.entries(node.properties).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                      {key}:
                                    </span>
                                    <span className="text-zinc-700 dark:text-zinc-300 truncate ml-2 max-w-48">
                                      {String(value)}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {/* Relationships */}
                        {node.relationships.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">
                              Connected To
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {node.relationships
                                .slice(0, 5)
                                .map((rel, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-md"
                                  >
                                    {rel}
                                  </span>
                                ))}
                              {node.relationships.length > 5 && (
                                <span className="text-xs text-zinc-400">
                                  +{node.relationships.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Mini-Graph Preview Placeholder */}
                        <div>
                          <h5 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">
                            Local Context
                          </h5>
                          <div className="h-24 bg-zinc-100 dark:bg-zinc-700 rounded-md flex items-center justify-center">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Mini-graph preview (coming soon)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      <Button
                        size="sm"
                        onClick={() => onOpenInGraph(node.id)}
                        className="bg-amber-400 hover:bg-amber-400/90 text-white flex-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open in Graph View
                      </Button>
                      {onEditNode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditNode(node.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {onDeleteNode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteNode(node.id)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
