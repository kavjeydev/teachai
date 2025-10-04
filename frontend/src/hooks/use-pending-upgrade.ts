"use client";

import { useEffect } from "react";
import { useAuthState } from "@/hooks/use-auth-state";
import { toast } from "sonner";
import { getStripe } from "@/lib/stripe";

interface PendingUpgrade {
  priceId: string;
  tierName: string;
  timestamp: number;
}

export function usePendingUpgrade() {
  const authState = useAuthState();

  useEffect(() => {
    // Only check for pending upgrades if user is signed in and loaded
    if (!authState.isSignedIn || !authState.user || !authState.isLoaded) {
      return;
    }

    const pendingUpgradeStr = localStorage.getItem("pendingUpgrade");
    if (!pendingUpgradeStr) {
      return;
    }

    try {
      const pendingUpgrade: PendingUpgrade = JSON.parse(pendingUpgradeStr);

      // Check if the pending upgrade is not too old (expire after 30 minutes)
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      if (pendingUpgrade.timestamp < thirtyMinutesAgo) {
        localStorage.removeItem("pendingUpgrade");
        return;
      }

      // Clear the pending upgrade first to avoid loops
      localStorage.removeItem("pendingUpgrade");

      // Show a toast asking if they want to continue with the upgrade
      toast.info(
        `Welcome back! Continue with your ${pendingUpgrade.tierName} upgrade?`,
        {
          duration: 10000,
          action: {
            label: "Continue",
            onClick: () => handlePendingUpgrade(pendingUpgrade),
          },
        },
      );
    } catch (error) {
      console.error("Error parsing pending upgrade:", error);
      localStorage.removeItem("pendingUpgrade");
    }
  }, [authState.isSignedIn, authState.user, authState.isLoaded]);

  const handlePendingUpgrade = async (upgrade: PendingUpgrade) => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: upgrade.priceId,
          mode: "subscription",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific case where user already has an active subscription
        if (
          errorData.error &&
          errorData.error.includes("already have an active") &&
          errorData.error.includes("subscription")
        ) {
          toast.info(errorData.error);
          return;
        }

        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId, url, error } = await response.json();

      if (error) {
        // Handle specific case where user already has an active subscription
        if (
          error.includes("already have an active") &&
          error.includes("subscription")
        ) {
          toast.info(error);
          return;
        }
        throw new Error(error);
      }

      if (url) {
        window.location.href = url;
      } else if (sessionId) {
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error("Stripe failed to load");
        }
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error("No checkout session or URL received");
      }
    } catch (error) {
      console.error("Pending upgrade checkout failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to continue with upgrade: ${errorMessage}`);
    }
  };
}
