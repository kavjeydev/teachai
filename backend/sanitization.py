"""
Comprehensive input sanitization and validation utilities for the backend
to prevent XSS, SQL injection, and other security vulnerabilities.
"""

import re
import html
import json
import urllib.parse
import logging
from typing import Any, Dict, Optional, Union, List
import bleach
from pydantic import BaseModel, validator

# Set up logging for security events
logger = logging.getLogger(__name__)

# XSS Detection patterns
XSS_PATTERNS = [
    # Script tags
    re.compile(r'<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>', re.IGNORECASE),
    # Event handlers
    re.compile(r'on\w+\s*=\s*["\'][^"\']*["\']', re.IGNORECASE),
    # JavaScript protocols
    re.compile(r'javascript\s*:', re.IGNORECASE),
    # Data URLs with scripts
    re.compile(r'data\s*:\s*text/html', re.IGNORECASE),
    # VBScript
    re.compile(r'vbscript\s*:', re.IGNORECASE),
    # Expression() CSS
    re.compile(r'expression\s*\(', re.IGNORECASE),
    # Meta refresh redirects
    re.compile(r'<meta[^>]+http-equiv\s*=\s*["\']?refresh["\']?[^>]*>', re.IGNORECASE),
    # Iframe
    re.compile(r'<iframe\b[^>]*>', re.IGNORECASE),
    # Object/embed tags
    re.compile(r'<(object|embed)\b[^>]*>', re.IGNORECASE),
    # Style with javascript
    re.compile(r'<style[^>]*>[\s\S]*?</style>', re.IGNORECASE),
    # Import statements in CSS
    re.compile(r'@import\s+[^;]+;', re.IGNORECASE),
]


class SanitizationConfig:
    """Configuration for HTML sanitization"""

    ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'code', 'pre',
        'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4',
        'h5', 'h6', 'span', 'div'
    ]

    ALLOWED_ATTRIBUTES = {
        '*': ['class', 'id'],
        'a': ['href', 'title'],
    }

    ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


def sanitize_html(dirty_html: str, config: Optional[SanitizationConfig] = None) -> str:
    """
    Sanitize HTML content using bleach to prevent XSS attacks.

    Args:
        dirty_html: The potentially unsafe HTML content
        config: Optional sanitization configuration

    Returns:
        Sanitized HTML string
    """
    if not dirty_html or not isinstance(dirty_html, str):
        return ""

    if config is None:
        config = SanitizationConfig()

    return bleach.clean(
        dirty_html,
        tags=config.ALLOWED_TAGS,
        attributes=config.ALLOWED_ATTRIBUTES,
        protocols=config.ALLOWED_PROTOCOLS,
        strip=True,
        strip_comments=True
    )


def sanitize_text(input_text: str) -> str:
    """
    Sanitize plain text input to prevent XSS.

    Args:
        input_text: The user input string

    Returns:
        Sanitized text string
    """
    if not input_text or not isinstance(input_text, str):
        return ""

    # HTML escape the input
    sanitized = html.escape(input_text.strip())

    # Remove any null bytes
    sanitized = sanitized.replace('\x00', '')

    return sanitized


def sanitize_email(email: str) -> str:
    """
    Validate and sanitize email addresses.

    Args:
        email: The email string to validate

    Returns:
        Sanitized email or empty string if invalid
    """
    if not email or not isinstance(email, str):
        return ""

    email = email.strip().lower()

    # Basic email validation regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    if re.match(email_pattern, email) and len(email) <= 254:
        return email

    return ""


def sanitize_url(url: str) -> str:
    """
    Validate and sanitize URLs.

    Args:
        url: The URL string to validate

    Returns:
        Sanitized URL or empty string if invalid
    """
    if not url or not isinstance(url, str):
        return ""

    url = url.strip()

    # Allow relative URLs for internal navigation
    if url.startswith('/') or url.startswith('./') or url.startswith('../'):
        # Basic validation for relative URLs
        if not re.search(r'[<>"\'`\s]', url):
            return url
        return ""

    # Validate absolute URLs
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme in ['http', 'https'] and parsed.netloc:
            return url
    except Exception:
        pass

    return ""


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe file operations.

    Args:
        filename: The filename to sanitize

    Returns:
        Sanitized filename
    """
    if not filename or not isinstance(filename, str):
        return ""

    # Remove path traversal attempts and dangerous characters
    sanitized = re.sub(r'[/\\:*?"<>|]', '', filename)
    sanitized = re.sub(r'\.\.', '', sanitized)
    sanitized = re.sub(r'^\.+', '', sanitized)
    sanitized = sanitized.strip()

    # Limit length
    return sanitized[:255]


def sanitize_json_input(json_string: str) -> Optional[Dict[str, Any]]:
    """
    Sanitize JSON input to prevent injection.

    Args:
        json_string: The JSON string to validate

    Returns:
        Parsed and validated JSON object or None if invalid
    """
    if not json_string or not isinstance(json_string, str):
        return None

    try:
        parsed = json.loads(json_string)

        def sanitize_value(value: Any) -> Any:
            if isinstance(value, str):
                return sanitize_text(value)
            elif isinstance(value, list):
                return [sanitize_value(v) for v in value]
            elif isinstance(value, dict):
                sanitized = {}
                for k, v in value.items():
                    sanitized_key = sanitize_text(str(k))
                    if sanitized_key:
                        sanitized[sanitized_key] = sanitize_value(v)
                return sanitized
            return value

        return sanitize_value(parsed)
    except (json.JSONDecodeError, ValueError):
        return None


def sanitize_chat_id(chat_id: str) -> str:
    """
    Validate and sanitize chat ID.

    Args:
        chat_id: The chat ID to validate

    Returns:
        Sanitized chat ID or empty string if invalid
    """
    if not chat_id or not isinstance(chat_id, str):
        return ""

    chat_id = chat_id.strip()

    # Basic validation - adjust pattern based on your chat ID format
    if re.match(r'^[a-zA-Z0-9_-]+$', chat_id) and 3 <= len(chat_id) <= 50:
        return chat_id

    return ""


def sanitize_api_key(api_key: str) -> str:
    """
    Sanitize API key.

    Args:
        api_key: The API key to sanitize

    Returns:
        Sanitized API key or empty string if invalid
    """
    if not api_key or not isinstance(api_key, str):
        return ""

    api_key = api_key.strip()

    # Basic validation for API key format
    if re.match(r'^[a-zA-Z0-9_-]+$', api_key) and 10 <= len(api_key) <= 100:
        return api_key

    return ""


def sanitize_user_message(message: str, allow_html: bool = False) -> str:
    """
    Comprehensive input sanitization for user messages.

    Args:
        message: The user message to sanitize
        allow_html: Whether to allow limited HTML tags

    Returns:
        Sanitized message
    """
    if not message or not isinstance(message, str):
        return ""

    if allow_html:
        return sanitize_html(message)
    else:
        return sanitize_text(message)


def sanitize_with_length(
    input_text: str,
    max_length: int = 1000,
    min_length: int = 0
) -> str:
    """
    Validate input length and sanitize.

    Args:
        input_text: The input to validate
        max_length: Maximum allowed length
        min_length: Minimum required length

    Returns:
        Sanitized input or empty string if invalid
    """
    if not input_text or not isinstance(input_text, str):
        return ""

    sanitized = sanitize_text(input_text)

    if len(sanitized) < min_length or len(sanitized) > max_length:
        return ""

    return sanitized


def sanitize_sql_identifier(identifier: str) -> str:
    """
    Sanitize database identifiers (table names, column names, etc.).

    Args:
        identifier: The identifier to sanitize

    Returns:
        Sanitized identifier or empty string if invalid
    """
    if not identifier or not isinstance(identifier, str):
        return ""

    identifier = identifier.strip()

    # Only allow alphanumeric characters and underscores
    if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', identifier) and len(identifier) <= 64:
        return identifier

    return ""


# Pydantic models for request validation
class SanitizedUserMessage(BaseModel):
    """Pydantic model for validating user messages"""
    content: str

    @validator('content')
    def sanitize_content(cls, v):
        return sanitize_user_message(v)


class SanitizedChatId(BaseModel):
    """Pydantic model for validating chat IDs"""
    chat_id: str

    @validator('chat_id')
    def sanitize_chat_id_field(cls, v):
        sanitized = sanitize_chat_id(v)
        if not sanitized:
            raise ValueError("Invalid chat ID format")
        return sanitized


class SanitizedApiKey(BaseModel):
    """Pydantic model for validating API keys"""
    api_key: str

    @validator('api_key')
    def sanitize_api_key_field(cls, v):
        sanitized = sanitize_api_key(v)
        if not sanitized:
            raise ValueError("Invalid API key format")
        return sanitized


def detect_xss(input_text: str) -> bool:
    """
    Detect potential XSS attacks in input text.

    Args:
        input_text: The input to check

    Returns:
        True if XSS patterns are detected
    """
    if not input_text or not isinstance(input_text, str):
        return False

    try:
        # Decode URL encoding
        decoded = urllib.parse.unquote(input_text)
        normalized = decoded.lower()

        # Check against XSS patterns
        for pattern in XSS_PATTERNS:
            if pattern.search(normalized):
                logger.warning(f"XSS pattern detected: {pattern.pattern[:50]}...")
                return True

        return False
    except Exception as e:
        logger.error(f"Error in XSS detection: {e}")
        return True  # Err on the side of caution


def sanitize_with_xss_detection(
    input_text: str,
    allow_html: bool = False,
    max_length: int = 1000,
    context: str = "general"
) -> str:
    """
    Sanitize input with comprehensive XSS detection.

    Args:
        input_text: The input to sanitize
        allow_html: Whether to allow limited HTML tags
        max_length: Maximum allowed length
        context: Context for logging

    Returns:
        Sanitized input or empty string if XSS detected
    """
    if not input_text or not isinstance(input_text, str):
        return ""

    # Length check
    if len(input_text) > max_length:
        logger.warning(f"Input exceeds maximum length in {context}: {len(input_text)}")
        return ""

    # XSS detection
    if detect_xss(input_text):
        logger.warning(f"XSS attempt detected in {context}: {input_text[:50]}...")
        return ""

    # Sanitize
    if allow_html:
        sanitized = sanitize_html(input_text)
    else:
        sanitized = sanitize_text(input_text)

    # Log significant content removal
    if len(sanitized) < len(input_text) * 0.8:
        logger.warning(f"Significant content removed during sanitization in {context}")

    return sanitized


def remove_inline_event_handlers(html_content: str) -> str:
    """
    Remove inline event handlers from HTML content.

    Args:
        html_content: HTML content to clean

    Returns:
        HTML with inline event handlers removed
    """
    if not html_content or not isinstance(html_content, str):
        return ""

    # Remove all on* attributes
    return re.sub(r'\s+on\w+\s*=\s*["\'][^"\']*["\']', '', html_content, flags=re.IGNORECASE)


def sanitize_css(css_content: str) -> str:
    """
    Sanitize CSS to prevent XSS via styles.

    Args:
        css_content: CSS content to sanitize

    Returns:
        Sanitized CSS
    """
    if not css_content or not isinstance(css_content, str):
        return ""

    # Remove dangerous CSS patterns
    sanitized = css_content
    sanitized = re.sub(r'expression\s*\(', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'javascript\s*:', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'vbscript\s*:', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'@import\s+[^;]+;', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'behavior\s*:', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'binding\s*:', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'-moz-binding\s*:', '', sanitized, flags=re.IGNORECASE)

    return sanitized


# Utility functions for common validation patterns
def is_safe_string(input_str: str, max_length: int = 1000) -> bool:
    """
    Check if a string is safe (no XSS patterns, reasonable length).

    Args:
        input_str: String to check
        max_length: Maximum allowed length

    Returns:
        True if string is safe, False otherwise
    """
    if not input_str or not isinstance(input_str, str):
        return False

    if len(input_str) > max_length:
        return False

    # Check for common XSS patterns
    dangerous_patterns = [
        r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>',
        r'javascript:',
        r'vbscript:',
        r'data:',
        r'on\w+=',
        r'<iframe\b',
        r'<object\b',
        r'<embed\b',
        r'<link\b',
        r'<meta\b',
        r'<style\b',
    ]

    for pattern in dangerous_patterns:
        if re.search(pattern, input_str, re.IGNORECASE):
            return False

    return True


def sanitize_request_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize all string values in a request data dictionary.

    Args:
        data: The request data dictionary

    Returns:
        Dictionary with sanitized string values
    """
    sanitized = {}

    for key, value in data.items():
        sanitized_key = sanitize_text(str(key))

        if isinstance(value, str):
            sanitized[sanitized_key] = sanitize_text(value)
        elif isinstance(value, dict):
            sanitized[sanitized_key] = sanitize_request_data(value)
        elif isinstance(value, list):
            sanitized[sanitized_key] = [
                sanitize_text(item) if isinstance(item, str) else item
                for item in value
            ]
        else:
            sanitized[sanitized_key] = value

    return sanitized
