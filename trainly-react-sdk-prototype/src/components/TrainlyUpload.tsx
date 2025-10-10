"use client";

import * as React from "react";
import { useTrainly } from "../useTrainly";

export interface TrainlyUploadProps {
  variant?: "drag-drop" | "button" | "minimal";
  accept?: string;
  maxSize?: string;
  multiple?: boolean;
  className?: string;
  onUpload?: (files: File[]) => void;
  onError?: (error: string) => void;
  scopeValues?: Record<string, string | number | boolean>; // NEW: Custom scopes support
}

export function TrainlyUpload({
  variant = "drag-drop",
  accept = ".pdf,.doc,.docx,.txt,.md",
  maxSize = "10MB",
  multiple = false,
  className = "",
  onUpload,
  onError,
  scopeValues,
}: TrainlyUploadProps) {
  const { upload, isLoading } = useTrainly();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const maxSizeBytes = parseMaxSize(maxSize);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);

    // Validate files
    for (const file of fileArray) {
      if (maxSizeBytes && file.size > maxSizeBytes) {
        const error = `File "${file.name}" is too large. Maximum size is ${maxSize}.`;
        onError?.(error);
        return;
      }
    }

    // Upload files
    try {
      for (const file of fileArray) {
        await upload(file, scopeValues);
      }
      onUpload?.(fileArray);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  if (variant === "button") {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`
            px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        >
          {isLoading ? "Uploading..." : "Upload Files"}
        </button>
      </>
    );
  }

  if (variant === "minimal") {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`text-blue-500 hover:text-blue-600 underline ${className}`}
        >
          {isLoading ? "Uploading..." : "Upload"}
        </button>
      </>
    );
  }

  // Default: drag-drop variant
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragOver ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"}
          ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isLoading
                ? "Uploading..."
                : "Drop files here or click to upload"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports: {accept.replace(/\./g, "").toUpperCase()} files up to{" "}
              {maxSize}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function parseMaxSize(maxSize: string): number | null {
  const match = maxSize.match(/^(\d+)\s*(GB|MB|KB)?$/i);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = (match[2] || "B").toUpperCase();

  switch (unit) {
    case "GB":
      return value * 1024 * 1024 * 1024;
    case "MB":
      return value * 1024 * 1024;
    case "KB":
      return value * 1024;
    default:
      return value;
  }
}
