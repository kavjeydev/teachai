"use client";

import React, { useState } from "react";

// Simple mock version to test the npm package concept
export function SimpleTrainlyTest() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);

    // Mock response for testing package concept
    setTimeout(() => {
      setAnswer(
        `Mock AI Response: You asked "${question}". This demonstrates that the npm package concept works! The package would normally call your backend API at localhost:8000, get a real AI response, and display it here. Once we fix the backend issue (sanitized_chat_id bug), this will work with real AI responses.`,
      );
      setQuestion("");
      setLoading(false);
    }, 1500); // Simulate API delay
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-green-900 mb-2">
          ✅ NPM Package Concept Test
        </h1>
        <p className="text-green-700">
          This demonstrates how the @trainly/react package would work once the
          backend is fixed
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold">Test the Package UX:</h3>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "AI is thinking..." : "Ask Trainly AI"}
        </button>
      </div>

      {answer && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">AI Response:</h3>
          <p className="text-blue-700">{answer}</p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">
          🔧 Implementation Status:
        </h4>
        <div className="space-y-2 text-sm text-yellow-700">
          <p>
            ✅ <strong>NPM Package Concept:</strong> Ready to go!
          </p>
          <p>
            ✅ <strong>React Components:</strong> Working (this UI)
          </p>
          <p>
            ✅ <strong>TypeScript Types:</strong> Implemented
          </p>
          <p>
            🔧 <strong>Backend API:</strong> Needs chat content or bug fix
          </p>
          <p>
            🔧 <strong>Package Imports:</strong> Fixed React import issues
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border rounded-lg p-4 text-xs">
        <h4 className="font-semibold mb-2">Next Steps:</h4>
        <div className="space-y-1 text-gray-600">
          <p>1. Fix backend API (sanitized_chat_id bug - ✅ DONE)</p>
          <p>2. Add content to test chat OR create working chat</p>
          <p>3. Test real API connection</p>
          <p>4. Fix npm package imports</p>
          <p>5. Publish v1.0.1 with working implementation</p>
        </div>
      </div>
    </div>
  );
}
