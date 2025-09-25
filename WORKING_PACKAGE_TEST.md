# 🧪 Working Package Test Plan

## Current Issues Identified

1. **✅ Backend Running**: localhost:8000 is responsive
2. **✅ API Keys Found**: We have working chat IDs and API keys
3. **❌ Demo App Secret**: `as_demo_secret_123` not in database
4. **❌ Package Errors**: React import issues in npm package
5. **❌ Chat Processing**: Chat endpoint returning errors

## 🎯 Immediate Test Strategy

Let's create a **minimal working version** to test the concept:

### Step 1: Create Simple Test Component (Local)

Instead of the complex npm package, let's create a simple React component that we can test locally in your existing frontend:

```tsx
// Add this to your frontend: src/components/TrainlyTest.tsx
"use client";

import React, { useState } from "react";

export function TrainlyTest() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    try {
      // Test direct API call
      const response = await fetch(
        "http://localhost:8000/v1/jd73cnrkqwm5d2rqbe5r2xzbad7r0jta/answer_question",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer tk_mftuhnj7_496mba00cas",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        },
      );

      const data = await response.json();

      if (data.answer) {
        setAnswer(data.answer);
      } else if (data.detail) {
        setAnswer(`Error: ${data.detail}`);
      } else {
        setAnswer("Unknown response format");
      }
    } catch (error) {
      setAnswer(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Trainly API Test</h1>

      <div className="space-y-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full p-3 border rounded"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Test API"}
        </button>
      </div>

      {answer && (
        <div className="bg-gray-50 border p-4 rounded">
          <h3 className="font-semibold mb-2">Response:</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Add to Your Frontend

Add this component to your existing frontend to test if the API connection works:

```tsx
// In any page, like src/app/test/page.tsx
import { TrainlyTest } from "@/components/TrainlyTest";

export default function TestPage() {
  return <TrainlyTest />;
}
```

### Step 3: Test the Connection

1. Make sure backend is running: `python read_files.py`
2. Visit `http://localhost:3000/test`
3. Try asking a simple question
4. See what response we get

## 🔧 Package Fix Strategy

Once we verify the API connection works:

1. **Fix React imports** in the npm package
2. **Use working API key** instead of demo app secret
3. **Simplify initial implementation** (just basic ask/answer)
4. **Test locally** before republishing
5. **Publish v1.0.1** with fixes

## 🎯 Debugging Steps

If the test component still fails:

1. **Check browser network tab** - see exact request/response
2. **Check backend logs** - see what error is happening
3. **Test with curl first** - isolate the issue
4. **Fix API issue** before worrying about package

This approach lets us **verify the concept works** before fixing all the npm package complexity!

Want me to create the test component in your frontend so we can verify the API connection works?
