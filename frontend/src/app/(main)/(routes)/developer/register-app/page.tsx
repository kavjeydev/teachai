"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Copy,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface AppCreationResult {
  appId: string;
  appSecret: string;
  app: any;
}

export default function RegisterAppPage() {
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [redirectUri, setRedirectUri] = useState(
    "http://localhost:3000/auth/trainly/callback",
  );
  const [result, setResult] = useState<AppCreationResult | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const createApp = useMutation(api.app_management.createApp);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appName.trim()) {
      toast.error("App name is required");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createApp({
        name: appName.trim(),
        description: description.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        privacyPolicyUrl: privacyPolicyUrl.trim() || undefined,
      });

      setResult(result as AppCreationResult);
      toast.success(
        "App created and published! Chat settings auto-published and app is live.",
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to create app");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  if (result) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/developer"
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Developer Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900">
            App Created Successfully! 🎉
          </h1>
          <p className="text-zinc-600 mt-2">
            Your app has been registered. Save your app secret securely - it
            won't be shown again.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* App Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                App Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">
                  App Name
                </label>
                <p className="text-zinc-900 font-semibold">{appName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  App ID
                </label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-zinc-100 px-2 py-1 rounded">
                    {result.appId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.appId, "App ID")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Description
                </label>
                <p className="text-zinc-600 text-sm">
                  {description || "No description provided"}
                </p>
              </div>

              {websiteUrl && (
                <div>
                  <label className="text-sm font-medium text-zinc-700">
                    Website
                  </label>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                  >
                    {websiteUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* App Secret */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="w-5 h-5" />
                App Secret
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">
                  ⚠️ Important Security Notice
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• This secret will only be shown once</li>
                  <li>• Store it securely in your environment variables</li>
                  <li>• Never expose it in client-side code</li>
                  <li>• Use it only for server-to-server calls</li>
                </ul>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">
                  Your App Secret
                </label>
                <div className="relative">
                  <code
                    className={`text-sm bg-zinc-900 text-zinc-100 p-3 rounded block font-mono ${
                      showSecret ? "" : "filter blur-sm"
                    }`}
                  >
                    {result.appSecret}
                  </code>
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <div></div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSecret(!showSecret)}
                        className="bg-white/90 hover:bg-white"
                      >
                        {showSecret ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(result.appSecret, "App Secret")
                        }
                        className="bg-white/90 hover:bg-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🚀 Next Steps - Integration Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">
                1. Add to Your Environment Variables
              </h4>
              <div className="bg-zinc-900 rounded-lg p-4">
                <pre className="text-zinc-300 text-sm overflow-x-auto">
                  {`# .env.local
TRAINLY_APP_SECRET=${result.appSecret}
NEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here`}
                </pre>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  copyToClipboard(
                    `TRAINLY_APP_SECRET=${result.appSecret}\nNEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000\nNEXT_PUBLIC_APP_URL=http://localhost:3000\nJWT_SECRET=your_jwt_secret_here`,
                    "Environment Variables",
                  )
                }
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All Environment Variables
              </Button>
            </div>

            <div>
              <h4 className="font-semibold mb-3">
                2. OAuth Flow Implementation
              </h4>
              <div className="bg-zinc-900 rounded-lg p-4">
                <pre className="text-zinc-300 text-sm overflow-x-auto">
                  {`// Generate OAuth URL for your users
const response = await fetch('/api/oauth/authorize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${result.appSecret}'
  },
  body: JSON.stringify({
    end_user_id: 'user_123',
    capabilities: ['ask', 'upload'],
    redirect_uri: 'http://localhost:3000/auth/trainly/callback'
  })
});

const { authorization_url } = await response.json();
// Redirect user to authorization_url`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">3. Token Exchange</h4>
              <div className="bg-zinc-900 rounded-lg p-4">
                <pre className="text-zinc-300 text-sm overflow-x-auto">
                  {`// After user authorizes, exchange code for token
const tokenResponse = await fetch('/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: 'http://localhost:3000/auth/trainly/callback'
  })
});

const { access_token } = await tokenResponse.json();
// User's private token (store on their device only)`}
                </pre>
              </div>
            </div>

            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/api-docs">View Full Documentation</Link>
              </Button>
              <Button asChild>
                <Link href="/developer">Back to Developer Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/developer"
          className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Developer Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900">Register New App</h1>
        <p className="text-zinc-600 mt-2">
          Create a new app to get OAuth credentials for Trainly integration.
        </p>
      </div>

      <form onSubmit={handleCreateApp} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                App Name *
              </label>
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My Document Assistant"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="AI-powered document analysis with privacy protection"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Website URL
              </label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://myapp.com"
                type="url"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Privacy Policy URL
              </label>
              <Input
                value={privacyPolicyUrl}
                onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                placeholder="https://myapp.com/privacy"
                type="url"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                OAuth Redirect URI *
              </label>
              <Input
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                placeholder="http://localhost:3000/auth/trainly/callback"
                required
              />
              <p className="text-xs text-zinc-500 mt-1">
                Where users will be redirected after authorization
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3">
                🔒 Default Capabilities
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    ask
                  </Badge>
                  <span className="text-sm text-blue-700">
                    Users can query their documents via AI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    upload
                  </Badge>
                  <span className="text-sm text-blue-700">
                    Users can upload files to their private workspace
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200">
                <h5 className="font-semibold text-blue-800 text-sm mb-2">
                  🛡️ Privacy Guarantees:
                </h5>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Users control their own authentication tokens</li>
                  <li>• You cannot access users' raw files or documents</li>
                  <li>• Complete data isolation between users</li>
                  <li>• Users can revoke access anytime</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="px-8">
            {isLoading ? "Creating App..." : "Create App"}
          </Button>
        </div>
      </form>
    </div>
  );
}
