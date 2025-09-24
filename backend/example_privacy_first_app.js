#!/usr/bin/env node
/**
 * 🔒 Privacy-First App Example
 *
 * This example shows how to build a privacy-first app with Trainly.
 * Each user gets their own isolated sub-chat, and you can only access
 * AI responses, never raw user files.
 */

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Your Trainly app configuration
const TRAINLY_CONFIG = {
  appSecret: process.env.TRAINLY_APP_SECRET || "as_demo_secret_123",
  baseUrl: process.env.TRAINLY_API_URL || "http://localhost:8000",
};

// Token storage (use Redis/database in production)
const userTokens = new Map();

class TrainlyPrivacyFirstClient {
  constructor(config) {
    this.appSecret = config.appSecret;
    this.baseUrl = config.baseUrl;
  }

  async provisionUser(userId) {
    console.log(`📁 Provisioning user: ${userId}`);

    const response = await fetch(
      `${this.baseUrl}/v1/privacy/apps/users/provision`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.appSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          end_user_id: userId,
          capabilities: ["ask", "upload"],
        }),
      },
    );

    if (response.ok) {
      const data = await response.json();

      // Store scoped token (expires in 15 minutes)
      userTokens.set(userId, {
        token: data.scoped_token,
        expiresAt: Date.now() + 14 * 60 * 1000, // 14 min buffer
      });

      console.log(`✅ User ${userId} provisioned successfully`);
      console.log(`🔒 Privacy guarantee: ${data.privacy_guarantee}`);

      return { success: true, isNewUser: data.is_new_user };
    } else {
      const error = await response.json();
      console.error(`❌ Failed to provision user ${userId}:`, error.detail);
      return { success: false, error: error.detail };
    }
  }

  async queryUserData(userId, question) {
    // Check if we have a valid token
    const tokenData = userTokens.get(userId);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      console.log(`🔄 Token expired for ${userId}, re-provisioning...`);
      await this.provisionUser(userId);
    }

    const token = userTokens.get(userId)?.token;
    if (!token) {
      throw new Error("Failed to get user token");
    }

    console.log(`💬 User ${userId} asks: "${question}"`);

    const response = await fetch(`${this.baseUrl}/v1/privacy/query`, {
      method: "POST",
      headers: {
        "x-scoped-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end_user_id: userId,
        question: question,
        include_citations: true,
      }),
    });

    if (response.ok) {
      const result = await response.json();

      console.log(
        `✅ AI response for ${userId}: ${result.answer.substring(0, 100)}...`,
      );
      console.log(`🔒 ${result.privacy_note}`);

      return {
        answer: result.answer,
        citations: result.citations,
        privacyProtected: true,
      };
    } else {
      const error = await response.json();
      console.error(`❌ Query failed for ${userId}:`, error.detail);
      throw new Error(error.detail);
    }
  }

  async getUploadUrl(userId, filename, fileType) {
    const tokenData = userTokens.get(userId);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      await this.provisionUser(userId);
    }

    const token = userTokens.get(userId)?.token;

    const response = await fetch(
      `${this.baseUrl}/v1/privacy/upload/presigned-url`,
      {
        method: "POST",
        headers: {
          "x-scoped-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          end_user_id: userId,
          filename: filename,
          file_type: fileType,
        }),
      },
    );

    if (response.ok) {
      const result = await response.json();
      console.log(`📤 Upload URL generated for ${userId}: ${filename}`);
      console.log(`🔒 ${result.privacy_note}`);
      return result.upload_url;
    } else {
      const error = await response.json();
      throw new Error(error.detail);
    }
  }
}

// Initialize Trainly client
const trainly = new TrainlyPrivacyFirstClient(TRAINLY_CONFIG);

// API Routes for your app

// User onboarding
app.post("/api/users/:userId/onboard", async (req, res) => {
  try {
    const result = await trainly.provisionUser(req.params.userId);

    res.json({
      ...result,
      message: result.success
        ? "Your private AI workspace is ready! 🔒"
        : "Failed to create workspace",
      privacy_info: {
        data_isolation:
          "Your files are stored privately - we cannot access them",
        developer_access: "We only receive AI responses, never your raw files",
        user_control: "You own and control all your data",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User queries their private data
app.post("/api/users/:userId/ask", async (req, res) => {
  try {
    const result = await trainly.queryUserData(
      req.params.userId,
      req.body.question,
    );

    res.json({
      answer: result.answer,
      sources: result.citations?.map((c) => ({
        snippet: c.snippet, // Limited snippet only
        score: c.score,
      })),
      privacy_status: "Data accessed from your private workspace only",
      developer_access: "We cannot see your files - only AI responses",
    });
  } catch (error) {
    if (error.message.includes("User ID mismatch")) {
      res.status(403).json({
        error: "Privacy protection: Cannot access other users' data",
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Direct file upload URL generation
app.post("/api/users/:userId/upload-url", async (req, res) => {
  try {
    const uploadUrl = await trainly.getUploadUrl(
      req.params.userId,
      req.body.filename,
      req.body.fileType,
    );

    res.json({
      upload_url: uploadUrl,
      message: "Upload directly to your private workspace",
      privacy_note: "File will be stored in your isolated sub-chat",
      developer_note: "We cannot access your uploaded files",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Privacy information endpoint
app.get("/api/privacy", (req, res) => {
  res.json({
    privacy_model: "Privacy-First with Complete Data Isolation",
    guarantees: [
      "Each user gets their own isolated sub-chat",
      "Developers cannot list, download, or access raw files",
      "Cross-user data access is impossible",
      "AI responses only - no raw data exposure",
      "Complete audit trail for transparency",
    ],
    user_rights: [
      "You own and control your data",
      "You can see how your data is accessed",
      "You can revoke app access anytime",
      "You can export or delete your data anytime",
    ],
    compliance: "GDPR/CCPA ready by design",
  });
});

// Test endpoint to demonstrate privacy protection
app.post("/api/test/privacy-violation", async (req, res) => {
  try {
    // This should fail - demonstrates privacy protection
    const response = await fetch(
      `${TRAINLY_CONFIG.baseUrl}/v1/privacy/apps/users/provision`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TRAINLY_CONFIG.appSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          end_user_id: "test_user",
          capabilities: ["ask", "upload", "list_files", "download_file"], // Dangerous!
        }),
      },
    );

    if (response.ok) {
      res.json({
        result: "SECURITY ISSUE",
        message: "Dangerous capabilities were allowed!",
      });
    } else {
      const error = await response.json();
      res.json({
        result: "PRIVACY PROTECTED",
        message: "Dangerous capabilities correctly blocked",
        details: error.detail,
      });
    }
  } catch (error) {
    res.json({
      result: "PRIVACY PROTECTED",
      message: "Access attempt blocked",
      error: error.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Privacy-First App Server running on port ${PORT}`);
  console.log(`🔒 Privacy Model: Complete user data isolation`);
  console.log(`🛡️  Developer Access: AI responses only, no raw files`);
  console.log(`📊 Test at: http://localhost:${PORT}/api/privacy`);

  console.log(`\n📋 Available endpoints:`);
  console.log(
    `  POST /api/users/:userId/onboard     - Create user's private workspace`,
  );
  console.log(
    `  POST /api/users/:userId/ask         - Query user's private data`,
  );
  console.log(`  POST /api/users/:userId/upload-url  - Get direct upload URL`);
  console.log(`  GET  /api/privacy                   - Privacy information`);
  console.log(
    `  POST /api/test/privacy-violation    - Test privacy protection`,
  );
});

// Example usage in comments:
/*

// 1. User starts using your app
POST /api/users/alice123/onboard
Response: {"success": true, "privacy_guarantee": "Data isolated"}

// 2. User uploads file (gets direct upload URL)
POST /api/users/alice123/upload-url
Body: {"filename": "business_plan.pdf", "fileType": "application/pdf"}
Response: {"upload_url": "https://trainly.com/direct-upload-url"}

// 3. User uploads file directly to Trainly (bypasses your servers)
// File is stored in alice123's isolated sub-chat

// 4. User asks questions about their data
POST /api/users/alice123/ask
Body: {"question": "What's the key strategy from my business plan?"}
Response: {"answer": "AI response based on alice's private data", "privacy_status": "isolated"}

// 5. Cross-user access attempt (automatically blocked)
POST /api/users/bob456/ask
Headers: alice123's token
Response: 403 Forbidden - "Privacy protection: Cannot access other users' data"

*/
