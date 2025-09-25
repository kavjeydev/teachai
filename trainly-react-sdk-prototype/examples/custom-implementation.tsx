// Example: Custom Implementation using useTrainly hook
// This shows how to build your own UI with the SDK

import React, { useState } from "react";
import { TrainlyProvider, useTrainly } from "@trainly/react";

function CustomChatComponent() {
  const { ask, upload, isLoading, error, clearError } = useTrainly();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = async () => {
    if (!question.trim()) return;

    try {
      const response = await ask(question);
      setAnswer(response);
      setQuestion("");
    } catch (err) {
      console.error("Failed to get answer:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await upload(file);
      alert("File uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Custom RAG App</h1>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-600">{error.message}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* File upload */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
        <input
          type="file"
          accept=".pdf,.doc,.txt"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Question input */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
        <div className="space-y-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to know about your documents?"
            disabled={isLoading}
            className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
          <button
            onClick={handleAsk}
            disabled={isLoading || !question.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Thinking..." : "Ask AI"}
          </button>
        </div>
      </div>

      {/* Answer display */}
      {answer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-800">Answer</h2>
          <p className="text-green-700 whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <TrainlyProvider appSecret="as_demo_secret_123">
      <div className="min-h-screen bg-gray-50 py-8">
        <CustomChatComponent />
      </div>
    </TrainlyProvider>
  );
}

export default App;
