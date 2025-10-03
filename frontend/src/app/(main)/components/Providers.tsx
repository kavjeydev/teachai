// components/Providers.tsx
"use client";

import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/clerk-react";
import { ConvexClientProvider } from "@/app/components/providers/convex-provider";
// Import other client-side providers if necessary

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ConvexClientProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        enableColorScheme={true}
      >
        {children}
      </ThemeProvider>
    </ConvexClientProvider>
  );
};

export default Providers;
