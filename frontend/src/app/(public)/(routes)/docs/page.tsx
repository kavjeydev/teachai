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
  Lightbulb,
  Database,
  MessageSquare,
  FileText,
  Settings,
  ArrowRight,
  Terminal,
  Layers,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// import { ApiTester } from "@/components/api-tester";

export default function DocsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedEndpoint, setSelectedEndpoint] = useState("answer_question");
  const [copyingStates, setCopyingStates] = useState<Record<string, boolean>>(
    {},
  );

  const copyToClipboard = async (text: string, label: string) => {
    const copyId = `${label}-${Date.now()}`;
    setCopyingStates((prev) => ({ ...prev, [copyId]: true }));

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    } finally {
      setTimeout(() => {
        setCopyingStates((prev) => {
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
      description:
        "Ask questions about your chat's knowledge base using natural language",
      category: "AI & Chat",
      parameters: [
        {
          name: "question",
          type: "string",
          required: true,
          description: "The question to ask about your knowledge base",
        },
        {
          name: "selected_model",
          type: "string",
          required: false,
          description: "AI model to use (default: gpt-4o-mini)",
          default: "gpt-4o-mini",
        },
        {
          name: "temperature",
          type: "number",
          required: false,
          description: "Response creativity from 0.0 to 1.0 (default: 0.7)",
          default: 0.7,
        },
        {
          name: "max_tokens",
          type: "number",
          required: false,
          description: "Maximum response length (default: 1000)",
          default: 1000,
        },
        {
          name: "custom_prompt",
          type: "string",
          required: false,
          description: "Custom system prompt to guide the AI response",
        },
      ],
    },
    {
      id: "get_graph_data",
      method: "GET",
      path: "/v1/{chat_id}/get_graph_data",
      title: "Get Graph Data",
      description:
        "Retrieve the complete knowledge graph structure for visualization",
      category: "Data & Analytics",
      parameters: [
        {
          name: "format",
          type: "string",
          required: false,
          description:
            "Response format: 'cytoscape' or 'raw' (default: cytoscape)",
          default: "cytoscape",
        },
        {
          name: "include_properties",
          type: "boolean",
          required: false,
          description: "Include node and edge properties (default: true)",
          default: true,
        },
      ],
    },
    {
      id: "upload_file",
      method: "POST",
      path: "/v1/{chat_id}/upload_file",
      title: "Upload Document",
      description: "Upload and process documents to expand your knowledge base",
      category: "File Management",
      parameters: [
        {
          name: "file",
          type: "file",
          required: true,
          description: "Document file (PDF, TXT, DOCX, up to 50MB)",
        },
        {
          name: "extract_entities",
          type: "boolean",
          required: false,
          description:
            "Extract named entities during processing (default: true)",
          default: true,
        },
        {
          name: "chunk_size",
          type: "number",
          required: false,
          description: "Text chunk size for processing (default: 1000)",
          default: 1000,
        },
      ],
    },
    {
      id: "list_files",
      method: "GET",
      path: "/v1/{chat_id}/files",
      title: "List Files",
      description: "Get a list of all uploaded files in your knowledge base",
      category: "File Management",
      parameters: [
        {
          name: "page",
          type: "number",
          required: false,
          description: "Page number for pagination (default: 1)",
          default: 1,
        },
        {
          name: "limit",
          type: "number",
          required: false,
          description: "Number of files per page (default: 20)",
          default: 20,
        },
      ],
    },
    {
      id: "v1_upload_file",
      method: "POST",
      path: "/v1/me/chats/files/upload",
      title: "V1 Upload Single File",
      description:
        "Upload a single file to your permanent private subchat using OAuth authentication",
      category: "V1 File Management",
      parameters: [
        {
          name: "file",
          type: "file",
          required: true,
          description: "Document file (PDF, TXT, DOCX, up to 5MB)",
        },
        {
          name: "Authorization",
          type: "header",
          required: true,
          description: "Bearer {oauth_id_token}",
        },
        {
          name: "X-App-ID",
          type: "header",
          required: true,
          description: "Your registered app ID",
        },
      ],
    },
    {
      id: "v1_upload_bulk",
      method: "POST",
      path: "/v1/me/chats/files/upload-bulk",
      title: "V1 Bulk Upload Files",
      description:
        "Upload multiple files at once to your permanent private subchat (max 10 files)",
      category: "V1 File Management",
      parameters: [
        {
          name: "files",
          type: "file[]",
          required: true,
          description:
            "Array of document files (PDF, TXT, DOCX, up to 5MB each)",
        },
        {
          name: "Authorization",
          type: "header",
          required: true,
          description: "Bearer {oauth_id_token}",
        },
        {
          name: "X-App-ID",
          type: "header",
          required: true,
          description: "Your registered app ID",
        },
      ],
    },
    {
      id: "v1_list_files",
      method: "GET",
      path: "/v1/me/chats/files",
      title: "V1 List Files",
      description: "Get all files in your permanent private subchat",
      category: "V1 File Management",
      parameters: [
        {
          name: "Authorization",
          type: "header",
          required: true,
          description: "Bearer {oauth_id_token}",
        },
        {
          name: "X-App-ID",
          type: "header",
          required: true,
          description: "Your registered app ID",
        },
      ],
    },
    {
      id: "v1_delete_file",
      method: "DELETE",
      path: "/v1/me/chats/files/{file_id}",
      title: "V1 Delete File",
      description: "Delete a specific file from your permanent private subchat",
      category: "V1 File Management",
      parameters: [
        {
          name: "file_id",
          type: "path",
          required: true,
          description: "The ID of the file to delete",
        },
        {
          name: "Authorization",
          type: "header",
          required: true,
          description: "Bearer {oauth_id_token}",
        },
        {
          name: "X-App-ID",
          type: "header",
          required: true,
          description: "Your registered app ID",
        },
      ],
    },
    {
      id: "v1_user_profile",
      method: "GET",
      path: "/v1/me/profile",
      title: "V1 User Profile",
      description: "Get user profile and subchat information",
      category: "V1 Authentication",
      parameters: [
        {
          name: "Authorization",
          type: "header",
          required: true,
          description: "Bearer {oauth_id_token}",
        },
        {
          name: "X-App-ID",
          type: "header",
          required: true,
          description: "Your registered app ID",
        },
      ],
    },
  ];

  const codeExamples = {
    javascript: {
      answer_question: `const response = await fetch('https://api.trainlyai.com/v1/{chat_id}/answer_question', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    question: "What are the main concepts discussed in the uploaded documents?",
    selected_model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 1500
  })
});

const data = await response.json();
console.log('Answer:', data.answer);
console.log('Sources:', data.sources);`,
      get_graph_data: `const response = await fetch('https://api.trainlyai.com/v1/{chat_id}/get_graph_data', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const graphData = await response.json();
console.log('Nodes:', graphData.nodes.length);
console.log('Relationships:', graphData.relationships.length);`,
      upload_file: `const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('extract_entities', 'true');
formData.append('chunk_size', '1200');

const response = await fetch('https://api.trainlyai.com/v1/{chat_id}/upload_file', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const result = await response.json();
console.log('Upload successful:', result.file_id);`,
      list_files: `const response = await fetch('https://api.trainlyai.com/v1/{chat_id}/files?page=1&limit=10', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const data = await response.json();
console.log('Files:', data.files);
console.log('Total:', data.total);`,
      v1_upload_file: `const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('https://api.trainlyai.com/v1/me/chats/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_OAUTH_ID_TOKEN',
    'X-App-ID': 'your_app_id'
  },
  body: formData
});

const result = await response.json();
console.log('Upload successful:', result.success);
console.log('File ID:', result.file_id);`,
      v1_upload_bulk: `const formData = new FormData();
// Add multiple files
for (const file of fileInput.files) {
  formData.append('files', file);
}

const response = await fetch('https://api.trainlyai.com/v1/me/chats/files/upload-bulk', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_OAUTH_ID_TOKEN',
    'X-App-ID': 'your_app_id'
  },
  body: formData
});

const result = await response.json();
console.log('Bulk upload completed:', result.message);
console.log('Successful uploads:', result.successful_uploads);
console.log('Results:', result.results);`,
      v1_list_files: `const response = await fetch('https://api.trainlyai.com/v1/me/chats/files', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_OAUTH_ID_TOKEN',
    'X-App-ID': 'your_app_id'
  }
});

const result = await response.json();
console.log('Files:', result.files);
console.log('Total files:', result.total_files);`,
      v1_delete_file: `const response = await fetch('https://api.trainlyai.com/v1/me/chats/files/file_123', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_OAUTH_ID_TOKEN',
    'X-App-ID': 'your_app_id'
  }
});

const result = await response.json();
console.log('File deleted:', result.success);
console.log('Chunks deleted:', result.chunks_deleted);`,
      v1_user_profile: `const response = await fetch('https://api.trainlyai.com/v1/me/profile', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_OAUTH_ID_TOKEN',
    'X-App-ID': 'your_app_id'
  }
});

const result = await response.json();
console.log('User ID:', result.user_id);
console.log('Chat ID:', result.chat_id);`,
    },
    python: {
      answer_question: `import requests

response = requests.post(
    'https://api.trainlyai.com/v1/{chat_id}/answer_question',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    json={
        'question': 'What are the main concepts discussed in the uploaded documents?',
        'selected_model': 'gpt-4o-mini',
        'temperature': 0.7,
        'max_tokens': 1500
    }
)

data = response.json()
print('Answer:', data['answer'])
print('Sources:', data['sources'])`,
      get_graph_data: `import requests

response = requests.get(
    'https://api.trainlyai.com/v1/{chat_id}/get_graph_data',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY'
    }
)

graph_data = response.json()
print(f"Nodes: {len(graph_data['nodes'])}")
print(f"Relationships: {len(graph_data['relationships'])}")`,
      upload_file: `import requests

with open('document.pdf', 'rb') as file:
    files = {'file': file}
    data = {
        'extract_entities': 'true',
        'chunk_size': '1200'
    }

    response = requests.post(
        'https://api.trainlyai.com/v1/{chat_id}/upload_file',
        headers={
            'Authorization': 'Bearer YOUR_API_KEY'
        },
        files=files,
        data=data
    )

result = response.json()
print('Upload successful:', result['file_id'])`,
      list_files: `import requests

response = requests.get(
    'https://api.trainlyai.com/v1/{chat_id}/files',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    params={
        'page': 1,
        'limit': 10
    }
)

data = response.json()
print('Files:', data['files'])
print('Total:', data['total'])`,
    },
    curl: {
      answer_question: `curl -X POST "https://api.trainlyai.com/v1/{chat_id}/answer_question" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "question": "What are the main concepts discussed in the uploaded documents?",
    "selected_model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 1500
  }'`,
      get_graph_data: `curl -X GET "https://api.trainlyai.com/v1/{chat_id}/get_graph_data" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      upload_file: `curl -X POST "https://api.trainlyai.com/v1/{chat_id}/upload_file" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "extract_entities=true" \\
  -F "chunk_size=1200"`,
      list_files: `curl -X GET "https://api.trainlyai.com/v1/{chat_id}/files?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
  };

  const categories = Array.from(new Set(endpoints.map((e) => e.category)));

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-amber-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  API Documentation
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Build with the Trainly API
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://docs.trainlyai.com"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  Interactive Reference
                </a>
              </Button>
              <Button size="sm" asChild>
                <a
                  href="/sign-in?redirect_url=/dashboard/manage"
                  className="flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Get API Key
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-white mb-6">
            Build AI-powered applications
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto mb-8">
            The Trainly API gives you access to powerful knowledge graphs and AI
            capabilities. Query documents, extract insights, and build
            intelligent experiences.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
              <a href="#quickstart" className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Start
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://docs.trainlyai.com"
                target="_blank"
                className="flex items-center gap-2"
              >
                <Code className="w-5 h-5" />
                Try the API
              </a>
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                Natural Language Queries
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Ask questions in natural language and get intelligent responses
                powered by your knowledge base.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mb-6">
                <Database className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                Knowledge Graphs
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Access structured representations of your data with entities,
                relationships, and rich metadata.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                Document Processing
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Upload and process documents automatically with entity
                extraction and relationship mapping.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Section */}
        <div id="quickstart" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              Quick Start
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-300">
              Get up and running in under 5 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  Get your API key
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                  Generate your API key from your dashboard to authenticate
                  requests.
                </p>
                <Button variant="outline" asChild>
                  <a
                    href="/sign-in?redirect_url=/dashboard/manage"
                    className="flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Generate API Key
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  Make your first request
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                  Try the API with a simple question to your knowledge base.
                </p>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 text-sm font-mono">
                  <code className="text-zinc-800 dark:text-zinc-200">
                    curl -X POST
                    api.trainlyai.com/v1/your-chat-id/answer_question
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Reference Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              API Reference
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-300">
              Complete documentation for all endpoints
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="border border-zinc-200 dark:border-zinc-800 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Endpoints</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <div key={category}>
                        <div className="px-4 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                          {category}
                        </div>
                        {endpoints
                          .filter((e) => e.category === category)
                          .map((endpoint) => (
                            <button
                              key={endpoint.id}
                              onClick={() => setSelectedEndpoint(endpoint.id)}
                              className={cn(
                                "w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2",
                                selectedEndpoint === endpoint.id &&
                                  "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600",
                              )}
                            >
                              <Badge
                                variant={
                                  endpoint.method === "GET"
                                    ? "secondary"
                                    : "default"
                                }
                                className="text-xs"
                              >
                                {endpoint.method}
                              </Badge>
                              <span className="truncate">{endpoint.title}</span>
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {endpoints
                .filter((e) => e.id === selectedEndpoint)
                .map((endpoint) => (
                  <Card
                    key={endpoint.id}
                    className="border border-zinc-200 dark:border-zinc-800"
                  >
                    <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl flex items-center gap-3">
                            <Badge
                              variant={
                                endpoint.method === "GET"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {endpoint.method}
                            </Badge>
                            {endpoint.title}
                          </CardTitle>
                          <p className="text-zinc-600 dark:text-zinc-300 mt-2">
                            {endpoint.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg font-mono text-sm">
                        <code className="text-zinc-800 dark:text-zinc-200">
                          {endpoint.method} https://api.trainlyai.com
                          {endpoint.path}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={() =>
                            copyToClipboard(
                              `${endpoint.method} https://api.trainlyai.com${endpoint.path}`,
                              "Endpoint",
                            )
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-8">
                        {/* Parameters */}
                        {endpoint.parameters.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                              Parameters
                            </h3>
                            <div className="space-y-4">
                              {endpoint.parameters.map((param, idx) => (
                                <div
                                  key={idx}
                                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 rounded text-sm font-mono">
                                      {param.name}
                                    </code>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {param.type}
                                    </Badge>
                                    {param.required && (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        Required
                                      </Badge>
                                    )}
                                    {param.default && (
                                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Default: {param.default}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-zinc-600 dark:text-zinc-300 text-sm">
                                    {param.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Code Examples */}
                        <div>
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                            Code Examples
                          </h3>
                          <Tabs
                            value={selectedLanguage}
                            onValueChange={setSelectedLanguage}
                          >
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="javascript">
                                JavaScript
                              </TabsTrigger>
                              <TabsTrigger value="python">Python</TabsTrigger>
                              <TabsTrigger value="curl">cURL</TabsTrigger>
                            </TabsList>
                            {Object.entries(codeExamples).map(
                              ([lang, examples]) => (
                                <TabsContent
                                  key={lang}
                                  value={lang}
                                  className="mt-4"
                                >
                                  <div className="relative">
                                    <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed">
                                      <code>
                                        {
                                          examples[
                                            endpoint.id as keyof typeof examples
                                          ]
                                        }
                                      </code>
                                    </pre>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                                      onClick={() =>
                                        copyToClipboard(
                                          examples[
                                            endpoint.id as keyof typeof examples
                                          ],
                                          "Code example",
                                        )
                                      }
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TabsContent>
                              ),
                            )}
                          </Tabs>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>

        {/* Authentication & Rate Limits */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-600" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                All API requests require authentication using your API key in
                the Authorization header.
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 font-mono text-sm">
                <code className="text-zinc-800 dark:text-zinc-200">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Keep your API key secure and never expose it in client-side
                    code.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Rate Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    Requests per minute
                  </span>
                  <Badge variant="secondary">60</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    Requests per hour
                  </span>
                  <Badge variant="secondary">1,000</Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    File uploads per day
                  </span>
                  <Badge variant="secondary">100</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <Card className="border border-zinc-200 dark:border-zinc-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Need Help?</CardTitle>
            <p className="text-zinc-600 dark:text-zinc-300">
              Get support and connect with our community
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <a href="https://docs.trainlyai.com" target="_blank">
                  <Terminal className="w-5 h-5" />
                  <span>Interactive API</span>
                </a>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <a href="mailto:kavin11205@gmail.com">
                  <ExternalLink className="w-5 h-5" />
                  <span>Contact Support</span>
                </a>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2" asChild>
                <a href="/community">
                  <MessageSquare className="w-5 h-5" />
                  <span>Community</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
