import { NextRequest, NextResponse } from "next/server";
import { sanitizeApiKey } from "./sanitization";

/**
 * Verify that the request is authenticated with a valid backend API key
 * @param req - The Next.js request object
 * @returns null if authenticated, or a NextResponse with error if not
 */
export function verifyBackendApiKey(
  req: NextRequest,
): NextResponse | null {
  // Get the API key from the Authorization header (Bearer token) or x-api-key header
  const authHeader = req.headers.get("authorization");
  const apiKeyHeader = req.headers.get("x-api-key");

  // Try to get the API key from either header
  let providedKey: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    providedKey = authHeader.substring(7);
  } else if (apiKeyHeader) {
    providedKey = apiKeyHeader;
  }

  if (!providedKey) {
    return NextResponse.json(
      { error: "Missing authentication. Provide API key via Authorization: Bearer <key> or x-api-key header." },
      { status: 401 },
    );
  }

  // Sanitize the provided key
  const sanitizedKey = sanitizeApiKey(providedKey);
  if (!sanitizedKey) {
    return NextResponse.json(
      { error: "Invalid API key format." },
      { status: 401 },
    );
  }

  // Get the expected backend API key from environment variables
  const expectedKey = process.env.BACKEND_API_KEY;
  if (!expectedKey) {
    console.error("❌ BACKEND_API_KEY environment variable is not set");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  // Use constant-time comparison to prevent timing attacks
  if (!constantTimeEquals(sanitizedKey, expectedKey)) {
    return NextResponse.json(
      { error: "Invalid API key." },
      { status: 401 },
    );
  }

  // Authentication successful
  return null;
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

