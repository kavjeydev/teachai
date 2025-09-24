import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Copy,
  Zap,
  Users,
  Key,
  Globe,
  Code,
  FileText,
  BarChart3,
  Upload,
  Download,
  Eye,
} from "lucide-react";

export const apiDocsSections = {
  "getting-started": {
    title: "Quick Start",
    content: (
      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Welcome to Trainly API
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Build AI applications with complete user privacy. Users control
            their authentication tokens and data access.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              🔒 User-Controlled Auth
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              📱 Each Chat = App
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              🛡️ Privacy-First
            </Badge>
          </div>
        </div>

        {/* Quick Steps */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
                <span className="text-white font-bold">1</span>
              </div>
              <CardTitle className="text-lg">Get Chat API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Enable API access for your chat in the Trainly dashboard
              </p>
              <code className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block">
                Chat Settings → API Access → Generate Key
              </code>
            </CardContent>
          </Card>

          <Card className="border border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                <span className="text-white font-bold">2</span>
              </div>
              <CardTitle className="text-lg">Token Exchange</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Exchange user's Clerk token for secure Trainly token
              </p>
              <code className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block">
                POST /oauth/token → Bearer token
              </code>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
                <span className="text-white font-bold">3</span>
              </div>
              <CardTitle className="text-lg">Query User Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Users query their private data with complete privacy protection
              </p>
              <code className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block">
                POST /me/chats/query → AI responses only
              </code>
            </CardContent>
          </Card>
        </div>

        {/* Key Benefits */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Shield className="w-5 h-5" />
              Why Choose Trainly's Privacy-First API?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  For Your Users:
                </h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Complete control over their data and authentication
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Confidence to upload sensitive documents
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Transparency about what apps can access
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  For Developers:
                </h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    Zero liability for user data security
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    Higher user adoption through trust
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    Automatic GDPR/CCPA compliance
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },

  authentication: {
    title: "Authentication",
    content: (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            User-Controlled Authentication
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Trainly uses a token exchange system where users control their own
            authentication tokens. Developers never see or control user tokens,
            ensuring complete privacy protection.
          </p>
        </div>

        {/* Authentication Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                    User Authentication
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    User signs into your app with Clerk (or their existing auth)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Token Exchange
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your app exchanges user's Clerk token for short-lived
                    Trainly token
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                    Secure Storage
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Trainly token stored on user's device only - you never see
                    it
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Model */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Lock className="w-5 h-5" />
              Security Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6">
              <h4 className="font-bold text-green-800 dark:text-green-200 mb-4">
                🔒 Zero-Trust Architecture
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                    Token Verification:
                  </h5>
                  <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                    <li>• JWKS signature validation</li>
                    <li>• Issuer and audience verification</li>
                    <li>• Expiration time enforcement</li>
                    <li>• Scope-based access control</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                    Privacy Protection:
                  </h5>
                  <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                    <li>• Citation filtering for apps</li>
                    <li>• User subchat isolation</li>
                    <li>• No raw file access</li>
                    <li>• Audit trail logging</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },

  "privacy-protection": {
    title: "Privacy Protection",
    content: (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Privacy Protection System
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Our multi-layered privacy protection ensures users can trust
            uploading sensitive documents while developers can still build
            powerful AI applications.
          </p>
        </div>

        {/* Privacy Layers */}
        <div className="grid gap-6">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Shield className="w-5 h-5" />
                Data Isolation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Each user gets their own completely isolated subchat. Cross-user
                data access is impossible.
              </p>
              <div className="bg-slate-900 rounded-lg p-4">
                <pre className="text-green-400 text-sm">
                  {`// Database queries automatically scoped
WHERE subchat_id = 'subchat_chatid_userid'
AND external_user_id = 'verified_user_from_token'
// Only this user's data returned`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Eye className="w-5 h-5" />
                Citation Filtering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Developers get AI responses only. Detailed citations are
                filtered to prevent content reconstruction.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                    ✅ Developer Gets:
                  </h5>
                  <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                    <li>• AI-generated answers</li>
                    <li>• Citation count and confidence</li>
                    <li>• Usage analytics</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                    ❌ Protected from Developer:
                  </h5>
                  <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                    <li>• Raw file content snippets</li>
                    <li>• Detailed citation text</li>
                    <li>• File names and metadata</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },

  "token-exchange": {
    title: "Token Exchange",
    content: (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            RFC 8693 Token Exchange
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Exchange user's Clerk ID token for a short-lived Trainly access
            token. This enables user-controlled authentication without OAuth
            complexity.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>POST /oauth/token</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Request</h4>
                <div className="bg-slate-900 rounded-lg p-4">
                  <pre className="text-green-400 text-sm">
                    {`{
  "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
  "subject_token_type": "urn:ietf:params:oauth:token-type:id_token",
  "subject_token": "<CLERK_ID_TOKEN>",
  "client_id": "trainly_app_<CHAT_ID>",
  "scope": "chat.query chat.upload"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Response</h4>
                <div className="bg-slate-900 rounded-lg p-4">
                  <pre className="text-blue-400 text-sm">
                    {`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "chat.query chat.upload",
  "chat_id": "your_chat_id",
  "privacy_guarantee": {
    "user_controlled": true,
    "citations_filtered_for_apps": true,
    "no_raw_file_access": true
  }
}`}
                  </pre>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-amber-800 dark:text-amber-200">
                      Important
                    </h5>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Store the access token on the user's device only. Never
                      store it on your servers - this maintains user privacy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },

  "chat-queries": {
    title: "Chat Queries",
    content: (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            User-Private Chat Queries
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Users query their private chat data using secure tokens. Citations
            are filtered for privacy protection.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>POST /me/chats/query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Request</h4>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Headers</Badge>
                  <code className="text-sm">
                    Authorization: Bearer &lt;trainly_token&gt;
                  </code>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <pre className="text-green-400 text-sm">
                    {`{
  "question": "What are the key concepts from my study materials?",
  "include_citations": false  // Privacy protection for app calls
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Response</h4>
                <div className="bg-slate-900 rounded-lg p-4">
                  <pre className="text-blue-400 text-sm">
                    {`{
  "answer": "Based on your study materials, the key concepts are...",
  "subchat_id": "subchat_chatid_userid",
  "access_type": "user_controlled",
  "privacy_note": "Response generated from your private data only",
  "citations_summary": {
    "sources_used": 3,
    "confidence_level": "high",
    "privacy_protection": "Citations filtered - full citations at trainly.com"
  }
}`}
                  </pre>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Privacy Protection
                </h5>
                <p className="text-sm text-green-700 dark:text-green-300">
                  When called through developer apps, detailed citations are
                  filtered to protect user privacy. Users can see full citations
                  when accessing their data directly at trainly.com.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },

  "react-integration": {
    title: "React Integration",
    content: (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            React Integration Guide
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Complete React integration with hooks and components for Trainly's
            privacy-first API.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>useTrainlyAuth Hook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-6">
              <pre className="text-green-400 text-sm overflow-x-auto">
                {`import { useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

export function useTrainlyAuth(chatId) {
  const { user, getToken } = useUser();
  const [trainlyToken, setTrainlyToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check for existing token
    const stored = localStorage.getItem(\`trainly_token_\${chatId}\`);
    if (stored) {
      const tokenData = JSON.parse(stored);
      if (tokenData.expires_at > Date.now()) {
        setTrainlyToken(tokenData.access_token);
        setIsConnected(true);
      }
    }
  }, [chatId]);

  const connect = async () => {
    const clerkToken = await getToken();

    const response = await fetch('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        subject_token: clerkToken,
        client_id: \`trainly_app_\${chatId}\`,
        scope: "chat.query chat.upload"
      })
    });

    const tokenData = await response.json();

    // Store on user's device
    localStorage.setItem(\`trainly_token_\${chatId}\`, JSON.stringify({
      access_token: tokenData.access_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    }));

    setTrainlyToken(tokenData.access_token);
    setIsConnected(true);
  };

  const query = async (question) => {
    const response = await fetch('/me/chats/query', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${trainlyToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    });

    return response.json();
  };

  return { isConnected, connect, query };
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
};
