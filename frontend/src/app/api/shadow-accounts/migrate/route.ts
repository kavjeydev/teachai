import { NextRequest, NextResponse } from "next/server";
import { verifyBackendApiKey } from "@/lib/api-auth";

// Use direct HTTP calls to Convex for server-side operations
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

// Helper function to call Convex mutations from server-side
async function callConvexMutation(functionPath: string, args: any) {
  const url = `${CONVEX_SITE_URL}/api/run/${functionPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      args,
      format: "json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Convex mutation failed: ${functionPath}`, {
      status: response.status,
      error: errorText,
    });
    throw new Error(
      `Convex mutation failed: ${response.status} - ${errorText}`,
    );
  }

  const result = await response.json();
  return result;
}

/**
 * POST /api/shadow-accounts/migrate
 * Migrates a shadow account to the authenticated user's account
 *
 * Note: This endpoint requires authentication via Clerk. The Convex mutation
 * will verify authentication and migrate the shadow account data.
 *
 * Request body:
 * {
 *   "shadowUserId": "shadow_xxx" // The shadow account userId to migrate
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "migrated": {
 *     "credits": true,
 *     "organizations": 1,
 *     "chats": 1,
 *     "apps": 1,
 *     ...
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  // Verify backend API key authentication
  const authError = verifyBackendApiKey(req);
  if (authError) {
    return authError;
  }

  try {
    const body = await req.json();
    const shadowUserId = body.shadowUserId;

    if (!shadowUserId) {
      return NextResponse.json(
        { error: "shadowUserId is required" },
        { status: 400 },
      );
    }

    // Verify shadow account userId format
    if (!shadowUserId.startsWith("shadow_")) {
      return NextResponse.json(
        { error: "Invalid shadow account userId format" },
        { status: 400 },
      );
    }

    // Call Convex mutation to migrate shadow account
    // Note: The mutation will verify authentication internally
    const result = await callConvexMutation(
      "shadow_accounts/migrateShadowAccountToUser",
      {
        shadowUserId: shadowUserId,
      },
    );

    return NextResponse.json({
      success: true,
      migrated: result.value.migrated,
    });
  } catch (error) {
    console.error("❌ Shadow account migration failed:", error);
    return NextResponse.json(
      {
        error: "Failed to migrate shadow account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
