"""
TeachAI Chat API Python SDK

Easy-to-use Python SDK for integrating with TeachAI Chat APIs.
Handles authentication, rate limiting, and provides clean interfaces.

Usage:
```python
from teachai_sdk import TeachAIClient

client = TeachAIClient(
    integration_key='cik_your_integration_key',
    chat_id='your_chat_id',
    base_url='https://api.teachai.com'
)

response = client.query([
    {'role': 'user', 'content': 'Hello!'}
])
print(response.answer)
```
"""

import httpx
import json
import time
from typing import List, Dict, Any, Optional, Iterator, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import asyncio
import logging

logger = logging.getLogger(__name__)

@dataclass
class ChatMessage:
    role: str  # 'user' or 'assistant'
    content: str

@dataclass
class Citation:
    node_id: str
    title: str
    snippet: str
    score: Optional[float] = None
    source_uri: Optional[str] = None

@dataclass
class Usage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

@dataclass
class QueryResponse:
    answer: str
    citations: List[Citation]
    usage: Usage
    run_id: str
    model: str

@dataclass
class GraphNode:
    node_id: str
    type: str
    title: str
    snippet: str
    source_uri: Optional[str]
    properties: Dict[str, Any]

@dataclass
class GraphRelationship:
    rel_id: str
    type: str
    from_node: str
    to_node: str
    properties: Dict[str, Any]

@dataclass
class GraphResponse:
    nodes: List[GraphNode]
    relationships: List[GraphRelationship]
    center_node: Optional[str] = None

class TeachAIError(Exception):
    """Custom exception for TeachAI API errors"""

    def __init__(self, message: str, status: Optional[int] = None, code: Optional[str] = None):
        super().__init__(message)
        self.status = status
        self.code = code

class TeachAIClient:
    """
    TeachAI Chat API Client

    Provides secure, authenticated access to individual chat APIs.
    """

    def __init__(
        self,
        integration_key: str,
        chat_id: str,
        base_url: str = "https://api.teachai.com",
        timeout: int = 30,
        retry_attempts: int = 3,
        debug: bool = False
    ):
        self.integration_key = integration_key
        self.chat_id = chat_id
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.retry_attempts = retry_attempts
        self.debug = debug

        self._access_token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None

        # Validate configuration
        self._validate_config()

    def _validate_config(self):
        """Validate client configuration"""
        if not self.integration_key:
            raise TeachAIError("Integration key is required", code="INVALID_CONFIG")

        if not self.chat_id:
            raise TeachAIError("Chat ID is required", code="INVALID_CONFIG")

        if not self.integration_key.startswith('cik_'):
            raise TeachAIError("Invalid integration key format", code="INVALID_CONFIG")

    async def _get_access_token(self) -> str:
        """Get a valid access token, refreshing if necessary"""
        # Check if current token is still valid (with 30s buffer)
        if (self._access_token and self._token_expiry and
            datetime.now() < self._token_expiry - timedelta(seconds=30)):
            return self._access_token

        # Exchange integration key for new JWT token
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/v1/tokens/exchange",
                    headers={
                        "Authorization": f"Bearer {self.integration_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "chat_id": self.chat_id,
                        "requested_scopes": ["chat.query", "graph.read"]
                    }
                )

                if response.status_code != 200:
                    error_data = response.json()
                    raise TeachAIError(
                        error_data.get("error", "Token exchange failed"),
                        response.status_code,
                        "TOKEN_EXCHANGE_FAILED"
                    )

                token_data = response.json()
                self._access_token = token_data["access_token"]
                self._token_expiry = datetime.now() + timedelta(seconds=token_data["expires_in"])

                if self.debug:
                    logger.info("TeachAI: Token refreshed successfully")

                return self._access_token

            except httpx.RequestError as e:
                raise TeachAIError(f"Network error during token exchange: {e}", code="NETWORK_ERROR")

    async def _request(self, endpoint: str, method: str = "GET", **kwargs) -> Dict[str, Any]:
        """Make an authenticated API request with retry logic"""
        token = await self._get_access_token()

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            **kwargs.pop("headers", {})
        }

        for attempt in range(self.retry_attempts):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.request(
                        method,
                        f"{self.base_url}{endpoint}",
                        headers=headers,
                        **kwargs
                    )

                    if response.status_code == 429:  # Rate limited
                        retry_after = int(response.headers.get("retry-after", "60"))
                        if attempt < self.retry_attempts - 1:
                            if self.debug:
                                logger.info(f"Rate limited, retrying after {retry_after}s")
                            await asyncio.sleep(retry_after)
                            continue

                    if not response.is_success:
                        error_data = response.json()
                        raise TeachAIError(
                            error_data.get("error", f"HTTP {response.status_code}"),
                            response.status_code,
                            error_data.get("type", "API_ERROR")
                        )

                    return response.json()

            except httpx.RequestError as e:
                if attempt == self.retry_attempts - 1:
                    raise TeachAIError(f"Network error: {e}", code="NETWORK_ERROR")

                if self.debug:
                    logger.info(f"Request failed (attempt {attempt + 1}), retrying...")
                await asyncio.sleep(2 ** attempt)  # Exponential backoff

        raise TeachAIError("Max retry attempts exceeded", code="MAX_RETRIES")

    # Synchronous wrapper methods
    def _sync_request(self, endpoint: str, method: str = "GET", **kwargs) -> Dict[str, Any]:
        """Synchronous wrapper for async requests"""
        return asyncio.run(self._request(endpoint, method, **kwargs))

    async def query_async(self, messages: List[Dict[str, str]], **options) -> QueryResponse:
        """Query the chat asynchronously"""
        request_data = {
            "messages": messages,
            **options
        }

        if self.debug:
            logger.info(f"TeachAI: Sending query with {len(messages)} messages")

        response_data = await self._request(
            f"/v1/chats/{self.chat_id}/query",
            method="POST",
            json=request_data
        )

        return QueryResponse(
            answer=response_data["answer"],
            citations=[Citation(**c) for c in response_data["citations"]],
            usage=Usage(**response_data["usage"]),
            run_id=response_data["run_id"],
            model=response_data["model"]
        )

    def query(self, messages: List[Dict[str, str]], **options) -> QueryResponse:
        """Query the chat synchronously"""
        return asyncio.run(self.query_async(messages, **options))

    async def query_stream_async(
        self,
        messages: List[Dict[str, str]],
        on_content: Callable[[str], None],
        on_complete: Optional[Callable[[str], None]] = None,
        **options
    ):
        """Stream a chat response asynchronously"""
        token = await self._get_access_token()

        request_data = {
            "messages": messages,
            "stream": True,
            **options
        }

        full_answer = ""

        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/v1/chats/{self.chat_id}/query/stream",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json=request_data
            ) as response:

                if response.status_code != 200:
                    raise TeachAIError(f"Stream failed: {response.status_code}", response.status_code)

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if data.get("type") == "content":
                                content = data.get("data", "")
                                full_answer += content
                                on_content(content)
                            elif data.get("type") == "end":
                                if on_complete:
                                    on_complete(full_answer)
                                break
                            elif data.get("type") == "error":
                                raise TeachAIError(data.get("data", "Stream error"))
                        except json.JSONDecodeError:
                            continue

    def query_stream(
        self,
        messages: List[Dict[str, str]],
        on_content: Callable[[str], None],
        on_complete: Optional[Callable[[str], None]] = None,
        **options
    ):
        """Stream a chat response synchronously"""
        asyncio.run(self.query_stream_async(messages, on_content, on_complete, **options))

    async def get_nodes_async(self, node_ids: List[str]) -> List[GraphNode]:
        """Get specific nodes by IDs asynchronously"""
        response_data = await self._request(
            f"/v1/chats/{self.chat_id}/nodes",
            params={"node_ids": ",".join(node_ids)}
        )

        return [GraphNode(**node) for node in response_data]

    def get_nodes(self, node_ids: List[str]) -> List[GraphNode]:
        """Get specific nodes by IDs synchronously"""
        return asyncio.run(self.get_nodes_async(node_ids))

    async def get_graph_async(
        self,
        center_node: Optional[str] = None,
        hops: int = 1,
        limit: int = 100
    ) -> GraphResponse:
        """Get the knowledge graph asynchronously"""
        params = {}
        if center_node:
            params["center_node"] = center_node
        if hops != 1:
            params["hops"] = hops
        if limit != 100:
            params["limit"] = limit

        response_data = await self._request(
            f"/v1/chats/{self.chat_id}/graph",
            params=params
        )

        return GraphResponse(
            nodes=[GraphNode(**node) for node in response_data["nodes"]],
            relationships=[GraphRelationship(**rel) for rel in response_data["relationships"]],
            center_node=response_data.get("center_node")
        )

    def get_graph(
        self,
        center_node: Optional[str] = None,
        hops: int = 1,
        limit: int = 100
    ) -> GraphResponse:
        """Get the knowledge graph synchronously"""
        return asyncio.run(self.get_graph_async(center_node, hops, limit))

    # Convenience methods
    def ask(self, question: str, **options) -> str:
        """Simple question-answer interface"""
        response = self.query([{"role": "user", "content": question}], **options)
        return response.answer

    def ask_stream(
        self,
        question: str,
        on_content: Callable[[str], None],
        on_complete: Optional[Callable[[str], None]] = None,
        **options
    ):
        """Simple streaming question-answer interface"""
        self.query_stream(
            [{"role": "user", "content": question}],
            on_content,
            on_complete,
            **options
        )

# ==============================================================================
# Example Usage and Testing
# ==============================================================================

def example_usage():
    """Example of how to use the TeachAI SDK"""

    # Initialize client
    client = TeachAIClient(
        integration_key="cik_your_key_here",
        chat_id="your_chat_id",
        base_url="https://api.teachai.com",
        debug=True
    )

    # Simple question
    answer = client.ask("What is the main topic of this chat?")
    print(f"Answer: {answer}")

    # Detailed query
    response = client.query([
        {"role": "user", "content": "Summarize the key points"}
    ], model="gpt-4o", temperature=0.3)

    print(f"Answer: {response.answer}")
    print(f"Citations: {len(response.citations)}")
    print(f"Tokens used: {response.usage.total_tokens}")

    # Streaming response
    def on_content(content: str):
        print(content, end="", flush=True)

    def on_complete(full_answer: str):
        print(f"\n\nFull answer: {len(full_answer)} characters")

    client.ask_stream(
        "Explain this in detail",
        on_content=on_content,
        on_complete=on_complete
    )

    # Get graph data
    graph = client.get_graph(hops=2, limit=50)
    print(f"Graph: {len(graph.nodes)} nodes, {len(graph.relationships)} relationships")

if __name__ == "__main__":
    # Run example (replace with actual keys)
    # example_usage()
    pass
