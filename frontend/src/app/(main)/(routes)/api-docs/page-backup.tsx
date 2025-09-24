"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Copy,
  Globe,
  Key,
  Zap,
  Shield,
  BookOpen,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiTester } from "@/components/api-tester";

export default function ApiDocsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedEndpoint, setSelectedEndpoint] = useState("answer_question");
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

  const endpoints = [
    {
      id: "answer_question",
      method: "POST",
      path: "/v1/{chat_id}/answer_question",
      title: "Answer Question",
      description: "Ask questions about your chat's knowledge base",
      parameters: [
        {
          name: "question",
          type: "string",
          required: true,
          description: "The question to ask",
        },
        {
          name: "selected_model",
          type: "string",
          required: false,
          description: "AI model (default: gpt-4o-mini)",
        },
        {
          name: "temperature",
          type: "number",
          required: false,
          description: "Response creativity 0.0-1.0 (default: 0.7)",
        },
        {
          name: "max_tokens",
          type: "number",
          required: false,
          description: "Maximum response length (default: 1000)",
        },
        {
          name: "custom_prompt",
          type: "string",
          required: false,
          description: "Custom system prompt",
        },
      ],
    },
    {
      id: "answer_question_stream",
      method: "POST",
      path: "/v1/{chat_id}/answer_question_stream",
      title: "Stream Answer",
      description: "Get streaming responses for real-time applications",
      parameters: [
        {
          name: "question",
          type: "string",
          required: true,
          description: "The question to ask",
        },
        {
          name: "selected_model",
          type: "string",
          required: false,
          description: "AI model (default: gpt-4o-mini)",
        },
        {
          name: "temperature",
          type: "number",
          required: false,
          description: "Response creativity 0.0-1.0 (default: 0.7)",
        },
        {
          name: "max_tokens",
          type: "number",
          required: false,
          description: "Maximum response length (default: 1000)",
        },
      ],
    },
    {
      id: "info",
      method: "GET",
      path: "/v1/{chat_id}/info",
      title: "Chat Info",
      description: "Get information about a chat",
      parameters: [],
    },
    {
      id: "health",
      method: "GET",
      path: "/v1/health",
      title: "Health Check",
      description: "Check API health status",
      parameters: [],
    },
  ];

  const codeExamples = {
    javascript: {
      answer_question: `// Basic question answering
const response = await fetch('https://api.trainlyai.com/v1/YOUR_CHAT_ID/answer_question', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tk_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: 'What is machine learning?',
    selected_model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000
  })
});

const data = await response.json();
console.log('Answer:', data.answer);
console.log('Citations:', data.context);`,

      answer_question_stream: `// Streaming responses
const response = await fetch('https://api.trainlyai.com/v1/YOUR_CHAT_ID/answer_question_stream', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tk_your_api_key',
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify({
    question: 'Explain neural networks in detail'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.type === 'content') {
        process.stdout.write(data.data);
      }
    }
  }
}`,

      info: `// Get chat information
const response = await fetch('https://api.trainlyai.com/v1/YOUR_CHAT_ID/info', {
  headers: {
    'Authorization': 'Bearer tk_your_api_key'
  }
});

const chatInfo = await response.json();
console.log('Chat:', chatInfo.title);
console.log('Files:', chatInfo.context_files);`,

      health: `// Check API health
const response = await fetch('https://api.trainlyai.com/v1/health');
const health = await response.json();
console.log('Status:', health.status);`,
    },

    python: {
      answer_question: `import requests

# Basic question answering
response = requests.post(
    'https://api.trainlyai.com/v1/YOUR_CHAT_ID/answer_question',
    headers={
        'Authorization': 'Bearer tk_your_api_key',
        'Content-Type': 'application/json'
    },
    json={
        'question': 'What is machine learning?',
        'selected_model': 'gpt-4o-mini',
        'temperature': 0.7,
        'max_tokens': 1000
    }
)

data = response.json()
print('Answer:', data['answer'])
print('Citations:', len(data['context']))`,

      answer_question_stream: `import requests
import json

# Streaming responses
response = requests.post(
    'https://api.trainlyai.com/v1/YOUR_CHAT_ID/answer_question_stream',
    headers={
        'Authorization': 'Bearer tk_your_api_key',
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
    },
    json={
        'question': 'Explain neural networks in detail'
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        line_str = line.decode('utf-8')
        if line_str.startswith('data: '):
            try:
                data = json.loads(line_str[6:])
                if data.get('type') == 'content':
                    print(data['data'], end='', flush=True)
            except json.JSONDecodeError:
                continue`,

      info: `import requests

# Get chat information
response = requests.get(
    'https://api.trainlyai.com/v1/YOUR_CHAT_ID/info',
    headers={
        'Authorization': 'Bearer tk_your_api_key'
    }
)

chat_info = response.json()
print('Chat:', chat_info['title'])
print('Files:', chat_info['context_files'])`,

      health: `import requests

# Check API health
response = requests.get('https://api.trainlyai.com/v1/health')
health = response.json()
print('Status:', health['status'])`,
    },

    curl: {
      answer_question: `# Basic question answering
curl -X POST https://api.trainlyai.com/v1/YOUR_CHAT_ID/answer_question \\
  -H "Authorization: Bearer tk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What is machine learning?",
    "selected_model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 1000
  }'`,

      answer_question_stream: `# Streaming responses
curl -X POST https://api.trainlyai.com/v1/YOUR_CHAT_ID/answer_question_stream \\
  -H "Authorization: Bearer tk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -H "Accept: text/event-stream" \\
  -d '{
    "question": "Explain neural networks in detail",
    "selected_model": "gpt-4o-mini"
  }'`,

      info: `# Get chat information
curl -H "Authorization: Bearer tk_your_api_key" \\
     https://api.trainlyai.com/v1/YOUR_CHAT_ID/info`,

      health: `# Check API health
curl https://api.trainlyai.com/v1/health`,
    },
  };

  const currentEndpoint = endpoints.find((e) => e.id === selectedEndpoint);
  const currentCode =
    codeExamples[selectedLanguage as keyof typeof codeExamples]?.[
      selectedEndpoint as keyof typeof codeExamples.javascript
    ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-blue-100/20 to-purple-100/20 dark:from-blue-900/10 dark:to-purple-900/10"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Premium Header */}
        <div className="text-center mb-16">
          {/* Logo and Badge */}
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

          {/* Hero Description */}
          <div className="max-w-4xl mx-auto">
            <p className="text-2xl text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Build AI applications where users <span className="text-green-700 dark:text-green-300 font-semibold">trust uploading sensitive documents</span> because developers cannot access raw files.
            </p>

            {/* Key Benefits */}
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

        {/* Quick Start */}
        <Card className="mb-12 shadow-xl shadow-slate-500/10 border border-slate-200/50 dark:border-slate-800/50">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900/50 dark:to-blue-950/30 border-b border-slate-200/50 dark:border-slate-800/50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    1
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Create & Upload
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create a chat and upload your documents to build a knowledge
                  base
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    2
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Get API Key
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Generate an API key for your chat in the settings panel
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    3
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Start Querying
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Use the API endpoint to query your knowledge base from any app
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy-First API Section - Premium Design */}
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
            {/* Premium Hero Section */}
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ What You CAN Do:
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Get AI responses about user's data</li>
                    <li>• Enable direct user file uploads</li>
                    <li>• View usage analytics (anonymized)</li>
                    <li>• Build trusted AI applications</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ❌ What You CANNOT Do:
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• List user's uploaded files</li>
                    <li>• Download raw file content</li>
                    <li>• Access other users' data</li>
                    <li>• See user's actual questions/content</li>
                  </ul>
                </div>
              </div>
            </div>

            <Tabs defaultValue="integration" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="integration">Integration</TabsTrigger>
                <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
                <TabsTrigger value="examples">Code Examples</TabsTrigger>
              </TabsList>

              <TabsContent value="integration" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">1. App Registration</h4>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-sm mb-2">
                        Register your app in the Trainly developer dashboard:
                      </p>
                      <code className="text-xs block bg-slate-200 dark:bg-slate-700 p-2 rounded">
                        App ID: app_yourapp_123
                        <br />
                        App Secret: as_yourapp_secret_xyz789
                      </code>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">2. User Provisioning</h4>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-sm mb-2">
                        Each user gets their own isolated sub-chat:
                      </p>
                      <code className="text-xs block bg-slate-200 dark:bg-slate-700 p-2 rounded">
                        POST /v1/privacy/apps/users/provision
                        <br />→ Creates private sub-chat for user
                      </code>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="endpoints" className="space-y-4">
                <div className="space-y-4">
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-800">POST</Badge>
                      <code className="text-sm">
                        /v1/privacy/apps/users/provision
                      </code>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Create isolated sub-chat for a user (requires app secret)
                    </p>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-100 text-green-800">
                        POST
                      </Badge>
                      <code className="text-sm">/v1/privacy/query</code>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Query user's private data (AI responses only, requires
                      scoped token)
                    </p>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-800">
                        POST
                      </Badge>
                      <code className="text-sm">
                        /v1/privacy/upload/presigned-url
                      </code>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Get direct upload URL (files bypass your servers entirely)
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">
                      Backend Integration (Node.js)
                    </h4>
                    <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                      {`// 1. Provision user (creates private sub-chat)
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
});

const { scoped_token } = await response.json();

// 2. Query user's private data (AI only)
const queryResponse = await fetch('/v1/privacy/query', {
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

// You get AI response, never raw files! 🔒`}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        copyToClipboard(
                          `// Privacy-First API Integration
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
});`,
                          "Privacy-First Integration Code",
                        )
                      }
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">
                      Frontend React Component
                    </h4>
                    <pre className="bg-slate-900 text-blue-400 p-4 rounded-lg text-sm overflow-x-auto">
                      {`function PrivateAIAssistant({ userId }) {
  const [answer, setAnswer] = useState('');
  const [isOnboarded, setIsOnboarded] = useState(false);

  // Onboard user (creates their private workspace)
  useEffect(() => {
    fetch(\`/api/users/\${userId}/onboard\`, { method: 'POST' })
      .then(r => r.json())
      .then(result => {
        setIsOnboarded(true);
        console.log('Privacy guarantee:', result.privacy_guarantee);
      });
  }, [userId]);

  const askQuestion = async (question) => {
    const response = await fetch(\`/api/users/\${userId}/ask\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    const result = await response.json();
    setAnswer(result.answer);

    // User sees that their data is protected
    if (result.privacy_protected) {
      console.log('✅ Your files are private - developer cannot access them');
    }
  };

  return (
    <div>
      <h3>Your Private AI Assistant</h3>
      {isOnboarded ? (
        <div>
          <p>✅ Your private workspace is ready</p>
          <button onClick={() => askQuestion('What did I upload?')}>
            Ask about my documents
          </button>
          {answer && <p>AI Response: {answer}</p>}
        </div>
      ) : (
        <p>Setting up your private workspace...</p>
      )}
    </div>
  );
}`}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Legacy API Warning - Enhanced */}
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

        {/* API Reference */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Endpoints */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {endpoints.map((endpoint) => (
                    <div
                      key={endpoint.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        selectedEndpoint === endpoint.id
                          ? "border-trainlymainlight bg-trainlymainlight/5"
                          : "border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/50",
                      )}
                      onClick={() => setSelectedEndpoint(endpoint.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant={
                            endpoint.method === "POST" ? "default" : "secondary"
                          }
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono text-slate-700 dark:text-slate-300">
                          {endpoint.path}
                        </code>
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {endpoint.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {endpoint.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        API Key Required
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        All API requests require a valid API key in the
                        Authorization header.
                      </p>
                      <code className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-mono">
                        Authorization: Bearer tk_your_api_key
                      </code>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Rate Limiting
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        60 requests per minute per API key. Rate limit headers
                        included in responses.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Codes */}
            <Card>
              <CardHeader>
                <CardTitle>Error Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      code: 200,
                      status: "OK",
                      description: "Request successful",
                    },
                    {
                      code: 401,
                      status: "Unauthorized",
                      description: "Invalid or missing API key",
                    },
                    {
                      code: 429,
                      status: "Too Many Requests",
                      description: "Rate limit exceeded",
                    },
                    {
                      code: 500,
                      status: "Server Error",
                      description: "Internal server error",
                    },
                  ].map((error) => (
                    <div
                      key={error.code}
                      className="flex items-center gap-3 p-2"
                    >
                      <Badge
                        variant={error.code === 200 ? "default" : "destructive"}
                      >
                        {error.code}
                      </Badge>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white text-sm">
                          {error.status}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {error.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Code Examples */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Code Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Language Selector */}
                <Tabs
                  value={selectedLanguage}
                  onValueChange={setSelectedLanguage}
                  className="mb-4"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Endpoint Details */}
                {currentEndpoint && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        variant={
                          currentEndpoint.method === "POST"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {currentEndpoint.method}
                      </Badge>
                      <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {currentEndpoint.path}
                      </code>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {currentEndpoint.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {currentEndpoint.description}
                    </p>

                    {/* Parameters */}
                    {currentEndpoint.parameters.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                          Parameters
                        </h4>
                        <div className="space-y-2">
                          {currentEndpoint.parameters.map((param) => (
                            <div
                              key={param.name}
                              className="flex items-start gap-2 text-sm"
                            >
                              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                                {param.name}
                              </code>
                              <Badge
                                variant={
                                  param.required ? "destructive" : "secondary"
                                }
                                className="text-xs"
                              >
                                {param.required ? "required" : "optional"}
                              </Badge>
                              <span className="text-slate-600 dark:text-slate-400">
                                {param.type} - {param.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Code Example */}
                {currentCode && (
                  <div className="relative">
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
                      <pre className="text-sm text-slate-300 overflow-x-auto">
                        <code>{currentCode}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-slate-400 hover:text-white"
                        onClick={() =>
                          copyToClipboard(currentCode, "Code example")
                        }
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Response Example */}
            <Card>
              <CardHeader>
                <CardTitle>Response Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4">
                  <pre className="text-sm text-green-400 overflow-x-auto">
                    <code>
                      {JSON.stringify(
                        {
                          answer:
                            "Based on the uploaded documents, machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed...",
                          context: [
                            {
                              chunk_id: "doc1-chunk-0",
                              chunk_text:
                                "Machine learning is a method of data analysis that automates analytical model building...",
                              score: 0.95,
                            },
                            {
                              chunk_id: "doc1-chunk-2",
                              chunk_text:
                                "The goal of machine learning is to develop algorithms that can receive input data and use statistical analysis to predict an output...",
                              score: 0.87,
                            },
                          ],
                          chat_id: "your_chat_id",
                          model: "gpt-4o-mini",
                          usage: {
                            prompt_tokens: 150,
                            completion_tokens: 200,
                            total_tokens: 350,
                          },
                        },
                        null,
                        2,
                      )}
                    </code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Use Cases */}
            <Card>
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
                      title: "Customer Support",
                      description:
                        "Build chatbots that answer questions from your knowledge base",
                    },
                    {
                      icon: <BookOpen className="w-5 h-5 text-green-600" />,
                      title: "Documentation Search",
                      description:
                        "Add intelligent search to your documentation websites",
                    },
                    {
                      icon: <Globe className="w-5 h-5 text-purple-600" />,
                      title: "Mobile Apps",
                      description:
                        "Integrate AI-powered Q&A into your mobile applications",
                    },
                    {
                      icon: <Code className="w-5 h-5 text-orange-600" />,
                      title: "Slack/Discord Bots",
                      description:
                        "Create bots that can answer questions about your content",
                    },
                  ].map((useCase, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      {useCase.icon}
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {useCase.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Interactive API Tester */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Try It Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApiTester />
          </CardContent>
        </Card>

        {/* Get Started CTA */}
        <Card className="mt-8">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
              Create your first chat, upload some documents, and generate an API
              key to start building with TeachAI.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => (window.location.href = "/dashboard")}
                className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white"
              >
                Create Your First Chat
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  window.open("https://github.com/teachai/examples", "_blank")
                }
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Examples
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Testing Section */}
        <Card className="mt-8 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Shield className="w-5 h-5" />
              🧪 Test Privacy Protection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-700 dark:text-green-300">
                  ✅ Tests That Should PASS
                </h4>
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <code className="text-xs block mb-2">
                      POST /v1/privacy/apps/users/provision
                    </code>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      User provisioning should return scoped token and privacy
                      guarantee
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <code className="text-xs block mb-2">
                      POST /v1/privacy/query
                    </code>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      User queries should return AI responses with privacy notes
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-red-700 dark:text-red-300">
                  ❌ Tests That Should FAIL
                </h4>
                <div className="space-y-3">
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <code className="text-xs block mb-2">
                      capabilities: ["list_files"]
                    </code>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Should return 400: "Invalid capabilities" - file access
                      blocked
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <code className="text-xs block mb-2">
                      Cross-user token usage
                    </code>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Should return 403: "User ID mismatch" - privacy protection
                      active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🔬 Run Your Own Tests
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Use these curl commands to verify privacy protection in your
                integration:
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `curl -X POST https://api.trainly.com/v1/privacy/apps/users/provision \\
  -H "Authorization: Bearer your_app_secret" \\
  -H "Content-Type: application/json" \\
  -d '{"end_user_id": "test_user", "capabilities": ["ask", "upload"]}'`,
                      "User Provisioning Test",
                    )
                  }
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Provisioning Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `curl -X POST https://api.trainly.com/v1/privacy/apps/users/provision \\
  -H "Authorization: Bearer your_app_secret" \\
  -H "Content-Type: application/json" \\
  -d '{"end_user_id": "hacker", "capabilities": ["list_files", "download_file"]}'`,
                      "Privacy Violation Test",
                    )
                  }
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Privacy Violation Test (Should Fail)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card className="mt-8 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Lock className="w-5 h-5" />
              🔐 Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">App Secret Management</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Server-side only
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Store app secrets in environment variables, never in
                        client code
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Never expose in frontend
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        App secrets in client-side code = security vulnerability
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">User Data Protection</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Scoped tokens only
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Use user-specific tokens, never share between users
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        AI responses only
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Never attempt to access raw file content or listings
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                🎯 Privacy-First Integration Checklist
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    ✅ Implementation:
                  </p>
                  <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1 ml-3">
                    <li>• Each user gets isolated sub-chat</li>
                    <li>• Use scoped tokens for user operations</li>
                    <li>• Only request safe capabilities</li>
                    <li>• Handle token expiry gracefully</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    🧪 Testing:
                  </p>
                  <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1 ml-3">
                    <li>• Verify cross-user access is blocked</li>
                    <li>• Test dangerous capabilities are rejected</li>
                    <li>• Confirm only AI responses returned</li>
                    <li>• Check audit logging works</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Base URL Info */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">
                  Base URL
                </div>
                <code className="text-sm text-slate-600 dark:text-slate-400">
                  https://api.trainlyai.com
                </code>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Operational
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
