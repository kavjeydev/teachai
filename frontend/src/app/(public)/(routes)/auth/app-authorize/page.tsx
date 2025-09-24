"use client";

import React, { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Note: Using Card instead of Alert since Alert component doesn't exist
import {
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Users,
  Files,
  Key,
} from "lucide-react";
import { toast } from "sonner";

/**
 * 🔐 OAuth-Style App Authorization Page
 *
 * Users visit this page to authorize apps to access their private data.
 * This is where users get their secure auth tokens that developers never see.
 */

export default function AppAuthorizePage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get URL parameters
  const appId = searchParams.get("app_id");
  const requestedCapabilities = searchParams
    .get("capabilities")
    ?.split(",") || ["ask"];
  const redirectUrl = searchParams.get("redirect_url");

  const authorizeApp = useMutation(api.user_auth_system.authorizeAppAccess);

  // Mock app data (in production, this would be fetched based on appId)
  const appInfo = {
    name: "DocuMentor",
    description: "AI-powered document analysis and Q&A assistant",
    developer: "TechCorp Inc.",
    iconUrl: "/api/placeholder/64/64",
    websiteUrl: "https://documenator.com",
  };

  const handleAuthorize = async () => {
    if (!user || !appId) return;

    setIsAuthorizing(true);
    try {
      const result = await authorizeApp({
        appId,
        requestedCapabilities,
      });

      setAuthResult(result);
      toast.success("App authorized successfully!");

      // If there's a redirect URL, redirect after showing the token
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 5000);
      }
    } catch (error) {
      console.error("Authorization failed:", error);
      toast.error("Failed to authorize app");
    } finally {
      setIsAuthorizing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Token copied to clipboard!");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!appId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              Invalid Authorization Request
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Missing app ID in authorization request.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-amber-950/20 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {!user ? (
          /* Not Signed In */
          <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Authorize App Access</CardTitle>
              <p className="text-zinc-600 dark:text-zinc-400">
                Sign in to Trainly to authorize <strong>{appInfo.name}</strong>
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <SignInButton mode="modal">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In to Continue
                </Button>
              </SignInButton>
            </CardContent>
          </Card>
        ) : authResult ? (
          /* Authorization Successful */
          <Card className="border-2 border-green-200 dark:border-green-800 shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-800 dark:text-green-200">
                Authorization Successful!
              </CardTitle>
              <p className="text-green-700 dark:text-green-300">
                You've authorized <strong>{appInfo.name}</strong> to access your
                private data
              </p>
            </CardHeader>
            <CardContent>
              {/* Your Private Auth Token */}
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Your Private Auth Token
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  This token is <strong>yours alone</strong>. The app developer
                  cannot see it. Use it to access your private data through the
                  app.
                </p>

                <div className="bg-zinc-900 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <code className="text-green-400 font-mono text-sm">
                      {showToken
                        ? authResult.userAuthToken
                        : `uat_${"*".repeat(32)}_${"*".repeat(8)}`}
                    </code>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowToken(!showToken)}
                        className="text-green-400 border-green-400 hover:bg-green-400 hover:text-white"
                      >
                        {showToken ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(authResult.userAuthToken)
                        }
                        className="text-green-400 border-green-400 hover:bg-green-400 hover:text-white"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border border-green-200 bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <div className="text-green-800 dark:text-green-200">
                      <strong>Keep this token secure!</strong> This is your
                      private key to access your data. The app developer cannot
                      see this token - you control it completely.
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Protection Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    What You Control
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Your private auth token</li>
                    <li>• Access to your own data</li>
                    <li>• Full citations and content</li>
                    <li>• Ability to revoke access anytime</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    What's Protected
                  </h4>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                    <li>• Developer cannot see your token</li>
                    <li>• Your files stay in private sub-chat</li>
                    <li>• No cross-user data access</li>
                    <li>• Complete data isolation</li>
                  </ul>
                </div>
              </div>

              {/* Next Steps */}
              <div className="text-center">
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                  Next Steps
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Use your private auth token to securely access your data
                  through {appInfo.name}
                </p>

                {redirectUrl ? (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Redirecting you back to {appInfo.name} in 5 seconds...
                    </p>
                    <Button
                      onClick={() => (window.location.href = redirectUrl)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Return to {appInfo.name}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Return to the app and use your private token to access your
                    data
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Authorization Request */
          <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-amber-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">
                    Authorize App Access
                  </CardTitle>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    <strong>{appInfo.name}</strong> wants to access your private
                    data
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* App Information */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">App Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {appInfo.name}
                  </div>
                  <div>
                    <strong>Developer:</strong> {appInfo.developer}
                  </div>
                  <div>
                    <strong>Description:</strong> {appInfo.description}
                  </div>
                  {appInfo.websiteUrl && (
                    <div>
                      <strong>Website:</strong>{" "}
                      <a
                        href={appInfo.websiteUrl}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        {appInfo.websiteUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Requested Permissions */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Requested Permissions</h3>
                <div className="space-y-2">
                  {requestedCapabilities.map((capability) => (
                    <div
                      key={capability}
                      className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-800 dark:text-blue-200">
                          {capability === "ask"
                            ? "Ask Questions"
                            : capability === "upload"
                              ? "Enable File Uploads"
                              : capability}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {capability === "ask"
                            ? "App can ask questions about your documents and get AI responses"
                            : capability === "upload"
                              ? "App can help you upload files to your private workspace"
                              : "Custom capability"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Guarantees */}
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  🔒 Your Privacy is Protected
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      ✅ You Control:
                    </h4>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <li>• Your private auth token</li>
                      <li>• Access to your data</li>
                      <li>• App authorization</li>
                      <li>• Ability to revoke access</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                      ❌ App Cannot:
                    </h4>
                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                      <li>• See your auth token</li>
                      <li>• Access your raw files</li>
                      <li>• See other users' data</li>
                      <li>• Control your authorization</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Authorization Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAuthorize}
                  disabled={isAuthorizing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                >
                  {isAuthorizing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Authorize {appInfo.name}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.close()}
                  className="border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </Button>
              </div>

              {/* Security Notice */}
              <div className="mt-6 text-center">
                <p className="text-xs text-zinc-500">
                  By authorizing this app, you're creating a private workspace
                  that only you control. You can revoke access anytime from your
                  Trainly dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
