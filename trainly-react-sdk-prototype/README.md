# @trainly/react

**Dead simple RAG integration for React apps with V1 OAuth Authentication**

Go from `npm install` to working AI in under 5 minutes. Now supports direct OAuth integration with **permanent user subchats** and complete privacy protection.

## 🆕 **NEW: V1 Trusted Issuer Authentication**

Use your existing OAuth provider (Clerk, Auth0, Cognito) directly with Trainly! Users get permanent private workspaces, and developers never see raw files or queries.

### V1 Quick Start

#### 1. Install

```bash
npm install @trainly/react
```

#### 2. Register Your OAuth App (One-time)

```bash
curl -X POST "http://localhost:8000/v1/console/apps/register" \
  -H "X-Admin-Token: admin_dev_token_123" \
  -F "app_name=My App" \
  -F "issuer=https://clerk.myapp.com" \
  -F 'allowed_audiences=["my-clerk-frontend-api"]'
```

Save the `app_id` from the response!

#### 3. Setup with V1 (Clerk Example)

```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import { TrainlyProvider } from "@trainly/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClerkProvider>
          <TrainlyProvider appId="your_app_id_from_step_2">
            {children}
          </TrainlyProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

#### 4. Use with OAuth Authentication

```tsx
// Any component
import { useAuth } from "@clerk/nextjs";
import { useTrainly } from "@trainly/react";

function MyComponent() {
  const { getToken } = useAuth();
  const { ask, connectWithOAuthToken } = useTrainly();

  React.useEffect(() => {
    async function setupTrainly() {
      const idToken = await getToken();
      await connectWithOAuthToken(idToken);
    }
    setupTrainly();
  }, []);

  const handleClick = async () => {
    const answer = await ask("What files do I have?");
    console.log(answer); // AI response from user's permanent private subchat!
  };

  return <button onClick={handleClick}>Ask My AI</button>;
}
```

## 🔒 **V1 Benefits**

- ✅ **Permanent User Data**: Same user = same private subchat forever
- ✅ **Complete Privacy**: Developer never sees user files or queries
- ✅ **Any OAuth Provider**: Clerk, Auth0, Cognito, Firebase, custom OIDC
- ✅ **Zero Migration**: Works with your existing OAuth setup
- ✅ **Simple Integration**: Just add `appId` and use `connectWithOAuthToken()`

---

## 🚀 Original Quick Start (Legacy)

### 1. Install

```bash
npm install @trainly/react
```

### 2. Setup (2 lines)

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

### 3. Use anywhere (3 lines)

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

**That's it!** No auth setup, no API routes, no session management.

## 📦 What's Included

### Core Hook

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
import { TrainlyChat, TrainlyUpload, TrainlyStatus } from '@trainly/react';

// Drop-in chat interface
<TrainlyChat height="400px" showCitations={true} />

// Drop-in file upload
<TrainlyUpload accept=".pdf,.doc,.txt" />

// Connection status indicator
<TrainlyStatus />
```

## 🎯 Complete Example

```tsx
import { TrainlyProvider, TrainlyChat, TrainlyUpload } from "@trainly/react";

function App() {
  return (
    <TrainlyProvider appSecret="as_demo_secret_123">
      <div>
        <h1>My Document Assistant</h1>

        {/* File upload area */}
        <TrainlyUpload onUpload={(files) => console.log("Uploaded:", files)} />

        {/* Chat interface */}
        <TrainlyChat
          height="500px"
          placeholder="Ask about your documents..."
          showCitations={true}
        />
      </div>
    </TrainlyProvider>
  );
}
```

## 🔧 Configuration Options

### Authentication Modes

```tsx
// Mode 1: V1 Trusted Issuer (NEW - recommended for OAuth apps)
<TrainlyProvider appId="app_v1_12345" /> // Register via console API first

// Mode 2: App Secret (legacy - for multi-user apps)
<TrainlyProvider appSecret="as_secret_123" />

// Mode 3: With user context (legacy)
<TrainlyProvider
  appSecret="as_secret_123"
  userId="user_123"
  userEmail="user@example.com"
/>

// Mode 4: Direct API key (legacy - simple apps)
<TrainlyProvider apiKey="tk_chat_id_key" />
```

### V1 OAuth Provider Examples

```tsx
// With Clerk
<TrainlyProvider
  appId="app_v1_clerk_123"
  baseUrl="https://api.trainly.com"
/>

// With Auth0
<TrainlyProvider
  appId="app_v1_auth0_456"
  baseUrl="https://api.trainly.com"
/>

// With AWS Cognito
<TrainlyProvider
  appId="app_v1_cognito_789"
  baseUrl="https://api.trainly.com"
/>
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

## 🎨 Styling

Components use Tailwind classes by default but can be fully customized:

```tsx
<TrainlyChat
  className="my-custom-chat"
  height="400px"
/>

// Override with CSS
.my-custom-chat {
  border: 2px solid blue;
  border-radius: 12px;
}
```

## 📖 API Reference

### useTrainly()

The main hook for interacting with Trainly.

```tsx
const {
  // Core functions
  ask: (question: string) => Promise<string>,
  askWithCitations: (question: string) => Promise<{answer: string, citations: Citation[]}>,
  upload: (file: File) => Promise<UploadResult>,

  // NEW: V1 Authentication
  connectWithOAuthToken: (idToken: string) => Promise<void>,

  // State
  isLoading: boolean,
  isConnected: boolean,
  error: TrainlyError | null,

  // Advanced
  clearError: () => void,
  reconnect: () => Promise<void>,

  // For chat components
  messages: ChatMessage[],
  sendMessage: (content: string) => Promise<void>,
  clearMessages: () => void,
} = useTrainly();
```

### TrainlyProvider Props

```tsx
interface TrainlyProviderProps {
  children: React.ReactNode;
  appId?: string; // NEW: V1 app ID from console registration
  appSecret?: string; // Legacy: App secret from Trainly dashboard
  apiKey?: string; // Legacy: Direct API key (alternative to appSecret)
  baseUrl?: string; // Custom API URL (defaults to trainly.com)
  userId?: string; // Legacy: Your app's user ID
  userEmail?: string; // Legacy: Your app's user email
}
```

## 🔍 Examples

See complete implementation examples in the [API Documentation](https://trainly.com/docs/v1-authentication).

## 🆚 **V1 vs Legacy Comparison**

| Feature        | V1 Trusted Issuer                | Legacy App Secret         |
| -------------- | -------------------------------- | ------------------------- |
| **User Auth**  | Your OAuth provider              | Trainly OAuth flow        |
| **User Data**  | Permanent private subchat        | Temporary or shared       |
| **Privacy**    | Complete (dev can't see files)   | Limited                   |
| **Setup**      | Register once, use OAuth tokens  | Generate app secrets      |
| **Migration**  | Zero (uses existing OAuth)       | Requires auth integration |
| **Permanence** | Same user = same subchat forever | Depends on implementation |

**Recommendation**: Use V1 for new apps and consider migrating existing apps for better privacy and user experience.

## 🛠️ Development

```bash
# Clone the repo
git clone https://github.com/trainly/react-sdk.git
cd react-sdk

# Install dependencies
npm install

# Build the package
npm run build

# Watch mode for development
npm run dev
```

## 📝 License

MIT - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

## 🆘 Support

- 📖 [Documentation](https://trainly.com/docs/react-sdk)
- 💬 [Discord Community](https://discord.gg/trainly)
- 📧 [Email Support](mailto:support@trainly.com)
- 🐛 [Report Issues](https://github.com/trainly/react-sdk/issues)

---

**Made with ❤️ by the Trainly team**

_The simplest way to add AI to your React app_
