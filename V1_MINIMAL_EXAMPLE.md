# Trainly V1 - Minimal Usage Example

## Direct TrainlyClient Usage (No Provider)

```tsx
import { TrainlyClient } from "@trainly/react";
import { useAuth } from "@clerk/nextjs";

function MyComponent() {
  const { getToken } = useAuth();
  const [client, setClient] = useState(null);

  useEffect(() => {
    async function setup() {
      const trainlyClient = new TrainlyClient({
        appId: "your_app_id_from_console",
      });

      const idToken = await getToken();
      await trainlyClient.connectWithOAuthToken(idToken);
      setClient(trainlyClient);
    }
    setup();
  }, []);

  async function handleQuery() {
    const answer = await client.ask("What files do I have?");
    console.log(answer);
  }

  async function handleUpload(file) {
    const result = await client.upload(file);
    console.log(result);
  }

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      <button onClick={handleQuery}>Ask</button>
    </div>
  );
}
```

## With TrainlyProvider (Recommended)

```tsx
import { TrainlyProvider, useTrainly } from "@trainly/react";
import { useAuth } from "@clerk/nextjs";

function App() {
  return (
    <TrainlyProvider
      appId="app_v1_1759096418_13c95ffd"
      baseUrl="http://localhost:8000"
    >
      <MyComponent />
    </TrainlyProvider>
  );
}

function MyComponent() {
  const { getToken } = useAuth();
  const { connectWithOAuthToken, ask, upload } = useTrainly();

  useEffect(() => {
    async function setup() {
      const idToken = await getToken();
      await connectWithOAuthToken(idToken);
    }
    setup();
  }, []);

  async function handleQuery() {
    const answer = await ask("What files do I have?");
    console.log(answer);
  }

  async function handleUpload(file) {
    const result = await upload(file);
    console.log(result);
  }

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      <button onClick={handleQuery}>Ask</button>
    </div>
  );
}
```

## Key Points

1. **User identity comes from OAuth token** - no userId/userEmail props needed
2. **Same user = same permanent subchat** automatically
3. **Developer never sees user files** - only AI responses
4. **Works with any OAuth provider** (Clerk, Auth0, Cognito, etc.)
