"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Lock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Copy,
  Zap,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export default function ApiDocsPage() {
  const [copyingStates, setCopyingStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, label: string) => {
    const copyId = `${label}-${Date.now()}`;
    setCopyingStates(prev => ({ ...prev, [copyId]: true }));

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    } finally {
      setTimeout(() => {
        setCopyingStates(prev => {
          const newState = { ...prev };
          delete newState[copyId];
          return newState;
        });
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10">
      {/* Premium Background */}
      <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-blue-100/20 to-purple-100/20 dark:from-blue-900/10 dark:to-purple-900/10"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Premium Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 dark:from-white dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
                Trainly API
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
                  Privacy-First Architecture
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-2xl text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Build AI applications where users <span className="text-green-700 dark:text-green-300 font-semibold">trust uploading sensitive documents</span> because developers cannot access raw files.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="bg-green-100 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-full px-4 py-2">
                <span className="text-sm font-medium text-green-800 dark:text-green-200">🔒 Complete Data Isolation</span>
              </div>
              <div className="bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">🛡️ Zero Raw Data Access</span>
              </div>
              <div className="bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-2">
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">✅ GDPR/CCPA Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy-First API Section */}
        <Card className="mb-12 border-2 border-green-200 dark:border-green-800 shadow-xl shadow-green-500/10">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 border-b border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-green-800 dark:text-green-200 text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                🔒 Privacy-First API
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white shadow-lg animate-pulse">Recommended</Badge>
                <Badge variant="outline" className="border-green-600 text-green-700 dark:text-green-300">Multi-User Apps</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-950/30 dark:via-blue-950/30 dark:to-purple-950/30 rounded-2xl p-8 mb-8 border border-green-200 dark:border-green-800">
              <div className="grid md:grid-cols-3 gap-6 items-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-green-800 dark:text-green-200 mb-2">Complete Isolation</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">Each user gets their own private sub-chat</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">AI Responses Only</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Developers get AI responses, never raw files</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-purple-800 dark:text-purple-200 mb-2">Enterprise Ready</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">GDPR/CCPA compliant by design</p>
                </div>
              </div>

              <div className="text-center mt-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  🚀 The Trust Advantage
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                  Users confidently upload sensitive documents because they know developers cannot access their files -
                  only AI-generated insights are available, leading to higher engagement and enterprise adoption.
                </p>
              </div>
            </div>

            {/* What You Can/Cannot Do */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ What You CAN Do
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 dark:text-green-300">Get AI responses about user's data</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 dark:text-green-300">Enable direct user file uploads</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 dark:text-green-300">View usage analytics (anonymized)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ❌ What You CANNOT Do
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-700 dark:text-red-300">List user's uploaded files</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-700 dark:text-red-300">Download raw file content</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-700 dark:text-red-300">Access other users' data</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Integration Example */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-bold text-white">Quick Integration</h4>
                <Badge className="bg-green-600 text-white">3 Steps</Badge>
              </div>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`// 1. Provision user (creates isolated sub-chat)
const response = await fetch('/v1/privacy/apps/users/provision', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_app_secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    end_user_id: 'user_123',
    capabilities: ['ask', 'upload']  // Safe permissions only
  })
});

const { scoped_token } = await response.json();

// 2. Query user's private data (AI responses only)
const result = await fetch('/v1/privacy/query', {
  method: 'POST',
  headers: {
    'x-scoped-token': scoped_token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    end_user_id: 'user_123',
    question: 'What did I upload?'
  })
});

// 3. You get AI answer, never raw files! 🔒
const { answer, privacy_note } = await result.json();`}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                onClick={() => copyToClipboard(`// Privacy-First API Integration
const response = await fetch('/v1/privacy/apps/users/provision', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_app_secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    end_user_id: 'user_123',
    capabilities: ['ask', 'upload']
  })
});`, "Privacy-First Integration Code")}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Integration Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card className="mb-12 shadow-xl shadow-slate-500/10">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900/50 dark:to-blue-950/30 border-b border-slate-200/50 dark:border-slate-800/50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              Privacy-First API Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {/* User Provisioning */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-gradient-to-r from-blue-50/50 to-green-50/50 dark:from-blue-950/30 dark:to-green-950/30">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-blue-600 text-white">POST</Badge>
                  <code className="font-mono text-lg">/v1/privacy/apps/users/provision</code>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  Create isolated sub-chat for a user. <strong>Requires app secret</strong> - each user gets their own private namespace.
                </p>
                <div className="bg-slate-900 rounded-lg p-4">
                  <pre className="text-green-400 text-sm">
{`{
  "end_user_id": "user_123",
  "capabilities": ["ask", "upload"]  // Only safe permissions
}`}
                  </pre>
                </div>
              </div>

              {/* Privacy Query */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-gradient-to-r from-green-50/50 to-purple-50/50 dark:from-green-950/30 dark:to-purple-950/30">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-green-600 text-white">POST</Badge>
                  <code className="font-mono text-lg">/v1/privacy/query</code>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  Query user's private data. <strong>Returns AI responses only</strong> - never raw files or content.
                </p>
                <div className="bg-slate-900 rounded-lg p-4">
                  <pre className="text-blue-400 text-sm">
{`{
  "end_user_id": "user_123",
  "question": "What did I upload?",
  "include_citations": true
}`}
                  </pre>
                </div>
              </div>

              {/* Direct Upload */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-purple-600 text-white">POST</Badge>
                  <code className="font-mono text-lg">/v1/privacy/upload/presigned-url</code>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  Get direct upload URL. <strong>Files bypass your servers</strong> - uploaded directly to user's private namespace.
                </p>
                <div className="bg-slate-900 rounded-lg p-4">
                  <pre className="text-purple-400 text-sm">
{`{
  "end_user_id": "user_123",
  "filename": "document.pdf",
  "file_type": "application/pdf"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Testing */}
        <Card className="mb-12 border-2 border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-500/10">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-b border-blue-200 dark:border-blue-800">
            <CardTitle className="flex items-center gap-3 text-blue-800 dark:text-blue-200 text-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              🧪 Test Privacy Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-4 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Tests That Should PASS
                </h4>
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <code className="text-sm block mb-2 font-mono">User Provisioning</code>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Should return scoped token and privacy guarantee
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <code className="text-sm block mb-2 font-mono">Privacy Queries</code>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Should return AI responses with privacy notes
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ❌ Tests That Should FAIL
                </h4>
                <div className="space-y-3">
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <code className="text-sm block mb-2 font-mono">Dangerous Capabilities</code>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Should return 400: "Invalid capabilities"
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <code className="text-sm block mb-2 font-mono">Cross-User Access</code>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Should return 403: "User ID mismatch"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy Test Commands */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">🔬 Test Commands</h4>
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="justify-start text-left"
                  onClick={() => copyToClipboard(`curl -X POST http://localhost:8000/v1/privacy/apps/users/provision \\
  -H "Authorization: Bearer as_demo_secret" \\
  -H "Content-Type: application/json" \\
  -d '{"end_user_id": "test_user", "capabilities": ["ask", "upload"]}'`, "User Provisioning Test")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy User Provisioning Test
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => copyToClipboard(`curl -X POST http://localhost:8000/v1/privacy/apps/users/provision \\
  -H "Authorization: Bearer as_demo_secret" \\
  -H "Content-Type: application/json" \\
  -d '{"end_user_id": "hacker", "capabilities": ["list_files", "download_file"]}'`, "Privacy Violation Test")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Privacy Violation Test (Should Fail)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legacy API Warning */}
        <Card className="mb-12 border-2 border-amber-300 dark:border-amber-700 shadow-xl shadow-amber-500/10">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                Legacy Chat API
              </CardTitle>
              <Badge variant="outline" className="border-amber-600 text-amber-700 dark:text-amber-300">Single-User Only</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-amber-50 to-red-50 dark:from-amber-950/30 dark:to-red-950/30 rounded-xl p-6 border-l-4 border-amber-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">⚠️ Privacy Notice</h4>
                  <p className="text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                    <strong>Single-user or internal applications only.</strong> For apps with multiple users,
                    use the Privacy-First API above to ensure complete data isolation and user trust.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Badge className="bg-red-100 text-red-800 border-red-200">❌ Multi-User Risk</Badge>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">⚠️ Limited Privacy</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="border-2 border-green-200 dark:border-green-800 shadow-xl shadow-green-500/10">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              🚀 Ready to Build Privacy-First Apps?
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
              Start building applications where users trust uploading sensitive documents because they know you can't access their files.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.href = "/dashboard"}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
              >
                <Shield className="w-4 h-4 mr-2" />
                Start Building
              </Button>
              <Button
                variant="outline"
                onClick={() => copyToClipboard("curl -X GET http://localhost:8000/v1/privacy/health", "Health Check Test")}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Test API Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
