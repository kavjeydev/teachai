#!/usr/bin/env python3
"""
Minimal test server to verify V1 endpoints work
"""

from fastapi import FastAPI, Header, HTTPException
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="V1 Test Server")

# Simple test endpoint
@app.get("/v1/test")
async def test_endpoint():
    return {"message": "V1 endpoints are working"}

# Test the V1 profile endpoint without dependencies
@app.get("/v1/me/profile")
async def v1_user_profile_test(
    authorization: str = Header(None, alias="authorization"),
    app_id: str = Header(None, alias="x-app-id")
):
    """Test V1 profile endpoint"""

    if not app_id:
        raise HTTPException(status_code=400, detail="X-App-ID header required")

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # For testing, just return a mock response
    return {
        "success": True,
        "user_id": "test_user_123",
        "chat_id": "test_chat_456",
        "app_id": app_id,
        "message": "V1 profile endpoint is working",
        "test_mode": True
    }

if __name__ == "__main__":
    import uvicorn
    print("🧪 Starting V1 Test Server...")
    print("Test endpoints:")
    print("  GET  /v1/test")
    print("  GET  /v1/me/profile")
    uvicorn.run(app, host="0.0.0.0", port=8001)
