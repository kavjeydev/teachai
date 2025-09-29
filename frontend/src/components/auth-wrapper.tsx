"use client";

import React from "react";
import { useConvexAuth } from "@/hooks/use-auth-state";
import { LoadingCard } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function AuthWrapper({
  children,
  fallback,
  showError = true
}: AuthWrapperProps) {
  const { isLoaded, isSignedIn, isLoading, error, canQuery } = useConvexAuth();

  // Show loading state while auth is initializing
  if (isLoading || !isLoaded) {
    return fallback || (
      <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <LoadingCard
          title="Initializing Authentication..."
          description="Please wait while we verify your session"
        />
      </div>
    );
  }

  // Show error state if auth failed
  if (error && showError) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Authentication Error
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {error}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-amber-400 hover:bg-amber-400/90 text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // If not signed in, let the app handle redirect
  if (!isSignedIn) {
    return <>{children}</>;
  }

  // Only render children when auth is fully loaded and ready for Convex queries
  if (canQuery) {
    return <>{children}</>;
  }

  // Fallback loading state
  return fallback || (
    <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
      <LoadingCard
        title="Loading..."
        description="Preparing your dashboard"
      />
    </div>
  );
}

// Higher-order component version
export function withAuthWrapper<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    showError?: boolean;
  }
) {
  const WrappedComponent = (props: P) => (
    <AuthWrapper {...options}>
      <Component {...props} />
    </AuthWrapper>
  );

  WrappedComponent.displayName = `withAuthWrapper(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
