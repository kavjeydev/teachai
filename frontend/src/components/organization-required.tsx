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

export function OrganizationRequired({
  children,
}: {
  children: React.ReactNode;
}) {
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
        {/* Content */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto relative border rounded-3xl border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex flex-col items-center w-full max-w-2xl mx-auto text-center p-8">
            {/* Visual Illustration */}
            <div className="mb-8 relative">
              {/* Two overlapping frames */}
              <div className="relative w-48 h-48 mx-auto">
                {/* Back frame */}
                <div className="absolute inset-0 border-2 border-amber-200 dark:border-amber-800 rounded-lg transform rotate-[-5deg] opacity-60"></div>
                {/* Front frame */}
                <div className="absolute inset-0 border-2 border-amber-300 dark:border-amber-700 rounded-lg transform rotate-[2deg] shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/30">
                      <Building2 className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
                {/* Dashed lines extending from frames */}
                <div className="absolute -left-8 top-1/2 w-8 border-t-2 border-dashed border-amber-200 dark:border-amber-800 opacity-50"></div>
                <div className="absolute -right-8 top-1/2 w-8 border-t-2 border-dashed border-amber-200 dark:border-amber-800 opacity-50"></div>
              </div>
            </div>

            {/* Text Content */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-amber-600 dark:text-amber-400 mb-3">
                Create Your First Organization
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Organize your chats and collaborate with your team.
              </p>
            </div>

            {/* Button */}
            <div className="w-full max-w-xs">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="w-full bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Organization
              </Button>
            </div>
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
