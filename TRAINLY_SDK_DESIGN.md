# 📦 Trainly SDK - Dead Simple RAG Integration

## The Problem with Current Setup

❌ **Too Complex**: 50+ lines of auth code, API routes, session management
❌ **Too Much Boilerplate**: Manual token handling, cookie setup, middleware
❌ **Too Time Consuming**: Hours of setup before you can ask a single question

## ✅ The Solution: `@trainly/react` SDK

**Goal**: Go from `npm install` to working RAG in under 5 minutes.

---

## 🚀 Super Simple Usage

### 1. Install (1 command)

```bash
npm install @trainly/react
```

### 2. Configure (2 lines)

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

### 3. Use Anywhere (3 lines)

```tsx
// Any component
import { useTrainly } from "@trainly/react";

function MyComponent() {
  const { ask, upload, isLoading } = useTrainly();

  const handleQuestion = async () => {
    const answer = await ask("What is photosynthesis?");
    console.log(answer); // Ready to use!
  };

  return <button onClick={handleQuestion}>Ask AI</button>;
}
```

**That's it!** No auth setup, no API routes, no session management. Just install and use.

---

## 🎯 Complete SDK API Design

### Core Hook: `useTrainly()`

```tsx
import { useTrainly } from "@trainly/react";

function ChatComponent() {
  const {
    // Core functions
    ask, // (question: string) => Promise<string>
    upload, // (file: File) => Promise<void>

    // State
    isLoading, // boolean
    isConnected, // boolean
    error, // string | null

    // Advanced
    askWithCitations, // (question: string) => Promise<{answer: string, citations: Citation[]}>
    clearError, // () => void
    reconnect, // () => Promise<void>
  } = useTrainly();

  return (
    <div>
      <input type="file" onChange={(e) => upload(e.target.files[0])} />
      <button onClick={() => ask("Explain this document")} disabled={isLoading}>
        {isLoading ? "Thinking..." : "Ask AI"}
      </button>
    </div>
  );
}
```

### Pre-built Components

```tsx
import { TrainlyChat, TrainlyUpload, TrainlyStatus } from "@trainly/react";

function App() {
  return (
    <div>
      {/* Drop-in chat interface */}
      <TrainlyChat placeholder="Ask about your documents..." height="400px" />

      {/* Drop-in file upload */}
      <TrainlyUpload
        onUpload={(file) => console.log("Uploaded:", file.name)}
        accept=".pdf,.doc,.txt"
      />

      {/* Connection status */}
      <TrainlyStatus />
    </div>
  );
}
```

### Authentication Modes

```tsx
// Mode 1: Automatic (recommended)
<TrainlyProvider appSecret="as_secret_123">
  {/* SDK handles all auth automatically */}
</TrainlyProvider>

// Mode 2: With user context
<TrainlyProvider
  appSecret="as_secret_123"
  userId="user_123"  // Your app's user ID
  userEmail="user@example.com"
>
  {/* SDK creates scoped workspace for this user */}
</TrainlyProvider>

// Mode 3: Direct API key (simple apps)
<TrainlyProvider apiKey="tk_direct_key_123">
  {/* Direct connection to specific chat */}
</TrainlyProvider>
```

---

## 🛠️ Implementation Architecture

### SDK Structure

```
@trainly/react/
├── src/
│   ├── TrainlyProvider.tsx      # Context provider
│   ├── useTrainly.tsx           # Main hook
│   ├── components/
│   │   ├── TrainlyChat.tsx      # Pre-built chat
│   │   ├── TrainlyUpload.tsx    # Pre-built upload
│   │   └── TrainlyStatus.tsx    # Connection status
│   ├── auth/
│   │   ├── AutoAuth.ts          # Automatic auth handling
│   │   └── TokenManager.ts      # Token management
│   ├── api/
│   │   ├── TrainlyClient.ts     # API client
│   │   └── types.ts             # TypeScript types
│   └── index.ts                 # Main exports
├── package.json
└── README.md
```

### Auto-Authentication Flow

```typescript
// SDK handles this automatically behind the scenes
class AutoAuth {
  async authenticate(appSecret: string, userId?: string) {
    // 1. Check for existing session
    const existingToken = this.getStoredToken();
    if (existingToken && !this.isExpired(existingToken)) {
      return existingToken;
    }

    // 2. Create anonymous or scoped session
    const response = await fetch("/api/trainly/provision", {
      method: "POST",
      headers: { Authorization: `Bearer ${appSecret}` },
      body: JSON.stringify({
        end_user_id: userId || this.generateAnonymousId(),
        capabilities: ["ask", "upload"],
      }),
    });

    // 3. Store token securely
    const { scoped_token } = await response.json();
    this.storeToken(scoped_token);
    return scoped_token;
  }
}
```

---

## 📋 Setup Comparison

### Before (Current Complex Setup)

```
1. Install dependencies (5 packages)
2. Create auth utilities file (50+ lines)
3. Set up API routes (4 files, 100+ lines)
4. Configure middleware (20+ lines)
5. Create auth context (80+ lines)
6. Set up secure cookies
7. Handle token refresh
8. Create Trainly integration hook (60+ lines)
9. Handle errors and edge cases

Total: ~300 lines of code, 2-3 hours setup
```

### After (SDK Setup)

```
1. npm install @trainly/react
2. Add TrainlyProvider to layout
3. Use useTrainly() hook

Total: ~10 lines of code, 5 minutes setup
```

---

## 🎨 Pre-built Components Design

### TrainlyChat Component

```tsx
<TrainlyChat
  // Styling
  height="400px"
  theme="light" | "dark" | "auto"
  className="custom-chat"

  // Behavior
  placeholder="Ask me anything..."
  showCitations={true}
  enableFileUpload={true}

  // Events
  onMessage={(message) => console.log(message)}
  onError={(error) => console.error(error)}
/>
```

Renders a complete chat interface with:

- Message history
- Typing indicators
- File upload area
- Citation display
- Auto-scroll
- Responsive design

### TrainlyUpload Component

```tsx
<TrainlyUpload
  // Styling
  variant="drag-drop" | "button" | "minimal"

  // Constraints
  accept=".pdf,.doc,.txt"
  maxSize="10MB"
  multiple={false}

  // Events
  onUpload={(files) => console.log('Uploaded:', files)}
  onError={(error) => console.error(error)}
/>
```

### TrainlyStatus Component

```tsx
<TrainlyStatus showDetails={true} position="top-right" />
```

Shows connection status:

- ✅ Connected (3.2k documents)
- 🔄 Connecting...
- ❌ Connection failed
- ⚠️ Reconnecting...

---

## 🔧 Environment Variables (Minimal)

```bash
# .env.local (only 1-2 variables needed)
TRAINLY_APP_SECRET=as_your_secret_123

# Optional: for custom deployment
NEXT_PUBLIC_TRAINLY_API_URL=https://api.trainly.com  # defaults to trainly.com
```

---

## 📖 Documentation Structure

### 1. Quick Start (5 minutes)

- Install
- Basic setup
- First question

### 2. Guides (10 minutes each)

- File upload integration
- Chat interface
- User authentication
- Styling and theming

### 3. API Reference

- Hook documentation
- Component props
- TypeScript types
- Error handling

### 4. Examples

- Simple Q&A bot
- Document chat interface
- Multi-user app
- Custom styling

---

## 🚀 Development Roadmap

### Phase 1: Core SDK (Week 1)

- [x] Design API interface
- [ ] Implement TrainlyProvider
- [ ] Create useTrainly hook
- [ ] Auto-authentication system
- [ ] Basic error handling

### Phase 2: Components (Week 2)

- [ ] TrainlyChat component
- [ ] TrainlyUpload component
- [ ] TrainlyStatus component
- [ ] Styling and themes

### Phase 3: Polish (Week 3)

- [ ] TypeScript types
- [ ] Comprehensive testing
- [ ] Documentation site
- [ ] Example applications

### Phase 4: Publish

- [ ] NPM package publishing
- [ ] GitHub repository
- [ ] Documentation deployment
- [ ] Community examples

---

## 💡 Benefits of SDK Approach

### For Developers

- **5-minute setup** instead of hours
- **10 lines of code** instead of 300+
- **Zero boilerplate** - just use the hook
- **Production ready** out of the box
- **TypeScript support** with full intellisense

### For Trainly

- **Massive adoption** - removes biggest barrier
- **Better DX** - developers love simple tools
- **Fewer support tickets** - less setup complexity
- **Showcase** - clean examples for marketing
- **Ecosystem** - community builds on top

### For Users

- **Faster deployment** - apps ship sooner
- **More reliable** - tested SDK vs custom code
- **Better UX** - pre-built components look great
- **Consistent** - same patterns across all apps

---

## 🎯 Marketing Points

- **"From npm install to AI answers in under 5 minutes"**
- **"The simplest way to add RAG to your React app"**
- **"Just like adding any other npm package"**
- **"No backend required - works with any React app"**
- **"Production-ready components included"**

This SDK would make Trainly the **easiest RAG solution** on the market, similar to how Stripe made payments simple or how Auth0 made authentication simple.
