"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Code,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sanitizeUserInput, sanitizeApiKey } from "@/lib/sanitization";

interface ApiTesterProps {
  chatId?: string;
  defaultApiKey?: string;
}

export function ApiTester({ chatId, defaultApiKey }: ApiTesterProps) {
  const [apiKey, setApiKey] = useState(defaultApiKey || "");
  const [testChatId, setTestChatId] = useState(chatId || "");
  const [question, setQuestion] = useState("What is the main topic of this chat?");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    // Sanitize inputs
    const sanitizedApiKey = sanitizeApiKey(apiKey.trim());
    const sanitizedChatId = sanitizeUserInput(testChatId.trim(), 'chat-id', { maxLength: 50 });
    const sanitizedQuestion = sanitizeUserInput(question.trim(), 'test-question', { maxLength: 2000 });

    if (!sanitizedApiKey) {
      toast.error("Please enter a valid API key");
      return;
    }

    if (!sanitizedChatId) {
      toast.error("Please enter a valid chat ID");
      return;
    }

    if (!sanitizedQuestion) {
      toast.error("Please enter a valid question");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Auto-detect environment for API URL
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isLocal ? 'http://localhost:8000' : 'https://api.trainlyai.com';

      console.log(`🔧 Testing API at: ${apiBaseUrl} (local: ${isLocal})`);

      const response = await fetch(`${apiBaseUrl}/v1/${testChatId}/answer_question`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sanitizedApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: sanitizedQuestion,
          selected_model: model === "gpt-4o-mini" ? undefined : model, // Let API use chat defaults
          temperature: temperature === 0.7 ? undefined : temperature,   // Let API use chat defaults
          max_tokens: maxTokens === 1000 ? undefined : maxTokens        // Let API use chat defaults
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || `HTTP ${response.status}: ${response.statusText}`);
        toast.error("API test failed");
      } else {
        setResponse(data);
        toast.success("API test successful!");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      setError(errorMessage);
      toast.error("Failed to connect to API");
    } finally {
      setIsLoading(false);
    }
  };

  const [isCopying, setIsCopying] = useState(false);

  const copyResponse = async () => {
    if (response) {
      setIsCopying(true);
      try {
        await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
        toast.success("Response copied to clipboard");
      } catch (error) {
        toast.error("Failed to copy response");
      } finally {
        setTimeout(() => setIsCopying(false), 500); // Brief delay for visual feedback
      }
    }
  };

  const generateCurlCommand = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const apiBaseUrl = isLocal ? 'http://localhost:8000' : 'https://api.trainlyai.com';

    // Only include parameters that differ from defaults
    const bodyParams: any = { question };
    if (model !== "gpt-4o-mini") bodyParams.selected_model = model;
    if (temperature !== 0.7) bodyParams.temperature = temperature;
    if (maxTokens !== 1000) bodyParams.max_tokens = maxTokens;

    return `curl -X POST ${apiBaseUrl}/v1/${testChatId}/answer_question \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(bodyParams)}'`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            API Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="tk_your_api_key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="chatId">Chat ID</Label>
              <Input
                id="chatId"
                placeholder="your_chat_id"
                value={testChatId}
                onChange={(e) => setTestChatId(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min="1"
                max="4000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Test Button */}
          <Button
            onClick={testApi}
            disabled={isLoading || !apiKey.trim() || !testChatId.trim() || !question.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing API...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test API
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {(response || error) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {error ? (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    Error Response
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Success Response
                  </>
                )}
              </CardTitle>
              {response && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyResponse}
                  disabled={isCopying}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCopying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Response
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                      API Test Failed
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            ) : response ? (
              <div className="space-y-4">
                {/* Answer */}
                <div>
                  <Label className="text-sm font-semibold">Answer</Label>
                  <div className="mt-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
                      {response.answer}
                    </p>
                  </div>
                </div>

                {/* Citations */}
                {response.context && response.context.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">
                      Citations ({response.context.length})
                    </Label>
                    <div className="mt-1 space-y-2">
                      {response.context.slice(0, 3).map((citation: any, index: number) => (
                        <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {citation.chunk_id}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Score: {citation.score.toFixed(2)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {citation.chunk_text.substring(0, 200)}...
                          </p>
                        </div>
                      ))}
                      {response.context.length > 3 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          ... and {response.context.length - 3} more citations
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Usage Stats */}
                <div>
                  <Label className="text-sm font-semibold">Usage Statistics</Label>
                  <div className="mt-1 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {response.usage?.prompt_tokens || 0}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Prompt Tokens
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {response.usage?.completion_tokens || 0}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Response Tokens
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {response.usage?.total_tokens || 0}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Total Tokens
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw Response */}
                <div>
                  <Label className="text-sm font-semibold">Raw JSON Response</Label>
                  <div className="mt-1 bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
                    <pre className="text-sm text-slate-300 overflow-x-auto">
                      <code>{JSON.stringify(response, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* cURL Command */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Equivalent cURL Command
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 relative">
            <pre className="text-sm text-green-400 overflow-x-auto">
              <code>{generateCurlCommand()}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-slate-400 hover:text-white"
              onClick={() => {
                navigator.clipboard.writeText(generateCurlCommand());
                toast.success("cURL command copied");
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
