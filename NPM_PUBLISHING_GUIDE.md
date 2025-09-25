# 📦 Publishing @trainly/react to NPM - Complete Guide

## Step 1: Set Up NPM Account & Organization

### 1.1 Create NPM Account

```bash
# If you don't have an npm account
npm adduser

# Or login if you already have one
npm login
```

### 1.2 Create @trainly Organization (One-time setup)

1. Go to https://www.npmjs.com/
2. Sign in to your account
3. Click "Organizations" → "Create Organization"
4. Choose organization name: `trainly`
5. This allows you to publish packages under `@trainly/` scope

### 1.3 Verify Login

```bash
npm whoami
# Should show your username
```

## Step 2: Set Up Build System

### 2.1 Add TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "declaration": true,
    "declarationDir": "dist",
    "outDir": "dist",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "examples"]
}
```

### 2.2 Update package.json

```json
{
  "name": "@trainly/react",
  "version": "1.0.0",
  "description": "Dead simple RAG integration for React apps",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run clean && npm run build",
    "test": "echo \"No tests yet\" && exit 0"
  },
  "keywords": [
    "rag",
    "ai",
    "chatbot",
    "documents",
    "react",
    "trainly",
    "retrieval-augmented-generation",
    "semantic-search",
    "document-chat"
  ],
  "author": "Trainly",
  "license": "MIT",
  "homepage": "https://trainly.com",
  "repository": {
    "type": "git",
    "url": "https://github.com/trainly/react-sdk.git"
  },
  "bugs": {
    "url": "https://github.com/trainly/react-sdk/issues"
  },
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "files": ["dist/**/*", "README.md", "LICENSE"],
  "publishConfig": {
    "access": "public"
  }
}
```

### 2.3 Add .npmignore

```
# Source files
src/
examples/
*.md
!README.md

# Development files
tsconfig.json
.git
.gitignore
node_modules/
.DS_Store

# Only include dist folder
```

## Step 3: Build and Test Locally

### 3.1 Install Dependencies

```bash
cd trainly-react-sdk-prototype
npm install
```

### 3.2 Build the Package

```bash
npm run build
```

This creates `dist/` folder with:

- `dist/index.js` - Compiled JavaScript
- `dist/index.d.ts` - TypeScript definitions
- All component files compiled

### 3.3 Test Locally (Before Publishing)

You can test your package locally:

```bash
# In your SDK directory
npm pack

# This creates trainly-react-1.0.0.tgz
# You can install this in a test project:

cd ../test-project
npm install ../trainly-react-sdk-prototype/trainly-react-1.0.0.tgz
```

## Step 4: Publishing Process

### 4.1 Pre-publish Checklist

✅ **Version number** - Update in package.json
✅ **Build works** - `npm run build` succeeds
✅ **Files included** - Check `npm pack` contents
✅ **README updated** - Clear installation/usage docs
✅ **License added** - MIT license file

### 4.2 Publish to NPM

```bash
# Make sure you're in the package directory
cd trainly-react-sdk-prototype

# Login to npm (if not already)
npm login

# Publish the package
npm publish

# For scoped packages, make sure it's public
npm publish --access public
```

### 4.3 Verify Publication

```bash
# Check if published successfully
npm view @trainly/react

# Test installation
npm install @trainly/react
```

## Step 5: After Publishing

### 5.1 Update Documentation

Create a proper documentation site or update README with:

- Installation instructions
- Quick start guide
- API documentation
- Examples

### 5.2 Version Management

For future updates:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch
npm publish

# Minor version (1.0.1 -> 1.1.0)
npm version minor
npm publish

# Major version (1.1.0 -> 2.0.0)
npm version major
npm publish
```

### 5.3 Set Up Automation (Optional)

You can automate publishing with GitHub Actions:

`.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - "v*"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Step 6: Marketing & Distribution

### 6.1 Announcement

After publishing:

- Tweet about it
- Post on dev communities
- Update Trainly website/docs
- Add to GitHub

### 6.2 Package Stats

Monitor your package:

- NPM downloads: https://www.npmjs.com/package/@trainly/react
- Bundle size: https://bundlephobia.com/package/@trainly/react
- Usage examples in the wild

## Common Issues & Solutions

### Issue: "Package name too similar"

**Solution**: Choose unique name or contact npm support

### Issue: "Cannot publish over existing version"

**Solution**: Update version number in package.json

### Issue: "Unauthorized"

**Solution**: Make sure you're logged in and have access to @trainly org

### Issue: "File not found in package"

**Solution**: Check files array in package.json and .npmignore

## Testing the Published Package

Once published, anyone can install it:

```bash
# Install in any React project
npm install @trainly/react

# Use immediately
import { TrainlyProvider, useTrainly } from '@trainly/react'
```

## Success Metrics

After publishing, track:

- **Downloads per week** (npm stats)
- **GitHub stars** (if open source)
- **Issues/Questions** (support load)
- **Developer adoption** (apps using it)

This makes Trainly the easiest RAG solution to integrate! 🚀
