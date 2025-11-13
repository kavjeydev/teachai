"use client";

import { useAuth, useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { identifyUser, resetPostHog, setUserProperties } from "@/lib/posthog";

export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  isLoading: boolean;
  user: any;
  error: string | null;
}

export function useAuthState(): AuthState {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkAuthState = async () => {
      try {
        // Wait for both auth and user to be loaded
        if (authLoaded && userLoaded) {
          // If signed in, verify we can get a token
          if (isSignedIn) {
            try {
              await getToken();
              setError(null);

              // Identify user in PostHog when signed in
              if (user) {
                identifyUser(user.id, {
                  email: user.primaryEmailAddress?.emailAddress,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  username: user.username,
                  createdAt: user.createdAt,
                });

                // Set user properties
                setUserProperties({
                  email: user.primaryEmailAddress?.emailAddress,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  username: user.username,
                });
              }
            } catch (tokenError) {
              console.error("Token verification failed:", tokenError);
              setError(
                "Authentication token invalid. Please refresh the page.",
              );
            }
          } else {
            // User signed out - reset PostHog
            resetPostHog();
          }

          setIsLoading(false);
        } else {
          // Set a timeout to prevent infinite loading
          timeoutId = setTimeout(() => {
            if (!authLoaded || !userLoaded) {
              setError("Authentication timeout. Please refresh the page.");
              setIsLoading(false);
            }
          }, 10000); // 10 second timeout
        }
      } catch (error) {
        console.error("Auth state check failed:", error);
        setError("Authentication error. Please refresh the page.");
        setIsLoading(false);
      }
    };

    checkAuthState();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [authLoaded, userLoaded, isSignedIn, getToken, user]);

  return {
    isLoaded: authLoaded && userLoaded && !isLoading,
    isSignedIn: isSignedIn || false,
    isLoading,
    user,
    error,
  };
}

// Hook for components that need to wait for auth before making Convex queries
export function useConvexAuth() {
  const authState = useAuthState();

  // Return whether it's safe to make Convex queries
  const canQuery = authState.isLoaded && !authState.error;

  return {
    ...authState,
    canQuery,
    // Helper to conditionally skip queries
    skipQuery: canQuery ? undefined : ("skip" as const),
  };
}
