"use client";

import React, { useState } from "react";

export function TrainlyTest() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState("");

  const testConnection = async () => {
    setLoading(true);
    setConnectionInfo("Testing connection...");

    try {
      // Test 1: Health check
      const healthResponse = await fetch(
        "http://localhost:8000/v1/privacy/health",
      );
      const healthData = await healthResponse.json();
      setConnectionInfo(`✅ Backend healthy: ${healthData.status}`);
    } catch (error) {
      setConnectionInfo(`❌ Backend connection failed: ${error.message}`);
      setLoading(false);
      return;
    }

    try {
      // Test 2: Direct API call with working API key
      const response = await fetch(
        "http://localhost:8000/v1/jd73cnrkqwm5d2rqbe5r2xzbad7r0jta/answer_question",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer tk_mftuhnj7_496mba00cas",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question || "Hello, who are you?",
            selected_model: "gpt-4o-mini",
            temperature: 0.7,
          }),
        },
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (data.answer) {
        setAnswer(data.answer);
        setConnectionInfo("✅ API call successful!");
      } else if (data.detail) {
        setAnswer(`API Error: ${data.detail}`);
        setConnectionInfo("⚠️ API responded with error");
      } else {
        setAnswer(`Unexpected response: ${JSON.stringify(data)}`);
        setConnectionInfo("⚠️ Unexpected response format");
      }
    } catch (error) {
      setAnswer(`Network error: ${error.message}`);
      setConnectionInfo("❌ Network request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">
          🧪 Trainly API Test
        </h1>
        <p className="text-blue-700">
          Testing direct connection to Trainly backend to verify npm package
          concept
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Connection Status:</h3>
        <p
          className={`text-sm ${connectionInfo.includes("✅") ? "text-green-600" : connectionInfo.includes("❌") ? "text-red-600" : "text-yellow-600"}`}
        >
          {connectionInfo || "Not tested yet"}
        </p>
      </div>

      {/* Test Form */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold">Test API Call:</h3>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question (or leave empty for default test)"
          className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={testConnection}
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Testing..." : "Test Trainly API"}
        </button>
      </div>

      {/* Response */}
      {answer && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-2">API Response:</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <pre className="whitespace-pre-wrap">{answer}</pre>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="bg-gray-50 border rounded-lg p-4 text-xs">
        <h4 className="font-semibold mb-2">Debug Info:</h4>
        <div className="space-y-1 text-gray-600">
          <p>
            <strong>Backend:</strong> http://localhost:8000
          </p>
          <p>
            <strong>Chat ID:</strong> jd73cnrkqwm5d2rqbe5r2xzbad7r0jta
          </p>
          <p>
            <strong>API Key:</strong> tk_mftuhnj7_496mba00cas
          </p>
          <p>
            <strong>Chat Title:</strong> "test chat for API"
          </p>
          <p>
            <strong>Model:</strong> gpt-4o (Rick and Morty prompt)
          </p>
        </div>
      </div>
    </div>
  );
}
