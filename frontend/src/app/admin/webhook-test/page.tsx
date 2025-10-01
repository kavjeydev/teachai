"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function WebhookTestPage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    creditsToAdd: "",
    reason: "",
    adminKey: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/manual-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formData.userId || user?.id,
          creditsToAdd: parseInt(formData.creditsToAdd),
          reason: formData.reason,
          adminKey: formData.adminKey,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully added ${formData.creditsToAdd} credits!`);
        console.log("Webhook result:", result);
      } else {
        toast.error(result.error || "Failed to add credits");
        console.error("Webhook error:", result);
      }
    } catch (error) {
      toast.error("Network error");
      console.error("Network error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickAdd = (credits: number) => {
    setFormData((prev) => ({
      ...prev,
      creditsToAdd: credits.toString(),
      reason: `Quick add ${credits} credits`,
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Manual Webhook Test</CardTitle>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Manually add credits to test the webhook functionality
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current User Info */}
            {user && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Current User
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ID: {user.id}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Email: {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold mb-3">Quick Credit Amounts</h3>
              <div className="flex gap-2 flex-wrap">
                {[5000, 15000, 50000, 100000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => quickAdd(amount)}
                  >
                    {amount.toLocaleString()} credits
                  </Button>
                ))}
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  User ID (leave empty to use current user)
                </label>
                <Input
                  value={formData.userId}
                  onChange={(e) =>
                    setFormData({ ...formData, userId: e.target.value })
                  }
                  placeholder={user?.id || "user_..."}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Credits to Add *
                </label>
                <Input
                  type="number"
                  value={formData.creditsToAdd}
                  onChange={(e) =>
                    setFormData({ ...formData, creditsToAdd: e.target.value })
                  }
                  placeholder="5000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <Input
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Manual credit addition for testing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Admin Key *
                </label>
                <Input
                  type="password"
                  value={formData.adminKey}
                  onChange={(e) =>
                    setFormData({ ...formData, adminKey: e.target.value })
                  }
                  placeholder="Your webhook admin key"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Set WEBHOOK_ADMIN_KEY in your .env.local
                </p>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Adding Credits..." : "Add Credits"}
              </Button>
            </form>

            {/* API Test */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">API Test</h3>
              <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
                <code className="text-sm">
                  curl -X POST {window.location.origin}
                  /api/stripe/manual-webhook \<br />
                  -H "Content-Type: application/json" \<br />
                  -d '&#123;"userId": "{user?.id}", "creditsToAdd": 5000,
                  "reason": "Test", "adminKey": "your-key"&#125;'
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

