// Simple test implementation to verify the concept works
"use client";

import React from "react";

interface TrainlyConfig {
  appSecret?: string;
  apiKey?: string;
  baseUrl?: string;
  userId?: string;
}

interface TrainlyContextValue {
  ask: (question: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

const TrainlyContext = React.createContext<TrainlyContextValue | undefined>(
  undefined,
);

export function TrainlyProvider({
  children,
  appSecret = "as_demo_secret_123",
  baseUrl = "http://localhost:8000",
  userId = "test_user",
}: {
  children: React.ReactNode;
  appSecret?: string;
  baseUrl?: string;
  userId?: string;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [scopedToken, setScopedToken] = React.useState<string | null>(null);

  // Auto-connect on mount
  React.useEffect(() => {
    connect();
  }, []);

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Provision user with backend
      const response = await fetch(
        `${baseUrl}/v1/privacy/apps/users/provision`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${appSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            end_user_id: userId,
            capabilities: ["ask", "upload"],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.statusText}`);
      }

      const data = await response.json();
      setScopedToken(data.scoped_token);
      console.log("✅ Connected to Trainly successfully!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Connection failed";
      setError(errorMsg);
      console.error("❌ Trainly connection failed:", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const ask = async (question: string): Promise<string> => {
    if (!scopedToken) {
      throw new Error("Not connected to Trainly");
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${baseUrl}/v1/privacy/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-scoped-token": scopedToken,
        },
        body: JSON.stringify({
          end_user_id: userId,
          question,
          include_citations: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.answer;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Query failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const value: TrainlyContextValue = {
    ask,
    isLoading,
    error,
  };

  return (
    <TrainlyContext.Provider value={value}>{children}</TrainlyContext.Provider>
  );
}

export function useTrainly(): TrainlyContextValue {
  const context = React.useContext(TrainlyContext);
  if (!context) {
    throw new Error("useTrainly must be used within TrainlyProvider");
  }
  return context;
}

// Simple test component
export function TrainlyTest() {
  const { ask, isLoading, error } = useTrainly();
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");

  const handleAsk = async () => {
    if (!question.trim()) return;

    try {
      const response = await ask(question);
      setAnswer(response);
      setQuestion("");
    } catch (err) {
      console.error("Ask failed:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Trainly Test</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      <div className="space-y-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full p-3 border rounded"
          disabled={isLoading}
        />
        <button
          onClick={handleAsk}
          disabled={isLoading || !question.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      {answer && (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h3 className="font-semibold text-green-800 mb-2">Answer:</h3>
          <p className="text-green-700">{answer}</p>
        </div>
      )}
    </div>
  );
}
