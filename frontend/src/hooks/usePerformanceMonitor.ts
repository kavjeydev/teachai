import { useEffect, useCallback, useRef } from "react";

interface PerformanceMetrics {
  navigationStart: number;
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

interface UsePerformanceMonitorReturn {
  logPageLoad: (pageName: string) => void;
  logUserAction: (action: string, duration?: number) => void;
  getMetrics: () => PerformanceMetrics | null;
}

export function usePerformanceMonitor(): UsePerformanceMonitorReturn {
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  const navigationStartRef = useRef<number>(0);

  useEffect(() => {
    // Capture navigation start time
    navigationStartRef.current = performance.now();

    // Measure Core Web Vitals
    const measureWebVitals = () => {
      try {
        // First Contentful Paint
        const fcpEntry = performance.getEntriesByName(
          "first-contentful-paint",
        )[0] as PerformanceEntry;

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (metricsRef.current) {
            metricsRef.current.largestContentfulPaint = lastEntry.startTime;
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let cls = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          if (metricsRef.current) {
            metricsRef.current.cumulativeLayoutShift = cls;
          }
        }).observe({ type: "layout-shift", buffered: true });

        // First Input Delay
        new PerformanceObserver((list) => {
          const firstEntry = list.getEntries()[0];
          if (metricsRef.current && firstEntry) {
            metricsRef.current.firstInputDelay =
              (firstEntry as any).processingStart - firstEntry.startTime;
          }
        }).observe({ type: "first-input", buffered: true });

        // Initialize metrics
        metricsRef.current = {
          navigationStart: navigationStartRef.current,
          pageLoadTime: 0,
          domContentLoaded: 0,
          firstContentfulPaint: fcpEntry ? fcpEntry.startTime : undefined,
        };
      } catch (error) {
        // Performance monitoring error
      }
    };

    // Wait for page to load before measuring
    if (document.readyState === "complete") {
      measureWebVitals();
    } else {
      window.addEventListener("load", measureWebVitals);
      return () => window.removeEventListener("load", measureWebVitals);
    }
  }, []);

  const logPageLoad = useCallback((pageName: string) => {
    const loadTime = performance.now() - navigationStartRef.current;

    if (metricsRef.current) {
      metricsRef.current.pageLoadTime = loadTime;
    }


    // Send to analytics in production
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "page_load_time", {
        page_name: pageName,
        load_time: Math.round(loadTime),
      });
    }
  }, []);

  const logUserAction = useCallback((action: string, duration?: number) => {
    const timestamp = performance.now();


    // Send to analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "user_action", {
        action_name: action,
        duration: duration ? Math.round(duration) : undefined,
        timestamp: Math.round(timestamp),
      });
    }
  }, []);

  const getMetrics = useCallback(() => {
    return metricsRef.current;
  }, []);

  return {
    logPageLoad,
    logUserAction,
    getMetrics,
  };
}

// Performance monitoring utility for tracking render times
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number>(0);
  const { logUserAction } = usePerformanceMonitor();

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    if (renderTime > 100) {
      // Only log slow renders
      logUserAction(`render_${componentName}`, renderTime);
    }
  });

  return {
    startMeasure: () => {
      renderStartRef.current = performance.now();
    },
    endMeasure: () => {
      const renderTime = performance.now() - renderStartRef.current;
      logUserAction(`action_${componentName}`, renderTime);
      return renderTime;
    },
  };
}
