"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function DebugCredits() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);

  const credits = useQuery(api.subscriptions.getUserCredits);
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const consumeCredits = useMutation(api.subscriptions.consumeCredits);
  const initializeCredits = useMutation(api.subscriptions.initializeUserCredits);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force a refresh by calling initialize credits
      await initializeCredits();
      toast("Credits refreshed!");
    } catch (error) {
      console.error("Failed to refresh credits:", error);
      toast("Failed to refresh credits");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestConsumption = async () => {
    setIsConsuming(true);
    try {
      const result = await consumeCredits({
        credits: 5,
        model: "gpt-4o-mini",
        tokensUsed: 1000,
        description: "Test credit consumption",
      });

      console.log("Credit consumption result:", result);
      toast("Test: Consumed 5 credits!");
    } catch (error) {
      console.error("Failed to consume test credits:", error);
      toast(`Failed to consume credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConsuming(false);
    }
  };

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <AlertCircle className="w-5 h-5" />
          🧪 Credit System Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Subscription:</strong>
            <p>{subscription ? `${subscription.tier} (${subscription.status})` : 'Loading...'}</p>
          </div>
          <div>
            <strong>Credits:</strong>
            <p>{credits ? `${credits.usedCredits.toFixed(1)} / ${credits.totalCredits.toFixed(1)} used` : 'Loading...'}</p>
          </div>
          <div>
            <strong>Remaining:</strong>
            <p>{credits ? `${(credits.remainingCredits || 0).toFixed(1)} credits` : 'Loading...'}</p>
          </div>
          <div>
            <strong>Period:</strong>
            <p>{credits ? `${Math.ceil((credits.periodEnd - Date.now()) / (1000 * 60 * 60 * 24))} days left` : 'Loading...'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            {isRefreshing ? (
              <>
                <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin mr-1" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh Credits
              </>
            )}
          </Button>

          <Button
            onClick={handleTestConsumption}
            disabled={isConsuming}
            variant="outline"
            size="sm"
          >
            {isConsuming ? (
              <>
                <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin mr-1" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 mr-1" />
                Test: Use 5 Credits
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-blue-700 dark:text-blue-300">
          Use this to debug credit system. Check console for detailed logs.
        </p>
      </CardContent>
    </Card>
  );
}
