import { useState, useEffect } from "react";

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedWidth = localStorage.getItem("trainly-sidebar-width");
      const savedCollapsed = localStorage.getItem("trainly-sidebar-collapsed");

      if (savedWidth) {
        setSidebarWidth(parseInt(savedWidth, 10));
      }
      if (savedCollapsed) {
        setIsCollapsed(savedCollapsed === "true");
      }
    };

    // Initial load
    handleStorageChange();

    // Listen for changes
    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-tab updates
    window.addEventListener("sidebar-changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sidebar-changed", handleStorageChange);
    };
  }, []);

  const currentWidth = isCollapsed ? 72 : sidebarWidth;

  return { sidebarWidth: currentWidth, isCollapsed };
}
