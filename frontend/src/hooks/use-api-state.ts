"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface ApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  progress: number;
}

export interface ApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
  retryCount?: number;
  retryDelay?: number;
}

export function useApiState<T = any>(initialData: T | null = null) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
    progress: 0,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, loading: false, error: null, progress: 100 }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, loading: false, progress: 0 }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      progress: 0,
    });
  }, [initialData]);

  const execute = useCallback(async <R = T>(
    apiCall: () => Promise<R>,
    options: ApiOptions = {}
  ): Promise<R | null> => {
    const {
      onSuccess,
      onError,
      showErrorToast = true,
      showSuccessToast = false,
      successMessage = "Operation completed successfully",
      retryCount = 0,
      retryDelay = 1000,
    } = options;

    let attempts = 0;
    const maxAttempts = retryCount + 1;

    const attemptCall = async (): Promise<R | null> => {
      attempts++;

      try {
        setLoading(true);
        setProgress(10);

        const result = await apiCall();

        setProgress(90);
        setData(result as T);
        setProgress(100);

        if (showSuccessToast) {
          toast.success(successMessage);
        }

        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        console.error('API call failed:', error);

        if (attempts < maxAttempts) {
          console.log(`Retrying API call (${attempts}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return attemptCall();
        }

        setError(errorMessage);

        if (showErrorToast) {
          toast.error(errorMessage);
        }

        onError?.(errorMessage);
        return null;
      } finally {
        if (attempts >= maxAttempts) {
          setLoading(false);
        }
      }
    };

    return attemptCall();
  }, [setLoading, setProgress, setData, setError]);

  return {
    ...state,
    setLoading,
    setProgress,
    setData,
    setError,
    reset,
    execute,
    isIdle: !state.loading && !state.error && !state.data,
    isSuccess: !state.loading && !state.error && !!state.data,
    isError: !state.loading && !!state.error,
  };
}

// Specialized hook for file uploads
export function useFileUploadState() {
  const api = useApiState();

  const uploadFile = useCallback(async (
    file: File,
    uploadFn: (file: File, onProgress?: (progress: number) => void) => Promise<any>,
    options: ApiOptions = {}
  ) => {
    return api.execute(
      () => uploadFn(file, api.setProgress),
      {
        successMessage: `${file.name} uploaded successfully`,
        showSuccessToast: true,
        ...options,
      }
    );
  }, [api]);

  return {
    ...api,
    uploadFile,
  };
}

// Specialized hook for GraphRAG operations
export function useGraphApiState() {
  const api = useApiState();

  const loadGraphData = useCallback(async (
    chatId: string,
    baseUrl: string,
    options: ApiOptions = {}
  ) => {
    return api.execute(
      async () => {
        api.setProgress(20);
        const response = await fetch(`${baseUrl}graph_data/${chatId}`);

        if (!response.ok) {
          throw new Error(`Failed to load graph data: ${response.status}`);
        }

        api.setProgress(60);
        const data = await response.json();
        api.setProgress(80);

        return data;
      },
      {
        retryCount: 2,
        retryDelay: 1000,
        ...options,
      }
    );
  }, [api]);

  const answerQuestion = useCallback(async (
    payload: any,
    baseUrl: string,
    options: ApiOptions = {}
  ) => {
    return api.execute(
      async () => {
        api.setProgress(10);
        const response = await fetch(`${baseUrl}answer_question`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        api.setProgress(70);
        const data = await response.json();

        if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors[0].message);
        }

        return data;
      },
      {
        retryCount: 1,
        retryDelay: 2000,
        ...options,
      }
    );
  }, [api]);

  return {
    ...api,
    loadGraphData,
    answerQuestion,
  };
}
