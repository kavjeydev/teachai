"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";

function OAuthAuthorizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [appInfo, setAppInfo] = useState<any>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get OAuth parameters from URL
  const authCode = searchParams.get("code");
  const appId = searchParams.get("app_id");
  const capabilities = searchParams.get("capabilities")?.split(",") || [];

  useEffect(() => {
    if (authCode && appId) {
      // Fetch app information to show user what they're authorizing
      fetchAppInfo();
    } else {
      setError("Invalid authorization request - missing required parameters");
    }
  }, [authCode, appId]);

  const fetchAppInfo = async () => {
    try {
      // In a real implementation, you'd fetch app info from Convex
      // For now, show mock data based on appId
      setAppInfo({
        name:
          appId === "app_demo_123"
            ? "Demo Document Assistant"
            : "Third-Party App",
        description:
          "AI-powered document analysis with complete privacy protection",
        developer: "Verified Developer",
        website: "https://example.com",
        capabilities: capabilities,
      });
    } catch (error) {
      setError("Failed to load app information");
    }
  };

  const handleAuthorize = async () => {
    if (!user || !authCode) return;

    setIsAuthorizing(true);
    try {
      // The authorization happens automatically when user clicks authorize
      // The token is generated and stored in Convex via the backend

      // Redirect back to the app with the authorization code
      const redirectUri =
        searchParams.get("redirect_uri") ||
        "http://localhost:3000/auth/callback";
      const finalRedirectUrl = `${redirectUri}?code=${authCode}&state=success`;

      // Small delay to show authorization success
      setTimeout(() => {
        window.location.href = finalRedirectUrl;
      }, 1500);
    } catch (error) {
      setError("Authorization failed. Please try again.");
      setIsAuthorizing(false);
    }
  };

  const handleDeny = () => {
    const redirectUri =
      searchParams.get("redirect_uri") || "http://localhost:3000/auth/callback";
    const finalRedirectUrl = `${redirectUri}?error=access_denied&error_description=User denied authorization`;
    window.location.href = finalRedirectUrl;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Authorization Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-600 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sign In Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-600 mb-4">
              You need to sign in to Trainly before authorizing third-party app
              access.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full">Sign In to Continue</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAuthorizing) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Authorization Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-600">
              Redirecting you back to {appInfo?.name}...
            </p>
            <p className="text-sm text-green-600 mt-2">
              ✅ Your private AI workspace is now connected!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Authorize Third-Party App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* App Info */}
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold text-lg mb-2">{appInfo?.name}</h3>
            <p className="text-zinc-600 text-sm mb-3">{appInfo?.description}</p>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span>by {appInfo?.developer}</span>
              <Badge variant="outline" className="text-xs">
                Verified
              </Badge>
            </div>
          </div>

          {/* User Info */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="font-semibold text-blue-800 mb-2">
              Authorizing as: {user?.firstName} {user?.lastName}
            </h4>
            <p className="text-blue-700 text-sm">
              {user?.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>

          {/* Requested Permissions */}
          <div>
            <h4 className="font-semibold mb-3">
              This app is requesting permission to:
            </h4>
            <div className="space-y-2">
              {capabilities.map((capability, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-medium text-sm">
                      {capability === "ask" &&
                        "Ask questions about your documents"}
                      {capability === "upload" &&
                        "Help you upload new documents"}
                      {capability === "export_summaries" &&
                        "Export document summaries"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {capability === "ask" &&
                        "Get AI responses based on your private documents"}
                      {capability === "upload" &&
                        "Provide upload assistance (files go to your private workspace)"}
                      {capability === "export_summaries" &&
                        "Generate summaries of your documents"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Guarantees */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy Protection
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>
                • You control your authentication token (stored on your device
                only)
              </li>
              <li>• The app developer cannot see or access your raw files</li>
              <li>
                • You can revoke access anytime from your Trainly settings
              </li>
              <li>• Your data remains completely isolated from other users</li>
            </ul>
          </div>

          {/* Authorization Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDeny} className="flex-1">
              Deny Access
            </Button>
            <Button
              onClick={handleAuthorize}
              disabled={isAuthorizing}
              className="flex-1"
            >
              {isAuthorizing ? "Authorizing..." : "Authorize App"}
            </Button>
          </div>

          {/* Footer */}
          <div className="text-xs text-zinc-500 text-center pt-4 border-t">
            By authorizing, you allow {appInfo?.name} to access your Trainly AI
            workspace with the permissions listed above. You can revoke this
            access anytime.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <OAuthAuthorizeContent />
    </Suspense>
  );
}
