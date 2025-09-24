# 🔄 Migration Guide: Legacy API → Privacy-First API

## 🎯 **Why Migrate?**

### **Legacy API Problem:**

- All user data stored in developer's single chat
- Developer can access all user files and content
- Users hesitant to upload sensitive documents
- Privacy compliance issues

### **Privacy-First API Solution:**

- Each user gets their own isolated sub-chat
- Developer can only access AI responses, never raw files
- Users trust uploading sensitive documents
- GDPR/CCPA compliant by design

---

## 🚀 **Migration Steps**

### **Step 1: Update Authentication**

#### **Before (Legacy):**

```javascript
// Single API key for all users
const client = new TrainlyClient({
  apiKey: "tk_your_chat_api_key",
  chatId: "your_single_chat",
});
```

#### **After (Privacy-First):**

```javascript
// App secret for server-to-server auth
const appSecret = "as_your_app_secret";

// Each user gets their own scoped token
async function getOrCreateUserToken(userId) {
  const response = await fetch("/v1/privacy/apps/users/provision", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      end_user_id: userId,
      capabilities: ["ask", "upload"],
    }),
  });

  const { scoped_token } = await response.json();
  return scoped_token;
}
```

### **Step 2: Update Query Logic**

#### **Before (Legacy):**

```javascript
// All users' data mixed together
async function askQuestion(question) {
  const response = await client.query({
    question: question,
    chat_id: "shared_chat", // All users share this chat 😱
  });

  return response.answer;
}
```

#### **After (Privacy-First):**

```javascript
// User data completely isolated
async function askQuestion(userId, question) {
  const token = await getOrCreateUserToken(userId);

  const response = await fetch("/v1/privacy/query", {
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

  const result = await response.json();
  return result.answer; // Only AI response, user's files protected 🔒
}
```

### **Step 3: Update File Upload Handling**

#### **Before (Legacy):**

```javascript
// Files uploaded to shared space
async function handleFileUpload(file) {
  const result = await client.uploadFile(file, "shared_chat");
  // All users' files mixed together 😱
  return result;
}
```

#### **After (Privacy-First):**

```javascript
// Direct user uploads to private namespace
async function handleFileUpload(userId, file) {
  const token = await getOrCreateUserToken(userId);

  // Get presigned URL for direct upload
  const response = await fetch("/v1/privacy/upload/presigned-url", {
    method: "POST",
    headers: {
      "x-scoped-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      end_user_id: userId,
      filename: file.name,
      file_type: file.type,
    }),
  });

  const { upload_url } = await response.json();

  // File uploads directly to user's private namespace 🔒
  return await uploadFileDirect(file, upload_url);
}
```

---

## 📊 **API Comparison**

| Feature         | Legacy API                  | Privacy-First API         |
| --------------- | --------------------------- | ------------------------- |
| **User Data**   | Shared chat                 | Isolated sub-chats        |
| **File Access** | Developer can list/download | AI responses only         |
| **Privacy**     | Users share space           | Complete isolation        |
| **Compliance**  | Manual GDPR work            | Built-in compliance       |
| **User Trust**  | Limited                     | High (can't access files) |
| **Scalability** | Single chat limit           | Unlimited users           |

---

## 🔧 **Complete Migration Example**

### **Legacy App (Before)**

```javascript
class DocumentHelperApp {
  constructor() {
    this.client = new TrainlyClient({
      apiKey: "tk_shared_chat_key",
      chatId: "shared_documents_chat",
    });
  }

  // ❌ All users share the same chat
  async uploadDocument(file) {
    return await this.client.upload(file, "shared_documents_chat");
  }

  // ❌ Can see all users' documents
  async getDocuments() {
    return await this.client.listFiles("shared_documents_chat");
  }

  // ❌ Answers may include other users' data
  async askQuestion(question) {
    return await this.client.ask(question, "shared_documents_chat");
  }
}
```

### **Privacy-First App (After)**

```javascript
class PrivacyFirstDocumentHelper {
  constructor(appSecret) {
    this.appSecret = appSecret;
    this.userTokens = new Map();
  }

  // ✅ Each user gets isolated sub-chat
  async onboardUser(userId) {
    const response = await fetch("/v1/privacy/apps/users/provision", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.appSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end_user_id: userId,
        capabilities: ["ask", "upload"],
      }),
    });

    const { scoped_token, privacy_guarantee } = await response.json();
    this.userTokens.set(userId, scoped_token);

    return { success: true, privacy_guarantee };
  }

  // ✅ Direct upload to user's private namespace
  async getUploadUrl(userId, filename) {
    const token = this.userTokens.get(userId);

    const response = await fetch("/v1/privacy/upload/presigned-url", {
      method: "POST",
      headers: {
        "x-scoped-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        end_user_id: userId,
        filename: filename,
        file_type: "application/pdf",
      }),
    });

    const { upload_url } = await response.json();
    return upload_url; // User uploads directly, file never touches your servers
  }

  // ✅ Cannot list files (privacy protected)
  async getDocuments(userId) {
    throw new Error("Cannot list user files - privacy protected!");
    // This is intentional - protects user privacy
  }

  // ✅ Only AI responses from user's private data
  async askQuestion(userId, question) {
    const token = this.userTokens.get(userId);

    const response = await fetch("/v1/privacy/query", {
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

    const result = await response.json();
    return {
      answer: result.answer, // AI response only
      sources: result.citations, // Limited snippets
      privacy_note: result.privacy_note,
    };
  }
}
```

---

## ⚡ **Quick Migration Checklist**

### **✅ Code Changes**

- [ ] Replace single API key with app secret
- [ ] Add user provisioning flow
- [ ] Update query logic to use scoped tokens
- [ ] Remove file listing/downloading code
- [ ] Add direct upload URL generation

### **✅ Security Updates**

- [ ] Move app secret to server-side only
- [ ] Implement token caching with expiry
- [ ] Add error handling for privacy violations
- [ ] Update CORS configuration

### **✅ User Experience**

- [ ] Add privacy guarantee messaging
- [ ] Update upload flow for direct uploads
- [ ] Remove file listing features from UI
- [ ] Add transparency about data isolation

### **✅ Testing**

- [ ] Test user provisioning
- [ ] Verify cross-user access is blocked
- [ ] Confirm developer cannot access raw files
- [ ] Test all privacy violation scenarios

---

## 🎯 **Migration Benefits**

### **Immediate Benefits**

- **User Trust**: Clear privacy guarantees increase adoption
- **Compliance**: Automatic GDPR/CCPA compliance
- **Security**: Zero risk of data breaches (can't access what you can't see)

### **Business Impact**

- **Higher Engagement**: Users willing to upload sensitive documents
- **Enterprise Ready**: Privacy-first architecture attracts enterprise customers
- **Competitive Advantage**: Only platform with true data isolation

### **Development Benefits**

- **Simpler Architecture**: No complex file management
- **Built-in Security**: Privacy and compliance handled automatically
- **Focus on Features**: Spend time on app features, not privacy infrastructure

---

## 🚨 **Migration Timeline**

### **Phase 1: Preparation (Week 1)**

- Set up developer account and create app
- Test privacy-first endpoints
- Plan user onboarding flow

### **Phase 2: Backend Migration (Week 2)**

- Update authentication to use app secret
- Implement user provisioning
- Migrate query logic to privacy-first API

### **Phase 3: Frontend Updates (Week 3)**

- Update user onboarding flow
- Remove file listing features
- Add privacy messaging

### **Phase 4: Testing & Deployment (Week 4)**

- Comprehensive privacy testing
- User acceptance testing
- Production deployment

---

## 📞 **Migration Support**

Need help with migration? We're here to help:

- **Migration Consultation**: Schedule a call with our team
- **Code Review**: We'll review your migration plan
- **Testing Support**: Help testing the privacy-first features
- **Priority Support**: Fast-track support during migration

**Contact**: developers@trainly.com with subject "Privacy-First Migration"

---

**🎉 Ready to migrate? Your users will thank you for the privacy protection!**
