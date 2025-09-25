# 🚀 Dead Simple Trainly Integration for Next.js

## The Problem with Complex RAG Setup

Traditional RAG integrations are way too complex:

- ❌ **Hours of setup** (authentication, API routes, session management)
- ❌ **300+ lines of boilerplate code** (auth utilities, middleware, contexts)
- ❌ **Security vulnerabilities** (localStorage tokens, XSS attacks)
- ❌ **Poor developer experience** (manual token handling, no TypeScript support)

## ✅ The Solution: @trainly/react NPM Package

Now you can add RAG to your Next.js app in **under 5 minutes**:

- ✅ **npm install @trainly/react** (one command setup)
- ✅ **10 lines of code** (instead of 300+)
- ✅ **Built-in security** (httpOnly cookies, automatic session management)
- ✅ **TypeScript support** (full IntelliSense and type safety)
- ✅ **Pre-built components** (chat interface, file upload, status indicators)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install the Package

```bash
npm install @trainly/react
```

### Step 2: Set Up Provider (2 lines)

```tsx
// app/layout.tsx
import { TrainlyProvider } from "@trainly/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TrainlyProvider appSecret="as_your_app_secret">
          {children}
        </TrainlyProvider>
      </body>
    </html>
  );
}
```

### Step 3: Use Anywhere (3 lines)

```tsx
// Any component
import { useTrainly } from "@trainly/react";

function MyComponent() {
  const { ask } = useTrainly();

  const handleClick = async () => {
    const answer = await ask("What is photosynthesis?");
    console.log(answer); // Ready to use!
  };

  return <button onClick={handleClick}>Ask AI</button>;
}
```

**That's it!** You now have secure RAG integration with:

- ✅ Automatic authentication
- ✅ Built-in security (httpOnly cookies)
- ✅ TypeScript support
- ✅ Pre-built components

---

## 📦 What's Included

### Core Hook: `useTrainly()`

```tsx
const {
  ask, // (question: string) => Promise<string>
  upload, // (file: File) => Promise<void>
  isLoading, // boolean
  isConnected, // boolean
  error, // string | null
} = useTrainly();
```

### Pre-built Components

```tsx
import { TrainlyChat, TrainlyUpload, TrainlyStatus } from "@trainly/react";

// Drop-in chat interface
<TrainlyChat height="400px" showCitations={true} />

// Drop-in file upload
<TrainlyUpload accept=".pdf,.doc,.txt" />

// Connection status indicator
<TrainlyStatus />
```

---

## 🎯 Complete Example App

```tsx
import { TrainlyProvider, TrainlyChat, TrainlyUpload } from "@trainly/react";

function App() {
  return (
    <TrainlyProvider appSecret="as_demo_secret_123">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4">
          <h1 className="text-2xl font-bold">My Document Assistant</h1>
        </header>

        <main className="max-w-4xl mx-auto p-4 space-y-6">
          {/* File upload area */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
            <TrainlyUpload
              onUpload={(files) => console.log("Uploaded:", files)}
              onError={(error) => console.error("Upload error:", error)}
            />
          </div>

          {/* Chat interface */}
          <div className="bg-white rounded-lg shadow">
            <TrainlyChat
              height="500px"
              placeholder="Ask anything about your documents..."
              showCitations={true}
              enableFileUpload={true}
            />
          </div>
        </main>
      </div>
    </TrainlyProvider>
  );
}
```

---

## ⚙️ Configuration Options

### Authentication Modes

```tsx
// Mode 1: App Secret (recommended for multi-user apps)
<TrainlyProvider appSecret="as_secret_123" />

// Mode 2: With user context
<TrainlyProvider
  appSecret="as_secret_123"
  userId="user_123"
  userEmail="user@example.com"
/>

// Mode 3: Direct API key (simple apps)
<TrainlyProvider apiKey="tk_chat_id_key" />
```

### Component Customization

```tsx
<TrainlyChat
  height="600px"
  theme="dark"
  placeholder="Ask me anything..."
  showCitations={true}
  enableFileUpload={true}
  onMessage={(msg) => console.log(msg)}
  onError={(err) => console.error(err)}
/>

<TrainlyUpload
  variant="drag-drop" // or "button" or "minimal"
  accept=".pdf,.doc,.txt"
  maxSize="10MB"
  multiple={false}
  onUpload={(files) => console.log(files)}
/>
```

---

## 🔧 Environment Variables

Create `.env.local`:

```env
# Get your app secret from Trainly dashboard
TRAINLY_APP_SECRET=as_your_secret_here

# Optional: Custom API URL
NEXT_PUBLIC_TRAINLY_API_URL=https://api.trainly.com
```

---

## 💡 Advanced Usage

### Custom Implementation

If you want to build your own UI:

```tsx
import { useTrainly } from "@trainly/react";

function CustomChat() {
  const { ask, upload, isLoading, error } = useTrainly();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = async () => {
    try {
      const response = await ask(question);
      setAnswer(response);
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <div>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
      />
      <button onClick={handleAsk} disabled={isLoading}>
        {isLoading ? "Thinking..." : "Ask AI"}
      </button>
      {answer && <p>{answer}</p>}
    </div>
  );
}
```

### User-Specific Workspaces

```tsx
function UserSpecificChat({ user }) {
  return (
    <TrainlyProvider
      appSecret="as_secret_123"
      userId={user.id}
      userEmail={user.email}
    >
      {/* Each user gets their own private workspace */}
      <TrainlyChat
        placeholder={`Hi ${user.name}, ask about your documents...`}
      />
    </TrainlyProvider>
  );
}
```

---

## 🔒 Built-in Security Features

The `@trainly/react` package includes enterprise-grade security:

### ✅ **Automatic Session Management**

- **7-day sessions** by default (industry standard)
- **30-day "remember me"** option for longer access
- **Automatic token refresh** when < 1 day remains
- **No localStorage vulnerabilities** (httpOnly cookies)

### ✅ **XSS Protection**

- Tokens stored in **httpOnly cookies** (inaccessible to JavaScript)
- **SameSite=Strict** cookies prevent CSRF attacks
- **Secure flags** for HTTPS-only transmission in production

### ✅ **User Privacy**

- **Scoped authentication** - users only access their own data
- **Automatic provisioning** of isolated workspaces
- **Built-in error handling** and reconnection logic

---

## 📊 Before vs After Comparison

| Aspect              | Before (Manual Setup) | After (@trainly/react) |
| ------------------- | --------------------- | ---------------------- |
| **Setup Time**      | 2-3 hours             | **5 minutes**          |
| **Lines of Code**   | 300+ lines            | **10 lines**           |
| **Files to Create** | 8+ files              | **2 lines in layout**  |
| **Authentication**  | Manual JWT + cookies  | **Automatic**          |
| **Security**        | DIY implementation    | **Enterprise-grade**   |
| **TypeScript**      | Manual types          | **Full support**       |
| **Components**      | Build from scratch    | **Pre-built**          |
| **Maintenance**     | High (custom code)    | **Zero (npm updates)** |

---

## 🚀 Why This is Revolutionary

### For Developers

- **10x faster setup** - From hours to minutes
- **Production-ready** out of the box
- **Zero security concerns** - handled automatically
- **Great DX** - TypeScript, IntelliSense, examples

### For Users

- **Better security** - enterprise-grade authentication
- **Faster apps** - optimized package, no bloat
- **Consistent UX** - professional pre-built components

### For Trainly

- **Massive adoption** - removes biggest barrier to entry
- **Developer love** - easiest RAG solution on the market
- **Competitive advantage** - simpler than any alternative

---

## 🎯 Next Steps

1. **Install the package**: `npm install @trainly/react`
2. **Get your app secret** from Trainly dashboard
3. **Follow the 5-minute setup** above
4. **Customize** components to match your design
5. **Deploy** and enjoy RAG in production!

---

## 📚 Resources

- **Package**: https://www.npmjs.com/package/@trainly/react
- **Documentation**: https://trainly.com/docs/react-sdk
- **Examples**: https://github.com/trainly/react-sdk/examples
- **Support**: https://discord.gg/trainly

---

This package makes Trainly the **easiest RAG solution on the market**. What used to take hours now takes minutes, and what used to require hundreds of lines of code now takes just a few.

**Welcome to the future of RAG integration! 🚀**
