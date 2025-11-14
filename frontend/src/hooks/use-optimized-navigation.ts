"use client";

import { useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";

/**
 * Hook for optimized navigation with instant visual feedback
 * Uses React transitions to keep UI responsive during navigation
 */
export function useOptimizedNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (path: string) => {
      // Use startTransition for non-blocking navigation
      startTransition(() => {
        router.push(path);
      });
    },
    [router],
  );

  const navigatePrefetch = useCallback(
    (path: string) => {
      // Prefetch the route for faster navigation
      router.prefetch(path);
    },
    [router],
  );

  return {
    navigate,
    navigatePrefetch,
    isNavigating: isPending,
  };
}
