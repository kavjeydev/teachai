"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Custom useAuth hook that specifies the JWT template
function useAuthWithTemplate() {
  const auth = useAuth();
  return {
    ...auth,
    // Override getToken to use the "convex" JWT template
    getToken: async (options?: any) => {
      if (!auth.getToken) return null;
      return auth.getToken({ ...options, template: "convex" });
    },
  };
}

export const ConvexClientProvider = ({ children }: { children: ReactNode }) => {
  return (
    // @ts-ignore - ClerkProvider types are overly strict but this works at runtime
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      {/* @ts-ignore - useAuth hook signature is compatible */}
      <ConvexProviderWithClerk useAuth={useAuthWithTemplate} client={convex}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
