"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { toast } from "sonner";

export function TestSubscriptionButton() {
  const [isActivating, setIsActivating] = useState(false);
  const giveUserProSubscription = useMutation(api.subscriptions.giveUserProSubscription);
  const initializeCredits = useMutation(api.subscriptions.initializeUserCredits);

  const handleActivatePro = async () => {
    setIsActivating(true);
    try {
      // First initialize credits if needed
      await initializeCredits();

      // Then give Pro subscription
      const result = await giveUserProSubscription();
      toast.success("Pro subscription activated! You now have 10,000 credits.");

      // Refresh to show new subscription status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to activate Pro:", error);
      toast.error("Failed to activate Pro subscription");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Button
      onClick={handleActivatePro}
      disabled={isActivating}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {isActivating ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          Activating...
        </>
      ) : (
        <>
          <Crown className="w-4 h-4 mr-2" />
          🧪 Test: Activate Pro Subscription
        </>
      )}
    </Button>
  );
}
