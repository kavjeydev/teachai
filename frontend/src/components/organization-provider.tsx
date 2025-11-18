"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

  const organizations = useQuery(api.organizations.getOrganizations);
  const createOrgMutation = useMutation(api.organizations.createOrganization);

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

  // Set default organization when organizations load
  useEffect(() => {
    if (
      isInitialized &&
      organizations &&
      organizations.length > 0 &&
      !currentOrganizationId
    ) {
      // Check if saved org still exists
      const savedOrgId = localStorage.getItem("currentOrganizationId");
      if (savedOrgId) {
        const orgExists = organizations.some((org) => org._id === savedOrgId);
        if (orgExists) {
          setCurrentOrganizationIdState(savedOrgId as Id<"organizations">);
          return;
        }
      }
      // Otherwise, use the first organization
      const firstOrg = organizations[0];
      setCurrentOrganizationIdState(firstOrg._id);
      localStorage.setItem("currentOrganizationId", firstOrg._id);
    }
  }, [organizations, currentOrganizationId, isInitialized]);

  const setCurrentOrganizationId = (id: Id<"organizations"> | null) => {
    setCurrentOrganizationIdState(id);
    if (id && typeof window !== "undefined") {
      localStorage.setItem("currentOrganizationId", id);
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
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
}
