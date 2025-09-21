"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiTester } from "@/components/api-tester";

interface SimpleApiManagerProps {
  chatId: Id<"chats">;
  chatTitle: string;
}

export function SimpleApiManager({ chatId, chatTitle }: SimpleApiManagerProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Convex hooks
  const apiKeyStatus = useQuery(api.simple_api.getApiKeyStatus, { chatId });
  const generateApiKey = useMutation(api.simple_api.generateApiKey);
  const regenerateApiKey = useMutation(api.simple_api.regenerateApiKey);
  const enableApiAccess = useMutation(api.simple_api.enableApiAccess);
  const disableApiAccess = useMutation(api.simple_api.disableApiAccess);

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
    if (!confirm("Are you sure? This will invalidate the current API key and break existing integrations.")) {
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

  const getStatusColor = () => {
    if (!apiKeyStatus?.hasApiKey) return "text-slate-500";
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            API Access
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Enable external API access for <strong>{chatTitle}</strong>
          </p>
        </div>

        <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium", getStatusColor())}>
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
                    value={showApiKey ? apiKeyStatus.apiKey : "tk_" + "•".repeat(32)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiKeyStatus.apiKey || "", "API key")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* API Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    API Access
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {apiKeyStatus.isEnabled
                      ? "External applications can access this chat"
                      : "API access is currently disabled"
                    }
                  </div>
                </div>
                <Button
                  onClick={handleToggleAccess}
                  variant={apiKeyStatus.isEnabled ? "destructive" : "default"}
                  className={apiKeyStatus.isEnabled ? "" : "bg-trainlymainlight hover:bg-trainlymainlight/90"}
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
                      This will invalidate the current key and break existing integrations
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
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No API Key Generated
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Generate an API key to allow external applications to access this chat's knowledge base.
              </p>
              <Button
                onClick={handleGenerateKey}
                disabled={isGenerating}
                className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white"
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
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  cURL
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
                  <code className="text-sm text-green-400 font-mono whitespace-pre-wrap">
{`curl -X POST https://api.trainlyai.com/v1/${chatId}/answer_question \\
  -H "Authorization: Bearer ${showApiKey ? apiKeyStatus.apiKey : 'YOUR_API_KEY'}" \\
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
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(
                      `curl -X POST https://api.trainlyai.com/v1/${chatId}/answer_question -H "Authorization: Bearer ${apiKeyStatus.apiKey}" -H "Content-Type: application/json" -d '{"question": "What is machine learning?", "selected_model": "gpt-4o-mini", "temperature": 0.7}'`,
                      "cURL example"
                    )}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* JavaScript Example */}
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  JavaScript
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
                  <code className="text-sm text-blue-400 font-mono whitespace-pre-wrap">
{`const response = await fetch('https://api.trainlyai.com/v1/${chatId}/answer_question', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${showApiKey ? apiKeyStatus.apiKey : 'YOUR_API_KEY'}',
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
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(
                      `const response = await fetch('https://api.trainlyai.com/v1/${chatId}/answer_question', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ${apiKeyStatus.apiKey}',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    question: 'What is machine learning?',\n    selected_model: 'gpt-4o-mini',\n    temperature: 0.7\n  })\n});\n\nconst data = await response.json();\nconsole.log(data.answer);`,
                      "JavaScript example"
                    )}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Python Example */}
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Python
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
                  <code className="text-sm text-yellow-400 font-mono whitespace-pre-wrap">
{`import requests

response = requests.post(
    'https://api.trainlyai.com/v1/${chatId}/answer_question',
    headers={
        'Authorization': 'Bearer ${showApiKey ? apiKeyStatus.apiKey : 'YOUR_API_KEY'}',
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
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(
                      `import requests\n\nresponse = requests.post(\n    'https://api.trainlyai.com/v1/${chatId}/answer_question',\n    headers={\n        'Authorization': 'Bearer ${apiKeyStatus.apiKey}',\n        'Content-Type': 'application/json'\n    },\n    json={\n        'question': 'What is machine learning?',\n        'selected_model': 'gpt-4o-mini',\n        'temperature': 0.7\n    }\n)\n\ndata = response.json()\nprint(data['answer'])`,
                      "Python example"
                    )}
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
                    Rate limit: 60 requests/minute • Supports streaming responses
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive API Tester */}
          {apiKeyStatus?.isEnabled && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
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
                  <li>• Keep your API key secure and never expose it in client-side code</li>
                  <li>• Use environment variables to store the API key</li>
                  <li>• Monitor API usage and regenerate keys if compromised</li>
                  <li>• Only enable API access when needed</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
