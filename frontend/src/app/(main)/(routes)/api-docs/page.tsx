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
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiTester } from "@/components/api-tester";

export default function ApiDocsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedEndpoint, setSelectedEndpoint] = useState("answer_question");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const endpoints = [
    {
      id: "answer_question",
      method: "POST",
      path: "/v1/{chat_id}/answer_question",
      title: "Answer Question",
      description: "Ask questions about your chat's knowledge base",
      parameters: [
        { name: "question", type: "string", required: true, description: "The question to ask" },
        { name: "selected_model", type: "string", required: false, description: "AI model (default: gpt-4o-mini)" },
        { name: "temperature", type: "number", required: false, description: "Response creativity 0.0-1.0 (default: 0.7)" },
        { name: "max_tokens", type: "number", required: false, description: "Maximum response length (default: 1000)" },
        { name: "custom_prompt", type: "string", required: false, description: "Custom system prompt" }
      ]
    },
    {
      id: "answer_question_stream",
      method: "POST",
      path: "/v1/{chat_id}/answer_question_stream",
      title: "Stream Answer",
      description: "Get streaming responses for real-time applications",
      parameters: [
        { name: "question", type: "string", required: true, description: "The question to ask" },
        { name: "selected_model", type: "string", required: false, description: "AI model (default: gpt-4o-mini)" },
        { name: "temperature", type: "number", required: false, description: "Response creativity 0.0-1.0 (default: 0.7)" },
        { name: "max_tokens", type: "number", required: false, description: "Maximum response length (default: 1000)" }
      ]
    },
    {
      id: "info",
      method: "GET",
      path: "/v1/{chat_id}/info",
      title: "Chat Info",
      description: "Get information about a chat",
      parameters: []
    },
    {
      id: "health",
      method: "GET",
      path: "/v1/health",
      title: "Health Check",
      description: "Check API health status",
      parameters: []
    }
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
console.log('Status:', health.status);`
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
print('Status:', health['status'])`
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
curl https://api.trainlyai.com/v1/health`
    }
  };

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpoint);
  const currentCode = codeExamples[selectedLanguage as keyof typeof codeExamples]?.[selectedEndpoint as keyof typeof codeExamples.javascript];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-trainlymainlight/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            TeachAI Chat API
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Turn your knowledge graphs into powerful APIs. Each chat becomes a secure endpoint that external applications can query.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Create & Upload</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create a chat and upload your documents to build a knowledge base
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Get API Key</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Generate an API key for your chat in the settings panel
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Start Querying</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Use the API endpoint to query your knowledge base from any app
                </p>
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
                          : "border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/50"
                      )}
                      onClick={() => setSelectedEndpoint(endpoint.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={endpoint.method === "POST" ? "default" : "secondary"}>
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
                        All API requests require a valid API key in the Authorization header.
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
                        60 requests per minute per API key. Rate limit headers included in responses.
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
                    { code: 200, status: "OK", description: "Request successful" },
                    { code: 401, status: "Unauthorized", description: "Invalid or missing API key" },
                    { code: 429, status: "Too Many Requests", description: "Rate limit exceeded" },
                    { code: 500, status: "Server Error", description: "Internal server error" }
                  ].map((error) => (
                    <div key={error.code} className="flex items-center gap-3 p-2">
                      <Badge variant={error.code === 200 ? "default" : "destructive"}>
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
                <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage} className="mb-4">
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
                      <Badge variant={currentEndpoint.method === "POST" ? "default" : "secondary"}>
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
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Parameters</h4>
                        <div className="space-y-2">
                          {currentEndpoint.parameters.map((param) => (
                            <div key={param.name} className="flex items-start gap-2 text-sm">
                              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                                {param.name}
                              </code>
                              <Badge variant={param.required ? "destructive" : "secondary"} className="text-xs">
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
                        onClick={() => copyToClipboard(currentCode, "Code example")}
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
                    <code>{JSON.stringify({
                      answer: "Based on the uploaded documents, machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed...",
                      context: [
                        {
                          chunk_id: "doc1-chunk-0",
                          chunk_text: "Machine learning is a method of data analysis that automates analytical model building...",
                          score: 0.95
                        },
                        {
                          chunk_id: "doc1-chunk-2",
                          chunk_text: "The goal of machine learning is to develop algorithms that can receive input data and use statistical analysis to predict an output...",
                          score: 0.87
                        }
                      ],
                      chat_id: "your_chat_id",
                      model: "gpt-4o-mini",
                      usage: {
                        prompt_tokens: 150,
                        completion_tokens: 200,
                        total_tokens: 350
                      }
                    }, null, 2)}</code>
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
                      description: "Build chatbots that answer questions from your knowledge base"
                    },
                    {
                      icon: <BookOpen className="w-5 h-5 text-green-600" />,
                      title: "Documentation Search",
                      description: "Add intelligent search to your documentation websites"
                    },
                    {
                      icon: <Globe className="w-5 h-5 text-purple-600" />,
                      title: "Mobile Apps",
                      description: "Integrate AI-powered Q&A into your mobile applications"
                    },
                    {
                      icon: <Code className="w-5 h-5 text-orange-600" />,
                      title: "Slack/Discord Bots",
                      description: "Create bots that can answer questions about your content"
                    }
                  ].map((useCase, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
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
              Create your first chat, upload some documents, and generate an API key to start building with TeachAI.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.href = "/dashboard"}
                className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white"
              >
                Create Your First Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://github.com/teachai/examples", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Examples
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Base URL Info */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Base URL</div>
                <code className="text-sm text-slate-600 dark:text-slate-400">https://api.trainlyai.com</code>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
