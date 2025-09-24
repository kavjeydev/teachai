"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiTester } from "@/components/api-tester";

interface SimpleApiManagerProps {
  chatId: Id<"chats">;
  chatTitle: string;
}

interface AppSecretDisplayProps {
  appId: string;
  onCopy: (text: string, label: string) => void;
}

interface JwtSecretDisplayProps {
  appId: string;
  onCopy: (text: string, label: string) => void;
}

function AppSecretDisplay({ appId, onCopy }: AppSecretDisplayProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const appSecretQuery = useQuery(
    api.app_management.getAppSecret,
    showSecret ? { appId } : "skip",
  );

  const regenerateAppSecret = useMutation(
    api.app_management.regenerateAppSecret,
  );

  const toggleSecret = () => setShowSecret(!showSecret);

  const handleRotateSecret = async () => {
    if (
      !confirm(
        "Are you sure you want to rotate this app secret? This will invalidate the current secret and break any existing integrations using it.",
      )
    ) {
      return;
    }

    setIsRotating(true);
    try {
      const result = await regenerateAppSecret({ appId });
      toast.success(
        "App secret rotated successfully! The new secret is now displayed.",
      );
      // The query will automatically refetch and show the new secret
    } catch (error: any) {
      toast.error(error.message || "Failed to rotate app secret");
    } finally {
      setIsRotating(false);
    }
  };

  const secretValue =
    showSecret && appSecretQuery
      ? appSecretQuery.appSecret
      : "as_" + "•".repeat(32);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-green-700">App Secret</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRotateSecret}
          disabled={isRotating}
          className="h-6 px-2 text-xs text-green-600 hover:text-green-800 hover:bg-green-50"
          title="Rotate app secret (generates a new secret)"
        >
          <RefreshCw
            className={`w-3 h-3 mr-1 ${isRotating ? "animate-spin" : ""}`}
          />
          {isRotating ? "Rotating..." : "Rotate"}
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Input
          value={secretValue}
          readOnly
          className="font-mono text-sm bg-green-50 border-green-200"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSecret}
          className="border-green-200 hover:bg-green-50"
        >
          {showSecret ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            showSecret && appSecretQuery
              ? onCopy(appSecretQuery.appSecret, "App Secret")
              : toast.error("Please reveal the secret first")
          }
          className="border-green-200 hover:bg-green-50"
          disabled={!showSecret || !appSecretQuery}
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function JwtSecretDisplay({ appId, onCopy }: JwtSecretDisplayProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [jwtSecret, setJwtSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getJwtSecret = useMutation(api.app_management.getJwtSecret);
  const regenerateJwtSecret = useMutation(
    api.app_management.regenerateJwtSecret,
  );

  const toggleSecret = async () => {
    if (!showSecret && !jwtSecret) {
      // Fetch the JWT secret if we don't have it yet
      setIsLoading(true);
      try {
        const result = await getJwtSecret({ appId });
        setJwtSecret(result.jwtSecret);
      } catch (error) {
        toast.error("Failed to fetch JWT secret");
        return;
      } finally {
        setIsLoading(false);
      }
    }
    setShowSecret(!showSecret);
  };

  const handleRotateSecret = async () => {
    if (
      !confirm(
        "Are you sure you want to rotate this JWT secret? This will invalidate all existing user tokens and require users to re-authenticate.",
      )
    ) {
      return;
    }

    setIsRotating(true);
    try {
      const result = await regenerateJwtSecret({ appId });
      setJwtSecret(result.jwtSecret);
      toast.success(
        "JWT secret rotated successfully! All user tokens are now invalid and users will need to re-authenticate.",
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to rotate JWT secret");
    } finally {
      setIsRotating(false);
    }
  };

  const secretValue =
    showSecret && jwtSecret ? jwtSecret : "jwt_" + "•".repeat(60);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-blue-700">JWT Secret</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRotateSecret}
          disabled={isRotating}
          className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          title="Rotate JWT secret (invalidates all user tokens)"
        >
          <RefreshCw
            className={`w-3 h-3 mr-1 ${isRotating ? "animate-spin" : ""}`}
          />
          {isRotating ? "Rotating..." : "Rotate"}
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Input
          value={secretValue}
          readOnly
          className="font-mono text-sm bg-blue-50 border-blue-200"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSecret}
          disabled={isLoading}
          className="border-blue-200 hover:bg-blue-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : showSecret ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            showSecret && jwtSecret
              ? onCopy(jwtSecret, "JWT Secret")
              : toast.error("Please reveal the secret first")
          }
          className="border-blue-200 hover:bg-blue-50"
          disabled={!showSecret || !jwtSecret}
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      <div className="mt-1 text-xs text-blue-600">
        <p>🔐 Used to sign JWT tokens for end-user authentication</p>
      </div>
    </div>
  );
}

export function SimpleApiManager({ chatId, chatTitle }: SimpleApiManagerProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [createdAppSecret, setCreatedAppSecret] = useState<string | null>(null);
  const [createdJwtSecret, setCreatedJwtSecret] = useState<string | null>(null);

  // Convex hooks
  const apiKeyStatus = useQuery(api.simple_api.getApiKeyStatus, { chatId });
  const userApps = useQuery(api.app_management.getAppsForChat, { chatId });
  const generateApiKey = useMutation(api.simple_api.generateApiKey);
  const regenerateApiKey = useMutation(api.simple_api.regenerateApiKey);
  const enableApiAccess = useMutation(api.simple_api.enableApiAccess);
  const disableApiAccess = useMutation(api.simple_api.disableApiAccess);
  const createApp = useMutation(api.app_management.createApp);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const result = await generateApiKey({ chatId });
      toast.success("API key generated successfully!");
      setShowApiKey(true);
    } catch (error) {
      console.error("Failed to generate API key:", error);
      toast.error("Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (
      !confirm(
        "Are you sure? This will invalidate the current API key and break existing integrations.",
      )
    ) {
      return;
    }

    setIsGenerating(true);
    try {
      const result = await regenerateApiKey({ chatId });
      toast.success("API key regenerated successfully!");
      setShowApiKey(true);
    } catch (error) {
      console.error("Failed to regenerate API key:", error);
      toast.error("Failed to regenerate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleAccess = async () => {
    try {
      if (apiKeyStatus?.isEnabled) {
        await disableApiAccess({ chatId });
        toast.success("API access disabled");
      } else {
        await enableApiAccess({ chatId });
        toast.success("API access enabled");
      }
    } catch (error) {
      console.error("Failed to toggle API access:", error);
      toast.error("Failed to update API access");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCreateApp = async () => {
    setIsCreatingApp(true);
    try {
      const result = await createApp({
        name: `${chatTitle} App`,
        description: `Multi-user app based on ${chatTitle} with hybrid privacy`,
        parentChatId: chatId, // Link to source chat for settings inheritance
        websiteUrl: "http://localhost:3000",
      });

      setCreatedAppSecret(result.appSecret);
      setCreatedJwtSecret(result.jwtSecret);
      setShowAppSecret(true);
      toast.success(
        "App created! Your app secret and JWT secret are ready to use.",
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to create app");
    } finally {
      setIsCreatingApp(false);
    }
  };

  const getStatusColor = () => {
    if (!apiKeyStatus?.hasApiKey) return "text-zinc-500";
    if (apiKeyStatus.isEnabled) return "text-green-600";
    return "text-orange-600";
  };

  const getStatusIcon = () => {
    if (!apiKeyStatus?.hasApiKey) return <Key className="w-4 h-4" />;
    if (apiKeyStatus.isEnabled) return <CheckCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!apiKeyStatus?.hasApiKey) return "No API Key";
    if (apiKeyStatus.isEnabled) return "API Enabled";
    return "API Disabled";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-amber-600 dark:from-blue-500 dark:to-amber-500 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            API Access
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Enable external API access for <strong>{chatTitle}</strong>
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
            getStatusColor(),
          )}
        >
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </div>

      {/* Main API Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Chat API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Section */}
          {apiKeyStatus?.hasApiKey ? (
            <div className="space-y-4">
              <div>
                <Label>API Key</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={
                      showApiKey
                        ? apiKeyStatus.apiKey || ""
                        : "tk_" + "•".repeat(32)
                    }
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(apiKeyStatus.apiKey || "", "API key")
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* API Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white">
                    API Access
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {apiKeyStatus.isEnabled
                      ? "External applications can access this chat"
                      : "API access is currently disabled"}
                  </div>
                </div>
                <Button
                  onClick={handleToggleAccess}
                  variant={apiKeyStatus.isEnabled ? "destructive" : "default"}
                  className={
                    apiKeyStatus.isEnabled
                      ? ""
                      : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  }
                >
                  {apiKeyStatus.isEnabled ? "Disable API" : "Enable API"}
                </Button>
              </div>

              {/* Regenerate Key */}
              <div className="flex items-center justify-between p-4 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-800 dark:text-orange-200">
                      Regenerate API Key
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      This will invalidate the current key and break existing
                      integrations
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleRegenerateKey}
                  disabled={isGenerating}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-orange-600/30 border-t-orange-600 rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            /* No API Key Yet */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                No API Key Generated
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
                Generate an API key to allow external applications to access
                this chat's knowledge base.
              </p>
              <Button
                onClick={handleGenerateKey}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Generate API Key
                  </>
                )}
              </Button>
            </div>
          )}

          {/* API Usage Examples */}
          {apiKeyStatus?.hasApiKey && apiKeyStatus.isEnabled && (
            <div className="space-y-4">
              <Label>Integration Examples</Label>

              {/* cURL Example */}
              <div>
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  cURL
                </div>
                <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 relative">
                  <code className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {`curl -X POST https://api.trainlyai.com/v1/${chatId}/answer_question \\
  -H "Authorization: Bearer ${showApiKey ? apiKeyStatus.apiKey : "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What is machine learning?",
    "selected_model": "gpt-4o-mini",
    "temperature": 0.7
  }'`}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white"
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST https://api.trainlyai.com/v1/${chatId}/answer_question -H "Authorization: Bearer ${apiKeyStatus.apiKey}" -H "Content-Type: application/json" -d '{"question": "What is machine learning?", "selected_model": "gpt-4o-mini", "temperature": 0.7}'`,
                        "cURL example",
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* JavaScript Example */}
              <div>
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  JavaScript
                </div>
                <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 relative">
                  <code className="text-sm text-blue-400 font-mono whitespace-pre-wrap">
                    {`const response = await fetch('https://api.trainlyai.com/v1/${chatId}/answer_question', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${showApiKey ? apiKeyStatus.apiKey : "YOUR_API_KEY"}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: 'What is machine learning?',
    selected_model: 'gpt-4o-mini',
    temperature: 0.7
  })
});

const data = await response.json();
console.log(data.answer);`}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white"
                    onClick={() =>
                      copyToClipboard(
                        `const response = await fetch('https://api.trainlyai.com/v1/${chatId}/answer_question', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ${apiKeyStatus.apiKey}',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    question: 'What is machine learning?',\n    selected_model: 'gpt-4o-mini',\n    temperature: 0.7\n  })\n});\n\nconst data = await response.json();\nconsole.log(data.answer);`,
                        "JavaScript example",
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Python Example */}
              <div>
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Python
                </div>
                <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 relative">
                  <code className="text-sm text-yellow-400 font-mono whitespace-pre-wrap">
                    {`import requests

response = requests.post(
    'https://api.trainlyai.com/v1/${chatId}/answer_question',
    headers={
        'Authorization': 'Bearer ${showApiKey ? apiKeyStatus.apiKey : "YOUR_API_KEY"}',
        'Content-Type': 'application/json'
    },
    json={
        'question': 'What is machine learning?',
        'selected_model': 'gpt-4o-mini',
        'temperature': 0.7
    }
)

data = response.json()
print(data['answer'])`}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white"
                    onClick={() =>
                      copyToClipboard(
                        `import requests\n\nresponse = requests.post(\n    'https://api.trainlyai.com/v1/${chatId}/answer_question',\n    headers={\n        'Authorization': 'Bearer ${apiKeyStatus.apiKey}',\n        'Content-Type': 'application/json'\n    },\n    json={\n        'question': 'What is machine learning?',\n        'selected_model': 'gpt-4o-mini',\n        'temperature': 0.7\n    }\n)\n\ndata = response.json()\nprint(data['answer'])`,
                        "Python example",
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* API Information */}
          {apiKeyStatus?.isEnabled && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Globe className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    API Endpoint Ready
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Your chat is now accessible via API at:
                  </div>
                  <code className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-mono">
                    https://api.trainlyai.com/v1/{chatId}/answer_question
                  </code>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Rate limit: 60 requests/minute • Supports streaming
                    responses
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive API Tester */}
          {apiKeyStatus?.isEnabled && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Test Your API
              </h3>
              <ApiTester
                chatId={chatId}
                defaultApiKey={apiKeyStatus.apiKey || undefined}
              />
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Security Best Practices
                </div>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>
                    • Keep your API key secure and never expose it in
                    client-side code
                  </li>
                  <li>• Use environment variables to store the API key</li>
                  <li>
                    • Monitor API usage and regenerate keys if compromised
                  </li>
                  <li>• Only enable API access when needed</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Secret Section for Multi-User Apps */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Users className="w-5 h-5" />
            App Secret - For Multi-User OAuth Apps
          </CardTitle>
          <CardDescription>
            Create apps that support multiple users with private workspaces +
            shared knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-100 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">
              🔒 Hybrid Privacy Model
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Each user gets their own private workspace</li>
              <li>
                • Users can access shared knowledge base (this chat's documents)
              </li>
              <li>• Complete privacy between users' personal files</li>
              <li>• Perfect for education, legal, or business SaaS apps</li>
            </ul>
          </div>

          <div>
            <Label>App Secret for Multi-User Apps</Label>
            {userApps && userApps.length > 0 ? (
              <div className="space-y-3 mt-2">
                {userApps.map((app) => (
                  <div
                    key={app._id}
                    className="border border-green-200 rounded-lg p-4 bg-green-50/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-green-800">
                          {app.name}
                        </h4>
                        <p className="text-sm text-green-600">
                          {app.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-700 border-green-200"
                      >
                        {app.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <AppSecretDisplay
                        appId={app.appId}
                        onCopy={copyToClipboard}
                      />

                      <JwtSecretDisplay
                        appId={app.appId}
                        onCopy={copyToClipboard}
                      />

                      <div className="text-xs text-green-600">
                        <strong>App ID:</strong> {app.appId}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-auto p-1 text-green-600 hover:text-green-800"
                          onClick={() => copyToClipboard(app.appId, "App ID")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : createdAppSecret ? (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50 mt-2">
                <div className="mb-3">
                  <h4 className="font-medium text-green-800">
                    {chatTitle} App
                  </h4>
                  <p className="text-sm text-green-600">
                    Multi-user app with hybrid privacy
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-green-700">
                    Your App Secret
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={
                        showAppSecret
                          ? createdAppSecret
                          : "as_" + "•".repeat(32)
                      }
                      readOnly
                      className="font-mono text-sm bg-green-50 border-green-200"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAppSecret(!showAppSecret)}
                      className="border-green-200 hover:bg-green-50"
                    >
                      {showAppSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(createdAppSecret, "App Secret")
                      }
                      className="border-green-200 hover:bg-green-50"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Save this secret securely - it won't be shown again after
                    you refresh!
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <Button
                  onClick={handleCreateApp}
                  disabled={isCreatingApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isCreatingApp
                    ? "Creating App..."
                    : `Create App for "${chatTitle}"`}
                </Button>
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  This will create a multi-user app that uses this chat as the
                  shared knowledge base
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              🎯 Key Differences
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-blue-800 mb-1">
                  Chat API Key (Above)
                </h5>
                <ul className="text-blue-700 space-y-1">
                  <li>• Direct access to this chat only</li>
                  <li>• All users share same documents</li>
                  <li>• Simple API key authentication</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-green-800 mb-1">App Secret</h5>
                <ul className="text-green-700 space-y-1">
                  <li>• Each user gets private workspace</li>
                  <li>• Access to shared knowledge + private docs</li>
                  <li>• OAuth with user-controlled tokens</li>
                </ul>
              </div>
            </div>
          </div>

          {(userApps && userApps.length > 0) || createdAppSecret ? (
            <div>
              <h4 className="font-semibold mb-2">
                Environment Setup for Your Next.js App
              </h4>
              <div className="bg-zinc-900 rounded-lg p-3">
                <pre className="text-zinc-300 text-xs">
                  {`# .env.local
TRAINLY_APP_SECRET=${createdAppSecret || "as_your_app_secret_here"}
JWT_SECRET=${createdJwtSecret || "jwt_your_jwt_secret_here"}
NEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
                </pre>
              </div>
              <div className="mt-2 text-xs text-zinc-600">
                <p>
                  💡 <strong>Tip:</strong> Copy your actual secrets from the
                  "App Secret" and "JWT Secret" fields above to replace the
                  placeholder values
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  copyToClipboard(
                    `TRAINLY_APP_SECRET=${createdAppSecret || "as_your_app_secret_here"}\nJWT_SECRET=${createdJwtSecret || "jwt_your_jwt_secret_here"}\nNEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000\nNEXT_PUBLIC_APP_URL=http://localhost:3000`,
                    "Environment variables",
                  )
                }
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Complete Environment Setup
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
