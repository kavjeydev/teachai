# 🚀 Complete Next.js + Trainly Setup Guide

## Overview

This guide shows you how to build a Next.js application that uses Trainly as your RAG (Retrieval-Augmented Generation) backend with secure user authentication. You'll learn two approaches: **Hybrid OAuth** (shared knowledge + private data) and **Direct API integration**.

## 🏗️ Architecture Options

### Option 1: Hybrid OAuth (Recommended for Multi-User Apps)

- **Developer uploads shared knowledge base** (textbooks, guides, references)
- **Each user gets private workspace** that can access shared knowledge + their own docs
- **Complete privacy protection** (users can't see each other's private files)
- **Hybrid knowledge access** (shared foundation + personal content)
- **Perfect for:** Education, Legal, Business apps where users need shared + private knowledge

### Option 2: Direct API Integration (For Single-User or Internal Apps)

- Direct API key authentication to one specific chat
- Full access to that chat's functionality
- Simpler setup, good for prototypes or internal tools
- **Perfect for:** Personal apps, internal tools, shared team knowledge bases

---

## 🚀 Quick Start - Next.js Setup

### 1. Create a New Next.js App

```bash
npx create-next-app@latest my-trainly-app
cd my-trainly-app

# Install required dependencies
npm install axios react-dropzone lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Environment Variables

Create `.env.local`:

```env
# For Hybrid OAuth (multi-user apps)
NEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000
TRAINLY_APP_SECRET=as_demo_secret_123
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For direct API integration (single-user apps)
NEXT_PUBLIC_TRAINLY_CHAT_ID=your_chat_id_from_url
TRAINLY_API_KEY=tk_your_api_key_from_settings

# Your own JWT secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=49fea1efff81f16a2e6992a9d6da6c435dfe29cc13957af660ea2f553a03dc48
```

---

## 🔐 Option 1: Hybrid OAuth Setup (Shared Knowledge + Private Data)

### Step 1: Set up Your Own Authentication

```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

**`src/app/layout.tsx`**:

```tsx
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

**`src/contexts/AuthContext.tsx`**:

```tsx
"use client";

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
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    localStorage.setItem("auth_token", data.token);
    setUser(data.user);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    localStorage.setItem("auth_token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
}
```

### Step 2: Create Trainly Privacy-First Integration Hook

**`src/hooks/useTrainlyHybrid.ts`**:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface TrainlyConfig {
  appSecret: string; // Your app's secret (one per app concept)
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    snippet: string;
    score: number;
    source: string;
  }>;
}

export function useTrainlyHybrid(config: TrainlyConfig) {
  const { user } = useAuth();
  const [scopedToken, setScopedToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Connect user to Trainly (provisions private workspace + shared knowledge access)
  const connectToTrainly = async () => {
    if (!user) throw new Error("User not authenticated");

    setIsLoading(true);
    try {
      // Use the working privacy-first API
      const response = await fetch("/api/trainly/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          userId: user.id,
          capabilities: ["ask", "upload"],
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to connect to Trainly");
      }

      setScopedToken(data.scopedToken);
      setIsConnected(true);

      // Store token locally (expires in 15 minutes, refreshes automatically)
      localStorage.setItem(
        `trainly_token_${user.id}`,
        JSON.stringify({
          token: data.scopedToken,
          expiresAt: Date.now() + 14 * 60 * 1000,
        }),
      );

      return data;
    } catch (error) {
      console.error("Trainly connection failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing token on load
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`trainly_token_${user.id}`);
      if (stored) {
        const tokenData = JSON.parse(stored);
        if (tokenData.expiresAt > Date.now()) {
          setScopedToken(tokenData.token);
          setIsConnected(true);
        }
      }
    }
  }, [user]);

  // Query user's hybrid workspace (private docs + shared knowledge)
  const query = async (question: string): Promise<ChatMessage> => {
    if (!scopedToken || !user) throw new Error("Not connected to Trainly");

    const response = await fetch("/api/trainly/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        scopedToken,
        userId: user.id,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Query failed");
    }

    return {
      role: "assistant",
      content: data.answer,
      citations: data.citations || [],
    };
  };

  // Upload file to user's private workspace
  const uploadFile = async (file: File) => {
    if (!scopedToken || !user) throw new Error("Not connected to Trainly");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.id);
    formData.append("scopedToken", scopedToken);

    const response = await fetch("/api/trainly/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Upload failed");
    }

    return data;
  };

  return {
    isConnected,
    isLoading,
    connectToTrainly,
    query,
    uploadFile,
    disconnect: () => {
      setScopedToken(null);
      setIsConnected(false);
      if (user) {
        localStorage.removeItem(`trainly_token_${user.id}`);
      }
    },
  };
}
```

### Step 3: Create API Routes

First, create authentication routes for your own user system:

**`src/app/api/auth/register/route.ts`**:

```tsx
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// In production, use a proper database
const users = new Map();

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        {
          error: "Username, email, and password are required",
        },
        { status: 400 },
      );
    }

    // Check if user exists
    for (const [id, user] of users) {
      if (user.email === email) {
        return NextResponse.json(
          {
            error: "User with this email already exists",
          },
          { status: 400 },
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = Date.now().toString();
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.set(userId, user);

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, username },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" },
    );

    return NextResponse.json({
      success: true,
      user: { id: userId, username, email },
      token,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
```

**`src/app/api/auth/login/route.ts`**:

```tsx
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// In production, use a proper database
const users = new Map();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Find user
    let foundUser = null;
    for (const [id, user] of users) {
      if (user.email === email) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return NextResponse.json(
        {
          error: "Invalid credentials",
        },
        { status: 401 },
      );
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (!validPassword) {
      return NextResponse.json(
        {
          error: "Invalid credentials",
        },
        { status: 401 },
      );
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" },
    );

    return NextResponse.json({
      success: true,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
      },
      token,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
```

**`src/app/api/auth/me/route.ts`**:

```tsx
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        {
          error: "Access token required",
        },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid token",
      },
      { status: 403 },
    );
  }
}
```

Now create Trainly API routes using the working privacy-first system:

**`src/app/api/trainly/provision/route.ts`**:

```tsx
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, capabilities } = await req.json();

    // Provision user with Trainly using the working privacy-first API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_TRAINLY_API_URL}/v1/privacy/apps/users/provision`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TRAINLY_APP_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          end_user_id: userId,
          capabilities: capabilities || ["ask", "upload"],
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.detail || "Failed to provision user",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      scopedToken: data.scoped_token,
      isNewUser: data.is_new_user,
      privacyGuarantee: data.privacy_guarantee,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
```

**`src/app/api/trainly/query/route.ts`**:

```tsx
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question, scopedToken, userId } = await req.json();

    if (!scopedToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Scoped token required",
        },
        { status: 401 },
      );
    }

    // Query user's hybrid workspace (their private docs + shared knowledge base)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_TRAINLY_API_URL}/v1/privacy/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-scoped-token": scopedToken,
        },
        body: JSON.stringify({
          end_user_id: userId,
          question,
          include_citations: true, // Users can see their own citations
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.detail || "Query failed",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      answer: data.answer,
      citations: data.citations || [],
      privacyNote: data.privacy_note,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
```

**`src/app/api/trainly/upload/route.ts`**:

```tsx
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const scopedToken = formData.get("scopedToken") as string;

    if (!file || !userId || !scopedToken) {
      return NextResponse.json(
        {
          success: false,
          error: "File, userId, and scopedToken are required",
        },
        { status: 400 },
      );
    }

    // Get presigned upload URL for user's private workspace
    const uploadUrlResponse = await fetch(
      `${process.env.NEXT_PUBLIC_TRAINLY_API_URL}/v1/privacy/upload/presigned-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-scoped-token": scopedToken,
        },
        body: JSON.stringify({
          end_user_id: userId,
          filename: file.name,
          file_type: file.type,
        }),
      },
    );

    if (!uploadUrlResponse.ok) {
      const error = await uploadUrlResponse.json();
      return NextResponse.json(
        {
          success: false,
          error: error.detail || "Failed to get upload URL",
        },
        { status: 400 },
      );
    }

    const { upload_url } = await uploadUrlResponse.json();

    // Upload file directly to user's private workspace
    const fileBuffer = await file.arrayBuffer();
    const uploadResponse = await fetch(upload_url, {
      method: "PUT",
      body: fileBuffer,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload file",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded to your private workspace",
      filename: file.name,
      size: file.size,
      privacyNote:
        "File uploaded to your isolated workspace - other users cannot access it",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
```

### Step 4: Create UI Components

**`src/components/AuthForm.tsx`**:

```tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthForm() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isLogin ? "Sign In" : "Sign Up"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <p className="text-center mt-4 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
```

**`src/components/TrainlyChat.tsx`**:

```tsx
"use client";

import { useState } from "react";
import { useTrainly } from "@/hooks/useTrainly";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, MessageSquare, Shield } from "lucide-react";

interface TrainlyChatProps {
  appSecret: string;
}

export function TrainlyChat({ appSecret }: { appSecret: string }) {
  const { isConnected, isLoading, connectToTrainly, query, uploadFile } =
    useTrainlyHybrid({ appSecret });
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [querying, setQuerying] = useState(false);

  const handleConnect = async () => {
    try {
      await connectToTrainly(); // This will redirect to Trainly OAuth
    } catch (error) {
      alert("Failed to initiate Trainly connection. Please try again.");
    }
  };

  const handleQuery = async () => {
    if (!question.trim()) return;

    setQuerying(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const response = await query(question);
      setMessages((prev) => [...prev, response]);
      setQuestion("");
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your question.",
        },
      ]);
    } finally {
      setQuerying(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadFile(file);
      alert("File uploaded successfully! It will be processed shortly.");
    } catch (error) {
      alert("Failed to upload file. Please try again.");
    }
  };

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Connect to Trainly AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 mb-4">
            Connect to access your private AI workspace with shared knowledge
            base. Your personal documents remain completely private.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-sm text-blue-800 mb-1">
              🔒 Hybrid Privacy Model
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Access to shared knowledge base (textbooks, guides)</li>
              <li>• Your own private workspace for personal documents</li>
              <li>• Other users cannot see your private files</li>
              <li>• Complete privacy control and data isolation</li>
            </ul>
          </div>
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Connecting..." : "Connect to AI Workspace ✨"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={handleFileUpload}
            className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-50 file:text-zinc-700 hover:file:bg-zinc-100"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Supported: PDF, DOC, DOCX, TXT, MD (max 10MB)
          </p>
        </CardContent>
      </Card>

      {/* Chat Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat with Your Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-zinc-50 ml-8"
                    : "bg-zinc-50 mr-8"
                }`}
              >
                <div className="font-semibold text-sm mb-1">
                  {message.role === "user" ? "You" : "AI Assistant"}
                </div>
                <div className="text-sm">{message.content}</div>
              </div>
            ))}
            {querying && (
              <div className="bg-zinc-50 mr-8 p-3 rounded-lg">
                <div className="font-semibold text-sm mb-1">AI Assistant</div>
                <div className="text-sm">Thinking...</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your documents..."
              onKeyPress={(e) => e.key === "Enter" && handleQuery()}
              disabled={querying}
            />
            <Button
              onClick={handleQuery}
              disabled={querying || !question.trim()}
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 6: Create Your Main Page

**`src/app/page.tsx`**:

```tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { TrainlyChat } from "@/components/TrainlyChat";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Trainly App</h1>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-600">
                  Welcome, {user.username}!
                </span>
                <Button variant="outline" onClick={logout} size="sm">
                  Sign Out
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Main Content */}
        {!user ? (
          <div className="space-y-8">
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold mb-4">
                Welcome to Your AI Document Assistant
              </h2>
              <p className="text-zinc-600 mb-8">
                Sign in to upload documents and chat with your personal AI
                assistant using Trainly's privacy-first architecture.
              </p>
              <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <h3 className="font-semibold text-blue-800 mb-2">
                  🔒 Privacy-First Features
                </h3>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• Your own secure authentication tokens</li>
                  <li>• Complete data isolation between users</li>
                  <li>• Developers can't access your raw files</li>
                  <li>• You control all data access</li>
                </ul>
              </div>
            </div>
            <AuthForm />
          </div>
        ) : (
          <TrainlyChat appSecret="as_demo_secret_123" />
        )}
      </div>
    </div>
  );
}
```

### Step 5: How to Get Your App Secret

You have three options for getting your app secret:

#### **Option A: Use Demo Secret (Immediate Testing)**

```env
TRAINLY_APP_SECRET=as_demo_secret_123
```

#### **Option B: Create Your Own App Secret**

1. **Start your TeachAI system:**

   ```bash
   # Start backend
   cd backend
   /Users/kavin_jey/Desktop/teachai/backend/myenv/bin/python read_files.py

   # Start frontend (new terminal)
   cd frontend
   npm run dev
   ```

2. **Create your knowledge base chat:**
   - Go to `http://localhost:3000`
   - Sign in and create a new chat
   - Upload your shared knowledge base (textbooks, guides, references)
   - This becomes the foundation that all users can access

3. **Register your app:**
   - Open browser console (F12) in TeachAI frontend
   - Run this code:

   ```javascript
   const result = await convex.mutation("app_management:createApp", {
     name: "My Document Assistant",
     description: "AI-powered document analysis with shared knowledge",
     websiteUrl: "http://localhost:3000",
   });

   console.log("🔑 Your App Secret:", result.appSecret);
   console.log("📱 Your App ID:", result.appId);
   ```

4. **Copy your app secret** and use it in your environment variables

#### **Option C: Manual App Creation**

If the browser console method doesn't work, you can create an app registration interface or contact the system administrator.

### Step 6: Complete Environment Setup

Your final `.env.local` should look like:

```env
# Trainly configuration
NEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000
TRAINLY_APP_SECRET=as_your_actual_secret_from_step_5
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Your app's JWT secret
JWT_SECRET=49fea1efff81f16a2e6992a9d6da6c435dfe29cc13957af660ea2f553a03dc48
```

## 🎯 **How the Hybrid Model Works**

### **Your Hybrid Architecture:**

```
Your App "StudyBuddy" (as_studybuddy_secret_123)
├── 📚 Shared Knowledge Base (Biology Textbooks Chat)
│   ├── textbook_chapter1.pdf
│   ├── study_guide_photosynthesis.pdf
│   └── reference_materials.pdf
│
├── 👤 Alice's Private Workspace
│   ├── my_biology_notes.pdf (private)
│   ├── my_lab_report.pdf (private)
│   └── ACCESS to shared textbooks ✨
│
├── 👤 Bob's Private Workspace
│   ├── my_study_cards.pdf (private)
│   ├── my_homework.pdf (private)
│   └── ACCESS to shared textbooks ✨
│
└── 👤 Carol's Private Workspace
    ├── my_research.pdf (private)
    ├── my_notes.pdf (private)
    └── ACCESS to shared textbooks ✨
```

### **How Users Experience This:**

**When Alice asks:** _"Explain photosynthesis"_

- ✅ **Searches:** Alice's notes + shared biology textbooks
- ✅ **Gets:** Comprehensive answer from both sources
- ✅ **Privacy:** Never sees Bob's or Carol's private notes

**When Bob asks:** _"What did I write about plant cells?"_

- ✅ **Searches:** Bob's notes + shared biology textbooks
- ✅ **Gets:** Answer from his notes + relevant textbook context
- ✅ **Privacy:** Never sees Alice's or Carol's private notes

### **Benefits of This Hybrid Model:**

1. **📚 Rich Knowledge Base** - Users get access to comprehensive shared resources
2. **🔒 Complete Privacy** - Personal documents remain completely isolated
3. **🎯 Better AI Responses** - More context = better answers
4. **💰 Cost Effective** - Share expensive knowledge base across all users
5. **🚀 Easy Setup** - Developer uploads shared content once

---

## 🔑 Option 2: Direct API Integration (Simpler Setup)

For simpler use cases, you can use direct API integration:

### Step 1: Create Direct API Hook

**`src/hooks/useTrainlyDirect.ts`**:

```tsx
"use client";

import { useState } from "react";

interface TrainlyDirectConfig {
  apiKey: string;
  chatId: string;
  baseUrl?: string;
}

export function useTrainlyDirect(config: TrainlyDirectConfig) {
  const [isLoading, setIsLoading] = useState(false);

  const query = async (question: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/trainly-direct/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          chatId: config.chatId,
          apiKey: config.apiKey,
        }),
      });

      const data = await response.json();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  return { query, isLoading };
}
```

### Step 2: Create Direct API Route

**`src/app/api/trainly-direct/query/route.ts`**:

```tsx
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question, chatId, apiKey } = await req.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_TRAINLY_API_URL}/v1/${chatId}/answer_question`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ question }),
      },
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
```

---

## 🎯 Production Considerations

### Security Best Practices

1. **Never expose API keys in client-side code**
2. **Use server-side API routes for sensitive operations**
3. **Implement proper error handling and rate limiting**
4. **Validate all user inputs**

### Performance Optimization

1. **Implement request caching where appropriate**
2. **Use streaming for long responses**
3. **Optimize file upload sizes**
4. **Implement proper loading states**

### Monitoring and Analytics

```tsx
// Add to your components for usage tracking
useEffect(() => {
  // Track user interactions
  analytics.track("trainly_query", {
    chatId: config.chatId,
    questionLength: question.length,
  });
}, []);
```

---

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add CLERK_SECRET_KEY
vercel env add TRAINLY_APP_SECRET
```

### Environment Variables for Production

```env
# Production values
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_TRAINLY_API_URL=https://api.trainly.com
TRAINLY_APP_SECRET=as_live_xxx
```

---

## 🎉 You're Done!

You now have a complete Next.js application with:

✅ **Secure user authentication** via Clerk
✅ **Privacy-first Trainly integration** with OAuth-style tokens
✅ **File upload** to user's private workspace
✅ **AI-powered chat** with user's documents
✅ **Complete data isolation** between users
✅ **Production-ready** setup

### Next Steps:

1. **Customize the UI** to match your brand
2. **Add more features** like chat history, file management
3. **Implement analytics** and monitoring
4. **Scale** with proper database integration
5. **Deploy** to production

Need help with any specific part? The Trainly API documentation at `/api-docs` has more detailed examples and integration patterns!
