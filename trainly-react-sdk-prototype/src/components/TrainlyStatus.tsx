"use client";

import * as React from "react";
import { useTrainly } from "../useTrainly";

export interface TrainlyStatusProps {
  showDetails?: boolean;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "inline";
  className?: string;
}

export function TrainlyStatus({
  showDetails = true,
  position = "inline",
  className = "",
}: TrainlyStatusProps) {
  const { isConnected, isLoading, error } = useTrainly();

  const getStatusInfo = () => {
    if (error) {
      return {
        icon: "❌",
        text: "Connection failed",
        color: "text-red-600 bg-red-50 border-red-200",
        details: error.message,
      };
    }

    if (isLoading) {
      return {
        icon: "🔄",
        text: "Connecting...",
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        details: "Establishing connection to Trainly",
      };
    }

    if (isConnected) {
      return {
        icon: "✅",
        text: "Connected",
        color: "text-green-600 bg-green-50 border-green-200",
        details: "Ready to answer questions",
      };
    }

    return {
      icon: "⚠️",
      text: "Disconnected",
      color: "text-gray-600 bg-gray-50 border-gray-200",
      details: "Not connected to Trainly",
    };
  };

  const status = getStatusInfo();

  const positionClasses = {
    "top-left": "fixed top-4 left-4 z-50",
    "top-right": "fixed top-4 right-4 z-50",
    "bottom-left": "fixed bottom-4 left-4 z-50",
    "bottom-right": "fixed bottom-4 right-4 z-50",
    inline: "",
  };

  const baseClasses = `
    inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
    ${status.color}
    ${positionClasses[position]}
    ${className}
  `;

  return (
    <div className={baseClasses}>
      <span className={status.icon === "🔄" ? "animate-spin" : ""}>
        {status.icon}
      </span>
      <span>{status.text}</span>

      {showDetails && status.details && (
        <span className="text-xs opacity-75 ml-1">- {status.details}</span>
      )}
    </div>
  );
}
