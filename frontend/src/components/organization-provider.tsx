"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConvexAuth } from "@/hooks/use-auth-state";

interface OrganizationContextType {
  currentOrganizationId: Id<"organizations"> | null;
  setCurrentOrganizationId: (id: Id<"organizations"> | null) => void;
  organizations: any[] | undefined;
  isLoading: boolean;
  createOrganization: (name: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentOrganizationId, setCurrentOrganizationIdState] = useState<
    Id<"organizations"> | null
  >(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { canQuery, isSignedIn } = useConvexAuth();
  const organizations = useQuery(
    api.organizations.getOrganizations,
    canQuery && isSignedIn ? undefined : "skip",
  );
  const createOrgMutation = useMutation(api.organizations.createOrganization);
  const migrateChatsMutation = useMutation(api.chats.migrateChatsToOrganization);

  // Load organization from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOrgId = localStorage.getItem("currentOrganizationId");
      if (savedOrgId) {
        setCurrentOrganizationIdState(savedOrgId as Id<"organizations">);
      }
    }
    setIsInitialized(true);
  }, []);

  // Set default organization when organizations load and migrate chats
  useEffect(() => {
    if (
      isInitialized &&
      organizations &&
      organizations.length > 0 &&
      !currentOrganizationId &&
      canQuery
    ) {
      // Check if saved org still exists
      const savedOrgId = localStorage.getItem("currentOrganizationId");
      if (savedOrgId) {
        const orgExists = organizations.some((org) => org._id === savedOrgId);
        if (orgExists) {
          setCurrentOrganizationIdState(savedOrgId as Id<"organizations">);
          // Migrate any chats without organizationId to this org
          migrateChatsMutation({ organizationId: savedOrgId as Id<"organizations"> }).catch(
            (err) => {
              // Silently fail - migration is best effort
              console.log("Migration note:", err);
            },
          );
          return;
        }
      }
      // Otherwise, use the first organization
      const firstOrg = organizations[0];
      setCurrentOrganizationIdState(firstOrg._id);
      localStorage.setItem("currentOrganizationId", firstOrg._id);
      // Migrate any chats without organizationId to this org
      migrateChatsMutation({ organizationId: firstOrg._id }).catch((err) => {
        // Silently fail - migration is best effort
        console.log("Migration note:", err);
      });
    }
  }, [organizations, currentOrganizationId, isInitialized, canQuery, migrateChatsMutation]);

  const setCurrentOrganizationId = (id: Id<"organizations"> | null) => {
    setCurrentOrganizationIdState(id);
    if (id && typeof window !== "undefined") {
      localStorage.setItem("currentOrganizationId", id);
      // Migrate any chats without organizationId to this org when switching
      if (canQuery) {
        migrateChatsMutation({ organizationId: id }).catch((err) => {
          // Silently fail - migration is best effort
          console.log("Migration note:", err);
        });
      }
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("currentOrganizationId");
    }
  };

  const createOrganization = async (name: string) => {
    try {
      const newOrgId = await createOrgMutation({ name });
      setCurrentOrganizationId(newOrgId);
      toast.success(`Organization "${name}" created successfully!`);
      return;
    } catch (error) {
      console.error("Failed to create organization:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create organization",
      );
      throw error;
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganizationId,
        setCurrentOrganizationId,
        organizations,
        isLoading: !isInitialized || organizations === undefined,
        createOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    // Return a default context if not within provider (for public pages)
    return {
      currentOrganizationId: null,
      setCurrentOrganizationId: () => {},
      organizations: undefined,
      isLoading: false,
      createOrganization: async () => {
        throw new Error("OrganizationProvider is not available");
      },
    };
  }
  return context;
}
