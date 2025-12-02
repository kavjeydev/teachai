import { NextRequest, NextResponse } from "next/server";
import { verifyBackendApiKey } from "@/lib/api-auth";
import { clerkClient } from "@clerk/nextjs/server";

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
 * POST /api/shadow-accounts-10k
 * Creates a shadow account with 10,000 credits without requiring user sign-up through Trainly
 *
 * Request body (optional):
 * {
 *   "userId": "optional_user_id", // If not provided, will be auto-generated
 *   "email": "user@example.com" // Email address for linking shadow account to real account
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "userId": "shadow_xxx",
 *   "organizationId": "org_xxx", // String organizationId
 *   "organizationConvexId": "jxxx", // Convex document ID
 *   "organizationName": "Default",
 *   "chatId": "chat_xxx", // String chatId (this is what you requested)
 *   "chatConvexId": "jxxx", // Convex document ID
 *   "chatTitle": "Default App",
 *   "appId": "app_xxx",
 *   "appSecret": "as_xxx", // App secret (API key for the app)
 *   "jwtSecret": "xxx",
 *   "apiKey": "tk_xxx", // API key for the chat
 *   "credits": 10000
 * }
 */
export async function POST(req: NextRequest) {
  // Verify backend API key authentication
  const authError = verifyBackendApiKey(req);
  if (authError) {
    return authError;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId; // Optional
    const email = body.email; // Optional

    let result;

    // If email is provided, check if user already exists in Clerk
    if (email) {
      try {
        const clerk = await clerkClient();
        // Search for user by email address
        // Clerk's getUserList supports query parameter for searching
        let matchingUser = null;
        let hasMore = true;
        let offset = 0;
        const limit = 100;

        // Search through users with pagination until we find a match or exhaust all users
        while (hasMore && !matchingUser) {
          const users = await clerk.users.getUserList({
            limit,
            offset,
          });

          // Find user with matching email
          matchingUser = users.data.find((user) =>
            user.emailAddresses.some(
              (addr) => addr.emailAddress.toLowerCase() === email.toLowerCase()
            )
          );

          hasMore = users.data.length === limit;
          offset += limit;

          // Safety limit: don't search more than 1000 users
          if (offset >= 1000) {
            break;
          }
        }

        if (matchingUser) {
          // User exists - add template purchase to their existing account
          const existingUserId = matchingUser.id;
          result = await callConvexMutation("shadow_accounts/addTemplatePurchaseToUser", {
            userId: existingUserId,
            credits: 10000,
          });
        } else {
          // User doesn't exist - create shadow account
          result = await callConvexMutation("shadow_accounts/createShadowAccount10k", {
            userId: userId,
            email: email,
          });
        }
      } catch (clerkError) {
        console.error("❌ Clerk API error:", clerkError);
        // If Clerk check fails, fall back to creating shadow account
        result = await callConvexMutation("shadow_accounts/createShadowAccount10k", {
          userId: userId,
          email: email,
        });
      }
    } else {
      // No email provided - create shadow account
      result = await callConvexMutation("shadow_accounts/createShadowAccount10k", {
        userId: userId,
        email: email,
      });
    }

    // Return the result with all required information
    return NextResponse.json({
      success: true,
      userId: result.value.userId,
      organizationId: result.value.organizationId, // String organizationId
      organizationConvexId: result.value.organizationConvexId, // Convex document ID
      organizationName: result.value.organizationName,
      chatId: result.value.chatId, // String chatId (this is what the user requested)
      chatConvexId: result.value.chatConvexId, // Convex document ID
      chatTitle: result.value.chatTitle,
      appId: result.value.appId,
      appSecret: result.value.appSecret, // App secret (API key for the app)
      jwtSecret: result.value.jwtSecret,
      apiKey: result.value.apiKey, // API key for the chat
      credits: result.value.credits,
    });
  } catch (error) {
    console.error("❌ Shadow account creation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to create shadow account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

