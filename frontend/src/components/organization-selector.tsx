"use client";

import React, { useState } from "react";
import { useOrganization } from "./organization-provider";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function OrganizationSelector() {
  const {
    currentOrganizationId,
    setCurrentOrganizationId,
    organizations,
    isLoading,
    createOrganization,
  } = useOrganization();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const currentOrg = organizations?.find(
    (org) => org._id === currentOrganizationId,
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
        <span className="text-sm text-zinc-500">Loading...</span>
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          variant="outline"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
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

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={currentOrganizationId || undefined}
          onValueChange={(value) =>
            setCurrentOrganizationId(value as any)
          }
        >
          <SelectTrigger className="w-[200px] gap-2">
            <Building2 className="h-4 w-4" />
            <SelectValue placeholder="Select organization">
              {currentOrg?.name || "Select organization"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org._id} value={org._id}>
                {org.name}
              </SelectItem>
            ))}
            <SelectItem
              value="__create__"
              onSelect={() => setIsCreateDialogOpen(true)}
              className="text-blue-600 dark:text-blue-400"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Organization
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to organize your chats separately.
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
