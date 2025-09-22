import { useState, useCallback } from "react";

interface ButtonLoadingState {
  [key: string]: boolean;
}

export function useButtonLoading() {
  const [loadingStates, setLoadingStates] = useState<ButtonLoadingState>({});

  const setLoading = useCallback((buttonId: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [buttonId]: isLoading
    }));
  }, []);

  const isLoading = useCallback((buttonId: string) => {
    return loadingStates[buttonId] || false;
  }, [loadingStates]);

  const withLoading = useCallback(async (
    buttonId: string,
    asyncFn: () => Promise<any>
  ) => {
    setLoading(buttonId, true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(buttonId, false);
    }
  }, [setLoading]);

  return {
    isLoading,
    setLoading,
    withLoading
  };
}

// Component for consistent loading button UI
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingButton({
  isLoading = false,
  loadingText = "Loading...",
  children,
  className = "",
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${className} ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          {loadingText}
        </div>
      ) : (
        children
      )}
    </button>
  );
}
