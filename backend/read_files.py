#!/home/kavinjey/.virtualenvs/myvenv/bin/python
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Header, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pypdf import PdfReader
import docx
from bs4 import BeautifulSoup
import io  # Import io for BytesIO
from mangum import Mangum
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Union
import openai
import numpy as np
from neo4j import GraphDatabase
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import asyncio
import httpx
import time
import logging

# Data Models
class ChunkScore(BaseModel):
    chunk_id: str
    chunk_text: str
    score: float

class AnswerWithContext(BaseModel):
    answer: str = ""
    context: List[ChunkScore] = []

class QuestionRequest(BaseModel):
    question: str
    chat_id: str
    selected_model: str = "gpt-4o-mini"  # Default model
    custom_prompt: Union[str, None] = None  # Optional custom system prompt
    temperature: Optional[float] = 0.7  # Default temperature
    max_tokens: Optional[int] = 1000  # Default max tokens

class CreateNodesAndEmbeddingsRequest(BaseModel):
    pdf_text: str
    pdf_id: str
    chat_id: str
    filename: str

# API Models for external access
class ApiQuestionRequest(BaseModel):
    question: str
    selected_model: Optional[str] = None  # Will use chat's saved model if not provided
    custom_prompt: Optional[str] = None   # Will use chat's saved prompt if not provided
    temperature: Optional[float] = None   # Will use chat's saved temperature if not provided
    max_tokens: Optional[int] = None      # Will use chat's saved max_tokens if not provided

class ApiAnswerResponse(BaseModel):
    answer: str
    context: List[ChunkScore]
    chat_id: str
    model: str
    usage: dict

app = FastAPI(
    title="TeachAI GraphRAG API",
    description="GraphRAG backend with secure Chat API access",
    version="1.0.0"
)
handler = Mangum(app)

# Configure CORS middleware (adjust origins as needed for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Simple rate limiting (in-memory)
request_counts = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 60  # requests per window

MAX_FILE_SIZE = 5 * 1024 * 1024

class ReadFiles:
    def __init__(self):
        self.supported_file_types = [
            ".pdf", ".docx", ".txt", ".md", ".ts", ".csv", ".json", ".html",
            ".xml", ".yaml", ".yml", ".js", ".py", ".java", ".cpp", ".c", ".h",
            ".cs", ".php", ".rb", ".sh", ".bat", ".ps1", ".psm1", ".psd1",
            ".ps1xml", ".pssc"
        ]
        # Map file extensions to their respective extraction methods
        self.extractors = {
            ".pdf": self.extract_text_from_pdf,
            ".docx": self.extract_text_from_docx,
            ".txt": self.extract_text_from_text,
            ".md": self.extract_text_from_text,
            ".ts": self.extract_text_from_text,
            ".csv": self.extract_text_from_text,
            ".json": self.extract_text_from_text,
            ".html": self.extract_text_from_html,
            ".xml": self.extract_text_from_text,
            ".yaml": self.extract_text_from_text,
            ".yml": self.extract_text_from_text,
            ".js": self.extract_text_from_text,
            ".py": self.extract_text_from_text,
            ".java": self.extract_text_from_text,
            ".cpp": self.extract_text_from_text,
            ".c": self.extract_text_from_text,
            ".h": self.extract_text_from_text,
            ".cs": self.extract_text_from_text,
            ".php": self.extract_text_from_text,
            ".rb": self.extract_text_from_text,
            ".sh": self.extract_text_from_text,
            ".bat": self.extract_text_from_text,
            ".ps1": self.extract_text_from_text,
            ".psm1": self.extract_text_from_text,
            ".psd1": self.extract_text_from_text,
            ".ps1xml": self.extract_text_from_text,
            ".pssc": self.extract_text_from_text,
        }

    def get_file_size(self, upload_file: UploadFile) -> int:
        current_pos = upload_file.file.tell()
        upload_file.file.seek(0, 2)   # Go to the end of the file
        size = upload_file.file.tell()
        upload_file.file.seek(current_pos)  # Go back to original position
        return size

    def extract_text_from_pdf(self, file: UploadFile):
        try:
            # file_size = self.get_file_size(file)
            # if file_size > MAX_FILE_SIZE:
            #     raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
            file.file.seek(0)
            reader = PdfReader(file.file)
            text = ""
            for page in reader.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text += extracted_text + "\n"
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing PDF file: {str(e)}")
        finally:
            file.file.close()

    def extract_text_from_docx(self, file: UploadFile):
        try:
            # if file.size() > MAX_FILE_SIZE:
            #     raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
            # Read the entire file into bytes
            file.file.seek(0)
            data = file.file.read()

            # Use BytesIO to create a file-like object
            doc = docx.Document(io.BytesIO(data))

            # Extract text from paragraphs
            text = "\n".join([para.text for para in doc.paragraphs])
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing DOCX file: {str(e)}")
        finally:
            file.file.close()

    def extract_text_from_html(self, file: UploadFile):
        try:
            # if file.size() > MAX_FILE_SIZE:
            #     raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
            file.file.seek(0)
            content = file.file.read().decode('utf-8', errors='ignore')
            soup = BeautifulSoup(content, "html.parser")
            text = soup.get_text(separator='\n')
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing HTML file: {str(e)}")
        finally:
            file.file.close()

    def extract_text_from_text(self, file: UploadFile):
        try:
            # if file.size() > MAX_FILE_SIZE:
            #     raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
            file.file.seek(0)
            # Attempt to detect encoding; default to utf-8
            content = file.file.read().decode('utf-8', errors='ignore')
            print("HERE", content)
            return content
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing text file: {str(e)}")
        finally:
            file.file.close()

    def extract_text(self, file: UploadFile):
        # Identify the file extension
        # if file.size() > MAX_FILE_SIZE:
        #         raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
        filename = file.filename.lower()
        matched_extension = None
        for ext in self.supported_file_types:
            if filename.endswith(ext):
                matched_extension = ext
                break

        if not matched_extension:
            raise HTTPException(status_code=400, detail="Unsupported file type.")

        extractor = self.extractors.get(matched_extension)
        if extractor:
            return extractor(file)
        else:
            raise HTTPException(status_code=400, detail=f"No extractor available for file type: {matched_extension}")

read_files = ReadFiles()

@app.post("/extract-pdf-text")
async def extract_text_endpoint(file: UploadFile = File(...)):
    """
    Endpoint to upload a file and extract its text based on the file type.
    """
    file_size = read_files.get_file_size(file)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    try:
        text = read_files.extract_text(file)
        return JSONResponse(content={"text": text})
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Load environment variables
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
neo4j_uri = os.getenv("NEO4J_URI")
neo4j_user = os.getenv("NEO4J_USER")
neo4j_password = os.getenv("NEO4J_PASSWORD")

# Automatically detect environment and set Convex URL
def get_convex_url():
    """
    Automatically detect if running locally or in production and return appropriate Convex URL
    """
    # Check if we're running locally
    is_local = (
        os.getenv("ENVIRONMENT") == "development" or
        os.getenv("NODE_ENV") == "development" or
        not os.getenv("RAILWAY_ENVIRONMENT") and  # Not on Railway
        not os.getenv("RENDER") and              # Not on Render
        not os.getenv("VERCEL") and              # Not on Vercel
        not os.getenv("HEROKU_APP_NAME")         # Not on Heroku
    )

    if is_local:
        convex_url = "https://colorless-finch-681.convex.cloud"  # Dev deployment
        logger.info("🔧 Using DEV Convex deployment (local environment detected)")
    else:
        convex_url = "https://agile-ermine-199.convex.cloud"     # Prod deployment
        logger.info("🚀 Using PROD Convex deployment (production environment detected)")

    return f"{convex_url}/api/run/chats/getChatByIdExposed"

# Get the appropriate Convex URL
CONVEX_URL = get_convex_url()

# Helper Functions
def sanitize_for_neo4j(text: str) -> str:
    safe_text = text
    safe_text = safe_text.replace('\\', '\\\\')
    safe_text = safe_text.replace('"', '\\"')
    safe_text = safe_text.replace("'", "\\'")
    safe_text = safe_text.replace('\n', '\\n')
    safe_text = safe_text.replace('\r', '\\r')
    return safe_text

def chunk_text(full_text: str, max_chars: int = 500) -> List[str]:
    chunks = []
    start = 0
    while start < len(full_text):
        end = start + max_chars
        if end > len(full_text):
            chunks.append(full_text[start:])
            break
        chunks.append(full_text[start:end])
        start = end
    return chunks

def get_embedding(text: str) -> List[float]:
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# ==============================================================================
# API Authentication Functions
# ==============================================================================

def check_rate_limit(api_key: str, ip: str) -> bool:
    """Simple rate limiting check"""
    now = time.time()
    key = f"{api_key}:{ip}"

    # Clean old entries
    request_counts[key] = [
        timestamp for timestamp in request_counts.get(key, [])
        if now - timestamp < RATE_LIMIT_WINDOW
    ]

    # Check limit
    if len(request_counts.get(key, [])) >= RATE_LIMIT_MAX:
        return False

    # Add current request
    if key not in request_counts:
        request_counts[key] = []
    request_counts[key].append(now)

    return True

async def verify_api_key_and_chat(api_key: str, chat_id: str) -> bool:
    """
    Verify API key has access to the specific chat
    Integrates with your existing Convex system
    """
    try:
        # Call your Convex endpoint to verify (auto-detects dev/prod)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                CONVEX_URL,
                json={
                    "args": {"id": chat_id},
                    "format": "json"
                }
            )

            if response.status_code != 200:
                logger.warning(f"Convex call failed for chat {chat_id}: {response.status_code} - {response.text}")
                return False

            chat_data = response.json()

            # Handle both error responses and null responses
            if chat_data.get("status") == "error":
                error_message = chat_data.get("errorMessage", "Unknown error")
                logger.warning(f"Chat {chat_id} - Convex error: {error_message}")
                return False

            chat = chat_data.get("value")

            # Debug logging
            logger.info(f"🔍 Debug chat data for {chat_id}:")
            logger.info(f"   Response status: {response.status_code}")
            logger.info(f"   Chat found: {chat is not None}")

            if chat:
                logger.info(f"   Chat title: {chat.get('title', 'No title')}")
                logger.info(f"   API key in DB: {chat.get('apiKey', 'No key')[:10]}...")
                logger.info(f"   API key provided: {api_key[:10]}...")
                logger.info(f"   API disabled: {chat.get('apiKeyDisabled', 'Not set')}")
                logger.info(f"   Has API access: {chat.get('hasApiAccess', 'Not set')}")
                logger.info(f"   Is archived: {chat.get('isArchived', 'Not set')}")
                logger.info(f"   Visibility: {chat.get('visibility', 'Not set')}")

            if not chat:
                logger.warning(f"Chat {chat_id} not found - chat returned null from Convex")
                return False

            # Check if API key matches and is enabled
            chat_api_key = chat.get("apiKey")
            api_disabled = chat.get("apiKeyDisabled", True)
            is_archived = chat.get("isArchived", False)
            has_api_access = chat.get("hasApiAccess", False)

            # More lenient check - if hasApiAccess field doesn't exist, check if apiKeyDisabled is False
            api_access_enabled = has_api_access or (not api_disabled and chat_api_key and chat_api_key != "undefined")

            # Verify conditions
            if not api_access_enabled:
                logger.warning(f"API access not enabled for chat {chat_id} - hasApiAccess: {has_api_access}, apiKeyDisabled: {api_disabled}")
                return False

            if is_archived:
                logger.warning(f"Chat {chat_id} is archived")
                return False

            if not chat_api_key or chat_api_key == "undefined":
                logger.warning(f"No API key set for chat {chat_id}")
                return False

            # Verify API key matches
            if api_key != chat_api_key:
                logger.warning(f"API key mismatch for chat {chat_id} - expected: {chat_api_key[:10]}..., got: {api_key[:10]}...")
                return False

            logger.info(f"API key verified successfully for chat {chat_id}")
            return True

    except Exception as e:
        logger.error(f"API key verification failed: {e}")
        return False

async def get_verified_chat_access(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> HTTPAuthorizationCredentials:
    """FastAPI dependency to verify API key"""

    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="API key required. Include 'Authorization: Bearer your_api_key' header."
        )

    return credentials

# ==============================================================================
# Existing Helper Functions
# ==============================================================================

def analyze_chunk_relationships(chunks: List[str]) -> List[dict]:
    """Use AI to analyze relationships between chunks and determine logical connections"""
    if len(chunks) < 2:
        return []

    # Prepare chunks for analysis
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        # Create a brief summary of each chunk
        summary_prompt = f"Summarize this text in 1-2 sentences, focusing on the main concept or topic:\n\n{chunk}"

        try:
            response = openai.chat.completions.create(
                model="gpt-4o-mini",  # Use cheaper model for summaries
                messages=[{"role": "user", "content": summary_prompt}],
                max_tokens=100,
                temperature=0
            )
            summary = response.choices[0].message.content.strip()
            chunk_summaries.append({"index": i, "text": chunk[:200], "summary": summary})
        except Exception as e:
            print(f"Error creating summary for chunk {i}: {e}")
            chunk_summaries.append({"index": i, "text": chunk[:200], "summary": chunk[:100]})

    # Analyze relationships between all chunk pairs
    relationships = []

    # Create a more focused analysis prompt
    analysis_prompt = f"""Analyze these text chunks and find logical relationships. Return only valid JSON.

Chunks:
{chr(10).join([f"{item['index']}: {item['summary']}" for item in chunk_summaries])}

Find relationships like:
- EXPLAINS: One chunk explains concepts in another
- SUPPORTS: One chunk provides evidence for another
- ELABORATES: One chunk adds details to another
- INTRODUCES: One chunk introduces topics discussed in another
- CONCLUDES: One chunk concludes ideas from another

Return JSON with this exact format:
{{"relationships": [{{"source": 0, "target": 2, "type": "EXPLAINS", "confidence": 0.8}}]}}"""

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert at analyzing text relationships. Always respond with valid JSON only."},
                {"role": "user", "content": analysis_prompt}
            ],
            max_tokens=2000,
            temperature=0.3
        )

        ai_response = response.choices[0].message.content.strip()
        print(f"AI Response: {ai_response[:200]}...")  # Debug print

        # Clean up the response - sometimes AI adds markdown formatting
        if ai_response.startswith("```json"):
            ai_response = ai_response.replace("```json", "").replace("```", "").strip()
        elif ai_response.startswith("```"):
            ai_response = ai_response.replace("```", "").strip()

        import json
        result = json.loads(ai_response)
        ai_relationships = result.get("relationships", [])

        print(f"AI identified {len(ai_relationships)} potential semantic relationships")

        # Filter and validate AI relationships
        valid_relationships = []
        for rel in ai_relationships:
            if (rel.get("confidence", 0) > 0.6 and
                "source" in rel and "target" in rel and "type" in rel and
                0 <= rel["source"] < len(chunks) and 0 <= rel["target"] < len(chunks)):
                valid_relationships.append(rel)

        print(f"Validated {len(valid_relationships)} semantic relationships")

        # Only add NEXT relationships if we have no semantic relationships
        if len(valid_relationships) == 0:
            print("No semantic relationships found, falling back to sequential NEXT relationships")
            for i in range(len(chunks) - 1):
                valid_relationships.append({
                    "source": i,
                    "target": i + 1,
                    "type": "NEXT",
                    "description": "Sequential order in document",
                    "confidence": 1.0
                })
        else:
            print(f"Using {len(valid_relationships)} AI-generated semantic relationships")

        return valid_relationships

    except json.JSONDecodeError as json_error:
        print(f"JSON parsing error: {json_error}")
        print(f"Raw AI response: {ai_response}")
        # Fallback to simple sequential relationships
        return [{"source": i, "target": i + 1, "type": "NEXT", "description": "Sequential order", "confidence": 1.0}
                for i in range(len(chunks) - 1)]
    except Exception as e:
        print(f"Error analyzing relationships with AI: {e}")
        # Fallback to simple sequential relationships
        return [{"source": i, "target": i + 1, "type": "NEXT", "description": "Sequential order", "confidence": 1.0}
                for i in range(len(chunks) - 1)]

# ==============================================================================
# External Chat API Endpoints (Production Ready)
# ==============================================================================

@app.post("/v1/{chat_id}/answer_question", response_model=ApiAnswerResponse)
async def api_answer_question(
    chat_id: str,
    payload: ApiQuestionRequest,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(get_verified_chat_access)
):
    """
    External API endpoint for answering questions about a chat's knowledge base.

    This is the main production endpoint that external applications will use.
    Requires a valid API key for the specific chat.

    Usage:
    POST https://api.trainlyai.com/v1/{chat_id}/answer_question
    Authorization: Bearer tk_your_api_key
    Content-Type: application/json

    {
        "question": "What is machine learning?",
        "selected_model": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 1000
    }
    """

    try:
        # Verify API key and chat access first
        api_key = credentials.credentials

        # Rate limiting
        if not check_rate_limit(api_key, request.client.host):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Maximum 60 requests per minute.",
                headers={"Retry-After": "60"}
            )

        # Verify API key and chat access
        is_valid = await verify_api_key_and_chat(api_key, chat_id)

        if not is_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid API key or chat not accessible. Please check: 1) Chat exists, 2) API access is enabled in chat settings, 3) API key is correct."
            )

        # Get chat settings from Convex to use stored custom prompt, model, etc.
        async with httpx.AsyncClient() as client:
            chat_response = await client.post(
                CONVEX_URL,
                json={
                    "args": {"id": chat_id},
                    "format": "json"
                }
            )

            chat_settings = {}
            if chat_response.status_code == 200:
                chat_data = chat_response.json()
                if chat_data.get("value"):
                    chat = chat_data["value"]
                    chat_settings = {
                        "custom_prompt": chat.get("customPrompt"),
                        "selected_model": chat.get("selectedModel", "gpt-4o-mini"),
                        "temperature": chat.get("temperature", 0.7),
                        "max_tokens": chat.get("maxTokens", 1000)
                    }
                    logger.info(f"📋 Using chat settings: custom_prompt={bool(chat_settings['custom_prompt'])}, model={chat_settings['selected_model']}")

        # Use chat settings as defaults, allow API parameters to override
        final_model = payload.selected_model if payload.selected_model is not None else chat_settings.get("selected_model", "gpt-4o-mini")
        final_temperature = payload.temperature if payload.temperature is not None else chat_settings.get("temperature", 0.7)
        final_max_tokens = payload.max_tokens if payload.max_tokens is not None else chat_settings.get("max_tokens", 1000)
        final_custom_prompt = payload.custom_prompt if payload.custom_prompt is not None else chat_settings.get("custom_prompt")

        logger.info(f"🎯 Final API parameters: model={final_model}, temp={final_temperature}, max_tokens={final_max_tokens}, has_custom_prompt={bool(final_custom_prompt)}")

        # Call the existing answer_question function with merged settings
        internal_payload = QuestionRequest(
            question=payload.question,
            chat_id=chat_id,
            selected_model=final_model,
            custom_prompt=final_custom_prompt,
            temperature=final_temperature,
            max_tokens=final_max_tokens
        )

        # Use the existing answer_question logic
        result = await answer_question(internal_payload)

        # Format for external API
        api_response = ApiAnswerResponse(
            answer=result.answer,
            context=result.context,
            chat_id=chat_id,
            model=payload.selected_model or "gpt-4o-mini",
            usage={
                "prompt_tokens": len(payload.question) // 4,  # Rough estimate
                "completion_tokens": len(result.answer) // 4,
                "total_tokens": 0
            }
        )

        api_response.usage["total_tokens"] = (
            api_response.usage["prompt_tokens"] +
            api_response.usage["completion_tokens"]
        )

        # Log successful request
        logger.info(f"✅ API call successful for chat {chat_id} from {request.client.host}")

        return api_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ API answer_question failed for chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process question. Please try again.")

@app.post("/v1/{chat_id}/answer_question_stream")
async def api_answer_question_stream(
    chat_id: str,
    payload: ApiQuestionRequest,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(get_verified_chat_access)
):
    """
    External API endpoint for streaming answers.

    Returns Server-Sent Events stream for real-time applications.

    Usage:
    POST https://api.trainlyai.com/v1/{chat_id}/answer_question_stream
    Authorization: Bearer tk_your_api_key
    Accept: text/event-stream
    """

    try:
        # Verify API key and chat access first
        api_key = credentials.credentials

        # Rate limiting
        if not check_rate_limit(api_key, request.client.host):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Maximum 60 requests per minute.",
                headers={"Retry-After": "60"}
            )

        # Verify API key and chat access
        is_valid = await verify_api_key_and_chat(api_key, chat_id)

        if not is_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid API key or chat not accessible. Please check: 1) Chat exists, 2) API access is enabled in chat settings, 3) API key is correct."
            )

        # Get chat settings from Convex
        async with httpx.AsyncClient() as client:
            chat_response = await client.post(
                CONVEX_URL,
                json={
                    "args": {"id": chat_id},
                    "format": "json"
                }
            )

            chat_settings = {}
            if chat_response.status_code == 200:
                chat_data = chat_response.json()
                if chat_data.get("value"):
                    chat = chat_data["value"]
                    chat_settings = {
                        "custom_prompt": chat.get("customPrompt"),
                        "selected_model": chat.get("selectedModel", "gpt-4o-mini"),
                        "temperature": chat.get("temperature", 0.7),
                        "max_tokens": chat.get("maxTokens", 1000)
                    }

        # Use chat settings as defaults, allow API parameters to override
        final_model = payload.selected_model if payload.selected_model is not None else chat_settings.get("selected_model", "gpt-4o-mini")
        final_temperature = payload.temperature if payload.temperature is not None else chat_settings.get("temperature", 0.7)
        final_max_tokens = payload.max_tokens if payload.max_tokens is not None else chat_settings.get("max_tokens", 1000)
        final_custom_prompt = payload.custom_prompt if payload.custom_prompt is not None else chat_settings.get("custom_prompt")

        # Call the existing streaming function with merged settings
        internal_payload = QuestionRequest(
            question=payload.question,
            chat_id=chat_id,
            selected_model=final_model,
            custom_prompt=final_custom_prompt,
            temperature=final_temperature,
            max_tokens=final_max_tokens
        )

        # Use the existing streaming logic
        stream_response = await answer_question_stream(internal_payload)

        # Log successful streaming request
        logger.info(f"✅ API streaming call successful for chat {chat_id} from {request.client.host}")

        return stream_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ API streaming failed for chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to stream response. Please try again.")

@app.get("/v1/{chat_id}/info")
async def api_get_chat_info(
    chat_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(get_verified_chat_access)
):
    """Get basic information about the chat"""

    try:
        # Verify API key first
        api_key = credentials.credentials
        is_valid = await verify_api_key_and_chat(api_key, chat_id)

        if not is_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid API key or chat not accessible."
            )

        # Get chat info from Convex (auto-detects dev/prod)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                CONVEX_URL,
                json={
                    "args": {"id": chat_id},
                    "format": "json"
                }
            )

            if response.status_code == 200:
                chat_data = response.json()
                chat = chat_data.get("value", {})

                return {
                    "chat_id": chat_id,
                    "title": chat.get("title", "Untitled Chat"),
                    "created_at": chat.get("_creationTime"),
                    "has_api_access": not chat.get("apiKeyDisabled", True),
                    "visibility": chat.get("visibility", "private"),
                    "context_files": len(chat.get("context", [])),
                    "api_version": "1.0.0"
                }
            else:
                raise HTTPException(status_code=404, detail="Chat not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get chat info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get chat information")

@app.get("/v1/debug/{chat_id}")
async def debug_chat_data(chat_id: str):
    """Debug endpoint to check chat data in Convex (no auth required)"""
    try:
        convex_url = "https://agile-ermine-199.convex.cloud/api/run/chats/getChatByIdExposed"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                convex_url,
                json={
                    "args": {"id": chat_id},
                    "format": "json"
                }
            )

            return {
                "chat_id": chat_id,
                "convex_status": response.status_code,
                "convex_response": response.json() if response.status_code == 200 else response.text,
                "debug": "This endpoint shows raw Convex data for debugging"
            }
    except Exception as e:
        return {
            "error": str(e),
            "chat_id": chat_id
        }

@app.post("/v1/test/answer_question")
async def test_api_endpoint(payload: ApiQuestionRequest):
    """
    Test endpoint that bypasses authentication for development.
    Use this to verify the API structure is working before testing with real chat IDs.
    """
    return {
        "answer": f"✅ Test response for: '{payload.question}'. Your API structure is working correctly! Now use a real chat ID and API key.",
        "context": [
            {
                "chunk_id": "test_chunk_1",
                "chunk_text": "This is test content to verify the API response format is correct.",
                "score": 0.95
            },
            {
                "chunk_id": "test_chunk_2",
                "chunk_text": "Your API endpoints are properly configured and responding.",
                "score": 0.87
            }
        ],
        "chat_id": "test_chat_id",
        "model": payload.selected_model or "gpt-4o-mini",
        "usage": {
            "prompt_tokens": len(payload.question) // 4,
            "completion_tokens": 50,
            "total_tokens": len(payload.question) // 4 + 50
        }
    }

@app.get("/v1/health")
async def api_health_check():
    """API health check for external monitoring"""
    try:
        # Test Neo4j connection
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                session.run("RETURN 1")

        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": "1.0.0",
            "services": {
                "neo4j": "connected",
                "openai": "configured" if openai.api_key else "not_configured"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": time.time(),
                "error": str(e)
            }
        )

# ==============================================================================
# Existing Internal Endpoints (Keep for dashboard functionality)
# ==============================================================================

@app.post("/create_nodes_and_embeddings")
async def create_nodes_and_embeddings(payload: CreateNodesAndEmbeddingsRequest):
    pdf_text = payload.pdf_text
    pdf_id = payload.pdf_id
    chat_id = payload.chat_id
    filename = payload.filename
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Create Document node
                query = """
                MERGE (d:Document {id: $pdf_id})
                SET d.chatId = $chat_id, d.filename = $filename
                RETURN d
                """
                result = session.run(query, pdf_id=pdf_id, chat_id=chat_id, filename=filename)
                print(f"Created document node: {result.single()}")

                # Create chunks and embeddings
                chunks = chunk_text(pdf_text)
                print(f"Creating {len(chunks)} chunks for document {pdf_id}")

                # First, create all chunks
                chunk_ids = []
                for i, chunk in enumerate(chunks):
                    embedding = get_embedding(chunk)
                    chunk_id = f"{pdf_id}-{i}"
                    chunk_ids.append(chunk_id)

                    query = """
                    MATCH (d:Document {id: $pdf_id})
                    CREATE (c:Chunk {
                        id: $chunk_id,
                        text: $text,
                        embedding: $embedding,
                        chatId: $chat_id
                    })
                    CREATE (d)-[:HAS_CHUNK {order: $order}]->(c)
                    RETURN c
                    """

                    result = session.run(query,
                                       pdf_id=pdf_id,
                                       chunk_id=chunk_id,
                                       text=chunk,
                                       embedding=embedding,
                                       chat_id=chat_id,
                                       order=i)

                    chunk_result = result.single()
                    if chunk_result:
                        print(f"Created chunk {i}: {chunk_result['c']['id']}")
                    else:
                        print(f"Failed to create chunk {i}")
                        raise Exception(f"Failed to create chunk {i}")

                # Analyze content and create intelligent relationships
                if len(chunks) > 1:
                    print(f"🧠 Analyzing content for intelligent relationships...")

                    # Use AI to determine logical relationships
                    ai_relationships = analyze_chunk_relationships(chunks)

                    print(f"Creating {len(ai_relationships)} intelligent relationships...")
                    successful_links = 0

                    for rel in ai_relationships:
                        try:
                            source_idx = rel["source"]
                            target_idx = rel["target"]
                            rel_type = rel["type"]
                            description = rel.get("description", "")
                            confidence = rel.get("confidence", 0.0)

                            # Verify both chunks exist
                            check_query = """
                            MATCH (c1:Chunk {id: $chunk1_id})
                            MATCH (c2:Chunk {id: $chunk2_id})
                            RETURN c1.id as id1, c2.id as id2
                            """

                            check_result = session.run(check_query,
                                                     chunk1_id=f"{pdf_id}-{source_idx}",
                                                     chunk2_id=f"{pdf_id}-{target_idx}")

                            if check_result.single():
                                # Both chunks exist, create the intelligent relationship
                                link_query = f"""
                                MATCH (c1:Chunk {{id: $chunk1_id}})
                                MATCH (c2:Chunk {{id: $chunk2_id}})
                                CREATE (c1)-[:{rel_type} {{
                                    description: $description,
                                    confidence: $confidence,
                                    ai_generated: true
                                }}]->(c2)
                                RETURN c1.id as source, c2.id as target
                                """

                                link_result = session.run(link_query,
                                                         chunk1_id=f"{pdf_id}-{source_idx}",
                                                         chunk2_id=f"{pdf_id}-{target_idx}",
                                                         description=description,
                                                         confidence=confidence)

                                if link_result.single():
                                    print(f"✅ Created {rel_type} relationship: {source_idx} -> {target_idx} (confidence: {confidence:.2f})")
                                    successful_links += 1
                                else:
                                    print(f"❌ Failed to create {rel_type} relationship: {source_idx} -> {target_idx}")
                            else:
                                print(f"❌ One or both chunks missing for relationship {source_idx} -> {target_idx}")

                        except Exception as link_error:
                            print(f"❌ Error creating relationship {rel.get('type', 'UNKNOWN')} {source_idx} -> {target_idx}: {link_error}")

                    print(f"Successfully created {successful_links} out of {len(ai_relationships)} intelligent relationships")
                else:
                    print("Only one chunk, no relationships needed")

        # Final verification - count what we created
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                count_query = """
                MATCH (d:Document {chatId: $chat_id})
                OPTIONAL MATCH (d)-[:HAS_CHUNK]->(c:Chunk)
                OPTIONAL MATCH (c1:Chunk)-[:NEXT]->(c2:Chunk)
                WHERE c1.chatId = $chat_id AND c2.chatId = $chat_id
                RETURN count(DISTINCT d) as docs, count(DISTINCT c) as chunks, count(DISTINCT c1) as linked_chunks
                """
                result = session.run(count_query, chat_id=chat_id)
                counts = result.single()
                print(f"Final counts - Documents: {counts['docs']}, Chunks: {counts['chunks']}, Linked chunks: {counts['linked_chunks']}")

        return {"status": "success", "message": f"Created {len(chunks)} chunks with relationships"}
    except Exception as e:
        print(f"Error in create_nodes_and_embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer_question", response_model=AnswerWithContext)
async def answer_question(payload: QuestionRequest):
    try:
        # Extract parameters from payload
        question = payload.question
        chat_id = payload.chat_id
        selected_model = payload.selected_model or "gpt-4o-mini"
        custom_prompt = payload.custom_prompt
        temperature = payload.temperature or 0.7
        max_tokens = payload.max_tokens or 1000

        # Generate question embedding
        question_embedding = get_embedding(question)

        # Fetch chunks from Neo4j with document metadata for filename-based queries
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Enhanced query to include document filename for better context matching
                query = f"""
                MATCH (d:Document)-[:HAS_CHUNK]->(c:Chunk)
                WHERE c.chatId = '{chat_id}'
                RETURN c.id AS id, c.text AS text, c.embedding AS embedding, d.filename AS filename
                """
                results = session.run(query)


                # Calculate similarities with filename boost
                chunk_scores = []
                question_lower = question.lower()

                for record in results:
                    chunk_id = record["id"]
                    chunk_text = record["text"]
                    chunk_embedding = record["embedding"]
                    filename = record["filename"] or ""

                    # Calculate semantic similarity
                    semantic_score = cosine_similarity(np.array(question_embedding), chunk_embedding)

                    # Add filename relevance boost
                    filename_boost = 0.0
                    if filename:
                        filename_lower = filename.lower()
                        # Remove file extension for better matching
                        filename_base = filename_lower.replace('.pdf', '').replace('.docx', '').replace('.txt', '')

                        # Check for filename mentions in question
                        filename_words = filename_base.replace('_', ' ').replace('-', ' ').split()
                        question_words = question_lower.replace('_', ' ').replace('-', ' ').split()

                        # Boost score if filename words appear in question
                        for fname_word in filename_words:
                            if len(fname_word) > 2:  # Skip very short words
                                for q_word in question_words:
                                    if fname_word in q_word or q_word in fname_word:
                                        filename_boost += 0.1

                        # Additional boost for exact filename matches
                        if any(fname_word in question_lower for fname_word in filename_words if len(fname_word) > 3):
                            filename_boost += 0.2

                    # Combine semantic similarity with filename relevance
                    final_score = semantic_score + filename_boost

                    chunk_scores.append(ChunkScore(
                        chunk_id=chunk_id,
                        chunk_text=chunk_text,
                        score=float(final_score)
                    ))

                # Sort and get top chunks
                chunk_scores.sort(key=lambda x: x.score, reverse=True)
                top_k = 50
                top_chunks = chunk_scores[:top_k]

                # Generate answer using GPT-4 with citations
                # Limit to top 10 chunks for cleaner citations
                top_chunks_for_citations = top_chunks[:10]

                # Get document information for each chunk to provide better context
                chunk_document_info = {}
                for chunk in top_chunks_for_citations:
                    doc_query = f"""
                    MATCH (d:Document)-[:HAS_CHUNK]->(c:Chunk {{id: '{chunk.chunk_id}'}})
                    RETURN d.filename AS filename
                    """
                    doc_result = session.run(doc_query)
                    doc_record = doc_result.single()
                    if doc_record:
                        chunk_document_info[chunk.chunk_id] = doc_record['filename']

                context_with_ids = "\n\n---\n\n".join([
                    f"[CHUNK_{i}] (from document: {chunk_document_info.get(chunk.chunk_id, 'Unknown')}) {chunk.chunk_text}"
                    for i, chunk in enumerate(top_chunks_for_citations)
                ])

                # Use custom prompt if provided, otherwise use default system prompt
                if custom_prompt:
                    # Use custom prompt but ensure context is included
                    system_prompt = f"""
                    {custom_prompt}

                    You have the following context with chunk IDs (0-{len(top_chunks_for_citations)-1}):

                    {context_with_ids}

                    When you reference information from the context, add a citation using this format: [^{{i}}] where {{i}} is the chunk number (0-{len(top_chunks_for_citations)-1})
                    Only use citations [^0] through [^{len(top_chunks_for_citations)-1}]. Do not use citation numbers higher than {len(top_chunks_for_citations)-1}
                    """.strip()
                else:
                    # Default system prompt
                    system_prompt = f"""
                    You are a helpful assistant. You have the following context with chunk IDs (0-{len(top_chunks_for_citations)-1}):

                    {context_with_ids}

                    IMPORTANT INSTRUCTIONS:
                    1. ALWAYS prioritize using the provided context to answer the user's question
                    2. If the context contains relevant information, you MUST use it and cite it properly
                    3. Pay attention to the document names shown in parentheses - if the user asks about a specific document by name, use the content from that document
                    4. When you reference information from the context, add a citation using this format: [^{{i}}] where {{i}} is the chunk number (0-{len(top_chunks_for_citations)-1})
                    5. Only use citations [^0] through [^{len(top_chunks_for_citations)-1}]. Do not use citation numbers higher than {len(top_chunks_for_citations)-1}
                    6. If the user asks about a document by name (like "grant assignment", "ecology report", etc.), and you see content from a document with a similar name in the context, you MUST use that content
                    7. Only use external knowledge if the context is completely irrelevant to the question, and clearly state when you're using external knowledge

                    For example:
                    - "According to the Grant Assignment document [^0], ecology research involves..."
                    - "The document shows [^2] that species interactions..."

                    RESPOND IN MARKDOWN FORMAT WITH CITATIONS
                    """.strip()

                completion = openai.chat.completions.create(
                    model=selected_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question}
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens
                )

                answer = completion.choices[0].message.content.strip()
                return AnswerWithContext(answer=answer, context=top_chunks_for_citations)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer_question_stream")
async def answer_question_stream(payload: QuestionRequest):
    try:
        # Extract parameters from payload
        question = payload.question
        chat_id = payload.chat_id
        selected_model = payload.selected_model or "gpt-4o-mini"
        custom_prompt = payload.custom_prompt
        temperature = payload.temperature or 0.7
        max_tokens = payload.max_tokens or 1000

        # Generate question embedding
        question_embedding = get_embedding(question)

        # Fetch chunks from Neo4j with document metadata for filename-based queries
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Enhanced query to include document filename for better context matching
                query = f"""
                MATCH (d:Document)-[:HAS_CHUNK]->(c:Chunk)
                WHERE c.chatId = '{chat_id}'
                RETURN c.id AS id, c.text AS text, c.embedding AS embedding, d.filename AS filename
                """
                results = session.run(query)

                # Calculate similarities with filename boost
                chunk_scores = []
                question_lower = question.lower()

                for record in results:
                    chunk_id = record["id"]
                    chunk_text = record["text"]
                    chunk_embedding = record["embedding"]
                    filename = record["filename"] or ""

                    # Calculate semantic similarity
                    semantic_score = cosine_similarity(np.array(question_embedding), chunk_embedding)

                    # Add filename relevance boost
                    filename_boost = 0.0
                    if filename:
                        filename_lower = filename.lower()
                        # Remove file extension for better matching
                        filename_base = filename_lower.replace('.pdf', '').replace('.docx', '').replace('.txt', '')

                        # Check for filename mentions in question
                        filename_words = filename_base.replace('_', ' ').replace('-', ' ').split()
                        question_words = question_lower.replace('_', ' ').replace('-', ' ').split()

                        # Boost score if filename words appear in question
                        for fname_word in filename_words:
                            if len(fname_word) > 2:  # Skip very short words
                                for q_word in question_words:
                                    if fname_word in q_word or q_word in fname_word:
                                        filename_boost += 0.1

                        # Additional boost for exact filename matches
                        if any(fname_word in question_lower for fname_word in filename_words if len(fname_word) > 3):
                            filename_boost += 0.2

                    # Combine semantic similarity with filename relevance
                    final_score = semantic_score + filename_boost

                    chunk_scores.append(ChunkScore(
                        chunk_id=chunk_id,
                        chunk_text=chunk_text,
                        score=float(final_score)
                    ))

                # Sort and get top chunks
                chunk_scores.sort(key=lambda x: x.score, reverse=True)
                top_k = 50
                top_chunks = chunk_scores[:top_k]

                # Generate answer using GPT-4 with citations
                # Limit to top 10 chunks for cleaner citations
                top_chunks_for_citations = top_chunks[:10]

                # Get document information for each chunk to provide better context
                chunk_document_info = {}
                for chunk in top_chunks_for_citations:
                    doc_query = f"""
                    MATCH (d:Document)-[:HAS_CHUNK]->(c:Chunk {{id: '{chunk.chunk_id}'}})
                    RETURN d.filename AS filename
                    """
                    doc_result = session.run(doc_query)
                    doc_record = doc_result.single()
                    if doc_record:
                        chunk_document_info[chunk.chunk_id] = doc_record['filename']

                context_with_ids = "\n\n---\n\n".join([
                    f"[CHUNK_{i}] (from document: {chunk_document_info.get(chunk.chunk_id, 'Unknown')}) {chunk.chunk_text}"
                    for i, chunk in enumerate(top_chunks_for_citations)
                ])

                # Use custom prompt if provided, otherwise use default system prompt
                if custom_prompt:
                    # Use custom prompt but ensure context is included
                    system_prompt = f"""
                    {custom_prompt}

                    You have the following context with chunk IDs (0-{len(top_chunks_for_citations)-1}):

                    {context_with_ids}

                    When you reference information from the context, add a citation using this format: [^{{i}}] where {{i}} is the chunk number (0-{len(top_chunks_for_citations)-1})
                    Only use citations [^0] through [^{len(top_chunks_for_citations)-1}]. Do not use citation numbers higher than {len(top_chunks_for_citations)-1}
                    """.strip()
                else:
                    # Default system prompt
                    system_prompt = f"""
                    You are a helpful assistant. You have the following context with chunk IDs (0-{len(top_chunks_for_citations)-1}):

                    {context_with_ids}

                    IMPORTANT INSTRUCTIONS:
                    1. ALWAYS prioritize using the provided context to answer the user's question
                    2. If the context contains relevant information, you MUST use it and cite it properly
                    3. Pay attention to the document names shown in parentheses - if the user asks about a specific document by name, use the content from that document
                    4. When you reference information from the context, add a citation using this format: [^{{i}}] where {{i}} is the chunk number (0-{len(top_chunks_for_citations)-1})
                    5. Only use citations [^0] through [^{len(top_chunks_for_citations)-1}]. Do not use citation numbers higher than {len(top_chunks_for_citations)-1}
                    6. If the user asks about a document by name (like "grant assignment", "ecology report", etc.), and you see content from a document with a similar name in the context, you MUST use that content
                    7. Only use external knowledge if the context is completely irrelevant to the question, and clearly state when you're using external knowledge

                    For example:
                    - "According to the Grant Assignment document [^0], ecology research involves..."
                    - "The document shows [^2] that species interactions..."

                    RESPOND IN MARKDOWN FORMAT WITH CITATIONS
                    """.strip()

                # Create streaming generator function
                async def generate_stream():
                    # First, send the context information
                    context_data = {
                        "type": "context",
                        "data": [
                            {
                                "chunk_id": chunk.chunk_id,
                                "chunk_text": chunk.chunk_text,
                                "score": chunk.score
                            }
                            for chunk in top_chunks_for_citations
                        ]
                    }
                    yield f"data: {json.dumps(context_data)}\n\n"

                    # Then stream the AI response with selected model and settings
                    stream = openai.chat.completions.create(
                        model=selected_model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": question}
                        ],
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True
                    )

                    for chunk in stream:
                        if chunk.choices[0].delta.content is not None:
                            content_data = {
                                "type": "content",
                                "data": chunk.choices[0].delta.content
                            }
                            print(f"🔥 Streaming chunk: {chunk.choices[0].delta.content}")
                            yield f"data: {json.dumps(content_data)}\n\n"
                            # Small delay to ensure chunks are processed individually
                            await asyncio.sleep(0.01)

                    # Send end signal
                    yield f"data: {json.dumps({'type': 'end'})}\n\n"

                return StreamingResponse(
                    generate_stream(),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Headers": "*",
                        "X-Accel-Buffering": "no",  # Disable nginx buffering
                    }
                )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/remove_context/{file_id}")
async def remove_context(file_id: str): # TODO: add auth to this endpoint
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Delete Document and its Chunks
                query = """
                MATCH (d:Document {id: $file_id})-[r:HAS_CHUNK]->(c:Chunk)
                DETACH DELETE d, c
                """
                result = session.run(query, file_id=file_id)

                # Check if anything was deleted
                summary = result.consume()
                if summary.counters.nodes_deleted == 0:
                    print(f"No nodes found for file_id: {file_id}")
                    raise HTTPException(
                        status_code=404,
                        detail=f"No document found with id: {file_id}"
                    )

                return {
                    "status": "success",
                    "message": f"Document {file_id} and its chunks deleted",
                    "nodes_deleted": summary.counters.nodes_deleted
                }

    except Exception as e:
        print(f"Failed to delete document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete Document node in Neo4j: {str(e)}"
        )

# Graph API endpoints for interactive graph interface
@app.get("/graph_data/{chat_id}")
async def get_graph_data(chat_id: str):
    """Get all nodes and relationships for a specific chat to display in graph interface"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Get all nodes for this chat
                nodes_query = """
                MATCH (n)
                WHERE n.chatId = $chat_id
                RETURN
                    id(n) as node_id,
                    labels(n) as labels,
                    properties(n) as properties
                """

                # Get all relationships for this chat
                relationships_query = """
                MATCH (n)-[r]->(m)
                WHERE n.chatId = $chat_id AND m.chatId = $chat_id
                RETURN
                    id(r) as rel_id,
                    id(startNode(r)) as source,
                    id(endNode(r)) as target,
                    type(r) as type,
                    properties(r) as properties
                """

                nodes_result = session.run(nodes_query, chat_id=chat_id)
                relationships_result = session.run(relationships_query, chat_id=chat_id)

                nodes = []
                for record in nodes_result:
                    node_data = {
                        "id": str(record["node_id"]),
                        "labels": record["labels"],
                        "properties": dict(record["properties"])
                    }
                    nodes.append(node_data)

                relationships = []
                for record in relationships_result:
                    rel_data = {
                        "id": str(record["rel_id"]),
                        "source": str(record["source"]),
                        "target": str(record["target"]),
                        "type": record["type"],
                        "properties": dict(record["properties"])
                    }
                    relationships.append(rel_data)

                return {
                    "nodes": nodes,
                    "relationships": relationships
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/node_details/{node_id}")
async def get_node_details(node_id: str):
    """Get detailed information about a specific node"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                query = """
                MATCH (n)
                WHERE id(n) = $node_id
                RETURN
                    id(n) as node_id,
                    labels(n) as labels,
                    properties(n) as properties
                """

                result = session.run(query, node_id=int(node_id))
                record = result.single()

                if not record:
                    raise HTTPException(status_code=404, detail="Node not found")

                return {
                    "id": str(record["node_id"]),
                    "labels": record["labels"],
                    "properties": dict(record["properties"])
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/update_node/{node_id}")
async def update_node(node_id: str, properties: dict):
    """Update properties of a specific node"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Build SET clause for properties
                set_clauses = []
                params = {"node_id": int(node_id)}

                for key, value in properties.items():
                    if key != "id":  # Don't update id
                        param_key = f"prop_{key}"
                        set_clauses.append(f"n.{key} = ${param_key}")
                        params[param_key] = value

                if not set_clauses:
                    raise HTTPException(status_code=400, detail="No valid properties to update")

                query = f"""
                MATCH (n)
                WHERE id(n) = $node_id
                SET {', '.join(set_clauses)}
                RETURN
                    id(n) as node_id,
                    labels(n) as labels,
                    properties(n) as properties
                """

                result = session.run(query, **params)
                record = result.single()

                if not record:
                    raise HTTPException(status_code=404, detail="Node not found")

                return {
                    "id": str(record["node_id"]),
                    "labels": record["labels"],
                    "properties": dict(record["properties"])
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_node/{node_id}")
async def delete_node(node_id: str):
    """Delete a specific node and its relationships"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                query = """
                MATCH (n)
                WHERE id(n) = $node_id
                DETACH DELETE n
                """

                result = session.run(query, node_id=int(node_id))
                summary = result.consume()

                if summary.counters.nodes_deleted == 0:
                    raise HTTPException(status_code=404, detail="Node not found")

                return {
                    "status": "success",
                    "message": f"Node {node_id} deleted successfully",
                    "nodes_deleted": summary.counters.nodes_deleted,
                    "relationships_deleted": summary.counters.relationships_deleted
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create_relationship")
async def create_relationship(source_id: str, target_id: str, relationship_type: str, properties: dict = {}):
    """Create a new relationship between two nodes"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Build SET clause for relationship properties
                set_clause = ""
                params = {
                    "source_id": int(source_id),
                    "target_id": int(target_id),
                    "rel_type": relationship_type
                }

                if properties:
                    prop_assignments = []
                    for key, value in properties.items():
                        param_key = f"prop_{key}"
                        prop_assignments.append(f"r.{key} = ${param_key}")
                        params[param_key] = value
                    set_clause = f"SET {', '.join(prop_assignments)}"

                query = f"""
                MATCH (source), (target)
                WHERE id(source) = $source_id AND id(target) = $target_id
                CREATE (source)-[r:{relationship_type}]->(target)
                {set_clause}
                RETURN
                    id(r) as rel_id,
                    id(startNode(r)) as source,
                    id(endNode(r)) as target,
                    type(r) as type,
                    properties(r) as properties
                """

                result = session.run(query, **params)
                record = result.single()

                if not record:
                    raise HTTPException(status_code=404, detail="Source or target node not found")

                return {
                    "id": str(record["rel_id"]),
                    "source": str(record["source"]),
                    "target": str(record["target"]),
                    "type": record["type"],
                    "properties": dict(record["properties"])
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/update_relationship/{relationship_id}")
async def update_relationship(relationship_id: str, properties: dict):
    """Update properties of a specific relationship"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Build SET clause for properties
                set_clauses = []
                params = {"rel_id": int(relationship_id)}

                for key, value in properties.items():
                    if key not in ["id", "type"]:  # Don't update id or type
                        param_key = f"prop_{key}"
                        set_clauses.append(f"r.{key} = ${param_key}")
                        params[param_key] = value

                if not set_clauses:
                    raise HTTPException(status_code=400, detail="No valid properties to update")

                query = f"""
                MATCH ()-[r]-()
                WHERE id(r) = $rel_id
                SET {', '.join(set_clauses)}
                RETURN
                    id(r) as rel_id,
                    id(startNode(r)) as source,
                    id(endNode(r)) as target,
                    type(r) as type,
                    properties(r) as properties
                """

                result = session.run(query, **params)
                record = result.single()

                if not record:
                    raise HTTPException(status_code=404, detail="Relationship not found")

                return {
                    "id": str(record["rel_id"]),
                    "source": str(record["source"]),
                    "target": str(record["target"]),
                    "type": record["type"],
                    "properties": dict(record["properties"])
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_relationship/{relationship_id}")
async def delete_relationship(relationship_id: str):
    """Delete a specific relationship"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                query = """
                MATCH ()-[r]-()
                WHERE id(r) = $rel_id
                DELETE r
                """

                result = session.run(query, rel_id=int(relationship_id))
                summary = result.consume()

                if summary.counters.relationships_deleted == 0:
                    raise HTTPException(status_code=404, detail="Relationship not found")

                return {
                    "status": "success",
                    "message": f"Relationship {relationship_id} deleted successfully",
                    "relationships_deleted": summary.counters.relationships_deleted
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoint to create simple test nodes and relationships
@app.post("/test_relationships/{chat_id}")
async def test_relationships(chat_id: str):
    """Create test nodes and relationships to debug the issue"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Create test nodes
                session.run("""
                CREATE (n1:TestNode {id: 'test-1', chatId: $chat_id, text: 'First test node'})
                CREATE (n2:TestNode {id: 'test-2', chatId: $chat_id, text: 'Second test node'})
                """, chat_id=chat_id)

                # Create test relationship
                result = session.run("""
                MATCH (n1:TestNode {id: 'test-1', chatId: $chat_id})
                MATCH (n2:TestNode {id: 'test-2', chatId: $chat_id})
                CREATE (n1)-[:TEST_LINK]->(n2)
                RETURN n1, n2
                """, chat_id=chat_id)

                if result.single():
                    return {"status": "success", "message": "Test nodes and relationship created"}
                else:
                    return {"status": "error", "message": "Failed to create test relationship"}

    except Exception as e:
        return {"status": "error", "message": str(e)}

# Debug endpoint to check database contents
@app.get("/debug_database/{chat_id}")
async def debug_database(chat_id: str):
    """Debug endpoint to check what's in the database for a specific chat"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Check all nodes for this chat
                nodes_query = """
                MATCH (n)
                WHERE n.chatId = $chat_id
                RETURN labels(n) as labels, properties(n) as props, count(*) as count
                """

                # Check all relationships for this chat
                rels_query = """
                MATCH (n)-[r]->(m)
                WHERE n.chatId = $chat_id AND m.chatId = $chat_id
                RETURN type(r) as rel_type, properties(r) as props, count(*) as count
                """

                nodes_result = session.run(nodes_query, chat_id=chat_id)
                rels_result = session.run(rels_query, chat_id=chat_id)

                nodes_data = [dict(record) for record in nodes_result]
                rels_data = [dict(record) for record in rels_result]

                return {
                    "chat_id": chat_id,
                    "nodes": nodes_data,
                    "relationships": rels_data
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting TeachAI GraphRAG API with Chat API endpoints...")
    print("📡 Internal endpoints: http://localhost:8000")
    print("🌐 External API endpoints:")
    print("   POST /v1/{chat_id}/answer_question")
    print("   POST /v1/{chat_id}/answer_question_stream")
    print("   GET  /v1/{chat_id}/info")
    print("   GET  /v1/health")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔐 Authentication: Bearer token required for /v1/ endpoints")

    uvicorn.run(app, host="0.0.0.0", port=8000)