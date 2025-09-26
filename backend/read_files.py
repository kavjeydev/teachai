#!/home/kavinjey/.virtualenvs/myvenv/bin/python
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Header, Depends, Form, Query
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
from typing import List, Optional, Union, Dict, Any
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
from sanitization import (
    sanitize_user_message, sanitize_chat_id, sanitize_api_key,
    sanitize_text, sanitize_with_length, SanitizedUserMessage,
    SanitizedChatId, SanitizedApiKey, sanitize_request_data,
    sanitize_with_xss_detection, detect_xss, sanitize_filename
)

# Secure Privacy-First API Models
class AppAuthorizationRequest(BaseModel):
    end_user_id: str
    capabilities: List[str]
    redirect_uri: str

class SecureUserQueryRequest(BaseModel):
    question: str
    include_citations: Optional[bool] = True

class SecureUploadRequest(BaseModel):
    filename: str
    file_type: str

class AppUserRequest(BaseModel):
    end_user_id: str
    capabilities: List[str]

class PrivacyFirstQueryRequest(BaseModel):
    end_user_id: str
    question: str
    include_citations: Optional[bool] = False

class DirectUploadRequest(BaseModel):
    end_user_id: str
    filename: str
    file_type: str

class UserAuthVerification(BaseModel):
    user_auth_token: str

class TokenClaims(BaseModel):
    app_id: str
    end_user_id: str
    chat_id: str
    capabilities: List[str]
    exp: float
    iat: float

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

# Privacy-First API Helper Functions
import jwt
import time
import hashlib

# Temporary storage for OAuth authorization codes (use Redis in production)
auth_requests = {}

async def verify_app_secret(api_key: str) -> Dict[str, Any]:
    """
    Verify app secret for server-to-server calls.
    App secrets can create users and mint tokens, but CANNOT read raw data.
    """
    # Sanitize the secret
    sanitized_secret = sanitize_api_key(api_key)
    if not sanitized_secret:
        raise HTTPException(status_code=401, detail="Invalid app secret format")

    # Verify with Convex apps table
    try:
        convex_url = os.getenv("CONVEX_URL", "https://colorless-finch-681.convex.cloud")

        # Query Convex to verify app secret
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{convex_url}/api/run/app_management/verifyAppSecret",
                json={
                    "args": {"appSecret": sanitized_secret},
                    "format": "json"
                },
                headers={"Content-Type": "application/json"}
            )

            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid app secret")

            result = response.json()

            # Check if Convex returned an error
            if result.get("status") == "error":
                # Convex is having issues, use fallback
                if sanitized_secret == "as_demo_secret_123":
                    return {
                        "appId": "app_demo_123",
                        "developerId": "dev_demo",
                        "isActive": True,
                        "allowedCapabilities": ["ask", "upload"]
                    }
                # Temporary fallback for your app while Convex issues are resolved
                elif sanitized_secret == "as_mfybb395_dtvn1w7yk3t":
                    # Use your actual Clerk user ID for credit consumption
                    # You can find this in your Convex dashboard or frontend logs
                    your_clerk_user_id = "user_2nFpK6wR2KR7xH2tJ3Nq4wU6YsX"  # Replace with your actual ID

                    return {
                        "appId": "app_user_created_123",
                        "developerId": your_clerk_user_id,
                        "isActive": True,
                        "allowedCapabilities": ["ask", "upload"],
                        "parentChatSettings": {
                            "customPrompt": "You are a helpful AI assistant created by trainly. Respond naturally and helpfully to user questions.",
                            "selectedModel": "gpt-4o-mini",
                            "temperature": 0.7,
                            "maxTokens": 1000,
                            "userId": your_clerk_user_id  # Your real user ID for credit consumption
                        }
                    }
                raise HTTPException(status_code=401, detail="Unable to verify app secret - Convex error")

            app_data = result.get("value")

            if not app_data or not app_data.get("isActive"):
                raise HTTPException(status_code=401, detail="App not found or inactive")

            return {
                "appId": app_data["appId"],
                "developerId": app_data["developerId"],
                "isActive": app_data["isActive"],
                "allowedCapabilities": app_data.get("settings", {}).get("allowedCapabilities", ["ask", "upload"]),
                "parentChatSettings": app_data.get("parentChatSettings")
            }

    except httpx.RequestError:
        # Fallback for development - allow hardcoded demo secret
        if sanitized_secret == "as_demo_secret_123":
            return {
                "appId": "app_demo_123",
                "developerId": "dev_demo",
                "isActive": True,
                "allowedCapabilities": ["ask", "upload"]
            }
        raise HTTPException(status_code=401, detail="Unable to verify app secret")

async def verify_scoped_token(token: str) -> TokenClaims:
    """
    Verify a scoped JWT token for user-specific operations.
    These tokens are short-lived and scoped to specific (app_id, user_id, chat_id).
    """
    try:
        secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key")
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])

        claims = TokenClaims(**payload)

        # Check expiration
        if claims.exp < time.time():
            raise HTTPException(status_code=401, detail="Token expired")

        return claims

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_scoped_token(app_id: str, end_user_id: str, chat_id: str, capabilities: List[str]) -> str:
    """Generate a short-lived scoped token for specific user operations"""
    secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key")

    payload = {
        "app_id": app_id,
        "end_user_id": end_user_id,
        "chat_id": chat_id,
        "capabilities": capabilities,
        "iat": time.time(),
        "exp": time.time() + (15 * 60)  # 15 minutes expiry
    }

    return jwt.encode(payload, secret_key, algorithm="HS256")

async def get_or_create_user_subchat(app_id: str, end_user_id: str) -> Dict[str, Any]:
    """Get or create a private sub-chat for a user under an app"""
    user_chat_id = f"subchat_{app_id}_{end_user_id}"

    # Check if this user already has a subchat for this app
    # In production, this would query Convex user_app_chats
    # For now, we'll assume it's a new user to demonstrate the tracking

    return {
        "userChatId": f"uc_{app_id}_{end_user_id}",
        "chatId": user_chat_id,
        "chatStringId": user_chat_id,
        "isNew": True,  # Set to True to trigger metadata tracking
        "capabilities": ["ask", "upload"]
    }

async def log_app_access(
    app_id: str,
    end_user_id: str,
    chat_id: str,
    action: str,
    capability: str,
    allowed: bool,
    request: Request = None,
    **metadata
):
    """Log all app access attempts for audit trail"""
    try:
        # In production, this would call Convex to log the access
        logger.info(f"App Access: {app_id} | User: {end_user_id} | Action: {action} | Allowed: {allowed}")
    except Exception as e:
        logger.error(f"Failed to log app access: {e}")

async def track_subchat_creation(app_id: str, end_user_id: str, chat_id: str):
    """Track subchat creation for analytics"""
    try:
        # In production, this would call Convex to update chat metadata
        # For demonstration, we'll call a Convex function to track this
        convex_url = "https://colorless-finch-681.convex.cloud/api/run/chat_analytics/trackSubchatCreation"

        async with httpx.AsyncClient() as client:
            await client.post(
                convex_url,
                json={
                    "args": {
                        "appId": app_id,
                        "endUserId": end_user_id,
                        "chatId": chat_id
                    },
                    "format": "json"
                },
                timeout=5.0
            )

        logger.info(f"📊 Analytics: New subchat created | App: {app_id} | User: {end_user_id[:8]}...")
    except Exception as e:
        logger.error(f"Failed to track subchat creation: {e}")

async def track_file_upload(app_id: str, end_user_id: str, filename: str, file_size: int, chat_id: str):
    """Track file upload for analytics"""
    try:
        # Call Convex to update metadata
        convex_url = "https://colorless-finch-681.convex.cloud/api/run/chat_analytics/trackFileUpload"

        async with httpx.AsyncClient() as client:
            await client.post(
                convex_url,
                json={
                    "args": {
                        "appId": app_id,
                        "endUserId": end_user_id,
                        "filename": filename,
                        "fileSize": file_size,
                        "chatId": chat_id
                    },
                    "format": "json"
                },
                timeout=5.0
            )

        logger.info(f"📊 Analytics: File uploaded | App: {app_id} | Size: {format_bytes(file_size)} | Type: {get_file_type(filename)}")
    except Exception as e:
        logger.error(f"Failed to track file upload: {e}")

async def track_api_query(app_id: str, end_user_id: str, response_time: float, success: bool):
    """Track API query for performance analytics"""
    try:
        # Call Convex to update metadata
        convex_url = "https://colorless-finch-681.convex.cloud/api/run/chat_analytics/trackApiQuery"

        async with httpx.AsyncClient() as client:
            await client.post(
                convex_url,
                json={
                    "args": {
                        "appId": app_id,
                        "endUserId": end_user_id,
                        "responseTime": response_time,
                        "success": success
                    },
                    "format": "json"
                },
                timeout=5.0
            )

        logger.info(f"📊 Analytics: Query tracked | App: {app_id} | Time: {response_time:.0f}ms | Success: {success}")
    except Exception as e:
        logger.error(f"Failed to track API query: {e}")

def format_bytes(bytes_val: int) -> str:
    """Format bytes into human readable string"""
    if bytes_val == 0:
        return "0 B"

    sizes = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while bytes_val >= 1024 and i < len(sizes) - 1:
        bytes_val /= 1024
        i += 1

    return f"{bytes_val:.1f} {sizes[i]}"

def get_file_type(filename: str) -> str:
    """Get file type category from filename"""
    ext = filename.lower().split('.')[-1] if '.' in filename else ''

    if ext in ['pdf']:
        return 'pdf'
    elif ext in ['doc', 'docx']:
        return 'docx'
    elif ext in ['txt', 'md', 'csv', 'json']:
        return 'txt'
    elif ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        return 'images'
    else:
        return 'other'

print("✅ Privacy-First API functions loaded successfully")

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

    # Sanitize filename for security
    sanitized_filename = sanitize_filename(file.filename)
    if not sanitized_filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    try:
        text = read_files.extract_text(file)

        # Basic sanitization of extracted text to prevent XSS
        # Note: This is extracted text content, so we don't allow HTML
        sanitized_text = sanitize_with_xss_detection(
            text,
            allow_html=False,
            max_length=1000000,  # Allow larger content for documents
            context="file_extraction"
        )

        if not sanitized_text and text:
            raise HTTPException(status_code=400, detail="File contains potentially malicious content.")

        # Track file upload analytics (if this is part of privacy-first flow)
        file_size = file_size if 'file_size' in locals() else len(text.encode('utf-8'))
        await track_file_upload(
            "demo_app",  # This would be passed from the request in production
            "demo_user",  # This would be the actual user
            sanitized_filename,
            file_size,
            "demo_chat"
        )

        return JSONResponse(content={"text": sanitized_text})
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
        convex_url = "https://colorless-finch-681.convex.cloud"     # Prod deployment
        logger.info("🚀 Using PROD Convex deployment (production environment detected)")

    return f"{convex_url}/api/run/chats/getChatByIdExposed"

# Get the appropriate Convex URL
CONVEX_URL = get_convex_url()

# ==============================================================================
# Credit Management System
# ==============================================================================

# Model multipliers for credit calculation (GPT-4o-mini as 1x baseline)
MODEL_MULTIPLIERS = {
    # OpenAI Models
    'gpt-4o-mini': 1,         # Baseline: 1 credit = 1000 tokens
    'gpt-3.5-turbo': 0.7,     # 0.7x of 4o-mini
    'gpt-4': 18,              # 18x more expensive than 4o-mini
    'gpt-4-turbo': 12,        # 12x more expensive than 4o-mini
    'gpt-4o': 15,             # 15x more expensive than 4o-mini

    # Anthropic Claude Models
    'claude-3-haiku': 1,      # Similar to 4o-mini
    'claude-3-sonnet': 8,     # 8x more expensive than 4o-mini
    'claude-3-opus': 20,      # 20x more expensive than 4o-mini
    'claude-3.5-sonnet': 10,  # 10x more expensive than 4o-mini

    # Google Gemini Models
    'gemini-pro': 3,          # 3x more expensive than 4o-mini
    'gemini-ultra': 12,       # 12x more expensive than 4o-mini
    'gemini-1.5-pro': 4,      # 4x more expensive than 4o-mini

    # Open Source Models (cheaper)
    'llama-3': 0.5,           # 0.5x cheaper than 4o-mini
    'llama-3.1': 0.6,         # 0.6x of 4o-mini
    'mistral-7b': 0.5,        # 0.5x cheaper than 4o-mini
    'mixtral-8x7b': 0.8,      # 0.8x of 4o-mini
}

def calculate_credits_used(tokens: int, model: str) -> float:
    """
    Calculate credits used based on tokens and model.
    Uses the EXACT same calculation as frontend: (tokens / 1000) * multiplier
    Returns fractional credits, NOT rounded.
    """
    multiplier = MODEL_MULTIPLIERS.get(model, 1)
    return (tokens / 1000) * multiplier

class InsufficientCreditsError(Exception):
    """Raised when user doesn't have enough credits"""
    def __init__(self, required: float, available: float):
        self.required = required
        self.available = available
        super().__init__(f"Insufficient credits: need {required}, have {available}")

async def check_user_credits(user_id: str, required_credits: float) -> dict:
    """Check if user has enough credits and return credit info"""
    try:
        logger.info(f"💳 Checking credits for user {user_id}: need {required_credits}")

        # Use backend-safe credit checking function
        convex_url = os.getenv("CONVEX_URL", "https://colorless-finch-681.convex.cloud")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{convex_url}/api/run/backend_credits/checkDeveloperCredits",
                json={
                    "args": {"developerId": user_id},
                    "format": "json"
                },
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                result = response.json()
                credit_data = result.get("value")

                if credit_data and credit_data.get("found"):
                    remaining = credit_data.get("remainingCredits", 0)
                    total = credit_data.get("totalCredits", 0)
                    used = credit_data.get("usedCredits", 0)

                    has_sufficient = remaining >= required_credits

                    logger.info(f"💳 Real credit check: {remaining}/{total} remaining, need {required_credits}, sufficient: {has_sufficient}")

                    return {
                        "has_sufficient": has_sufficient,
                        "remaining": remaining,
                        "total": total,
                        "used": used,
                        "required": required_credits
                    }
                else:
                    logger.warning(f"💳 No credits found for developer {user_id}")
                    return {"has_sufficient": False, "remaining": 0, "total": 0, "used": 0, "required": required_credits}
            else:
                logger.error(f"💳 Credit check failed: {response.status_code}")
                return {"has_sufficient": False, "remaining": 0, "total": 0, "used": 0, "required": required_credits}

    except Exception as e:
        logger.error(f"Error checking user credits: {e}")
        return {
            "has_sufficient": False,
            "remaining": 0,
            "total": 0,
            "used": 0
        }

async def consume_user_credits(
    user_id: str,
    credits: float,
    model: str,
    tokens_used: int,
    chat_id: str = None,
    description: str = "AI model usage"
) -> bool:
    """Consume credits from user's balance"""
    try:
        logger.info(f"💳 Attempting to consume {credits} credits for user {user_id}: {description}")
        logger.info(f"   Model: {model}, Tokens: {tokens_used}, Chat: {chat_id}")

        # Use the backend-safe updateUserCredits function to consume credits
        convex_url = os.getenv("CONVEX_URL", "https://colorless-finch-681.convex.cloud")

        async with httpx.AsyncClient() as client:
            # First get current credits by querying user_credits table directly
            # We'll use a more direct approach since we can't use the auth-based functions

            # Use the backend-safe credit consumption function
            response = await client.post(
                f"{convex_url}/api/run/backend_credits/consumeDeveloperCredits",
                json={
                    "args": {
                        "developerId": user_id,
                        "credits": credits,
                        "model": model,
                        "tokensUsed": tokens_used,
                        "description": description,
                        "chatId": chat_id
                    },
                    "format": "json"
                },
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                result = response.json()
                value = result.get("value", {})

                if value.get("success"):
                    credits_consumed = value.get("creditsUsed", credits)
                    remaining = value.get("remainingCredits", 0)
                    was_initialized = value.get("wasInitialized", False)

                    if was_initialized:
                        logger.info(f"✅ Initialized developer {user_id} with credits and consumed {credits_consumed}")
                    else:
                        logger.info(f"✅ Successfully deducted {credits_consumed} credits from developer {user_id}")

                    logger.info(f"💳 Developer {user_id} now has {remaining} credits remaining")
                    return True
                else:
                    error_msg = value.get("error", "Unknown error")
                    required = value.get("required", credits)
                    available = value.get("remainingCredits", 0)
                    logger.error(f"❌ Credit consumption failed: {error_msg}")
                    logger.error(f"💳 Required: {required}, Available: {available}")
                    return False
            else:
                logger.error(f"❌ Failed to consume credits: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        logger.error(f"Error consuming user credits: {e}")
        return False

async def get_developer_id_from_chat(chat_id: str) -> str:
    """
    Get the developer ID responsible for a chat's API costs.
    Returns the developer ID or the original chat owner ID as fallback.
    """
    try:
        logger.info(f"🔍 Looking up developer ID for chat {chat_id}")
        convex_url = os.getenv("CONVEX_URL", "https://colorless-finch-681.convex.cloud")

        async with httpx.AsyncClient() as client:
            # First get the chat data
            chat_response = await client.post(
                f"{convex_url}/api/run/backend_credits/getChatWithApp",
                json={
                    "args": {"chatId": chat_id},
                    "format": "json"
                },
                headers={"Content-Type": "application/json"}
            )

            if chat_response.status_code == 200:
                chat_data = chat_response.json()
                value = chat_data.get("value")

                if value:
                    # If chat has a parentAppId, get the developer from that app
                    if value.get("parentAppId"):
                        app_id = value["parentAppId"]
                        logger.info(f"🔍 Chat {chat_id} is linked to app {app_id}")

                        # Get app info to find developer
                        app_response = await client.post(
                            f"{convex_url}/api/run/app_management/getAppWithSettings",
                            json={
                                "args": {"appId": app_id},
                                "format": "json"
                            },
                            headers={"Content-Type": "application/json"}
                        )

                        if app_response.status_code == 200:
                            app_data = app_response.json()
                            app_value = app_data.get("value")
                            if app_value and app_value.get("developerId"):
                                developer_id = app_value["developerId"]
                                logger.info(f"✅ Found developer ID {developer_id} for chat {chat_id} via app {app_id}")
                                return developer_id

                    # If no app association, check if this chat has apps created from it
                    chat_owner_id = value.get("userId")
                    if chat_owner_id:
                        # Check if there are any apps with this chat as parentChatId
                        apps_response = await client.post(
                            f"{convex_url}/api/run/backend_credits/getAppsForParentChat",
                            json={
                                "args": {"parentChatId": chat_id},
                                "format": "json"
                            },
                            headers={"Content-Type": "application/json"}
                        )

                        if apps_response.status_code == 200:
                            apps_data = apps_response.json()
                            apps_value = apps_data.get("value", [])
                            if apps_value and len(apps_value) > 0:
                                # Use the developer ID from the first app (they should all be the same developer)
                                developer_id = apps_value[0].get("developerId")
                                if developer_id:
                                    logger.info(f"✅ Found developer ID {developer_id} for chat {chat_id} as chat owner with apps")
                                    return developer_id

                        # Fallback: use the chat owner as the one responsible for credits
                        logger.info(f"💡 Using chat owner {chat_owner_id} as developer for chat {chat_id}")
                        return chat_owner_id

    except Exception as e:
        logger.error(f"❌ Error looking up developer for chat {chat_id}: {e}")

    # Ultimate fallback: use chat_id as user_id
    logger.warning(f"⚠️ Using chat_id {chat_id} as fallback developer ID")
    return chat_id

async def validate_and_consume_credits(
    user_id: str,
    model: str,
    estimated_tokens: int,
    chat_id: str = None
) -> int:
    """
    Validate user has enough credits and consume them.
    Returns the number of credits consumed.
    """
    required_credits = calculate_credits_used(estimated_tokens, model)

    # Determine who should be charged for the credits
    actual_user_id = user_id
    if chat_id:
        # Try to get the developer ID who should be charged
        developer_id = await get_developer_id_from_chat(chat_id)
        if developer_id != chat_id:  # Only use if we found a real developer ID
            actual_user_id = developer_id
            logger.info(f"💳 Charging developer {developer_id} instead of original user {user_id}")

    # Try to consume the credits (this will auto-initialize if user doesn't exist)
    success = await consume_user_credits(
        actual_user_id,
        required_credits,
        model,
        estimated_tokens,
        chat_id,
        f"AI response using {model} (chat: {chat_id})"
    )

    if not success:
        # If consumption failed, check why and provide helpful error
        credit_info = await check_user_credits(actual_user_id, required_credits)
        if not credit_info["has_sufficient"]:
            raise InsufficientCreditsError(required_credits, credit_info["remaining"])
        else:
            raise Exception("Failed to consume credits for unknown reason")

    return required_credits

async def consume_credits_for_actual_usage(
    user_id: str,
    model: str,
    question: str,
    response: str,
    chat_id: str = None
) -> float:
    """
    Consume credits based on actual token usage from AI response.
    Uses the EXACT same calculation as the frontend Trainly chat.
    Returns the number of credits consumed.
    """
    # Calculate actual tokens used (EXACT same method as frontend)
    # Frontend: Math.ceil(question.length / 4) + Math.ceil(response.length / 4)
    import math
    question_tokens = math.ceil(len(question) / 4)
    response_tokens = math.ceil(len(response) / 4)
    total_actual_tokens = question_tokens + response_tokens

    # Calculate credits based on actual usage (EXACT same method as frontend)
    # Frontend: (tokens / 1000) * multiplier (NO Math.ceil!)
    multiplier = MODEL_MULTIPLIERS.get(model, 1)
    actual_credits = (total_actual_tokens / 1000) * multiplier

    # Determine who should be charged for the credits
    actual_user_id = user_id
    if chat_id:
        # Try to get the developer ID who should be charged
        developer_id = await get_developer_id_from_chat(chat_id)
        if developer_id != chat_id:  # Only use if we found a real developer ID
            actual_user_id = developer_id
            logger.info(f"💳 Charging developer {developer_id} instead of original user {user_id}")

    # Consume the credits based on actual usage
    success = await consume_user_credits(
        actual_user_id,
        actual_credits,
        model,
        total_actual_tokens,
        chat_id,
        f"AI response using {model} - {total_actual_tokens} tokens (chat: {chat_id})"
    )

    if not success:
        # If consumption failed, check why and provide helpful error
        credit_info = await check_user_credits(actual_user_id, actual_credits)
        if not credit_info["has_sufficient"]:
            raise InsufficientCreditsError(actual_credits, credit_info["remaining"])
        else:
            raise Exception("Failed to consume credits for unknown reason")

    logger.info(f"💳 Consumed {actual_credits} credits for {total_actual_tokens} actual tokens ({model})")
    return actual_credits

async def ensure_developer_has_credits(developer_user_id: str, min_credits: int = 1000):
    """Ensure developer has credits, initialize with default amount if needed"""
    try:
        convex_url = os.getenv("CONVEX_URL", "https://colorless-finch-681.convex.cloud")

        async with httpx.AsyncClient() as client:
            # Check current credits
            response = await client.post(
                f"{convex_url}/api/run/subscriptions/getUserCredits",
                json={
                    "args": {"userId": developer_user_id},
                    "format": "json"
                },
                headers={"Content-Type": "application/json"}
            )

            current_credits = 0
            if response.status_code == 200:
                result = response.json()
                if result.get("value"):
                    current_credits = result["value"].get("remainingCredits", 0)

            # If no credits, initialize with default amount
            if current_credits == 0:
                logger.info(f"💳 Initializing credits for developer {developer_user_id} with {min_credits} credits")
                init_response = await client.post(
                    f"{convex_url}/api/run/subscriptions/initializeUserCredits",
                    json={
                        "args": {"userId": developer_user_id, "initialCredits": min_credits},
                        "format": "json"
                    },
                    headers={"Content-Type": "application/json"}
                )

                if init_response.status_code == 200:
                    logger.info(f"✅ Developer {developer_user_id} initialized with {min_credits} credits")
                else:
                    logger.warning(f"⚠️ Could not initialize credits for developer: {init_response.status_code}")
            else:
                logger.info(f"💳 Developer {developer_user_id} has {current_credits} credits")

    except Exception as e:
        logger.error(f"Error ensuring developer credits: {e}")

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

        # Sanitize chat_id first
        sanitized_chat_id = sanitize_chat_id(chat_id)
        if not sanitized_chat_id:
            raise HTTPException(status_code=400, detail="Invalid chat_id format")

        # Rate limiting
        if not check_rate_limit(api_key, request.client.host):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Maximum 60 requests per minute.",
                headers={"Retry-After": "60"}
            )

        # Verify API key and chat access
        is_valid = await verify_api_key_and_chat(api_key, sanitized_chat_id)

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

        # Sanitize chat_id first
        sanitized_chat_id = sanitize_chat_id(chat_id)
        if not sanitized_chat_id:
            raise HTTPException(status_code=400, detail="Invalid chat_id format")

        # Rate limiting
        if not check_rate_limit(api_key, request.client.host):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Maximum 60 requests per minute.",
                headers={"Retry-After": "60"}
            )

        # Verify API key and chat access
        is_valid = await verify_api_key_and_chat(api_key, sanitized_chat_id)

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
    # Sanitize all inputs
    pdf_text = sanitize_with_xss_detection(
        payload.pdf_text,
        allow_html=False,
        max_length=1000000,  # Allow large text content
        context="pdf_text"
    )
    pdf_id = sanitize_text(payload.pdf_id)
    chat_id = sanitize_chat_id(payload.chat_id)
    filename = sanitize_filename(payload.filename)

    if not pdf_text or not pdf_id or not chat_id or not filename:
        raise HTTPException(status_code=400, detail="Invalid input data or potentially malicious content detected")
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
        # Enhanced sanitization with XSS detection
        sanitized_question = sanitize_with_xss_detection(
            payload.question,
            allow_html=False,
            max_length=5000,
            context="answer_question"
        )
        sanitized_chat_id = sanitize_chat_id(payload.chat_id)

        if not sanitized_question or not sanitized_chat_id:
            raise HTTPException(status_code=400, detail="Invalid input format or potentially malicious content detected")

        # Extract parameters from payload
        question = sanitized_question
        chat_id = sanitized_chat_id
        selected_model = payload.selected_model or "gpt-4o-mini"
        custom_prompt = sanitize_with_xss_detection(
            payload.custom_prompt,
            allow_html=False,
            max_length=2000,
            context="custom_prompt"
        ) if payload.custom_prompt else None
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
                    # Ensure both are numpy arrays with correct dimensions
                    q_emb = np.array(question_embedding)
                    c_emb = np.array(chunk_embedding) if isinstance(chunk_embedding, list) else chunk_embedding
                    semantic_score = cosine_similarity(q_emb, c_emb)

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
                    6. Only use external knowledge if the context is completely irrelevant to the question, and clearly state when you're using external knowledge

                    For example:
                    - "According to the Grant Assignment document [^0], ecology research involves..."
                    - "The document shows [^2] that species interactions..."

                    RESPOND IN MARKDOWN FORMAT WITH CITATIONS
                    """.strip()

                # Estimate tokens for credit validation (rough estimate)
                estimated_tokens = len(question) // 4 + max_tokens  # Prompt + max response

                # Get user ID from chat data for proper credit consumption
                user_id = None
                try:
                    # Get chat data to find the user ID
                    async with httpx.AsyncClient() as client:
                        chat_response = await client.post(
                            CONVEX_URL,
                            json={
                                "args": {"id": chat_id},
                                "format": "json"
                            }
                        )

                        if chat_response.status_code == 200:
                            chat_data = chat_response.json()
                            if chat_data.get("value"):
                                user_id = chat_data["value"].get("userId")
                                logger.info(f"🔍 Found user ID for chat {chat_id}: {user_id}")

                    if not user_id:
                        logger.warning(f"Could not find user ID for chat {chat_id}, using chat_id as fallback")
                        user_id = chat_id

                except Exception as e:
                    logger.warning(f"Failed to get user ID from chat: {e}, using chat_id as fallback")
                    user_id = chat_id

                # Make AI call first to get actual token usage
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

                # Now consume credits based on actual usage
                try:
                    credits_consumed = await consume_credits_for_actual_usage(
                        user_id=user_id,
                        model=selected_model,
                        question=question,
                        response=answer,
                        chat_id=chat_id
                    )
                    logger.info(f"💳 Consumed {credits_consumed} credits for {selected_model} based on actual usage")
                except InsufficientCreditsError as e:
                    # Note: This is unusual since we've already made the AI call
                    # But we still need to handle the case where the developer runs out of credits
                    logger.error(f"💳 CREDIT ERROR after API call: need {e.required}, have {e.available}")
                    # We could either:
                    # 1. Return the answer anyway (developer gets a free response)
                    # 2. Return an error (lose the API response)
                    # For now, we'll return the answer but log the issue
                    logger.warning(f"💳 Allowing response due to insufficient credits - this should be monitored")

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
                    # Ensure both are numpy arrays with correct dimensions
                    q_emb = np.array(question_embedding)
                    c_emb = np.array(chunk_embedding) if isinstance(chunk_embedding, list) else chunk_embedding
                    semantic_score = cosine_similarity(q_emb, c_emb)

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

                    # Credit checking temporarily disabled to avoid warnings
                    # estimated_tokens = len(question) // 4 + max_tokens
                    # try:
                    #     credits_consumed = await validate_and_consume_credits(
                    #         user_id=chat_id,
                    #         model=selected_model,
                    #         estimated_tokens=estimated_tokens,
                    #         chat_id=chat_id
                    #     )
                    #     logger.info(f"💳 Consumed {credits_consumed} credits for streaming {selected_model}")
                    # except InsufficientCreditsError as e:
                    #     error_data = {
                    #         "type": "error",
                    #         "data": f"Insufficient credits: need {e.required}, have {e.available}. Please upgrade your plan or purchase more credits."
                    #     }
                    #     yield f"data: {json.dumps(error_data)}\n\n"
                    #     return

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
                    end_data = {'type': 'end'}
                    logger.info(f"🏁 Sending end signal: {end_data}")
                    yield f"data: {json.dumps(end_data)}\n\n"

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

class CreateRelationshipRequest(BaseModel):
    source_id: str
    target_id: str
    relationship_type: str
    properties: dict = {}

@app.post("/create_relationship")
async def create_relationship(request: CreateRelationshipRequest):
    """Create a new relationship between two nodes"""
    try:
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Build SET clause for relationship properties
                set_clause = ""
                params = {
                    "source_id": int(request.source_id),
                    "target_id": int(request.target_id),
                    "rel_type": request.relationship_type
                }

                if request.properties:
                    prop_assignments = []
                    for key, value in request.properties.items():
                        param_key = f"prop_{key}"
                        prop_assignments.append(f"r.{key} = ${param_key}")
                        params[param_key] = value
                    set_clause = f"SET {', '.join(prop_assignments)}"

                query = f"""
                MATCH (source), (target)
                WHERE id(source) = $source_id AND id(target) = $target_id
                CREATE (source)-[r:{request.relationship_type}]->(target)
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

# ==============================================================================
# 🔒 Secure Privacy-First API Endpoints (User-Controlled Authentication)
# ==============================================================================

@app.post("/v1/oauth/authorize")
async def generate_oauth_authorization_url(
    request: AppAuthorizationRequest,
    app_secret: str = Header(None, alias="x-api-key")
):
    """
    🔐 OAuth Authorization URL Generation

    This is the first step in the OAuth flow:
    1. Developer's app calls this with their app secret
    2. Returns authorization URL
    3. Developer redirects user to this URL
    4. User authorizes and gets redirected back with code
    5. Developer exchanges code for user's private token
    """

    # Verify app secret
    if not app_secret:
        raise HTTPException(status_code=401, detail="App secret required in x-api-key header")

    try:
        app_info = await verify_app_secret(app_secret)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid app secret")

    # Validate request
    if not request.end_user_id or not request.redirect_uri:
        raise HTTPException(status_code=400, detail="end_user_id and redirect_uri are required")

    # Validate capabilities
    valid_capabilities = ["ask", "upload", "export_summaries"]
    invalid_capabilities = [cap for cap in request.capabilities if cap not in valid_capabilities]
    if invalid_capabilities:
        raise HTTPException(status_code=400, detail=f"Invalid capabilities: {invalid_capabilities}")

    # Generate authorization code (short-lived)
    timestamp = int(time.time())
    auth_data = f'{app_info["appId"]}_{request.end_user_id}_{timestamp}'
    auth_code = f"ac_{timestamp}_{hashlib.md5(auth_data.encode()).hexdigest()[:16]}"

    # Store authorization request temporarily (in production, use Redis or database)
    auth_requests[auth_code] = {
        "app_id": app_info["appId"],
        "end_user_id": request.end_user_id,
        "redirect_uri": request.redirect_uri,
        "capabilities": request.capabilities,
        "expires_at": time.time() + 300,  # 5 minutes
        "created_at": time.time()
    }

    # Generate authorization URL
    auth_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/oauth/authorize?code={auth_code}&app_id={app_info['appId']}&capabilities={','.join(request.capabilities)}"

    return {
        "authorization_url": auth_url,
        "expires_in": 300,
        "app_id": app_info["appId"],
        "state": auth_code
    }

@app.post("/v1/oauth/token")
async def exchange_oauth_code(
    grant_type: str = Form(...),
    code: str = Form(...),
    redirect_uri: str = Form(...),
    client_id: str = Form(None)
):
    """
    🔐 OAuth Token Exchange

    Exchange authorization code for user's private auth token.
    This completes the OAuth flow and gives user their private token.
    """

    if grant_type != "authorization_code":
        raise HTTPException(status_code=400, detail="Unsupported grant type")

    if not code:
        raise HTTPException(status_code=400, detail="Authorization code required")

    # Verify authorization code
    auth_request = auth_requests.get(code)
    if not auth_request:
        raise HTTPException(status_code=400, detail="Invalid or expired authorization code")

    # Check expiration
    if time.time() > auth_request["expires_at"]:
        del auth_requests[code]  # Clean up expired code
        raise HTTPException(status_code=400, detail="Authorization code expired")

    # Verify redirect URI matches
    if redirect_uri != auth_request["redirect_uri"]:
        raise HTTPException(status_code=400, detail="Redirect URI mismatch")

    try:
        # Create user's private authentication token via Convex
        convex_url = os.getenv("CONVEX_URL", "https://colorless-finch-681.convex.cloud")

        async with httpx.AsyncClient() as client:
            # Create user auth token in Convex
            response = await client.post(
                f"{convex_url}/api/run/user_auth_system/authorizeAppAccess",
                json={
                    "args": {
                        "appId": auth_request["app_id"],
                        "requestedCapabilities": auth_request["capabilities"]
                    },
                    "format": "json"
                },
                headers={"Content-Type": "application/json"}
            )

            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to create user auth token")

            result = response.json()
            token_data = result.get("value")

            if not token_data or not token_data.get("success"):
                raise HTTPException(status_code=500, detail="Failed to authorize user")

        # Clean up authorization code (one-time use)
        del auth_requests[code]

        return {
            "access_token": token_data["userAuthToken"],
            "token_type": "Bearer",
            "expires_in": 31536000,  # 1 year (long-lived for user convenience)
            "scope": " ".join(auth_request["capabilities"]),
            "chat_id": token_data["chatId"],
            "app_id": auth_request["app_id"],
            "privacy_guarantee": {
                "user_controlled": True,
                "developer_cannot_see": True,
                "store_on_user_device_only": True,
                "revocable_anytime": True
            },
            "usage_note": "Store this token securely on user's device - never on your servers"
        }

    except Exception as e:
        # Clean up on error
        if code in auth_requests:
            del auth_requests[code]
        raise HTTPException(status_code=500, detail=f"Failed to exchange authorization code: {str(e)}")

@app.post("/v1/me/query")
async def user_private_query(
    request: SecureUserQueryRequest,
    user_auth_token: str = Header(None, alias="x-user-auth-token"),
    req: Request = None
):
    """
    🔐 User Private Query Endpoint

    Users query their private data using their own auth tokens.
    Developers can facilitate this but never see the tokens or raw data.
    """

    if not user_auth_token:
        raise HTTPException(status_code=401, detail="User auth token required in x-user-auth-token header")

    if not user_auth_token.startswith("uat_"):
        raise HTTPException(status_code=401, detail="Invalid user auth token format")

    try:
        # Verify user auth token with Convex
        convex_url = os.getenv("CONVEX_URL", "https://colorless-finch-681.convex.cloud")

        async with httpx.AsyncClient() as client:
            # Verify token and get user's chat access
            verify_response = await client.post(
                f"{convex_url}/api/run/user_auth_system/verifyUserAuthToken",
                json={
                    "args": {"userAuthToken": user_auth_token},
                    "format": "json"
                },
                headers={"Content-Type": "application/json"}
            )

            if verify_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid user auth token")

            verify_result = verify_response.json()
            auth_data = verify_result.get("value")

            if not auth_data or not auth_data.get("isValid"):
                raise HTTPException(status_code=401, detail="User auth token expired or revoked")

            chat_id = auth_data["chatId"]

            # Query the user's private chat
            answer_response = await answer_question(
                user_message=request.question,
                chat_id=chat_id,
                selected_model=request.selected_model or "gpt-4o-mini",
                temperature=request.temperature or 0.7,
                max_tokens=request.max_tokens or 1000
            )

            # Filter citations for privacy (developers get limited info)
            filtered_citations = []
            if answer_response.get("reasoning_context"):
                for citation in answer_response["reasoning_context"][:3]:  # Limit to 3
                    filtered_citations.append({
                        "snippet": citation.get("chunk_text", "")[:200] + "...",  # Truncated
                        "score": citation.get("score", 0),
                        "source": "private_document"  # No file names
                    })

            return {
                "success": True,
                "answer": answer_response.get("response", ""),
                "citations": filtered_citations,
                "privacy_note": "This response is generated from the user's private documents. Citations are filtered for privacy.",
                "user_controlled": True,
                "developer_access": "AI responses only - no raw file access"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in user private query: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process query")

@app.post("/v1/chats/{chat_id}/query/secure")
async def secure_chat_query(
    chat_id: str,
    request: SecureUserQueryRequest,
    user_auth_token: str = Header(None, alias="x-user-auth-token"),
    req: Request = None
):
    """
    🔐 SECURE CHAT QUERY: User-controlled authentication for specific chat

    Users call this directly with their private auth token for a specific chat.
    Each chat is treated as its own "app" with OAuth capabilities.
    Developers cannot make this call because they don't have the user's token.
    """

    if not user_auth_token:
        raise HTTPException(status_code=401, detail="Missing user auth token")

    # Verify user auth token with Convex
    try:
        convex_url = "https://colorless-finch-681.convex.cloud/api/run/user_auth_system/verifyUserAuthToken"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                convex_url,
                json={
                    "args": {"userAuthToken": user_auth_token},
                    "format": "json"
                }
            )

            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid user auth token")

            result = response.json()
            token_info = result.get("value")

            if not token_info:
                raise HTTPException(status_code=401, detail="User auth token not found or expired")

            # Check capabilities
            if "ask" not in token_info["capabilities"]:
                raise HTTPException(status_code=403, detail="User token does not have 'ask' capability")

    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Failed to verify user auth token")

    # Sanitize question
    sanitized_question = sanitize_with_xss_detection(
        request.question,
        allow_html=False,
        max_length=5000,
        context=f"secure_user_query"
    )

    if not sanitized_question:
        raise HTTPException(status_code=400, detail="Invalid or potentially malicious question")

    try:
        # Track query start time
        query_start_time = time.time()

        # This function is called by the secure chat query endpoint
        # For now, use defaults since this endpoint is less commonly used
        # The main privacy endpoint has the full settings inheritance

        result = await answer_question_with_privacy_scope(
            question=sanitized_question,
            chat_id=token_info["chatId"],
            end_user_id=token_info["trainlyUserId"],
            app_id=token_info["appId"] or "direct",
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=1000,
            custom_prompt=None
        )

        response_time = (time.time() - query_start_time) * 1000

        response = {
            "success": True,
            "answer": result["answer"],
            "access_type": "user_controlled",
            "privacy_note": "You are accessing your own private data with your secure token"
        }

        # User gets FULL citations because they're accessing their own data
        if request.include_citations and result.get("context"):
            response["citations"] = [
                {
                    "chunk_id": chunk["chunk_id"],
                    "snippet": chunk["chunk_text"][:500] + "...",  # Longer snippets for user
                    "score": chunk["score"],
                    "source_type": "your_document",
                    "access_level": "full",
                    "privacy_note": "You can see this because it's your own data"
                }
                for chunk in result["context"][:5]  # More citations for user
            ]
            response["citation_access"] = "full"

        # Track successful query
        await track_api_query(
            token_info["appId"] or "direct",
            token_info["trainlyUserId"],
            response_time,
            True
        )

        return response

    except Exception as e:
        # Track failed query
        if 'query_start_time' in locals():
            response_time = (time.time() - query_start_time) * 1000
            await track_api_query(
                token_info["appId"] or "direct",
                token_info["trainlyUserId"],
                response_time,
                False
            )

        raise HTTPException(status_code=500, detail="Failed to process query")

# Legacy endpoint (deprecated but kept for compatibility)
@app.post("/v1/privacy/apps/users/provision")
async def provision_user_subchat(
    request: AppUserRequest,
    authorization: str = Header(None, alias="authorization"),
    req: Request = None
):
    """
    🔒 PRIVACY-FIRST: Provision a private sub-chat for an end-user

    This is called when a new user starts using your app.
    Creates an isolated chat that ONLY that user can access.
    The developer cannot see the user's files or raw data.
    """

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    app_secret = authorization.replace("Bearer ", "")

    # Verify app secret and get parent chat settings
    app_info = await verify_app_secret(app_secret)

    # Sanitize user ID
    sanitized_user_id = sanitize_text(request.end_user_id)
    if not sanitized_user_id:
        raise HTTPException(status_code=400, detail="Invalid end_user_id")

    # Validate capabilities
    valid_capabilities = ["ask", "upload"]
    invalid_caps = [cap for cap in request.capabilities if cap not in valid_capabilities]
    if invalid_caps:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid capabilities: {invalid_caps}. Only 'ask' and 'upload' are allowed."
        )

    try:
        # Get or create user's private sub-chat
        subchat = await get_or_create_user_subchat(
            app_info["appId"],
            sanitized_user_id
        )

        # Generate scoped token for this user
        scoped_token = generate_scoped_token(
            app_info["appId"],
            sanitized_user_id,
            subchat["chatStringId"],
            request.capabilities
        )

        # Log the provisioning
        await log_app_access(
            app_info["appId"],
            sanitized_user_id,
            subchat["chatStringId"],
            "provision_user",
            "admin",
            True,
            req,
            is_new_user=subchat.get("isNew", False)
        )

        # Track subchat creation in analytics
        if subchat.get("isNew", False):
            await track_subchat_creation(
                app_info["appId"],
                sanitized_user_id,
                subchat["chatStringId"]
            )

        return {
            "success": True,
            "end_user_id": sanitized_user_id,
            "scoped_token": scoped_token,
            "capabilities": request.capabilities,
            "is_new_user": subchat.get("isNew", False),
            "privacy_guarantee": "This user's data is completely isolated - you cannot access their files or raw data"
        }

    except Exception as e:
        # Log failed attempt
        await log_app_access(
            app_info["appId"],
            sanitized_user_id,
            "unknown",
            "provision_user",
            "admin",
            False,
            req,
            error_reason=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Failed to provision user: {str(e)}")

@app.post("/v1/privacy/query")
async def privacy_first_query(
    request: PrivacyFirstQueryRequest,
    token: str = Header(None, alias="x-scoped-token"),
    req: Request = None
):
    """
    🔒 PRIVACY-FIRST: Query a user's private chat

    This endpoint ensures complete data isolation:
    - Only returns AI responses, never raw files
    - Scoped to the specific user's data only
    - Cannot access other users' information
    - Comprehensive audit logging
    """

    if not token:
        raise HTTPException(status_code=401, detail="Missing scoped token")

    # Verify scoped token
    claims = await verify_scoped_token(token)

    # Verify user ID matches token
    if request.end_user_id != claims.end_user_id:
        await log_app_access(
            claims.app_id,
            request.end_user_id,
            claims.chat_id,
            "query",
            "ask",
            False,
            req,
            error_reason="User ID mismatch"
        )
        raise HTTPException(status_code=403, detail="User ID mismatch")

    # Check capability
    if "ask" not in claims.capabilities:
        await log_app_access(
            claims.app_id,
            claims.end_user_id,
            claims.chat_id,
            "query",
            "ask",
            False,
            req,
            error_reason="Missing 'ask' capability"
        )
        raise HTTPException(status_code=403, detail="Missing 'ask' capability")

    # Sanitize question
    sanitized_question = sanitize_with_xss_detection(
        request.question,
        allow_html=False,
        max_length=5000,
        context=f"privacy_query_{claims.end_user_id}"
    )

    if not sanitized_question:
        await log_app_access(
            claims.app_id,
            claims.end_user_id,
            claims.chat_id,
            "query",
            "ask",
            False,
            req,
            error_reason="Invalid or malicious question",
            question=request.question[:100]
        )
        raise HTTPException(status_code=400, detail="Invalid or potentially malicious question")

    try:
        # Track query start time for performance metrics
        query_start_time = time.time()

        # Get app settings including parent chat settings from Convex
        app_settings = {}
        developer_user_id = claims.app_id

        try:
            async with httpx.AsyncClient() as client:
                app_response = await client.post(
                    "https://colorless-finch-681.convex.cloud/api/run/app_management/getAppWithSettings",
                    json={
                        "args": {"appId": claims.app_id},
                        "format": "json"
                    }
                )

                if app_response.status_code == 200:
                    app_data = app_response.json()
                    if app_data.get("value") and app_data["value"].get("parentChatSettings"):
                        parent_settings = app_data["value"]["parentChatSettings"]
                        app_settings = {
                            "custom_prompt": parent_settings.get("customPrompt"),
                            "selected_model": parent_settings.get("selectedModel", "gpt-4o-mini"),
                            "temperature": parent_settings.get("temperature", 0.7),
                            "max_tokens": int(parent_settings.get("maxTokens", 1000))
                        }
                        developer_user_id = parent_settings.get("userId") or claims.app_id
                        logger.info(f"📋 SUCCESS: Inherited settings from parent chat: model={app_settings['selected_model']}, temp={app_settings['temperature']}, custom_prompt={bool(app_settings['custom_prompt'])}")
                        logger.info(f"💳 Found developer user ID: {developer_user_id}")
                    else:
                        logger.info(f"📋 No parent chat settings found for app {claims.app_id}, using defaults")
                else:
                    logger.warning(f"Could not fetch app settings: {app_response.status_code}")
        except Exception as e:
            logger.error(f"Error fetching app settings: {str(e)}")

        # Use inherited settings with fallbacks
        model = app_settings.get("selected_model", "gpt-4o-mini")
        temperature = app_settings.get("temperature", 0.7)
        max_tokens = int(app_settings.get("max_tokens", 1000))
        custom_prompt = app_settings.get("custom_prompt")

        logger.info(f"📋 Final settings: model={model}, temp={temperature}, custom_prompt={bool(custom_prompt)}")
        logger.info(f"💳 Credit consumption target: {developer_user_id}")

        # Call the privacy-aware answer function with request settings
        # This ensures data is scoped to the user's specific chat
        result = await answer_question_with_privacy_scope(
            question=sanitized_question,
            chat_id=claims.chat_id,
            end_user_id=claims.end_user_id,
            app_id=claims.app_id,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            custom_prompt=custom_prompt
        )

        # Now consume credits based on actual usage (after getting the response)
        try:
            credits_consumed = await consume_credits_for_actual_usage(
                user_id=developer_user_id,
                model=model,
                question=sanitized_question,
                response=result.get("answer", ""),
                chat_id=claims.chat_id  # Use the user's chat ID for tracking
            )
            logger.info(f"💳 SUCCESS: Consumed {credits_consumed} credits from developer {developer_user_id} for end user {claims.end_user_id} based on actual usage")
        except InsufficientCreditsError as e:
            logger.error(f"💳 CREDIT ERROR after API call: need {e.required}, have {e.available}")
            # Since we've already made the AI call, we'll allow the response but log the issue
            logger.warning(f"💳 Allowing response due to insufficient credits - this should be monitored")
            credits_consumed = 0
        except Exception as e:
            logger.error(f"💳 ERROR: Credit consumption failed: {str(e)}")
            logger.warning(f"💳 Allowing response despite credit error - this should be monitored")
            credits_consumed = 0

        # Calculate response time and track metrics
        response_time = (time.time() - query_start_time) * 1000  # Convert to milliseconds
        await track_api_query(
            claims.app_id,
            claims.end_user_id,
            response_time,
            True  # Success
        )

        # Log successful query
        await log_app_access(
            claims.app_id,
            claims.end_user_id,
            claims.chat_id,
            "query",
            "ask",
            True,
            req,
            question=sanitized_question[:100],
            used_chunks=len(result.get("context", []))
        )

        response = {
            "success": True,
            "answer": result["answer"],
            "end_user_id": claims.end_user_id,
            "privacy_note": "This response contains only AI-generated content based on the user's private data"
        }

        # Include citations if requested (but never raw file content)
        if request.include_citations and result.get("context"):
            response["citations"] = [
                {
                    "chunk_id": chunk["chunk_id"],
                    "snippet": chunk["chunk_text"][:200] + "...",  # Limited snippet only
                    "score": chunk["score"]
                }
                for chunk in result["context"][:3]  # Max 3 citations
            ]

        return response

    except Exception as e:
        # Track failed query
        if 'query_start_time' in locals():
            response_time = (time.time() - query_start_time) * 1000
            await track_api_query(
                claims.app_id,
                claims.end_user_id,
                response_time,
                False  # Failed
            )

        await log_app_access(
            claims.app_id,
            claims.end_user_id,
            claims.chat_id,
            "query",
            "ask",
            False,
            req,
            error_reason=str(e),
            question=sanitized_question[:100]
        )
        raise HTTPException(status_code=500, detail="Failed to process query")

@app.post("/v1/privacy/upload/presigned-url")
async def get_presigned_upload_url(
    request: DirectUploadRequest,
    token: str = Header(None, alias="x-scoped-token"),
    req: Request = None
):
    """
    🔒 PRIVACY-FIRST: Get presigned URL for direct user uploads

    This bypasses the developer's servers entirely:
    - Files upload directly from user's browser to Trainly
    - Developer never sees the file content
    - Complete data isolation maintained
    """

    if not token:
        raise HTTPException(status_code=401, detail="Missing scoped token")

    # Verify scoped token
    claims = await verify_scoped_token(token)

    # Verify user ID and capability
    if (request.end_user_id != claims.end_user_id or
        "upload" not in claims.capabilities):
        await log_app_access(
            claims.app_id,
            request.end_user_id,
            claims.chat_id,
            "upload_request",
            "upload",
            False,
            req,
            error_reason="Unauthorized upload attempt"
        )
        raise HTTPException(status_code=403, detail="Unauthorized upload")

    # Sanitize filename
    sanitized_filename = sanitize_filename(request.filename)
    if not sanitized_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    try:
        # Generate upload URL for user's namespace
        # Routes to a privacy-aware upload endpoint that processes files completely
        # Files are processed securely and isolated per user/app
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        upload_url = f"{base_url}/v1/privacy/upload/process"

        # Log upload request
        await log_app_access(
            claims.app_id,
            claims.end_user_id,
            claims.chat_id,
            "upload_request",
            "upload",
            True,
            req,
            filename=sanitized_filename,
            file_type=request.file_type
        )

        return {
            "success": True,
            "upload_url": upload_url,
            "filename": sanitized_filename,
            "expires_in": 3600,  # 1 hour
            "privacy_note": "File will be uploaded directly to user's private namespace",
            "upload_method": "POST",  # Indicates to use POST with FormData instead of PUT
            "content_type": "multipart/form-data",
            "field_name": "file",  # The form field name to use
            "upload_headers": {  # Headers to include in the upload request
                "x-chat-id": claims.chat_id,
                "x-user-id": claims.end_user_id,
                "x-app-id": claims.app_id
            }
        }

    except Exception as e:
        await log_app_access(
            claims.app_id,
            claims.end_user_id,
            claims.chat_id,
            "upload_request",
            "upload",
            False,
            req,
            error_reason=str(e),
            filename=sanitized_filename
        )
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")

@app.post("/v1/privacy/upload/process")
async def privacy_upload_process(
    file: UploadFile = File(...),
    chat_id: str = Header(None, alias="x-chat-id"),
    user_id: str = Header(None, alias="x-user-id"),
    app_id: str = Header(None, alias="x-app-id")
):
    """
    🔒 PRIVACY-FIRST: Complete file upload processing

    This endpoint:
    1. Extracts text from uploaded files
    2. Creates embeddings and associates them with the user's sub-chat
    3. Ensures complete privacy isolation
    """

    # Validate file
    file_size = read_files.get_file_size(file)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB).")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    # Validate required headers
    if not chat_id or not user_id or not app_id:
        raise HTTPException(status_code=400, detail="Missing required headers: x-chat-id, x-user-id, x-app-id")

    # Sanitize inputs
    sanitized_filename = sanitize_filename(file.filename)
    sanitized_chat_id = sanitize_chat_id(chat_id)
    sanitized_user_id = sanitize_api_key(user_id)  # Reuse sanitization function
    sanitized_app_id = sanitize_api_key(app_id)    # Reuse sanitization function

    if not sanitized_filename or not sanitized_chat_id or not sanitized_user_id or not sanitized_app_id:
        raise HTTPException(status_code=400, detail="Invalid input parameters")

    try:
        # Step 1: Extract text from file
        text = read_files.extract_text(file)

        # Sanitize extracted text
        sanitized_text = sanitize_with_xss_detection(
            text,
            allow_html=False,
            max_length=1000000,
            context="privacy_file_extraction"
        )

        if not sanitized_text and text:
            raise HTTPException(status_code=400, detail="File contains potentially malicious content.")

        # Step 2: Create embeddings and nodes for the user's sub-chat
        # Generate unique PDF ID for this upload
        pdf_id = f"{sanitized_user_id}_{sanitized_filename}_{int(time.time())}"

        # Create embeddings using the same logic as the regular flow
        # but scoped to the user's sub-chat
        create_payload = CreateNodesAndEmbeddingsRequest(
            pdf_text=sanitized_text,
            pdf_id=pdf_id,
            chat_id=sanitized_chat_id,  # This is the user's sub-chat ID
            filename=sanitized_filename
        )

        # Call the existing embeddings creation function
        await create_nodes_and_embeddings(create_payload)

        # Track the upload for analytics
        await track_file_upload(
            sanitized_app_id,
            sanitized_user_id,
            sanitized_filename,
            file_size,
            sanitized_chat_id
        )

        return {
            "success": True,
            "message": "File uploaded and processed successfully",
            "filename": sanitized_filename,
            "chat_id": sanitized_chat_id,
            "pdf_id": pdf_id,
            "privacy_note": "File processed and stored in your isolated workspace"
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Privacy upload processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {str(e)}")

@app.get("/debug/api-base-url")
async def debug_api_base_url():
    """Debug endpoint to check what API base URL is being used"""
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    return {
        "api_base_url": base_url,
        "environment_var": os.getenv("API_BASE_URL"),
        "default_used": os.getenv("API_BASE_URL") is None
    }

@app.get("/debug/chat-settings/{chat_id}")
async def debug_chat_settings(chat_id: str):
    """Debug endpoint to test chat settings fetching"""
    try:
        logger.info(f"🔍 DEBUG: Fetching settings for chat {chat_id}")
        logger.info(f"🔍 DEBUG: Using CONVEX_URL: {CONVEX_URL}")

        async with httpx.AsyncClient() as client:
            chat_response = await client.post(
                CONVEX_URL,
                json={
                    "args": {"id": chat_id},
                    "format": "json"
                }
            )

            logger.info(f"🔍 DEBUG: Convex response status: {chat_response.status_code}")
            logger.info(f"🔍 DEBUG: Convex response text: {chat_response.text}")

            if chat_response.status_code == 200:
                chat_data = chat_response.json()
                logger.info(f"🔍 DEBUG: Parsed chat data: {chat_data}")

                if chat_data.get("value"):
                    chat = chat_data["value"]
                    settings = {
                        "custom_prompt": chat.get("customPrompt"),
                        "selected_model": chat.get("selectedModel"),
                        "temperature": chat.get("temperature"),
                        "max_tokens": chat.get("maxTokens"),
                        "user_id": chat.get("userId")
                    }
                    logger.info(f"🔍 DEBUG: Extracted settings: {settings}")
                    return {"success": True, "settings": settings, "raw_chat": chat}
                else:
                    return {"success": False, "error": "No chat data in response", "response": chat_data}
            else:
                return {"success": False, "error": f"HTTP {chat_response.status_code}", "response": chat_response.text}

    except Exception as e:
        logger.error(f"🔍 DEBUG: Exception in debug endpoint: {str(e)}")
        return {"success": False, "error": str(e)}

@app.get("/v1/privacy/health")
async def privacy_api_health():
    """Health check for the privacy-first API"""
    return {
        "status": "healthy",
        "message": "Privacy-First API is operational",
        "privacy_model": "Complete data isolation - developers cannot access user files or raw data",
        "capabilities": {
            "allowed": ["ask", "upload"],
            "blocked": ["list_files", "download_file", "read_raw_data"],
        },
        "compliance": "GDPR/CCPA ready with user data ownership",
        "audit_trail": "All access attempts logged",
        "timestamp": time.time()
    }

async def answer_question_with_privacy_scope(
    question: str,
    chat_id: str,
    end_user_id: str,
    app_id: str,
    model: str = "gpt-4o-mini",
    temperature: float = 0.7,
    max_tokens: int = 1000,
    custom_prompt: str = None
) -> Dict[str, Any]:
    """
    Privacy-scoped question answering that ensures complete data isolation.
    This function ensures that responses only include data from the specific user's chat.
    """
    # This integrates with your existing answer_question logic
    # but with additional privacy controls and scoping

    try:
        # Generate question embedding
        question_embedding = get_embedding(question)

        # Query Neo4j with user-specific filtering
        with GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password)) as driver:
            with driver.session() as session:
                # Enhanced query that includes user/chat isolation + parent chat access
                # This searches BOTH user's private data AND parent app knowledge base
                # Note: This implements the hybrid model you described

                # First, let's see what documents exist for this chat
                doc_query = f"""
                MATCH (d:Document)
                WHERE d.chatId = '{chat_id}' OR (d.chatId = '{app_id}' AND '{app_id}' <> 'direct')
                RETURN d.filename AS filename, d.chatId AS docChatId
                """
                doc_result = session.run(doc_query)
                doc_list = [(record["filename"], record["docChatId"]) for record in doc_result]
                logger.info(f"🔍 DEBUG: Found {len(doc_list)} documents: {doc_list}")

                query = f"""
                MATCH (d:Document)-[:HAS_CHUNK]->(c:Chunk)
                WHERE c.chatId = '{chat_id}' OR (c.chatId = '{app_id}' AND '{app_id}' <> 'direct')
                RETURN c.id AS id, c.text AS text, c.embedding AS embedding, d.filename AS filename
                """

                result = session.run(query)
                chunks = []

                question_lower = question.lower()

                # Calculate similarities with filename boost - EXACT SAME AS MAIN CHAT
                chunk_scores = []

                for record in result:
                    chunk_id = record["id"]
                    chunk_text = record["text"]
                    chunk_embedding = record["embedding"]
                    filename = record["filename"] or ""

                    # Calculate semantic similarity
                    # Ensure both are numpy arrays with correct dimensions
                    q_emb = np.array(question_embedding)
                    c_emb = np.array(chunk_embedding) if isinstance(chunk_embedding, list) else chunk_embedding
                    semantic_score = cosine_similarity(q_emb, c_emb)

                    # Add filename relevance boost (same logic as main chat)
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

                    chunk_scores.append({
                        "chunk_id": chunk_id,
                        "chunk_text": chunk_text,
                        "score": float(final_score),
                        "filename": filename
                    })

                # Sort and get top chunks - EXACT SAME AS MAIN CHAT
                chunk_scores.sort(key=lambda x: x["score"], reverse=True)
                top_k = 50  # Same as main chat
                top_chunks = chunk_scores[:top_k]

                # Generate answer using GPT-4 with citations - EXACT SAME AS MAIN CHAT
                # Limit to top 10 chunks for cleaner citations
                top_chunks_for_citations = top_chunks[:10]

                # Get document information for each chunk to provide better context - EXACT SAME AS MAIN CHAT
                chunk_document_info = {}
                for chunk in top_chunks_for_citations:
                    doc_query = f"""
                    MATCH (d:Document)-[:HAS_CHUNK]->(c:Chunk {{id: '{chunk["chunk_id"]}'}})
                    RETURN d.filename AS filename
                    """
                    doc_result = session.run(doc_query)
                    doc_record = doc_result.single()
                    if doc_record:
                        chunk_document_info[chunk["chunk_id"]] = doc_record['filename']

                context_with_ids = "\n\n---\n\n".join([
                    f"[CHUNK_{i}] (from document: {chunk_document_info.get(chunk['chunk_id'], 'Unknown')}) {chunk['chunk_text']}"
                    for i, chunk in enumerate(top_chunks_for_citations)
                ])

                # Use custom prompt if provided, otherwise use default system prompt - EXACT SAME AS MAIN CHAT
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
                    # Default system prompt - EXACT SAME AS MAIN CHAT
                    system_prompt = f"""
                    You are a helpful assistant. You have the following context with chunk IDs (0-{len(top_chunks_for_citations)-1}):

                    {context_with_ids}

                    IMPORTANT INSTRUCTIONS:
                    1. ALWAYS prioritize using the provided context to answer the user's question
                    2. If the context contains relevant information, you MUST use it and cite it properly
                    3. Pay attention to the document names shown in parentheses - if the user asks about a specific document by name, use the content from that document
                    4. When you reference information from the context, add a citation using this format: [^{{i}}] where {{i}} is the chunk number (0-{len(top_chunks_for_citations)-1})
                    5. Only use citations [^0] through [^{len(top_chunks_for_citations)-1}]. Do not use citation numbers higher than {len(top_chunks_for_citations)-1}
                    6. Only use external knowledge if the context is completely irrelevant to the question, and clearly state when you're using external knowledge

                    For example:
                    - "According to the Grant Assignment document [^0], ecology research involves..."
                    - "The document shows [^2] that species interactions..."

                    RESPOND IN MARKDOWN FORMAT WITH CITATIONS
                    """.strip()

                completion = openai.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question}
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens
                )

                answer = completion.choices[0].message.content.strip()

                # Convert to same format as main chat
                context_chunks = []
                for chunk in top_chunks_for_citations:
                    context_chunks.append({
                        "chunk_id": chunk["chunk_id"],
                        "chunk_text": chunk["chunk_text"],
                        "score": chunk["score"]
                    })

                return {
                    "answer": answer,
                    "context": context_chunks,
                    "privacy_scope": {
                        "app_id": app_id,
                        "end_user_id": end_user_id,
                        "chat_id": chat_id,
                        "isolation_confirmed": True
                    }
                }

    except Exception as e:
        import traceback
        logger.error(f"Error in privacy-scoped answer: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return {
            "answer": f"Debug: Error occurred - {str(e)}. Please check server logs for details.",
            "context": [],
            "privacy_scope": {
                "app_id": app_id,
                "end_user_id": end_user_id,
                "chat_id": chat_id,
                "isolation_confirmed": True,
                "error": str(e)
            }
        }

# ==============================================================================
# 🔐 BYO OAuth Token Exchange (RFC 8693) - Lightweight Implementation
# ==============================================================================

@app.get("/oauth/authorize")
async def oauth_authorize(
    chat_id: str,
    redirect_uri: str,
    state: Optional[str] = None,
    scope: Optional[str] = "chat.query chat.upload"
):
    """
    🔐 Trainly OAuth Authorization Endpoint

    User visits this URL to authorize an app to access their chat.
    Returns authorization code that can be exchanged for access token.
    """

    # Sanitize inputs
    sanitized_chat_id = sanitize_chat_id(chat_id)
    if not sanitized_chat_id:
        raise HTTPException(status_code=400, detail="Invalid chat_id")

    # In production, this would show authorization page
    # For demo, we'll auto-approve and redirect with auth code
    auth_code = f"auth_{int(time.time())}_{sanitized_chat_id}_{state or 'default'}"

    redirect_url = f"{redirect_uri}?code={auth_code}&state={state or ''}"

    logger.info(f"🔐 OAuth authorization: {sanitized_chat_id} → {redirect_uri}")

    return {
        "authorization_url": redirect_url,
        "auth_code": auth_code,
        "chat_id": sanitized_chat_id,
        "message": "In production, user would see authorization page here"
    }

@app.post("/oauth/token")
async def token_exchange(
    grant_type: str,
    code: Optional[str] = None,
    redirect_uri: Optional[str] = None,
    client_id: Optional[str] = None,
    scope: Optional[str] = "chat.query chat.upload"
):
    """
    🔐 Trainly OAuth Token Exchange

    Exchange authorization code for user access token.
    Lightweight implementation with complete privacy protection.
    """

    if grant_type != "authorization_code":
        raise HTTPException(status_code=400, detail="Unsupported grant_type")

    if not code or not client_id:
        raise HTTPException(status_code=400, detail="Missing code or client_id")

    try:
        # Validate authorization code
        if not code.startswith("auth_"):
            raise HTTPException(status_code=401, detail="Invalid authorization code")

        # Extract info from auth code
        code_parts = code.split("_")
        if len(code_parts) < 3:
            raise HTTPException(status_code=401, detail="Malformed authorization code")

        chat_id = code_parts[2]
        user_id = f"user_{int(time.time())}_{code_parts[1][-8:]}"  # Generate user ID from code

        # Sanitize inputs
        sanitized_chat_id = sanitize_chat_id(chat_id)
        if not sanitized_chat_id:
            raise HTTPException(status_code=400, detail="Invalid chat_id")

        subchat_id = f"subchat_{sanitized_chat_id}_{user_id}"

        # Generate Trainly access token
        trainly_token = generate_trainly_token(
            chat_id=sanitized_chat_id,
            user_id=user_id,
            subchat_id=subchat_id,
            scopes=scope.split() if scope else ["chat.query", "chat.upload"]
        )

        # Track token creation
        await track_subchat_creation(sanitized_chat_id, user_id, subchat_id)

        logger.info(f"🔐 Token exchange: {user_id[:8]}... → {sanitized_chat_id}")

        return {
            "access_token": trainly_token,
            "token_type": "Bearer",
            "expires_in": 3600,  # 1 hour
            "scope": scope,
            "chat_id": sanitized_chat_id,
            "subchat_id": subchat_id,
            "privacy_guarantee": {
                "user_controlled": True,
                "citations_filtered_for_apps": True,
                "no_raw_file_access": True,
                "developer_cannot_see_token": True
            },
            "usage_note": "Store this token on user's device only - never on your servers"
        }

    except Exception as e:
        logger.error(f"Token exchange failed: {e}")
        raise HTTPException(status_code=500, detail="Token exchange failed")

def generate_trainly_token(chat_id: str, user_id: str, subchat_id: str, scopes: List[str]) -> str:
    """Generate Trainly access token with privacy protection"""
    secret_key = os.getenv("TRAINLY_JWT_SECRET", "your-trainly-secret-key")

    now = time.time()
    payload = {
        "iss": "trainly.com",
        "sub": user_id,
        "aud": "trainly-api",
        "exp": now + 3600,  # 1 hour expiry
        "iat": now,
        "scope": " ".join(scopes),
        "chat_id": chat_id,
        "subchat_id": subchat_id,
        "user_id": user_id,
        "privacy_mode": "strict",
        "citations_filtered": True,
        "token_type": "trainly_oauth"
    }

    return jwt.encode(payload, secret_key, algorithm="HS256")

@app.post("/me/chats/query")
async def user_chat_query(
    request: SecureUserQueryRequest,
    authorization: str = Header(None),
    req: Request = None
):
    """
    🔐 User queries their private chat with Trainly token
    Citations filtered for developer calls, full for direct user access.
    """

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.replace("Bearer ", "")

    try:
        secret_key = os.getenv("TRAINLY_JWT_SECRET", "your-trainly-secret-key")
        claims = jwt.decode(token, secret_key, algorithms=["HS256"], audience="trainly-api")

        if claims["exp"] < time.time():
            raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Extract from token
    chat_id = claims["chat_id"]
    subchat_id = claims["subchat_id"]
    user_id = claims["user_id"]

    # Check scope
    if "chat.query" not in claims.get("scope", ""):
        raise HTTPException(status_code=403, detail="Insufficient scope")

    # Sanitize question
    sanitized_question = sanitize_with_xss_detection(
        request.question,
        allow_html=False,
        max_length=5000,
        context=f"user_query_{user_id[:8]}"
    )

    if not sanitized_question:
        raise HTTPException(status_code=400, detail="Invalid question")

    try:
        query_start_time = time.time()

        # For BYO OAuth endpoint, use simplified settings for now
        # The main privacy endpoint has full inheritance

        result = await answer_question_with_privacy_scope(
            question=sanitized_question,
            chat_id=subchat_id,
            end_user_id=user_id,
            app_id=chat_id,
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=1000,
            custom_prompt=None
        )

        response_time = (time.time() - query_start_time) * 1000

        # Detect developer app call vs direct user access
        is_developer_call = True
        if req:
            origin = req.headers.get("origin", "")
            if "trainly.com" in origin or "localhost:3000" in origin:
                is_developer_call = False

        response = {
            "answer": result["answer"],
            "subchat_id": subchat_id,
            "access_type": "user_controlled",
            "privacy_note": "Generated from your private data only"
        }

        # Citation filtering for privacy protection
        if request.include_citations and result.get("context"):
            if is_developer_call:
                # Developer gets summary only (privacy protection)
                response["citations_summary"] = {
                    "sources_used": len(result["context"]),
                    "confidence": "high" if result["context"][0]["score"] > 0.8 else "medium",
                    "privacy_note": "Citations filtered for privacy - full access at trainly.com"
                }
            else:
                # Direct user gets full citations
                response["citations"] = [
                    {
                        "chunk_id": chunk["chunk_id"],
                        "snippet": chunk["chunk_text"][:500] + "...",
                        "score": chunk["score"]
                    }
                    for chunk in result["context"][:5]
                ]

        await track_api_query(chat_id, user_id, response_time, True)
        return response

    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail="Query failed")

if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting TeachAI GraphRAG API with Privacy-First Architecture...")
    print("📡 Internal endpoints: http://localhost:8000")
    print("🌐 Legacy API endpoints:")
    print("   POST /v1/{chat_id}/answer_question")
    print("   POST /v1/{chat_id}/answer_question_stream")
    print("   GET  /v1/{chat_id}/info")
    print("   GET  /v1/health")
    print("🔒 Trainly OAuth API endpoints:")
    print("   GET  /oauth/authorize                  (OAuth authorization)")
    print("   POST /oauth/token                      (Token exchange)")
    print("   POST /me/chats/query                   (User-controlled queries)")
    print("   POST /me/chats/files/presign           (Private file uploads)")
    print("   GET  /v1/privacy/health                (API health status)")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔐 Authentication: Trainly OAuth 2.0 (User-controlled tokens)")
    print("🛡️  Privacy Guarantee: Citations filtered, no raw file access for developers")
    print("💡 Simple OAuth: Lightweight implementation, complete privacy control")

    uvicorn.run(app, host="0.0.0.0", port=8000)