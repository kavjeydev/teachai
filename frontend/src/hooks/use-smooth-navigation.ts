import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useSmoothNavigation() {
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const router = useRouter();

  const navigateTo = useCallback((path: string, displayName?: string) => {
    setNavigatingTo(path);

    // Start navigation
    router.push(path);

    // Keep loading state for a reasonable time to cover the navigation
    setTimeout(() => {
      setNavigatingTo(null);
    }, 2000); // 2 seconds should cover most navigation times

  }, [router]);

  const isNavigating = useCallback((path: string) => {
    return navigatingTo === path;
  }, [navigatingTo]);

  return {
    navigateTo,
    isNavigating,
    isNavigatingAnywhere: !!navigatingTo
  };
}
