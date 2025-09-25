# @trainly/react

**Dead simple RAG integration for React apps**

Go from `npm install` to working AI in under 5 minutes. No backend required, no complex setup, just install and use.

## 🚀 Quick Start

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
  appSecret?: string; // App secret from Trainly dashboard
  apiKey?: string; // Direct API key (alternative to appSecret)
  baseUrl?: string; // Custom API URL (defaults to trainly.com)
  userId?: string; // Your app's user ID
  userEmail?: string; // Your app's user email
}
```

## 🔍 Examples

Check out the `/examples` folder for complete implementations:

- **Simple Chat App** - Drop-in components
- **Custom Implementation** - Build your own UI
- **Multi-user App** - User-specific workspaces
- **File-focused App** - Document analysis focus

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
