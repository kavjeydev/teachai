import { TrainlyConfig, Citation, UploadResult } from "../types";

interface QueryResponse {
  answer: string;
  citations?: Citation[];
}

export class TrainlyClient {
  private config: TrainlyConfig;
  private scopedToken: string | null = null;
  private currentUserId: string | null = null;
  private isV1Mode: boolean = false;

  constructor(config: TrainlyConfig) {
    this.config = config;
  }

  /**
   * NEW: Connect using V1 Trusted Issuer authentication with OAuth ID token
   * This method allows users to authenticate directly with their OAuth provider tokens
   */
  async connectWithOAuthToken(idToken: string): Promise<void> {
    if (!this.config.appId) {
      throw new Error("appId is required for V1 authentication.");
    }

    // For V1, we use the ID token directly - no need to provision
    this.scopedToken = idToken;
    this.isV1Mode = true;

    // Get user profile to verify token works and extract user info
    const response = await fetch(`${this.config.baseUrl}/v1/me/profile`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        "X-App-ID": this.config.appId,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `V1 authentication failed: ${error.detail || response.statusText}`,
      );
    }

    const profile = await response.json();
    this.currentUserId = profile.user_id;

    console.log(
      "✅ Connected to Trainly with V1 Trusted Issuer authentication",
    );
    console.log(`📋 User ID: ${profile.user_id}`);
    console.log(`💬 Chat ID: ${profile.chat_id}`);
    console.log(`🔒 OAuth Provider: ${profile.issuer}`);
  }

  async connect(): Promise<void> {
    if (this.config.apiKey) {
      // Direct API key mode - no additional setup needed
      this.scopedToken = this.config.apiKey;
      return;
    }

    if (!this.config.appSecret) {
      throw new Error("Either appSecret or apiKey must be provided");
    }

    // App secret mode - provision user
    // Ensure we use the same user ID consistently
    if (!this.currentUserId) {
      this.currentUserId = this.config.userId || this.generateAnonymousId();
    }

    const response = await fetch(
      `${this.config.baseUrl}/v1/privacy/apps/users/provision`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.appSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          end_user_id: this.currentUserId,
          capabilities: ["ask", "upload"],
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to connect: ${error.detail || response.statusText}`,
      );
    }

    const data = await response.json();
    this.scopedToken = data.scoped_token;
  }

  async ask(
    question: string,
    options: { includeCitations?: boolean } = {},
  ): Promise<QueryResponse> {
    if (!this.scopedToken) {
      throw new Error(
        "Not connected. Call connect() or connectWithOAuthToken() first.",
      );
    }

    // NEW: V1 Trusted Issuer mode
    if (this.isV1Mode && this.config.appId) {
      const response = await fetch(`${this.config.baseUrl}/v1/me/chats/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.scopedToken}`,
          "X-App-ID": this.config.appId,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          messages: JSON.stringify([{ role: "user", content: question }]),
          response_tokens: "150",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `V1 query failed: ${error.detail || response.statusText}`,
        );
      }

      const data = await response.json();
      return {
        answer: data.answer,
        citations: data.citations || [],
      };
    }

    // Original logic for API key and app secret modes
    const url = this.config.apiKey
      ? `${this.config.baseUrl}/v1/${this.extractChatId()}/answer_question`
      : `${this.config.baseUrl}/v1/privacy/query`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const body: any = { question };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    } else {
      headers["x-scoped-token"] = this.scopedToken;
      // Use the same user ID that was used during provisioning
      body.end_user_id =
        this.currentUserId || this.config.userId || this.generateAnonymousId();
      body.include_citations = options.includeCitations || false;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Query failed: ${error.detail || response.statusText}`);
    }

    const data = await response.json();

    return {
      answer: data.answer,
      citations: data.citations || [],
    };
  }

  async upload(file: File): Promise<UploadResult> {
    if (!this.scopedToken) {
      throw new Error(
        "Not connected. Call connect() or connectWithOAuthToken() first.",
      );
    }

    // NEW: V1 Trusted Issuer mode
    if (this.isV1Mode && this.config.appId) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${this.config.baseUrl}/v1/me/chats/files/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.scopedToken}`,
            "X-App-ID": this.config.appId,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `V1 upload failed: ${error.detail || response.statusText}`,
        );
      }

      const data = await response.json();
      return {
        success: data.success,
        filename: data.filename,
        size: data.size_bytes,
        message:
          data.message || "File uploaded to your permanent private subchat",
      };
    }

    // Original logic for API key and app secret modes
    if (this.config.apiKey) {
      // Direct API mode - upload to specific chat
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${this.config.baseUrl}/v1/${this.extractChatId()}/upload_file`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Upload failed: ${error.detail || response.statusText}`,
        );
      }

      return {
        success: true,
        filename: file.name,
        size: file.size,
        message: "File uploaded successfully",
      };
    } else {
      // Privacy mode - upload to user's private workspace
      const presignedResponse = await fetch(
        `${this.config.baseUrl}/v1/privacy/upload/presigned-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-scoped-token": this.scopedToken,
          },
          body: JSON.stringify({
            end_user_id:
              this.currentUserId ||
              this.config.userId ||
              this.generateAnonymousId(),
            filename: file.name,
            file_type: file.type,
          }),
        },
      );

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(
          `Failed to get upload URL: ${error.detail || presignedResponse.statusText}`,
        );
      }

      const { upload_url, upload_headers } = await presignedResponse.json();

      // Upload to presigned URL using FormData (as backend expects)
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(upload_url, {
        method: "POST",
        body: formData,
        headers: {
          ...upload_headers, // Include required headers from backend
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      return {
        success: true,
        filename: file.name,
        size: file.size,
        message: "File uploaded to your private workspace",
      };
    }
  }

  private extractChatId(): string {
    if (!this.config.apiKey) {
      throw new Error("API key not provided");
    }
    // Extract chat ID from API key format: tk_chat_id_rest
    const parts = this.config.apiKey.split("_");
    if (parts.length < 3) {
      throw new Error("Invalid API key format");
    }
    return parts[1];
  }

  private generateAnonymousId(): string {
    return `anon_${Math.random().toString(36).substr(2, 9)}`;
  }
}
