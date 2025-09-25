"use client";

import React, { useState } from "react";
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
  BookOpen,
  Code,
  FileText,
  Settings,
  Home,
  ChevronRight,
  ExternalLink,
  Key,
  Globe,
  Users,
  Eye,
  Upload,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ApiDocsPage() {
  const [selectedSection, setSelectedSection] = useState("getting-started");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  // Navigation structure (Stripe-style)
  const navigation = [
    {
      title: "Getting Started",
      icon: Home,
      items: [
        { id: "getting-started", title: "Quick Start", badge: null },
        { id: "authentication", title: "Authentication", badge: "🔐" },
        { id: "privacy-first", title: "Privacy-First API", badge: "New" },
      ],
    },
    {
      title: "API Reference",
      icon: Code,
      items: [
        { id: "token-exchange", title: "Token Exchange", badge: null },
        { id: "chat-queries", title: "Chat Queries", badge: null },
        { id: "file-uploads", title: "File Uploads", badge: null },
        { id: "analytics", title: "Analytics", badge: null },
      ],
    },
    {
      title: "Integration",
      icon: BookOpen,
      items: [
        {
          id: "simple-nextjs-setup",
          title: "Simple Next.js Setup",
          badge: "⚡",
        },
        { id: "react-integration", title: "React", badge: null },
        { id: "nodejs-backend", title: "Node.js", badge: null },
        { id: "python-integration", title: "Python", badge: null },
      ],
    },
    {
      title: "Security",
      icon: Shield,
      items: [
        {
          id: "privacy-protection",
          title: "Privacy Protection",
          badge: "Important",
        },
        { id: "citation-filtering", title: "Citation Filtering", badge: null },
        { id: "data-isolation", title: "Data Isolation", badge: null },
      ],
    },
    {
      title: "Examples",
      icon: FileText,
      items: [
        { id: "study-assistant", title: "Study Assistant", badge: null },
        { id: "document-analyzer", title: "Document Analyzer", badge: null },
        { id: "testing", title: "Testing & Debugging", badge: null },
      ],
    },
  ];

  // Content for each section
  const sectionContent: Record<
    string,
    { title: string; content: React.ReactNode }
  > = {
    "getting-started": {
      title: "Quick Start",
      content: (
        <div className="space-y-8">
          {/* Hero */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              Welcome to Trainly API
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
              Build AI applications with complete user privacy. Users control
              their authentication tokens and data access.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Badge
                variant="outline"
                className="border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                🔒 User-Controlled Auth
              </Badge>
              <Badge
                variant="outline"
                className="border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                📱 Each Chat = App
              </Badge>
              <Badge
                variant="outline"
                className="border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                🛡️ Privacy-First
              </Badge>
            </div>
          </div>

          {/* Integration Steps */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-zinc-800 dark:bg-zinc-700 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <CardTitle className="text-lg">Setup Chat API</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Enable API access for your chat in the Trainly dashboard. Each
                  chat becomes an API endpoint.
                </p>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <code className="text-xs text-zinc-700 dark:text-zinc-300">
                    Chat Settings → API Access → Generate Key
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-zinc-800 dark:bg-zinc-700 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <CardTitle className="text-lg">User Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Users authenticate with their Clerk tokens. Exchange for
                  secure Trainly tokens.
                </p>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <code className="text-xs text-zinc-700 dark:text-zinc-300">
                    POST /oauth/token → Bearer token
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-zinc-800 dark:bg-zinc-700 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <CardTitle className="text-lg">Query & Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Users query their private data and upload files with complete
                  privacy protection.
                </p>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <code className="text-xs text-zinc-700 dark:text-zinc-300">
                    POST /me/chats/query → AI only
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Example */}
          <Card className="border-green-200 dark:border-green-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Zap className="w-5 h-5" />
                5-Minute Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-xl p-6">
                <pre className="text-zinc-300 text-sm overflow-x-auto">
                  {`// 🔐 Trainly OAuth - Simple & Secure

// 1. User authorizes your app (OAuth 2.0 flow)
function connectToTrainly(chatId) {
  const authUrl =
    'https://trainly.com/oauth/authorize?' +
    'chat_id=' + chatId +
    '&redirect_uri=' + encodeURIComponent('https://myapp.com/auth/callback') +
    '&scope=chat.query chat.upload' +
    '&state=csrf_protection_token';

  // Redirect user to Trainly authorization
  window.location.href = authUrl;
}

// 2. Handle OAuth callback and exchange code for token
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  // Exchange authorization code for access token
  const tokenResponse = await fetch('/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "https://myapp.com/auth/callback",
      client_id: chatId,
      scope: "chat.query chat.upload"
    })
  });

  const { access_token, expires_in } = await tokenResponse.json();

  // 3. Store user's token on their device (NEVER on your servers)
  res.send(\`
    <script>
      localStorage.setItem('trainly_token', JSON.stringify({
        token: '\${access_token}',
        expires_at: \${Date.now() + (expires_in * 1000)},
        chat_id: '\${chatId}'
      }));
      window.location.href = '/dashboard';
    </script>
  \`);
});

// 4. User queries their private data
const tokenData = JSON.parse(localStorage.getItem('trainly_token'));
const queryResponse = await fetch('/me/chats/query', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${tokenData.token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: 'What are the key points from my documents?',
    include_citations: false // Privacy protection for app calls
  })
});

// You get AI response, user controls their token! 🔒`}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-zinc-500 text-zinc-400 hover:bg-zinc-500 hover:text-white"
                  onClick={() =>
                    copyToClipboard(
                      "// Token Exchange Example",
                      "Quick Start Code",
                    )
                  }
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Example
                </Button>
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
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              User-Controlled Authentication
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Trainly uses a token exchange system where users control their own
              authentication tokens. Developers never see or control user
              tokens, ensuring complete privacy protection.
            </p>
          </div>

          {/* Authentication Flow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Authentication Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="w-8 h-8 bg-zinc-800 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">
                      User Authentication
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      User clicks "Connect with Trainly" in your app interface
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="w-8 h-8 bg-zinc-800 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Token Exchange
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      User redirected to Trainly OAuth, authorizes, gets
                      redirected back with code
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="w-8 h-8 bg-zinc-800 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Secure Storage
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      Authorization code exchanged for user's private Trainly
                      token
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="w-8 h-8 bg-zinc-800 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Privacy-Protected Usage
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      User queries their data with AI responses only - no raw
                      file access
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Exchange Details */}
          <Card>
            <CardHeader>
              <CardTitle>Token Exchange Implementation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">
                    Frontend Implementation
                  </h4>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-zinc-300 text-sm overflow-x-auto">
                      {`// Trainly OAuth 2.0 Implementation

// 1. Redirect user to Trainly OAuth
function connectToTrainly(chatId) {
  const authUrl =
    'https://trainly.com/oauth/authorize?' +
    'chat_id=' + chatId +
    '&redirect_uri=' + encodeURIComponent(window.location.origin + '/auth/callback') +
    '&scope=chat.query chat.upload' +
    '&state=' + generateCSRFToken();

  window.location.href = authUrl;
}

// 2. Handle OAuth callback
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  // Exchange authorization code for access token
  const response = await fetch('/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: window.location.origin + '/auth/callback',
      client_id: chatId,
      scope: "chat.query chat.upload"
    })
  });

  const { access_token, expires_in } = await response.json();

  // Store on user's device (NEVER on your servers)
  localStorage.setItem('trainly_token', JSON.stringify({
    token: access_token,
    expires_at: Date.now() + (expires_in * 1000),
    chat_id: chatId
  }));
});`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Security Validation</h4>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h5 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                      🔒 How Trainly Validates Tokens
                    </h5>
                    <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                      <li>
                        • <strong>Authorization Code Validation:</strong>{" "}
                        Validates OAuth authorization codes
                      </li>
                      <li>
                        • <strong>User Identity Verification:</strong> Ensures
                        legitimate user authorization
                      </li>
                      <li>
                        • <strong>Chat Access Verification:</strong> Confirms
                        user can access the specified chat
                      </li>
                      <li>
                        • <strong>Token Expiration:</strong> Short-lived tokens
                        (1 hour) for security
                      </li>
                      <li>
                        • <strong>Scope Validation:</strong> Enforces granular
                        permissions per token
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Model */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Lock className="w-5 h-5" />
                Security Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                  🔒 Zero-Trust Architecture
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      Token Verification:
                    </h5>
                    <ul className="text-sm text-green-600 dark:text-zinc-300 space-y-1">
                      <li>• JWKS signature validation</li>
                      <li>• Issuer and audience verification</li>
                      <li>• Expiration time enforcement</li>
                      <li>• Scope-based access control</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      Privacy Protection:
                    </h5>
                    <ul className="text-sm text-green-600 dark:text-zinc-300 space-y-1">
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

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Security Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                      ✅ Store tokens on user's device only
                    </h5>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      Use localStorage, secure cookies, or device keychain -
                      never on your servers
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                      ✅ Handle token expiration gracefully
                    </h5>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      Tokens expire after 1 hour - implement automatic refresh
                      flow
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                      ✅ Respect privacy boundaries
                    </h5>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      Don't request citations in app calls - users can see full
                      citations directly
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                      ❌ Never store user tokens on servers
                    </h5>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This violates the privacy guarantee and defeats the
                      security model
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },

    "privacy-first": {
      title: "Privacy-First API",
      content: (
        <div className="space-y-8">
          <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-200 mb-4">
              🔒 Complete User Privacy Protection
            </h2>
            <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-6">
              Our privacy-first architecture ensures developers can build
              powerful AI apps while users maintain complete control over their
              data.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />✅ What Developers Get
                </h4>
                <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    AI-generated responses from user data
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Usage analytics and performance metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    File upload assistance for users
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    User engagement insights
                  </li>
                </ul>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />❌ What's Protected
                </h4>
                <ul className="space-y-2 text-sm text-red-700 dark:text-red-300">
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Raw file content and downloads
                  </li>
                  <li className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Detailed citations and snippets
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Cross-user data access
                  </li>
                  <li className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    User authentication tokens
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Trust Advantage */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Shield className="w-5 h-5" />
                The Trust Advantage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Users confidently upload sensitive documents because they know
                developers cannot access their files. This leads to higher
                engagement, more uploads, and better AI responses.
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <h5 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  Business Impact:
                </h5>
                <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                  <li>
                    • 3x higher user engagement when privacy is guaranteed
                  </li>
                  <li>
                    • Enterprise customers adopt apps with proven data
                    protection
                  </li>
                  <li>• Developers have zero liability for data breaches</li>
                  <li>• Automatic GDPR/CCPA compliance</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },

    "token-exchange": {
      title: "Token Exchange",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              RFC 8693 Token Exchange
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Exchange user's Clerk ID token for a short-lived Trainly access
              token. This enables user-controlled authentication.
            </p>
          </div>

          {/* Endpoint Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-zinc-800 text-white">POST</Badge>
                <code className="font-mono text-lg">/oauth/token</code>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Request Body
                  </h4>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-zinc-300 text-sm">
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
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Response
                  </h4>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-blue-400 text-sm">
                      {`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
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
                      <h5 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        Critical Security Note
                      </h5>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Store the access token on the user's device only
                        (localStorage, secure cookie). Never store user tokens
                        on your servers - this maintains the privacy guarantee.
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
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              User-Private Chat Queries
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Users query their private chat data using secure tokens. Citations
              are automatically filtered for privacy protection.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-zinc-800 text-white">POST</Badge>
                <code className="font-mono text-lg">/me/chats/query</code>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Request</h4>
                  <div className="mb-3">
                    <Badge variant="outline" className="mb-2">
                      Required Headers
                    </Badge>
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                      <code className="text-sm">
                        Authorization: Bearer &lt;trainly_token&gt;
                      </code>
                    </div>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-zinc-300 text-sm">
                      {`{
  "question": "What are the key concepts from my study materials?",
  "include_citations": false,  // Privacy protection for app calls
  "max_tokens": 1000,
  "temperature": 0.7
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">
                    Response (Developer App Call)
                  </h4>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-blue-400 text-sm">
                      {`{
  "answer": "Based on your study materials, the key concepts include...",
  "subchat_id": "subchat_chatid_userid",
  "access_type": "user_controlled",
  "privacy_note": "Response generated from your private data only",
  "citations_summary": {
    "sources_used": 3,
    "confidence_level": "high",
    "privacy_protection": "Citations filtered for privacy - full access at trainly.com"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Protection */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <Shield className="w-5 h-5" />
                Citation Privacy Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                  🔒 Why Citations are Filtered
                </h4>
                <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                  Even though developers can't access raw files, detailed
                  citations could still reveal sensitive information through
                  snippets and context. Our filtering prevents this privacy
                  leak.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                      Developer API Calls Get:
                    </h5>
                    <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                      <li>• AI-generated answers only</li>
                      <li>• Citation count and confidence level</li>
                      <li>• Source availability confirmation</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                      Users Get (Direct Access):
                    </h5>
                    <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                      <li>• Full AI responses with context</li>
                      <li>• Complete citation snippets</li>
                      <li>• Source document references</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },

    "simple-nextjs-setup": {
      title: "Simple Next.js Setup",
      content: (
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
                  Dead Simple Next.js + Trainly Setup
                </h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                  Add RAG to your Next.js app in under 5 minutes using our
                  published npm package. No complex authentication, no
                  boilerplate code, just install and use!
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300"
                  >
                    📦 NPM Package
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300"
                  >
                    ⚡ 5 Minute Setup
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300"
                  >
                    🔒 Built-in Security
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* NEW: NPM Package Available */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                🎉 NEW: @trainly/react is now available on NPM!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <div className="text-4xl">🚀</div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                        Setup Just Got 10x Simpler!
                      </h3>
                      <p className="text-green-700 dark:text-green-300 mb-4">
                        We've published the Trainly React SDK to npm. Instead of
                        the complex setup below, you can now add RAG to your app
                        with just one install command!
                      </p>
                      <div className="bg-white dark:bg-green-900/20 rounded-lg p-4 text-left">
                        <div className="text-sm font-mono">
                          <div className="text-green-600 dark:text-green-400 mb-2">
                            # Install the package
                          </div>
                          <div className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded mb-3">
                            npm install @trainly/react
                          </div>
                          <div className="text-green-600 dark:text-green-400 mb-2">
                            # Use in your app (3 lines)
                          </div>
                          <div className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded">
                            <div>
                              import {`{ TrainlyProvider, useTrainly }`} from
                              "@trainly/react"
                            </div>
                            <div>const {`{ ask }`} = useTrainly()</div>
                            <div>const answer = await ask("Question?")</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `npm install @trainly/react`,
                              "Install command",
                            )
                          }
                        >
                          📋 Copy Install Command
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              "https://www.npmjs.com/package/@trainly/react",
                              "_blank",
                            )
                          }
                        >
                          📦 View on NPM
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                        Legacy Documentation Below
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        The manual setup documentation below is kept for
                        reference, but we highly recommend using the npm package
                        instead. It's simpler, more secure, and
                        production-ready.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complexity Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Before vs After: Complexity Eliminated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-red-600 dark:text-red-400">
                    ❌ Before (Manual Setup)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>2-3 hours setup time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>300+ lines of boilerplate code</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>8+ files to create manually</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Complex authentication setup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Security vulnerabilities to handle</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-600 dark:text-green-400">
                    ✅ After (@trainly/react)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>5 minutes setup time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>10 lines of code total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>One npm install command</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Automatic authentication</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Built-in enterprise security</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NPM Package Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                @trainly/react - Now Live on NPM!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Our package is now published and available worldwide:
                </p>
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                      📦
                    </div>
                    <div>
                      <h4 className="font-semibold">NPM Package</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Available at:{" "}
                        <code className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                          @trainly/react
                        </code>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Size: 12.6 kB (compressed), 58.6 kB (unpacked)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                      ⚡
                    </div>
                    <div>
                      <h4 className="font-semibold">5-Minute Setup</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        From npm install to working RAG in under 5 minutes
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        No backend setup, no complex auth, just install and use
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                      🔒
                    </div>
                    <div>
                      <h4 className="font-semibold">Enterprise Security</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Built-in httpOnly cookies, XSS protection, CSRF
                        protection
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        7-day sessions, automatic refresh, no localStorage
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Install Package */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Install @trainly/react</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Install the Trainly React package from npm:
                </p>
                <div className="relative">
                  <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-x-auto text-sm">
                    <code>{`npm install @trainly/react`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                    onClick={() =>
                      copyToClipboard(
                        `npm install @trainly/react`,
                        "Install command",
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">
                        That's All!
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        No additional dependencies needed. The package includes
                        everything: authentication, security, TypeScript types,
                        and pre-built components.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Setup Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Add TrainlyProvider (2 lines)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Wrap your app with the TrainlyProvider in your layout file:
                </p>
                <div className="relative">
                  <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed max-h-96">
                    <code>{`import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface SessionData {
  user: User;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const SESSION_DURATION = 24 * 60 * 60; // 24 hours

export function createSecureToken(user: User): string {
  return jwt.sign(
    {
      user: { id: user.id, email: user.email, username: user.username },
    },
    JWT_SECRET,
    { expiresIn: SESSION_DURATION },
  );
}

export function verifySecureToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function createSecureCookie(token: string): string {
  const maxAge = SESSION_DURATION;
  const secure = process.env.NODE_ENV === "production";

  return [
    \`auth-token=\${token}\`,
    \`Max-Age=\${maxAge}\`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<User | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((cookie) => {
      const [name, value] = cookie.split("=");
      return [name, value];
    }),
  );

  const token = cookies["auth-token"];
  if (!token) return null;

  const sessionData = verifySecureToken(token);
  if (!sessionData) return null;

  return sessionData.user;
}`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                    onClick={() =>
                      copyToClipboard(
                        `import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface SessionData {
  user: User;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const SESSION_DURATION = 24 * 60 * 60; // 24 hours

export function createSecureToken(user: User): string {
  return jwt.sign(
    {
      user: { id: user.id, email: user.email, username: user.username },
    },
    JWT_SECRET,
    { expiresIn: SESSION_DURATION },
  );
}

export function verifySecureToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function createSecureCookie(token: string): string {
  const maxAge = SESSION_DURATION;
  const secure = process.env.NODE_ENV === "production";

  return [
    \`auth-token=\${token}\`,
    \`Max-Age=\${maxAge}\`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<User | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((cookie) => {
      const [name, value] = cookie.split("=");
      return [name, value];
    }),
  );

  const token = cookies["auth-token"];
  if (!token) return null;

  const sessionData = verifySecureToken(token);
  if (!sessionData) return null;

  return sessionData.user;
}`,
                        "Auth utilities",
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: API Routes */}
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Create Secure API Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Create secure authentication API routes that use httpOnly
                  cookies:
                </p>
                {/* Login Route */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Login Route -{" "}
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-sm">
                      src/app/api/auth/login/route.ts
                    </code>
                  </h4>
                  <div className="relative">
                    <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed max-h-80">
                      <code>{`import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  createSecureToken,
  createSecureCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find user
    const foundUser = findUserByEmail(email);
    if (!foundUser) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Create secure session token
    const user = {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
    };
    const token = createSecureToken(user);

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      user,
    });

    response.headers.set("Set-Cookie", createSecureCookie(token));

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}`}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                      onClick={() =>
                        copyToClipboard(
                          `import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  createSecureToken,
  createSecureCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find user
    const foundUser = findUserByEmail(email);
    if (!foundUser) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Create secure session token
    const user = {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
    };
    const token = createSecureToken(user);

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      user,
    });

    response.headers.set("Set-Cookie", createSecureCookie(token));

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}`,
                          "Login route",
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Session Validation Route */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Session Validation -{" "}
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-sm">
                      src/app/api/auth/me/route.ts
                    </code>
                  </h4>
                  <div className="relative">
                    <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed max-h-64">
                      <code>{`import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json({ error: "Invalid session" }, { status: 403 });
  }
}`}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                      onClick={() =>
                        copyToClipboard(
                          `import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json({ error: "Invalid session" }, { status: 403 });
  }
}`,
                          "Session validation route",
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: AuthContext */}
          <Card>
            <CardHeader>
              <CardTitle>
                Step 4: Update AuthContext for Secure Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Create{" "}
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    src/contexts/AuthContext.tsx
                  </code>{" "}
                  that uses server-side sessions:
                </p>
                <div className="relative">
                  <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed max-h-96">
                    <code>{`"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                    onClick={() =>
                      copyToClipboard(
                        `"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}`,
                        "Auth context",
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Trainly Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Secure Trainly Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Create a secure Trainly hook that works with your
                  authentication system:
                </p>
                <div className="relative">
                  <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed max-h-96">
                    <code>{`"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface TrainlyConfig {
  appSecret: string;
}

export function useTrainlyHybrid(config: TrainlyConfig) {
  const { user, refreshAuth } = useAuth();
  const [scopedToken, setScopedToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Connect user to Trainly
  const connectToTrainly = async () => {
    if (!user) throw new Error("User not authenticated");

    setIsLoading(true);
    try {
      const response = await fetch("/api/trainly/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies
        body: JSON.stringify({
          userId: user.id,
          capabilities: ["ask", "upload"],
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // If session expired, try to refresh
        if (response.status === 401) {
          await refreshAuth();
        }
        throw new Error(data.error || "Failed to connect to Trainly");
      }

      setScopedToken(data.scopedToken);
      setIsConnected(true);

      return data;
    } catch (error) {
      console.error("Trainly connection failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Query with automatic session refresh
  const query = async (question: string) => {
    if (!scopedToken || !user) throw new Error("Not connected to Trainly");

    const response = await fetch("/api/trainly/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies
      body: JSON.stringify({
        question,
        scopedToken,
        userId: user.id,
      }),
    });

    const data = await response.json();

    // Handle session expiration
    if (response.status === 401) {
      await refreshAuth();
      throw new Error("Session expired, please reconnect");
    }

    if (!data.success) {
      throw new Error(data.error || "Query failed");
    }

    return {
      role: "assistant",
      content: data.answer,
      citations: data.citations || [],
    };
  };

  return {
    isConnected,
    isLoading,
    connectToTrainly,
    query,
    disconnect: () => {
      setScopedToken(null);
      setIsConnected(false);
    },
  };
}`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                    onClick={() =>
                      copyToClipboard(
                        `"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface TrainlyConfig {
  appSecret: string;
}

export function useTrainlyHybrid(config: TrainlyConfig) {
  const { user, refreshAuth } = useAuth();
  const [scopedToken, setScopedToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Connect user to Trainly
  const connectToTrainly = async () => {
    if (!user) throw new Error("User not authenticated");

    setIsLoading(true);
    try {
      const response = await fetch("/api/trainly/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies
        body: JSON.stringify({
          userId: user.id,
          capabilities: ["ask", "upload"],
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // If session expired, try to refresh
        if (response.status === 401) {
          await refreshAuth();
        }
        throw new Error(data.error || "Failed to connect to Trainly");
      }

      setScopedToken(data.scopedToken);
      setIsConnected(true);

      return data;
    } catch (error) {
      console.error("Trainly connection failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Query with automatic session refresh
  const query = async (question: string) => {
    if (!scopedToken || !user) throw new Error("Not connected to Trainly");

    const response = await fetch("/api/trainly/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies
      body: JSON.stringify({
        question,
        scopedToken,
        userId: user.id,
      }),
    });

    const data = await response.json();

    // Handle session expiration
    if (response.status === 401) {
      await refreshAuth();
      throw new Error("Session expired, please reconnect");
    }

    if (!data.success) {
      throw new Error(data.error || "Query failed");
    }

    return {
      role: "assistant",
      content: data.answer,
      citations: data.citations || [],
    };
  };

  return {
    isConnected,
    isLoading,
    connectToTrainly,
    query,
    disconnect: () => {
      setScopedToken(null);
      setIsConnected(false);
    },
  };
}`,
                        "Trainly hook",
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Step 6: Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Set up your environment variables in{" "}
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    .env.local
                  </code>
                  :
                </p>
                <div className="relative">
                  <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-x-auto text-sm">
                    <code>{`# Trainly configuration
NEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000
TRAINLY_APP_SECRET=as_demo_secret_123
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT secret for secure sessions (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_very_long_and_secure_secret_key_here_64_characters_minimum`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                    onClick={() =>
                      copyToClipboard(
                        `# Trainly configuration
NEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000
TRAINLY_APP_SECRET=as_demo_secret_123
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT secret for secure sessions (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_very_long_and_secure_secret_key_here_64_characters_minimum`,
                        "Environment variables",
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                        Generate Secure JWT Secret
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Run this command to generate a secure JWT secret:
                      </p>
                      <code className="block mt-2 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded text-sm">
                        node -e
                        "console.log(require('crypto').randomBytes(64).toString('hex'))"
                      </code>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">
                        Industry-Standard Session Duration
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        This implementation uses proper session times:
                      </p>
                      <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                        <li>
                          • <strong>Default sessions:</strong> 7 days (automatic
                          logout after a week)
                        </li>
                        <li>
                          • <strong>"Remember me" sessions:</strong> 30 days
                          (for longer access)
                        </li>
                        <li>
                          • <strong>Auto-refresh:</strong> Tokens refresh
                          automatically before expiration
                        </li>
                        <li>
                          • <strong>No more 5-minute expiration!</strong> Users
                          stay logged in for days/weeks
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Security Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-600 dark:text-green-400">
                    🔒 What This Provides
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">XSS Protection</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Tokens in httpOnly cookies can't be accessed by
                          malicious JavaScript
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">CSRF Protection</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          SameSite cookies prevent cross-site request forgery
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Secure Transport</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Secure flag ensures cookies only sent over HTTPS in
                          production
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400">
                    ⚡ User Experience
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Automatic Refresh</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Sessions validated server-side without client
                          intervention
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Route Protection</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Middleware automatically protects sensitive routes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">No Token Exposure</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Tokens never exposed to client-side JavaScript
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Production Deployment Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Before deploying to production, ensure you have:
                </p>
                <div className="grid gap-3">
                  {[
                    "Use strong JWT secrets (64+ characters)",
                    "Enable HTTPS in production",
                    "Set secure cookie flags",
                    "Implement proper session expiration",
                    "Add rate limiting to auth endpoints",
                    "Use proper database for user/session storage",
                    "Enable security headers (HSTS, CSP, etc.)",
                    "Monitor for suspicious authentication attempts",
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg"
                    >
                      <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded"></div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-zinc-600 dark:text-zinc-400">
                  You now have enterprise-grade secure authentication! Here's
                  what to do next:
                </p>
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        Test Your Implementation
                      </h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Create a simple login form and test the secure
                        authentication flow
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Add User Management</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Implement registration, password reset, and profile
                        management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Monitor & Analytics</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Add authentication analytics and security monitoring
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

    "react-integration": {
      title: "React Integration",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              React Integration Guide
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Complete React integration with hooks and components for Trainly's
              privacy-first API.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>useTrainlyAuth Hook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-lg p-6">
                <pre className="text-zinc-300 text-sm overflow-x-auto">
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
      body: JSON.stringify({
        question: question,
        include_citations: false // Privacy protection
      })
    });

    return response.json();
  };

  const disconnect = () => {
    localStorage.removeItem(\`trainly_token_\${chatId}\`);
    setTrainlyToken(null);
    setIsConnected(false);
  };

  return { isConnected, connect, query, disconnect };
}`}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    copyToClipboard("// React Hook Code", "useTrainlyAuth Hook")
                  }
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Hook
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Example */}
          <Card>
            <CardHeader>
              <CardTitle>Component Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-lg p-6">
                <pre className="text-blue-400 text-sm overflow-x-auto">
                  {`function MyAIAssistant({ chatId }) {
  const { isConnected, connect, query } = useTrainlyAuth(chatId);
  const [answer, setAnswer] = useState('');

  const handleQuestion = async (question) => {
    const result = await query(question);
    setAnswer(result.answer);
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>✅ Connected to Trainly AI</p>
          <button onClick={() => handleQuestion('Summarize my documents')}>
            Ask AI about your documents
          </button>
          {answer && <p>AI Response: {answer}</p>}
        </div>
      ) : (
        <div>
          <h3>Connect with Trainly for AI features</h3>
          <p>🔒 Your data stays private - we only get AI responses</p>
          <button onClick={connect}>
            Connect with Trainly ✨
          </button>
        </div>
      )}
    </div>
  );
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },

    "token-exchange": {
      title: "Token Exchange",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              RFC 8693 Token Exchange
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Exchange user's Clerk ID token for a short-lived Trainly access
              token. This enables user-controlled authentication without OAuth
              complexity.
            </p>
          </div>

          {/* Endpoint Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-zinc-800 text-white">POST</Badge>
                <code className="font-mono text-lg">/oauth/token</code>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Request Body
                  </h4>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-zinc-300 text-sm">
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
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Response
                  </h4>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-blue-400 text-sm">
                      {`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
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
                      <h5 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        Critical Security Note
                      </h5>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Store the access token on the user's device only
                        (localStorage, secure cookie). Never store user tokens
                        on your servers - this maintains the privacy guarantee.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Example */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Implementation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-lg p-6">
                <pre className="text-zinc-300 text-sm overflow-x-auto">
                  {`async function connectUserToTrainly(chatId) {
  try {
    // Get user's Clerk token
    const clerkToken = await window.Clerk.user.getToken();

    // Exchange for Trainly token
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

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    const tokenData = await response.json();

    // Store securely on user's device
    const tokenStorage = {
      access_token: tokenData.access_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      chat_id: chatId,
      scope: tokenData.scope
    };

    localStorage.setItem(\`trainly_token_\${chatId}\`, JSON.stringify(tokenStorage));

    console.log('✅ Connected to Trainly with privacy protection');
    return tokenData;

  } catch (error) {
    console.error('Failed to connect:', error);
    throw error;
  }
}`}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    copyToClipboard(
                      "// Token Exchange Implementation",
                      "Token Exchange Code",
                    )
                  }
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Implementation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  };

  // Navigation structure
  const currentSection = sectionContent[selectedSection];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex">
        {/* Stripe-style Sidebar */}
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-y-auto h-screen sticky top-0">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Trainly API
                </h1>
                <p className="text-sm text-zinc-500">
                  Privacy-First Documentation
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSection(item.id)}
                      className={cn(
                        "w-full text-left flex items-center justify-between p-3 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        selectedSection === item.id
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                          : "text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      <span className="font-medium">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              item.badge === "New"
                                ? "border-green-200 text-green-700"
                                : item.badge === "Important"
                                  ? "border-red-200 text-red-700"
                                  : item.badge === "🔐"
                                    ? "border-blue-200 text-blue-700"
                                    : "border-zinc-200 text-zinc-700",
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {selectedSection === item.id && (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 mt-8">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <a href="/dashboard" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Dashboard
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <a
                  href="https://github.com/trainly/examples"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Examples
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <a
                  href="https://status.trainly.com"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  API Status
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center justify-between p-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {currentSection?.title || "Documentation"}
                </h2>
                <p className="text-sm text-zinc-500">
                  Privacy-first API with user-controlled authentication
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    API Operational
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="/api-docs"
                    target="_blank"
                    className="flex items-center gap-2"
                  >
                    <Code className="w-4 h-4" />
                    Interactive API
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 max-w-5xl">
            {currentSection?.content || (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                  Select Documentation Section
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Choose a section from the sidebar to view detailed
                  documentation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
