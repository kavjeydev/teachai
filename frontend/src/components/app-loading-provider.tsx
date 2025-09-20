"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { LoadingOverlay } from "@/components/ui/loading-spinner";

interface LoadingState {
  id: string;
  message: string;
  progress?: number;
  showProgress?: boolean;
}

interface LoadingContextType {
  isLoading: boolean;
  loadingStates: LoadingState[];
  addLoading: (id: string, message: string, showProgress?: boolean) => void;
  updateProgress: (id: string, progress: number) => void;
  updateMessage: (id: string, message: string) => void;
  removeLoading: (id: string) => void;
  clearAll: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useAppLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useAppLoading must be used within an AppLoadingProvider");
  }
  return context;
}

interface AppLoadingProviderProps {
  children: React.ReactNode;
  showGlobalOverlay?: boolean;
}

export function AppLoadingProvider({
  children,
  showGlobalOverlay = false
}: AppLoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);

  const addLoading = useCallback((id: string, message: string, showProgress = false) => {
    setLoadingStates(prev => {
      const existing = prev.find(state => state.id === id);
      if (existing) {
        return prev.map(state =>
          state.id === id
            ? { ...state, message, showProgress, progress: showProgress ? 0 : undefined }
            : state
        );
      }
      return [...prev, { id, message, showProgress, progress: showProgress ? 0 : undefined }];
    });
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setLoadingStates(prev =>
      prev.map(state =>
        state.id === id
          ? { ...state, progress: Math.min(100, Math.max(0, progress)) }
          : state
      )
    );
  }, []);

  const updateMessage = useCallback((id: string, message: string) => {
    setLoadingStates(prev =>
      prev.map(state =>
        state.id === id
          ? { ...state, message }
          : state
      )
    );
  }, []);

  const removeLoading = useCallback((id: string) => {
    setLoadingStates(prev => prev.filter(state => state.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setLoadingStates([]);
  }, []);

  const isLoading = loadingStates.length > 0;
  const primaryLoadingState = loadingStates[0]; // Show the first/primary loading state

  const contextValue: LoadingContextType = {
    isLoading,
    loadingStates,
    addLoading,
    updateProgress,
    updateMessage,
    removeLoading,
    clearAll,
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}

      {/* Global Loading Overlay */}
      {showGlobalOverlay && primaryLoadingState && (
        <LoadingOverlay
          isVisible={true}
          text={primaryLoadingState.message}
          progress={primaryLoadingState.progress}
          showProgress={primaryLoadingState.showProgress}
          className="fixed inset-0 z-[9999]"
        />
      )}
    </LoadingContext.Provider>
  );
}

// Hook for managing specific loading operations
export function useLoadingOperation() {
  const { addLoading, updateProgress, updateMessage, removeLoading } = useAppLoading();

  const startLoading = useCallback((
    id: string,
    message: string,
    showProgress = false
  ) => {
    addLoading(id, message, showProgress);

    return {
      updateProgress: (progress: number) => updateProgress(id, progress),
      updateMessage: (message: string) => updateMessage(id, message),
      finish: () => removeLoading(id),
    };
  }, [addLoading, updateProgress, updateMessage, removeLoading]);

  return { startLoading };
}

// Hook for file upload operations
export function useFileUploadLoading() {
  const { startLoading } = useLoadingOperation();

  const startFileUpload = useCallback((fileName: string) => {
    const operation = startLoading(
      `file-upload-${fileName}`,
      `Uploading ${fileName}...`,
      true
    );

    return {
      ...operation,
      setExtracting: () => operation.updateMessage(`Extracting text from ${fileName}...`),
      setProcessing: () => operation.updateMessage(`Processing ${fileName}...`),
      setCreatingNodes: () => operation.updateMessage(`Creating knowledge graph nodes...`),
      setComplete: () => {
        operation.updateMessage(`${fileName} uploaded successfully!`);
        setTimeout(() => operation.finish(), 1000);
      },
    };
  }, [startLoading]);

  return { startFileUpload };
}

// Hook for navigation loading
export function useNavigationLoading() {
  const { startLoading } = useLoadingOperation();

  const startNavigation = useCallback((destination: string) => {
    const operation = startLoading(
      `navigation-${destination}`,
      `Navigating to ${destination}...`,
      false
    );

    // Auto-complete navigation after a timeout
    setTimeout(() => {
      operation.finish();
    }, 2000);

    return operation;
  }, [startLoading]);

  return { startNavigation };
}

// Hook for API operations
export function useApiLoading() {
  const { startLoading } = useLoadingOperation();

  const startApiCall = useCallback((
    operationName: string,
    showProgress = false
  ) => {
    const operation = startLoading(
      `api-${operationName}-${Date.now()}`,
      `${operationName}...`,
      showProgress
    );

    return operation;
  }, [startLoading]);

  return { startApiCall };
}
