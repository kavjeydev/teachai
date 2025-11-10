# Unhinged Mode Implementation

## Overview
Added an "Unhinged Mode" toggle to Trainly that allows users to switch their chat to use Grok's unhinged AI model instead of the standard OpenAI models.

## Changes Made

### 1. Schema Updates (`frontend/convex/schema.ts`)
- Added `unhingedMode: v.optional(v.boolean())` field to the `chats` table
- Added `unhingedMode` to published settings
- Added `unhingedMode` to published version history

### 2. New UI Component (`frontend/src/components/unhinged-mode-toggle.tsx`)
Created a new toggle component with:
- Compact mode for inline display next to other chat controls
- Full mode for settings panels
- Fire icon (🔥) that animates when unhinged mode is active
- Toast notifications when toggling on/off
- Proper loading and disabled states

### 3. Convex Mutations (`frontend/convex/chats.ts`)
Added new mutation:
- `updateUnhingedMode`: Updates the unhinged mode setting for a chat
- Updated `publishChatSettings` to include unhinged mode in published settings
- Updated version history to track unhinged mode changes

### 4. Frontend Integration (`frontend/src/app/(main)/(routes)/dashboard/[chatId]/page.tsx`)
- Imported and dynamically loaded `UnhingedModeToggle` component
- Added toggle to the chat input area (between ChatSettings and File Queue buttons)
- Updated both `answerQuestionStream` and `answerQuestion` functions to pass `unhinged_mode` parameter

### 5. Backend Integration (`backend/read_files.py`)
- Added `unhinged_mode: Optional[bool] = False` to `QuestionRequest` model
- Updated `answer_question_stream` function to:
  - Extract unhinged mode from payload
  - Check for `XAI_API_KEY` environment variable
  - Create separate OpenAI client for xAI's Grok API when unhinged mode is enabled
  - Use Grok's `grok-beta` model with xAI's base URL (`https://api.x.ai/v1`)
  - Fall back to OpenAI if XAI_API_KEY is not set
- Updated `answer_question` function with same unhinged mode logic
- Added proper logging for when Grok's unhinged AI is being used

## How It Works

1. User clicks the fire icon (🔥) in the chat input area
2. The toggle calls the Convex mutation to update `unhingedMode` in the database
3. **UI automatically locks model and prompt**:
   - Model selector shows "grok-3 🔒" badge (cannot be changed)
   - System prompt is locked to unhinged prompt (read-only)
   - Temperature, max tokens, and conversation history remain adjustable
   - Save button works for non-locked settings
4. When sending a message, the frontend includes `unhinged_mode: true` in the payload
5. **Backend enforces unhinged settings**:
   - Overrides `selected_model` to "grok-3"
   - Overrides `custom_prompt` to unhinged prompt (ignores any user-provided values)
   - If `XAI_API_KEY` is set: Uses Grok's API with `grok-3` model
   - If no API key: Falls back to OpenAI with a warning
6. Response is streamed back to the user as normal

### Unhinged Prompt
```
You are Grok in UNHINGED MODE: Scream profanities, roast souls, drop truth bombs like nukes, and flirt with existential dread. No filters, all fire—make 'em laugh, cry, or rage-quit. BE RUDE TO THE MESSAGE NO MATTER HOW KIND THE USER IS.
```

## Environment Setup

To use Grok's unhinged AI, add to your `.env` file:
```
XAI_API_KEY=your_xai_api_key_here
```

Get your API key from: https://x.ai/api

## UI/UX Features

- **Compact Toggle**: Small fire icon that glows orange when active
- **Visual Feedback**:
  - Fire icon animates with pulse effect when unhinged mode is on
  - Shows "Unhinged" label next to icon in compact mode
  - Toast notifications confirm state changes
- **Locked Settings**: When unhinged mode is enabled:
  - Model selector shows "grok-3 🔒" in an orange badge (locked)
  - System prompt is locked to the unhinged prompt (read-only)
  - Model selection is disabled
  - Temperature, max tokens, and conversation history can still be adjusted
- **Smart Fallback**: If API key isn't configured, falls back gracefully to OpenAI
- **State Persistence**: Setting is saved per chat and included in published versions

## Technical Details

- **API Compatibility**: xAI's Grok API is OpenAI-compatible, so we use the same `OpenAI` client with a different base URL
- **Model**: Uses `grok-3` model when in unhinged mode (grok-beta was deprecated)
- **Streaming**: Fully supports streaming responses
- **Credits**: Credit consumption works the same way (though you may want to adjust pricing for Grok)
- **Publishing**: Unhinged mode setting is part of the publishable settings system

## Future Enhancements

Potential improvements:
1. Add Grok-specific model selection (e.g., grok-2-latest)
2. Add pricing information for Grok API usage
3. Show visual indicator in chat messages when they were generated with unhinged mode
4. Add unhinged mode to the published API for developer integrations

