/**
 * TeachAI Chat API SDK
 *
 * Easy-to-use TypeScript/JavaScript SDK for integrating with TeachAI Chat APIs.
 * Handles authentication, rate limiting, and provides type-safe interfaces.
 *
 * Usage:
 * ```typescript
 * const client = new TeachAIClient({
 *   integrationKey: 'cik_your_integration_key',
 *   chatId: 'your_chat_id',
 *   baseUrl: 'https://api.teachai.com'
 * });
 *
 * const response = await client.query({
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface QueryRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface Citation {
  node_id: string;
  title: string;
  snippet: string;
  score?: number;
  source_uri?: string;
}

export interface QueryResponse {
  answer: string;
  citations: Citation[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  run_id: string;
  model: string;
}

export interface GraphNode {
  node_id: string;
  type: string;
  title: string;
  snippet: string;
  source_uri?: string;
  properties: Record<string, any>;
}

export interface GraphRelationship {
  rel_id: string;
  type: string;
  from_node: string;
  to_node: string;
  properties: Record<string, any>;
}

export interface GraphResponse {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  center_node?: string;
}

export interface TeachAIClientConfig {
  integrationKey: string;
  chatId: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  debug?: boolean;
}

export interface StreamEvent {
  type: 'context' | 'content' | 'end' | 'error';
  data: any;
}

export class TeachAIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'TeachAIError';
  }
}

export class TeachAIClient {
  private config: Required<TeachAIClientConfig>;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: TeachAIClientConfig) {
    this.config = {
      baseUrl: 'https://api.teachai.com',
      timeout: 30000,
      retryAttempts: 3,
      debug: false,
      ...config
    };
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // Check if current token is still valid (with 30s buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 30000) {
      return this.accessToken;
    }

    // Exchange integration key for new JWT token
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/tokens/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.integrationKey}`
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          requested_scopes: ['chat.query', 'graph.read']
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new TeachAIError(
          error.error || 'Token exchange failed',
          response.status,
          'TOKEN_EXCHANGE_FAILED'
        );
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

      if (this.config.debug) {
        console.log('TeachAI: Token refreshed successfully');
      }

      return this.accessToken;
    } catch (error) {
      if (error instanceof TeachAIError) throw error;
      throw new TeachAIError('Failed to exchange token', 500, 'NETWORK_ERROR');
    }
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new TeachAIError(
        error.error || `HTTP ${response.status}`,
        response.status,
        error.type || 'API_ERROR'
      );
    }

    return response.json();
  }

  /**
   * Query the chat with a message
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    if (this.config.debug) {
      console.log('TeachAI: Sending query', {
        messageCount: request.messages.length,
        model: request.model
      });
    }

    return this.request<QueryResponse>(`/v1/chats/${this.config.chatId}/query`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Stream a chat response
   */
  async queryStream(
    request: QueryRequest,
    onEvent: (event: StreamEvent) => void
  ): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.config.baseUrl}/v1/chats/${this.config.chatId}/query/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new TeachAIError(`Stream failed: ${response.status}`, response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new TeachAIError('Failed to get stream reader', 500);
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent(data);
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get specific nodes by IDs
   */
  async getNodes(nodeIds: string[]): Promise<GraphNode[]> {
    return this.request<GraphNode[]>(
      `/v1/chats/${this.config.chatId}/nodes?node_ids=${nodeIds.join(',')}`
    );
  }

  /**
   * Get the knowledge graph for the chat
   */
  async getGraph(options?: {
    centerNode?: string;
    hops?: number;
    limit?: number;
  }): Promise<GraphResponse> {
    const params = new URLSearchParams();
    if (options?.centerNode) params.set('center_node', options.centerNode);
    if (options?.hops) params.set('hops', options.hops.toString());
    if (options?.limit) params.set('limit', options.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<GraphResponse>(`/v1/chats/${this.config.chatId}/graph${query}`);
  }

  /**
   * Get chat information and statistics
   */
  async getChatInfo(): Promise<{
    chat_id: string;
    title: string;
    node_count: number;
    relationship_count: number;
    last_updated: string;
  }> {
    return this.request(`/v1/chats/${this.config.chatId}/info`);
  }

  /**
   * Helper method for simple question-answer
   */
  async ask(question: string, options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    const response = await this.query({
      messages: [{ role: 'user', content: question }],
      ...options
    });

    return response.answer;
  }

  /**
   * Helper method for streaming responses
   */
  async askStream(
    question: string,
    onContent: (content: string) => void,
    onComplete?: (fullAnswer: string) => void,
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<void> {
    let fullAnswer = '';

    await this.queryStream(
      {
        messages: [{ role: 'user', content: question }],
        stream: true,
        ...options
      },
      (event) => {
        if (event.type === 'content') {
          fullAnswer += event.data;
          onContent(event.data);
        } else if (event.type === 'end') {
          onComplete?.(fullAnswer);
        } else if (event.type === 'error') {
          throw new TeachAIError(event.data, 500, 'STREAM_ERROR');
        }
      }
    );
  }
}

// ==============================================================================
// React Hooks for Easy Integration
// ==============================================================================

export function useTeachAI(config: TeachAIClientConfig) {
  const [client] = useState(() => new TeachAIClient(config));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = async (request: QueryRequest): Promise<QueryResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await client.query(request);
      return response;
    } catch (err) {
      const errorMessage = err instanceof TeachAIError ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const ask = async (question: string): Promise<string | null> => {
    const response = await query({
      messages: [{ role: 'user', content: question }]
    });
    return response?.answer || null;
  };

  return {
    client,
    loading,
    error,
    query,
    ask
  };
}

// ==============================================================================
// Utility Functions
// ==============================================================================

export function createIntegrationKey(chatId: string, scopes: string[] = ['chat.query']): Promise<{
  integration_key: string;
  chat_id: string;
  scopes: string[];
}> {
  // This would be called from your dashboard to create new integration keys
  // Implementation depends on your existing auth system
  throw new Error('Integration key creation must be done through the TeachAI dashboard');
}

export function validateConfig(config: TeachAIClientConfig): void {
  if (!config.integrationKey) {
    throw new TeachAIError('Integration key is required', 400, 'INVALID_CONFIG');
  }

  if (!config.chatId) {
    throw new TeachAIError('Chat ID is required', 400, 'INVALID_CONFIG');
  }

  if (config.integrationKey && !config.integrationKey.startsWith('cik_')) {
    throw new TeachAIError('Invalid integration key format', 400, 'INVALID_CONFIG');
  }
}

// For CommonJS compatibility
export default TeachAIClient;
