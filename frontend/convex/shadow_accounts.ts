import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Shadow Account Creation
 * Creates accounts programmatically without requiring user sign-up through Trainly
 */

// Generate secure app secret
function generateAppSecret(): string {
  return `as_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 16)}`;
}

// Generate secure JWT secret (64-character hex string)
function generateJwtSecret(): string {
  const bytes = new Array(32)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate app ID
function generateAppId(): string {
  return `app_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
}

// Generate API key for chat
function generateApiKey(): string {
  return `tk_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 16)}`;
}

// Generate unique user ID for shadow account
function generateUserId(): string {
  return `shadow_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 12)}`;
}

// Create a shadow account
export const createShadowAccount = mutation({
  args: {
    userId: v.optional(v.string()), // Optional - will generate if not provided
    email: v.optional(v.string()), // Email address for linking shadow account to real account
  },
  handler: async (ctx, args) => {
    // Generate userId if not provided
    const userId = args.userId || generateUserId();

    // If email is provided, check if shadow account already exists for this email
    if (args.email) {
      const existingShadowAccount = await ctx.db
        .query("shadow_accounts")
        .withIndex("by_email", (q) => q.eq("email", args.email!.toLowerCase()))
        .filter((q) => q.eq(q.field("migrated"), false))
        .first();

      if (existingShadowAccount) {
        throw new Error("Shadow account already exists for this email address");
      }
    }

    // 1. Create user credits (500 credits)
    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("user_credits", {
      userId: userId,
      totalCredits: 500,
      usedCredits: 0,
      periodStart: now,
      periodEnd: periodEnd,
      lastResetAt: now,
      updatedAt: now,
    });

    // 2. Create organization "Default"
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 8);
    const uniqueOrgId = `org_${timestamp}_${randomPart}`;

    const organizationId = await ctx.db.insert("organizations", {
      organizationId: uniqueOrgId,
      name: "Default",
      userId: userId,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Create chat "Default App" under that org
    const chatTimestamp = Date.now().toString(36);
    const chatRandomPart = Math.random().toString(36).substr(2, 8);
    const uniqueChatId = `chat_${chatTimestamp}_${chatRandomPart}`;

    // Generate API key for the chat
    const apiKey = generateApiKey();

    const chatId = await ctx.db.insert("chats", {
      chatId: uniqueChatId,
      title: "Default App",
      userId: userId,
      organizationId: organizationId,
      isArchived: false,
      content: [],
      apiInfo: {
        visibility: "protected",
      },
      apiKey: apiKey,
      apiKeyDisabled: false,
      hasApiAccess: true,
      visibility: "private",
      // Initialize metadata
      metadata: {
        totalSubchats: 0,
        activeUsers: 0,
        totalUsers: 0,
        totalFiles: 0,
        totalStorageBytes: 0,
        totalQueries: 0,
        queriesLast7Days: 0,
        lastActivityAt: now,
        userActivitySummary: [],
        fileTypeStats: {
          pdf: 0,
          docx: 0,
          txt: 0,
          images: 0,
          other: 0,
        },
        privacyMode: "privacy_first",
        lastMetadataUpdate: now,
        complianceFlags: {
          gdprCompliant: true,
          ccpaCompliant: true,
          auditLogEnabled: true,
        },
      },
    });

    // 4. Create app for that chat with API key
    const appId = generateAppId();
    const appSecret = generateAppSecret();
    const jwtSecret = generateJwtSecret();

    const defaultSettings = {
      allowDirectUploads: true,
      maxUsersPerApp: 10000,
      allowedCapabilities: ["ask", "upload"],
    };

    // Ensure chat has published settings
    await ctx.db.patch(chatId, {
      publishedSettings: {
        selectedModel: "gpt-4o-mini",
        customPrompt: undefined,
        temperature: 0.7,
        maxTokens: 1000,
        conversationHistoryLimit: 10,
        context: [],
        publishedAt: now,
        publishedBy: userId,
      },
      hasUnpublishedChanges: false,
    });

    const app = await ctx.db.insert("apps", {
      appId,
      name: "Default App",
      description: "Default app created for shadow account",
      developerId: userId,
      appSecret,
      jwtSecret,
      parentChatId: chatId,
      isActive: true,
      isApiDisabled: false,
      createdAt: now,
      status: "live",
      publishedAt: now,
      publishedBy: userId,
      settings: defaultSettings,
      publishedSettings: defaultSettings,
    });

    // Store email mapping if provided
    if (args.email) {
      await ctx.db.insert("shadow_accounts", {
        shadowUserId: userId,
        email: args.email.toLowerCase(), // Store lowercase for case-insensitive lookup
        createdAt: now,
        migrated: false,
      });
    }

    // Return all required information
    return {
      userId,
      organizationId: uniqueOrgId, // String organizationId
      organizationConvexId: organizationId, // Convex document ID
      organizationName: "Default",
      chatId: uniqueChatId, // String chatId
      chatConvexId: chatId, // Convex document ID
      chatTitle: "Default App",
      appId,
      appSecret, // App secret (API key for the app)
      jwtSecret,
      apiKey, // API key for the chat
      credits: 500,
    };
  },
});

// Create a shadow account with 10k credits
export const createShadowAccount10k = mutation({
  args: {
    userId: v.optional(v.string()), // Optional - will generate if not provided
    email: v.optional(v.string()), // Email address for linking shadow account to real account
  },
  handler: async (ctx, args) => {
    // Generate userId if not provided
    const userId = args.userId || generateUserId();

    // If email is provided, check if shadow account already exists for this email
    if (args.email) {
      const existingShadowAccount = await ctx.db
        .query("shadow_accounts")
        .withIndex("by_email", (q) => q.eq("email", args.email!.toLowerCase()))
        .filter((q) => q.eq(q.field("migrated"), false))
        .first();

      if (existingShadowAccount) {
        throw new Error("Shadow account already exists for this email address");
      }
    }

    // 1. Create user credits (10,000 credits)
    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("user_credits", {
      userId: userId,
      totalCredits: 10000,
      usedCredits: 0,
      periodStart: now,
      periodEnd: periodEnd,
      lastResetAt: now,
      updatedAt: now,
    });

    // 2. Create organization "Default"
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 8);
    const uniqueOrgId = `org_${timestamp}_${randomPart}`;

    const organizationId = await ctx.db.insert("organizations", {
      organizationId: uniqueOrgId,
      name: "Default",
      userId: userId,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Create chat "Default App" under that org
    const chatTimestamp = Date.now().toString(36);
    const chatRandomPart = Math.random().toString(36).substr(2, 8);
    const uniqueChatId = `chat_${chatTimestamp}_${chatRandomPart}`;

    // Generate API key for the chat
    const apiKey = generateApiKey();

    const chatId = await ctx.db.insert("chats", {
      chatId: uniqueChatId,
      title: "Default App",
      userId: userId,
      organizationId: organizationId,
      isArchived: false,
      content: [],
      apiInfo: {
        visibility: "protected",
      },
      apiKey: apiKey,
      apiKeyDisabled: false,
      hasApiAccess: true,
      visibility: "private",
      // Initialize metadata
      metadata: {
        totalSubchats: 0,
        activeUsers: 0,
        totalUsers: 0,
        totalFiles: 0,
        totalStorageBytes: 0,
        totalQueries: 0,
        queriesLast7Days: 0,
        lastActivityAt: now,
        userActivitySummary: [],
        fileTypeStats: {
          pdf: 0,
          docx: 0,
          txt: 0,
          images: 0,
          other: 0,
        },
        privacyMode: "privacy_first",
        lastMetadataUpdate: now,
        complianceFlags: {
          gdprCompliant: true,
          ccpaCompliant: true,
          auditLogEnabled: true,
        },
      },
    });

    // 4. Create app for that chat with API key
    const appId = generateAppId();
    const appSecret = generateAppSecret();
    const jwtSecret = generateJwtSecret();

    const defaultSettings = {
      allowDirectUploads: true,
      maxUsersPerApp: 10000,
      allowedCapabilities: ["ask", "upload"],
    };

    // Ensure chat has published settings
    await ctx.db.patch(chatId, {
      publishedSettings: {
        selectedModel: "gpt-4o-mini",
        customPrompt: undefined,
        temperature: 0.7,
        maxTokens: 1000,
        conversationHistoryLimit: 10,
        context: [],
        publishedAt: now,
        publishedBy: userId,
      },
      hasUnpublishedChanges: false,
    });

    const app = await ctx.db.insert("apps", {
      appId,
      name: "Default App",
      description: "Default app created for shadow account",
      developerId: userId,
      appSecret,
      jwtSecret,
      parentChatId: chatId,
      isActive: true,
      isApiDisabled: false,
      createdAt: now,
      status: "live",
      publishedAt: now,
      publishedBy: userId,
      settings: defaultSettings,
      publishedSettings: defaultSettings,
    });

    // Store email mapping if provided
    if (args.email) {
      await ctx.db.insert("shadow_accounts", {
        shadowUserId: userId,
        email: args.email.toLowerCase(), // Store lowercase for case-insensitive lookup
        createdAt: now,
        migrated: false,
      });
    }

    // Return all required information
    return {
      userId,
      organizationId: uniqueOrgId, // String organizationId
      organizationConvexId: organizationId, // Convex document ID
      organizationName: "Default",
      chatId: uniqueChatId, // String chatId
      chatConvexId: chatId, // Convex document ID
      chatTitle: "Default App",
      appId,
      appSecret, // App secret (API key for the app)
      jwtSecret,
      apiKey, // API key for the chat
      credits: 10000,
    };
  },
});

/**
 * Migrate shadow account data to authenticated user account
 * This should be called when a shadow account user signs up with Trainly
 */
export const migrateShadowAccountToUser = mutation({
  args: {
    shadowUserId: v.string(), // The shadow account userId to migrate from
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const authenticatedUserId = identity.subject;
    const shadowUserId = args.shadowUserId;

    // Verify shadow account exists and starts with "shadow_"
    if (!shadowUserId.startsWith("shadow_")) {
      throw new Error("Invalid shadow account userId");
    }

    // 1. Migrate credits - merge balances
    const shadowCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", shadowUserId))
      .first();

    const userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", authenticatedUserId))
      .first();

    if (shadowCredits) {
      if (userCredits) {
        // Merge credits: add shadow credits to existing user credits
        const mergedTotalCredits = userCredits.totalCredits + shadowCredits.totalCredits;
        const mergedUsedCredits = userCredits.usedCredits + shadowCredits.usedCredits;

        await ctx.db.patch(userCredits._id, {
          totalCredits: mergedTotalCredits,
          usedCredits: mergedUsedCredits,
          updatedAt: Date.now(),
        });
      } else {
        // Transfer shadow credits to new user account
        await ctx.db.insert("user_credits", {
          userId: authenticatedUserId,
          totalCredits: shadowCredits.totalCredits,
          usedCredits: shadowCredits.usedCredits,
          periodStart: shadowCredits.periodStart,
          periodEnd: shadowCredits.periodEnd,
          lastResetAt: shadowCredits.lastResetAt,
          updatedAt: Date.now(),
        });
      }
    }

    // 2. Migrate organizations - update userId
    const shadowOrgs = await ctx.db
      .query("organizations")
      .withIndex("by_user", (q) => q.eq("userId", shadowUserId))
      .collect();

    for (const org of shadowOrgs) {
      await ctx.db.patch(org._id, {
        userId: authenticatedUserId,
        updatedAt: Date.now(),
      });
    }

    // 3. Migrate chats - update userId and organizationId if needed
    const shadowChats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", shadowUserId))
      .collect();

    for (const chat of shadowChats) {
      await ctx.db.patch(chat._id, {
        userId: authenticatedUserId,
        // organizationId stays the same since we already migrated organizations
      });
    }

    // 4. Migrate apps - update developerId
    const shadowApps = await ctx.db
      .query("apps")
      .withIndex("by_developer", (q) => q.eq("developerId", shadowUserId))
      .collect();

    for (const app of shadowApps) {
      await ctx.db.patch(app._id, {
        developerId: authenticatedUserId,
        publishedBy: authenticatedUserId,
      });
    }

    // 5. Migrate credit transactions
    const shadowTransactions = await ctx.db
      .query("credit_transactions")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", shadowUserId))
      .collect();

    for (const transaction of shadowTransactions) {
      await ctx.db.patch(transaction._id, {
        userId: authenticatedUserId,
      });
    }

    // 6. Migrate integration keys
    const shadowKeys = await ctx.db
      .query("integration_keys")
      .withIndex("by_user", (q) => q.eq("userId", shadowUserId))
      .collect();

    for (const key of shadowKeys) {
      await ctx.db.patch(key._id, {
        userId: authenticatedUserId,
      });
    }

    // 7. Migrate user auth tokens
    const shadowTokens = await ctx.db
      .query("user_auth_tokens")
      .withIndex("by_user", (q) => q.eq("trainlyUserId", shadowUserId))
      .collect();

    for (const token of shadowTokens) {
      await ctx.db.patch(token._id, {
        trainlyUserId: authenticatedUserId,
      });
    }

    // 8. Migrate user app authorizations
    const shadowAuthorizations = await ctx.db
      .query("user_app_authorizations")
      .withIndex("by_user", (q) => q.eq("trainlyUserId", shadowUserId))
      .collect();

    for (const auth of shadowAuthorizations) {
      await ctx.db.patch(auth._id, {
        trainlyUserId: authenticatedUserId,
      });
    }

    // 9. Migrate user app chats
    const shadowUserAppChats = await ctx.db
      .query("user_app_chats")
      .withIndex("by_user", (q) => q.eq("endUserId", shadowUserId))
      .collect();

    for (const userAppChat of shadowUserAppChats) {
      await ctx.db.patch(userAppChat._id, {
        endUserId: authenticatedUserId,
      });
    }

    // 10. Migrate file storage tracking
    const shadowFileStorage = await ctx.db
      .query("user_file_storage")
      .withIndex("by_user", (q) => q.eq("userId", shadowUserId))
      .first();

    if (shadowFileStorage) {
      const userFileStorage = await ctx.db
        .query("user_file_storage")
        .withIndex("by_user", (q) => q.eq("userId", authenticatedUserId))
        .first();

      if (userFileStorage) {
        // Merge file storage data
        await ctx.db.patch(userFileStorage._id, {
          totalFileSizeBytes: userFileStorage.totalFileSizeBytes + shadowFileStorage.totalFileSizeBytes,
          fileCount: userFileStorage.fileCount + shadowFileStorage.fileCount,
          lastUpdated: Date.now(),
        });
      } else {
        // Transfer shadow file storage to new user
        await ctx.db.insert("user_file_storage", {
          userId: authenticatedUserId,
          totalFileSizeBytes: shadowFileStorage.totalFileSizeBytes,
          fileCount: shadowFileStorage.fileCount,
          lastUpdated: Date.now(),
        });
      }
    }

    // Mark shadow account as migrated
    const shadowAccountRecord = await ctx.db
      .query("shadow_accounts")
      .withIndex("by_shadow_user", (q) => q.eq("shadowUserId", shadowUserId))
      .first();

    if (shadowAccountRecord) {
      await ctx.db.patch(shadowAccountRecord._id, {
        migrated: true,
        migratedAt: Date.now(),
        migratedToUserId: authenticatedUserId,
      });
    }

    return {
      success: true,
      migrated: {
        credits: !!shadowCredits,
        organizations: shadowOrgs.length,
        chats: shadowChats.length,
        apps: shadowApps.length,
        transactions: shadowTransactions.length,
        integrationKeys: shadowKeys.length,
        authTokens: shadowTokens.length,
        authorizations: shadowAuthorizations.length,
        userAppChats: shadowUserAppChats.length,
        fileStorage: !!shadowFileStorage,
      },
    };
  },
});

/**
 * Check if user has a shadow account and migrate it automatically
 * This should be called during user initialization
 */
export const checkAndMigrateShadowAccount = mutation({
  args: {
    shadowUserId: v.optional(v.string()), // Optional shadow userId to check
    email: v.optional(v.string()), // Optional email to check for shadow account
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const authenticatedUserId = identity.subject;

    // If email is provided, try to find and migrate by email first
    if (args.email) {
      try {
        // Find shadow account by email
        const shadowAccount = await ctx.db
          .query("shadow_accounts")
          .withIndex("by_email", (q) => q.eq("email", args.email!.toLowerCase()))
          .filter((q) => q.eq(q.field("migrated"), false))
          .first();

        if (shadowAccount) {
          const result = await (ctx as any).runMutation("shadow_accounts/migrateShadowAccountToUser", {
            shadowUserId: shadowAccount.shadowUserId,
          });

          // Mark shadow account as migrated
          await ctx.db.patch(shadowAccount._id, {
            migrated: true,
            migratedAt: Date.now(),
            migratedToUserId: authenticatedUserId,
          });

          return {
            migrated: true,
            shadowUserId: shadowAccount.shadowUserId,
            details: result,
          };
        }
      } catch (error) {
        console.error("Failed to migrate shadow account by email:", error);
      }
    }

    // If shadowUserId is provided, try to migrate it
    if (args.shadowUserId) {
      try {
        const result = await (ctx as any).runMutation("shadow_accounts/migrateShadowAccountToUser", {
          shadowUserId: args.shadowUserId,
        });
        return {
          migrated: true,
          shadowUserId: args.shadowUserId,
          details: result,
        };
      } catch (error) {
        // Shadow account might not exist or already migrated
        return {
          migrated: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Otherwise, check if user already has credits (might be from shadow account)
    const existingCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", authenticatedUserId))
      .first();

    if (existingCredits) {
      // User already has credits, might be from shadow account or already initialized
      return {
        migrated: false,
        alreadyHasCredits: true,
      };
    }

    return {
      migrated: false,
      noShadowAccount: true,
    };
  },
});

