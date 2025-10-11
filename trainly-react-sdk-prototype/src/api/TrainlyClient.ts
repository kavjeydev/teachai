import {
  TrainlyConfig,
  Citation,
  UploadResult,
  FileListResult,
  FileDeleteResult,
  BulkUploadResult,
  BulkUploadFileResult,
  TextContent,
} from "../types";

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
    options: {
      includeCitations?: boolean;
      scope_filters?: Record<string, string | number | boolean>;
    } = {},
  ): Promise<QueryResponse> {
    if (!this.scopedToken) {
      throw new Error(
        "Not connected. Call connect() or connectWithOAuthToken() first.",
      );
    }

    // NEW: V1 Trusted Issuer mode
    if (this.isV1Mode && this.config.appId) {
      const params: Record<string, string> = {
        messages: JSON.stringify([{ role: "user", content: question }]),
        response_tokens: "150",
      };

      // Add scope filters if provided
      if (
        options.scope_filters &&
        Object.keys(options.scope_filters).length > 0
      ) {
        params.scope_filters = JSON.stringify(options.scope_filters);
      }

      const response = await fetch(`${this.config.baseUrl}/v1/me/chats/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.scopedToken}`,
          "X-App-ID": this.config.appId,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
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

  async upload(
    file: File,
    scopeValues?: Record<string, string | number | boolean>,
  ): Promise<UploadResult> {
    if (!this.scopedToken) {
      throw new Error(
        "Not connected. Call connect() or connectWithOAuthToken() first.",
      );
    }

    // NEW: V1 Trusted Issuer mode
    if (this.isV1Mode && this.config.appId) {
      const formData = new FormData();
      formData.append("file", file);

      // Add scope values if provided
      if (scopeValues && Object.keys(scopeValues).length > 0) {
        formData.append("scope_values", JSON.stringify(scopeValues));
      }

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

      // Add scope values if provided
      if (scopeValues && Object.keys(scopeValues).length > 0) {
        formData.append("scope_values", JSON.stringify(scopeValues));
      }

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

  async uploadText(
    text: string,
    contentName: string,
    scopeValues?: Record<string, string | number | boolean>,
  ): Promise<UploadResult> {
    if (!this.scopedToken) {
      throw new Error(
        "Not connected. Call connect() or connectWithOAuthToken() first.",
      );
    }

    // NEW: V1 Trusted Issuer mode
    if (this.isV1Mode && this.config.appId) {
      const formData = new FormData();
      formData.append("text_content", text);
      formData.append("content_name", contentName);

      // Add scope values if provided
      if (scopeValues && Object.keys(scopeValues).length > 0) {
        formData.append("scope_values", JSON.stringify(scopeValues));
      }

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
          `V1 text upload failed: ${error.detail || response.statusText}`,
        );
      }

      const data = await response.json();
      return {
        success: data.success,
        filename: data.filename,
        size: data.size_bytes,
        message:
          data.message ||
          "Text content uploaded to your permanent private subchat",
      };
    }

    // For non-V1 modes, text upload is not yet supported
    throw new Error(
      "Text upload is currently only available in V1 Trusted Issuer mode",
    );
  }

  async bulkUploadFiles(
    files: File[],
    scopeValues?: Record<string, string | number | boolean>,
  ): Promise<BulkUploadResult> {
    if (!this.scopedToken) {
      throw new Error(
        "Not connected. Call connect() or connectWithOAuthToken() first.",
      );
    }

    if (!files || files.length === 0) {
      throw new Error("No files provided for bulk upload.");
    }

    if (files.length > 10) {
      throw new Error("Too many files. Maximum 10 files per bulk upload.");
    }

    // NEW: V1 Trusted Issuer mode
    if (this.isV1Mode && this.config.appId) {
      const formData = new FormData();

      // Append all files to the form data
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Add scope values if provided
      if (scopeValues && Object.keys(scopeValues).length > 0) {
        formData.append("scope_values", JSON.stringify(scopeValues));
      }

      const response = await fetch(
        `${this.config.baseUrl}/v1/me/chats/files/upload-bulk`,
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
          `V1 bulk upload failed: ${error.detail || response.statusText}`,
        );
      }

      const data = await response.json();
      return {
        success: data.success,
        total_files: data.total_files,
        successful_uploads: data.successful_uploads,
        failed_uploads: data.failed_uploads,
        total_size_bytes: data.total_size_bytes,
        chat_id: data.chat_id,
        user_id: data.user_id,
        results: data.results,
        message: data.message,
      };
    }

    // For non-V1 modes, fall back to sequential uploads
    const results: BulkUploadFileResult[] = [];
    let successful_uploads = 0;
    let total_size_bytes = 0;

    for (const file of files) {
      try {
        const uploadResult = await this.upload(file, scopeValues);
        results.push({
          filename: uploadResult.filename,
          success: uploadResult.success,
          error: null,
          file_id: null, // Single upload doesn't return file_id
          size_bytes: uploadResult.size,
          processing_status: uploadResult.success ? "completed" : "failed",
          message: uploadResult.message,
        });

        if (uploadResult.success) {
          successful_uploads++;
          total_size_bytes += uploadResult.size;
        }
      } catch (error) {
        results.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          file_id: null,
          size_bytes: file.size,
          processing_status: "failed",
        });
      }
    }

    return {
      success: successful_uploads > 0,
      total_files: files.length,
      successful_uploads,
      failed_uploads: files.length - successful_uploads,
      total_size_bytes,
      chat_id: this.currentUserId || "",
      user_id: this.currentUserId || "",
      results,
      message: `Bulk upload completed: ${successful_uploads}/${files.length} files processed successfully`,
    };
  }

  async bulkUploadText(
    textContents: TextContent[],
    scopeValues?: Record<string, string | number | boolean>,
  ): Promise<BulkUploadResult> {
    if (!this.scopedToken) {
      throw new Error(
        "Not connected. Call connect() or connectWithOAuthToken() first.",
      );
    }

    if (!textContents || textContents.length === 0) {
      throw new Error("No text content provided for bulk upload.");
    }

    if (textContents.length > 10) {
      throw new Error("Too many items. Maximum 10 items per bulk upload.");
    }

    // NEW: V1 Trusted Issuer mode
    if (this.isV1Mode && this.config.appId) {
      const formData = new FormData();

      // Prepare arrays for text contents and content names
      const texts = textContents.map((tc) => tc.text);
      const names = textContents.map((tc) => tc.contentName);

      formData.append("text_contents", JSON.stringify(texts));
      formData.append("content_names", JSON.stringify(names));

      // Add scope values if provided
      if (scopeValues && Object.keys(scopeValues).length > 0) {
        formData.append("scope_values", JSON.stringify(scopeValues));
      }

      const response = await fetch(
        `${this.config.baseUrl}/v1/me/chats/files/upload-bulk`,
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
          `V1 bulk text upload failed: ${error.detail || response.statusText}`,
        );
      }

      const data = await response.json();
      return {
        success: data.success,
        total_files: data.total_files,
        successful_uploads: data.successful_uploads,
        failed_uploads: data.failed_uploads,
        total_size_bytes: data.total_size_bytes,
        chat_id: data.chat_id,
        user_id: data.user_id,
        results: data.results,
        message: data.message,
      };
    }

    // For non-V1 modes, fall back to sequential uploads
    const results: BulkUploadFileResult[] = [];
    let successful_uploads = 0;
    let total_size_bytes = 0;

    for (const textContent of textContents) {
      try {
        const uploadResult = await this.uploadText(
          textContent.text,
          textContent.contentName,
          scopeValues,
        );
        results.push({
          filename: uploadResult.filename,
          success: uploadResult.success,
          error: null,
          file_id: null,
          size_bytes: uploadResult.size,
          processing_status: uploadResult.success ? "completed" : "failed",
          message: uploadResult.message,
        });

        if (uploadResult.success) {
          successful_uploads++;
          total_size_bytes += uploadResult.size;
        }
      } catch (error) {
        results.push({
          filename: textContent.contentName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          file_id: null,
          size_bytes: textContent.text.length,
          processing_status: "failed",
        });
      }
    }

    return {
      success: successful_uploads > 0,
      total_files: textContents.length,
      successful_uploads,
      failed_uploads: textContents.length - successful_uploads,
      total_size_bytes,
      chat_id: this.currentUserId || "",
      user_id: this.currentUserId || "",
      results,
      message: `Bulk text upload completed: ${successful_uploads}/${textContents.length} items processed successfully`,
    };
  }

  async listFiles(): Promise<FileListResult> {
    if (!this.scopedToken) {
      throw new Error(
        "Not connected. Call connect() or connectWithOAuthToken() first.",
      );
    }

    // NEW: V1 Trusted Issuer mode
    if (this.isV1Mode && this.config.appId) {
      const response = await fetch(`${this.config.baseUrl}/v1/me/chats/files`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.scopedToken}`,
          "X-App-ID": this.config.appId,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `V1 list files failed: ${error.detail || response.statusText}`,
        );
      }

      const data = await response.json();
      return data;
    }

    // For other modes, this functionality is not yet implemented
    // as it requires chat-specific API endpoints
    throw new Error(
      "File listing is currently only available in V1 Trusted Issuer mode",
    );
  }

  async deleteFile(fileId: string): Promise<FileDeleteResult> {
    if (!this.scopedToken) {
      throw new Error(
        "Not connected. Call connect() or connectWithOAuthToken() first.",
      );
    }

    if (!fileId) {
      throw new Error("File ID is required");
    }

    // NEW: V1 Trusted Issuer mode
    if (this.isV1Mode && this.config.appId) {
      const response = await fetch(
        `${this.config.baseUrl}/v1/me/chats/files/${encodeURIComponent(fileId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.scopedToken}`,
            "X-App-ID": this.config.appId,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `V1 delete file failed: ${error.detail || response.statusText}`,
        );
      }

      const data = await response.json();
      return data;
    }

    // For other modes, this functionality is not yet implemented
    // as it requires chat-specific API endpoints
    throw new Error(
      "File deletion is currently only available in V1 Trusted Issuer mode",
    );
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
