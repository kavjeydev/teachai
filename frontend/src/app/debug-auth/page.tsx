"use client";

import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export default function DebugAuthPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [rawToken, setRawToken] = useState<string>("");

  useEffect(() => {
    if (isLoaded && user) {
      getToken().then((token) => {
        if (token) {
          setRawToken(token);
          // Decode JWT to see issuer
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              setTokenInfo(payload);
            }
          } catch (e) {
            console.error("Failed to decode token:", e);
          }
        }
      });
    }
  }, [isLoaded, user, getToken]);

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Auth Debug - Not Signed In</h1>
        <p>Please sign in to debug authentication.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Authentication Debug Info</h1>

      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
            <p>
              <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>

        {/* JWT Token Info */}
        {tokenInfo && (
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
              🎯 JWT Token Info (THIS IS WHAT YOU NEED)
            </h2>
            <div className="space-y-3">
              <div className="bg-white dark:bg-zinc-900 rounded p-4">
                <p className="text-xs text-zinc-500 mb-2">Issuer (iss)</p>
                <p className="font-mono text-lg font-bold text-green-600 dark:text-green-400 break-all">
                  {tokenInfo.iss}
                </p>
              </div>

              <div
                className={`rounded p-4 ${
                  tokenInfo.aud === "convex"
                    ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-500"
                    : "bg-red-50 dark:bg-red-950/30 border-2 border-red-500"
                }`}
              >
                <p className="text-xs text-zinc-500 mb-2">Audience (aud)</p>
                <p
                  className={`font-mono text-lg font-bold break-all ${
                    tokenInfo.aud === "convex"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tokenInfo.aud || "❌ NOT SET"}
                </p>
                {tokenInfo.aud !== "convex" && (
                  <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/50 rounded">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                      ⚠️ THIS IS YOUR PROBLEM!
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      The audience must be "convex". You need to configure your
                      Clerk JWT template. See CLERK_JWT_TEMPLATE_FIX.md for
                      instructions.
                    </p>
                  </div>
                )}
                {tokenInfo.aud === "convex" && (
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    ✅ Audience is correct!
                  </p>
                )}
              </div>

              {tokenInfo.aud === "convex" && tokenInfo.iss && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 mt-4">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    📝 Update auth.config.js:
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                    Update your{" "}
                    <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">
                      frontend/convex/auth.config.js
                    </code>{" "}
                    with:
                  </p>
                  <pre className="bg-white dark:bg-zinc-900 p-4 rounded font-mono text-sm overflow-x-auto border">
                    {`export default {
  providers: [
    {
      domain: "${tokenInfo.iss}",
      applicationID: "convex",
    },
  ],
};`}
                  </pre>
                </div>
              )}

              {tokenInfo.aud !== "convex" && (
                <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-lg p-4 mt-4">
                  <p className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    🚨 URGENT: Fix Clerk JWT Template
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    Your JWT token doesn't have the correct audience claim.
                    Follow these steps:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-red-800 dark:text-red-200">
                    <li>Go to Clerk Dashboard → JWT Templates</li>
                    <li>Create or edit a template for Convex</li>
                    <li>
                      Add:{" "}
                      <code className="bg-red-200 dark:bg-red-800 px-2 py-1 rounded">
                        "aud": "convex"
                      </code>
                    </li>
                    <li>Set it as the default template in Sessions settings</li>
                    <li>Sign out and sign in again</li>
                  </ol>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-3">
                    📄 See <code>CLERK_JWT_TEMPLATE_FIX.md</code> in the project
                    root for detailed instructions.
                  </p>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                  View Full Token Payload
                </summary>
                <pre className="mt-2 bg-zinc-100 dark:bg-zinc-800 p-4 rounded text-xs overflow-x-auto">
                  {JSON.stringify(tokenInfo, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* Current Config */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">
            Current Convex Auth Config
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
            Located at:{" "}
            <code className="text-xs">frontend/convex/auth.config.js</code>
          </p>
          <pre className="bg-white dark:bg-zinc-800 p-4 rounded font-mono text-sm overflow-x-auto border">
            {`export default {
  providers: [
    {
      domain: "https://clerk.trainlyai.com",
      applicationID: "convex",
    },
  ],
};`}
          </pre>
        </div>

        {/* Instructions */}
        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <h2 className="text-xl font-semibold mb-4 text-green-900 dark:text-green-100">
            📝 Fix Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-green-800 dark:text-green-200">
            <li>Copy the "Issuer (iss)" value shown above</li>
            <li>
              Open{" "}
              <code className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded">
                frontend/convex/auth.config.js
              </code>
            </li>
            <li>
              Replace the{" "}
              <code className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded">
                domain
              </code>{" "}
              value with the issuer
            </li>
            <li>
              Run{" "}
              <code className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded">
                npx convex dev
              </code>{" "}
              (for dev) or push to production
            </li>
            <li>Clear your browser cache and cookies</li>
            <li>Sign in again</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
