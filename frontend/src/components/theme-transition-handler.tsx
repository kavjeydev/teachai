"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeTransitionHandler() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Add theme-loading class during theme resolution
    document.documentElement.classList.add("theme-loading");

    // Remove the class after a short delay to enable transitions
    const timer = setTimeout(() => {
      document.documentElement.classList.remove("theme-loading");
    }, 50);

    return () => clearTimeout(timer);
  }, [theme, systemTheme, mounted]);

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return null;
}
