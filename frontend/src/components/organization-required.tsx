"use client";

import React, { useState } from "react";
import { useOrganization } from "./organization-provider";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function OrganizationRequired({ children }: { children: React.ReactNode }) {
  const {
    currentOrganizationId,
    organizations,
    isLoading,
    createOrganization,
  } = useOrganization();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error("Please enter an organization name");
      return;
    }

    setIsCreating(true);
    try {
      await createOrganization(newOrgName.trim());
      setIsCreateDialogOpen(false);
      setNewOrgName("");
    } catch (error) {
      // Error already handled in createOrganization
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading organizations...
          </p>
        </div>
      </div>
    );
  }

  // Show create organization prompt if no organizations exist
  if (!organizations || organizations.length === 0) {
    return (
      <>
        <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-400/20 mx-auto mb-6">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-sans font-normal text-zinc-900 dark:text-white mb-4">
              Create Your First Organization
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Organizations help you organize your chats. Create an organization
              to get started.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-amber-400 hover:bg-amber-400/90 text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:shadow-amber-400/25 transition-all duration-300"
            >
              Create Organization
            </Button>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Your First Organization</DialogTitle>
              <DialogDescription>
                Organizations help you organize your chats. You can create
                multiple organizations and switch between them.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Organization Name
                </label>
                <Input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="My Organization"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateOrganization();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrganization}
                disabled={isCreating || !newOrgName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show loading if no organization is selected yet
  if (!currentOrganizationId) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Selecting organization...
          </p>
        </div>
      </div>
    );
  }

  // Render children if organization is selected
  return <>{children}</>;
}
