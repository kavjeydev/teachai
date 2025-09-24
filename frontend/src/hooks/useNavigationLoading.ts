import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface UseNavigationLoadingReturn {
  isNavigating: boolean;
  navigateTo: (path: string) => void;
  preloadRoute: (path: string) => void;
}

export function useNavigationLoading(): UseNavigationLoadingReturn {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [preloadedRoutes, setPreloadedRoutes] = useState<Set<string>>(new Set());

  // Preload route data and components
  const preloadRoute = useCallback((path: string) => {
    if (preloadedRoutes.has(path)) return;

    try {
      // Use router.prefetch for route preloading
      router.prefetch(path);
      setPreloadedRoutes(prev => new Set([...prev, path]));
    } catch (error) {
      console.warn(`Failed to preload route: ${path}`, error);
    }
  }, [router, preloadedRoutes]);

  const navigateTo = useCallback(async (path: string) => {
    setIsNavigating(true);

    // Preload the route if not already preloaded
    if (!preloadedRoutes.has(path)) {
      preloadRoute(path);
    }

    // Optimistic navigation with immediate UI feedback
    const minLoadingTime = 150; // Reduced for better performance
    const startTime = Date.now();

    try {
      // Use router.push with optimizations
      router.push(path);

      // Ensure minimum loading time for smooth UX
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed));
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset loading state
      setTimeout(() => {
        setIsNavigating(false);
      }, 50); // Reduced delay for faster response
    }
  }, [router, preloadedRoutes, preloadRoute]);

  // Auto-preload common routes on component mount
  useEffect(() => {
    const commonRoutes = [
      '/dashboard',
      '/pricing',
      '/profile',
    ];

    // Preload after a short delay to not block initial render
    const timeoutId = setTimeout(() => {
      commonRoutes.forEach(route => preloadRoute(route));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [preloadRoute]);

  return {
    isNavigating,
    navigateTo,
    preloadRoute,
  };
}
