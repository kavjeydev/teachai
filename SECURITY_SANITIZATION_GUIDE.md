# Security Sanitization Implementation Guide

## Overview

This document outlines the comprehensive input sanitization implementation to prevent XSS attacks and other security vulnerabilities across the TeachAI application.

## Implementation Summary

### 🔒 Frontend Sanitization (`/frontend/src/lib/sanitization.ts`)

**Key Functions:**
- `sanitizeHTML()` - Sanitizes HTML content with DOMPurify
- `sanitizeText()` - Escapes plain text to prevent XSS
- `sanitizeUserMessage()` - Comprehensive message sanitization
- `sanitizeEmail()` - Email validation and sanitization
- `sanitizeURL()` - URL validation and sanitization
- `sanitizeFilename()` - Safe filename processing
- `sanitizeJSON()` - JSON input sanitization
- `sanitizeChatId()` - Chat ID validation
- `sanitizeApiKey()` - API key validation

**Security Features:**
- Configurable DOMPurify with strict settings
- Whitelist approach for allowed HTML tags and attributes
- Automatic removal of dangerous event handlers (onclick, onerror, etc.)
- Length validation and limits
- Input type validation

### 🛡️ Backend Sanitization (`/backend/sanitization.py`)

**Key Functions:**
- `sanitize_html()` - Server-side HTML sanitization with bleach
- `sanitize_text()` - HTML escaping for plain text
- `sanitize_user_message()` - Message processing
- `sanitize_chat_id()` - Chat ID validation
- `sanitize_api_key()` - API key validation
- `sanitize_request_data()` - Recursive data sanitization

**Pydantic Models:**
- `SanitizedUserMessage` - Automatic message validation
- `SanitizedChatId` - Chat ID validation model
- `SanitizedApiKey` - API key validation model

## Protected Areas

### ✅ Frontend Components Sanitized:
1. **Chat Input** (`/dashboard/[chatId]/page.tsx`)
   - User message sanitization before processing
   - Real-time input validation
   - XSS prevention in chat display

2. **Preview Page** (`/preview/[chatId]/page.tsx`)
   - Public chat input sanitization
   - Safe message rendering

3. **Text Input Mock** (`/components/text-input-mock.tsx`)
   - Demo input sanitization
   - Safe data processing

4. **UI Components**
   - All textarea components protected
   - Form inputs validated

### ✅ API Endpoints Sanitized:
1. **Query AI Endpoint** (`/api/queryai/route.ts`)
   - Question sanitization
   - Chat ID validation
   - API key sanitization

2. **Backend API** (`/backend/read_files.py`)
   - All user inputs sanitized
   - Database query protection
   - File upload validation

## Security Configuration

### DOMPurify Configuration
```typescript
const defaultConfig: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4',
    'h5', 'h6', 'a', 'span', 'div'
  ],
  ALLOWED_ATTR: ['href', 'title', 'class', 'id'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: false
};
```

### Bleach Configuration (Backend)
```python
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
```

## XSS Attack Vectors Prevented

### 🚫 Script Injection
- `<script>alert('XSS')</script>`
- `<img src="x" onerror="alert('XSS')">`
- `<iframe src="javascript:alert('XSS')"></iframe>`

### 🚫 Event Handler Injection
- `<div onclick="alert('XSS')">Click me</div>`
- `<button onmouseover="alert('XSS')">Hover</button>`
- `<input onfocus="alert('XSS')" autofocus>`

### 🚫 Protocol-based Attacks
- `javascript:alert("XSS")`
- `data:text/html,<script>alert("XSS")</script>`
- `vbscript:alert("XSS")`

### 🚫 Advanced Vectors
- SVG-based XSS
- CSS injection
- Meta tag exploitation
- Object/embed tag abuse

## Input Validation Rules

### Chat IDs
- **Format:** Alphanumeric with underscores and hyphens
- **Length:** 3-50 characters
- **Pattern:** `^[a-zA-Z0-9_-]+$`

### API Keys
- **Format:** Alphanumeric with underscores and hyphens
- **Length:** 10-100 characters
- **Pattern:** `^[a-zA-Z0-9_-]+$`

### User Messages
- **Max Length:** 10,000 characters (configurable)
- **HTML:** Limited to safe tags when allowed
- **Text:** HTML-escaped when HTML not allowed

### Email Addresses
- **Validation:** RFC-compliant email format
- **Normalization:** Lowercase, trimmed
- **Max Length:** 254 characters

### URLs
- **Protocols:** http, https only
- **Relative URLs:** Allowed for internal navigation
- **Validation:** Strict format checking

## Testing

### Test Suite (`/frontend/src/tests/sanitization.test.ts`)
- **25 common XSS payloads** tested
- **Performance tests** for large inputs
- **Integration tests** for complex scenarios
- **All sanitization functions** covered

### Running Tests
```bash
cd frontend
npm test sanitization.test.ts
```

## Usage Examples

### Frontend Usage
```typescript
import { sanitizeUserMessage, sanitizeHTML } from '@/lib/sanitization';

// Sanitize user input
const userInput = "Hello <script>alert('XSS')</script> world";
const safe = sanitizeUserMessage(userInput); // "Hello  world"

// Sanitize HTML content
const htmlContent = "<p>Safe</p><script>alert('XSS')</script>";
const safeHTML = sanitizeHTML(htmlContent); // "<p>Safe</p>"
```

### Backend Usage
```python
from sanitization import sanitize_user_message, sanitize_chat_id

# Sanitize in API endpoints
@app.post("/api/endpoint")
async def endpoint(payload: dict):
    safe_message = sanitize_user_message(payload.get('message', ''))
    safe_chat_id = sanitize_chat_id(payload.get('chat_id', ''))

    if not safe_message or not safe_chat_id:
        raise HTTPException(status_code=400, detail="Invalid input")
```

## Migration Notes

### Updated Files
- ✅ `/frontend/src/lib/sanitization.ts` - New comprehensive sanitization utilities
- ✅ `/backend/sanitization.py` - Backend sanitization module
- ✅ `/frontend/src/app/(main)/(routes)/dashboard/[chatId]/page.tsx` - Chat input sanitization
- ✅ `/frontend/src/app/(public)/(routes)/preview/[chatId]/page.tsx` - Preview sanitization
- ✅ `/frontend/src/app/api/queryai/route.ts` - API endpoint sanitization
- ✅ `/backend/read_files.py` - Backend API sanitization

### Backward Compatibility
- Old `sanitizeHTML` function maintained for compatibility
- All existing functionality preserved
- Enhanced security without breaking changes

## Security Checklist

### ✅ Completed
- [x] Install DOMPurify and validator.js
- [x] Install bleach for backend
- [x] Create comprehensive sanitization utilities
- [x] Sanitize all frontend form inputs
- [x] Sanitize all API endpoints
- [x] Sanitize backend data processing
- [x] Create comprehensive test suite
- [x] Update all critical components
- [x] Document security implementation

### 🔄 Ongoing Monitoring
- [ ] Regular security audits
- [ ] Dependency updates for security patches
- [ ] Monitor for new XSS vectors
- [ ] Performance optimization as needed

## Best Practices

### 1. **Defense in Depth**
- Sanitize at input (frontend)
- Validate at API layer (backend)
- Escape at output (rendering)

### 2. **Whitelist Approach**
- Only allow known-safe elements
- Reject by default
- Strict validation rules

### 3. **Content Security Policy**
- Implement CSP headers
- Restrict script sources
- Prevent inline scripts

### 4. **Regular Updates**
- Keep DOMPurify updated
- Monitor security advisories
- Test new versions thoroughly

## Support

For questions about the sanitization implementation:
1. Review this documentation
2. Check test cases for examples
3. Examine sanitization utility source code
4. Test with provided XSS payloads

## Security Contact

Report security vulnerabilities through appropriate channels and ensure all user inputs are properly sanitized before processing.

---

**Last Updated:** September 2025
**Version:** 1.0
**Status:** ✅ Implemented and Tested
