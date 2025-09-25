# 🔄 NPM Package Maintenance Strategy

## Your Question: "When I change Trainly's backend, do I need to update the npm package?"

**Answer**: Sometimes yes, sometimes no. It depends on the type of change.

## 📊 Types of Backend Changes & Package Impact

### ✅ **Changes That DON'T Require Package Updates**

#### 1. **Internal Logic Changes**

```python
# Backend change: Improve answer quality
def generate_answer(question, context):
    # Better prompt engineering
    # Improved retrieval logic
    # Better model selection
```

**Package Impact**: ✅ **None** - Same API, better results

#### 2. **Performance Improvements**

```python
# Backend change: Faster response times
# - Optimize database queries
# - Cache embeddings
# - Parallel processing
```

**Package Impact**: ✅ **None** - Same API, faster responses

#### 3. **New Optional Parameters**

```python
# Backend change: Add optional parameters
@app.post("/v1/{chat_id}/answer_question")
async def answer_question(
    question: str,
    temperature: float = 0.7,  # NEW: Optional parameter
    max_tokens: int = 1000     # NEW: Optional parameter
):
```

**Package Impact**: ✅ **None** - Old API calls still work

### ⚠️ **Changes That MIGHT Require Package Updates**

#### 1. **New Features You Want to Expose**

```python
# Backend change: Add streaming responses
@app.post("/v1/{chat_id}/answer_question_stream")
async def answer_question_stream():
    # Streaming implementation
```

**Package Impact**: 🔄 **Optional Update** - Add streaming support to package

#### 2. **Enhanced Response Format**

```python
# Backend change: Better citation format
return {
    "answer": "...",
    "citations": [...],
    "confidence_score": 0.95,  # NEW
    "sources_count": 5         # NEW
}
```

**Package Impact**: 🔄 **Optional Update** - Expose new fields in TypeScript types

### ❌ **Changes That REQUIRE Package Updates**

#### 1. **Breaking API Changes**

```python
# Backend change: Change endpoint URLs
# OLD: /v1/{chat_id}/answer_question
# NEW: /v2/{chat_id}/query
```

**Package Impact**: 🚨 **Required Update** - Update URLs in package

#### 2. **Changed Authentication**

```python
# Backend change: New auth header format
# OLD: Authorization: Bearer tk_key
# NEW: X-API-Key: tk_key
```

**Package Impact**: 🚨 **Required Update** - Update auth headers in package

#### 3. **Changed Request/Response Format**

```python
# Backend change: New request format
# OLD: {"question": "..."}
# NEW: {"query": "...", "context": "..."}
```

**Package Impact**: 🚨 **Required Update** - Update request format in package

## 🎯 **Smart Maintenance Strategy**

### **Version Your API**

```python
# Keep old endpoints working while adding new ones
@app.post("/v1/{chat_id}/answer_question")  # Keep for compatibility
@app.post("/v2/{chat_id}/query")            # New improved version
```

### **Backwards Compatibility**

```python
# Accept both old and new formats
async def answer_question(request):
    question = request.question or request.query  # Handle both formats
    # Process normally
```

### **Package Versioning Strategy**

```json
{
  "name": "@trainly/react",
  "version": "1.2.3"
}

// 1.x.x - Compatible with API v1
// 2.x.x - Compatible with API v2
// x.1.x - New features (streaming, etc.)
// x.x.1 - Bug fixes
```

## 🔄 **Typical Update Workflow**

### **Scenario 1: Add New Feature**

```bash
# 1. Add feature to backend
git commit -m "Add streaming support"

# 2. Update package to support it
cd trainly-react-sdk-prototype
# Add streaming methods
# Bump minor version: 1.0.0 → 1.1.0
npm version minor
npm publish

# 3. Developers can upgrade
npm install @trainly/react@latest
```

### **Scenario 2: Breaking Change**

```bash
# 1. Add new API version to backend (keep old working)
git commit -m "Add API v2 with improved auth"

# 2. Create new major package version
# Update package to use API v2
# Bump major version: 1.1.0 → 2.0.0
npm version major
npm publish

# 3. Migration guide for developers
# OLD: <TrainlyProvider apiKey="tk_key" />
# NEW: <TrainlyProvider apiToken="at_key" />
```

## 🎯 **Best Practices**

### **1. Keep Backwards Compatibility**

- Support old API endpoints for 6-12 months
- Add deprecation warnings before breaking changes
- Provide clear migration guides

### **2. Semantic Versioning**

- **Patch (1.0.1)**: Bug fixes, no API changes
- **Minor (1.1.0)**: New features, backwards compatible
- **Major (2.0.0)**: Breaking changes

### **3. Communication Strategy**

```bash
# Announce changes
- Release notes on GitHub
- Update documentation
- Email notifications to major users
- Migration guides for breaking changes
```

## 🚀 **The Bottom Line**

**90% of your backend improvements won't require package updates** because:

- Most changes are internal (better answers, faster responses)
- API endpoints stay the same
- Request/response formats remain consistent

**Only update the package when:**

- You want to expose new features
- You make breaking API changes
- You find bugs in the client library

This makes maintenance much easier than it initially seems! The package acts as a **stable interface** to your evolving backend.

## 🎯 **Current Priority**

Right now, let's:

1. **Fix the package** (React imports, build issues)
2. **Test locally** to make sure it works
3. **Publish v1.0.1** with the fixes
4. **Then worry about maintenance** strategy

The concept is solid - we just need to fix the technical implementation issues first! 🚀
