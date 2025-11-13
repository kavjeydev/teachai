"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export function MockupCarousel() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentImage, setCurrentImage] = useState<"graph" | "chat">("graph");

  // Determine if we're in dark mode
  const isDark = resolvedTheme === "dark" || theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev === "graph" ? "chat" : "graph"));
    }, 10000); // Switch every 10 seconds

    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  const graphImage = isDark ? "/graph_dark.png" : "/graph_light.png";
  const chatImage = isDark ? "/chat_dark.png" : "/chat_light.png";

  return (
    <div className="relative w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full py-12">
        <div className="relative aspect-[17.5/9] w-full overflow-hidden rounded-3xl border-2 border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div
            className={`absolute inset-0 will-change-opacity ${
              currentImage === "graph" ? "z-10" : "z-0 pointer-events-none"
            }`}
            style={{
              opacity: currentImage === "graph" ? 1 : 0,
              transition: "opacity 3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Image
              src={graphImage}
              alt="Graph visualization mockup"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div
            className={`absolute inset-0 will-change-opacity ${
              currentImage === "chat" ? "z-10" : "z-0 pointer-events-none"
            }`}
            style={{
              opacity: currentImage === "chat" ? 1 : 0,
              transition: "opacity 3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Image
              src={chatImage}
              alt="Chat interface mockup"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
