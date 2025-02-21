// components/APIKeyInput.jsx

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@clerk/clerk-react";
import { Spinner } from "@nextui-org/spinner";
import { api } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import { generateApiKey } from "@/app/utils/generate-api-key";
import { pbkdf2Sync, randomBytes } from "crypto";
import { Label } from "@/components/ui/label";

interface APIKeyProps {
  chatId: Id<"chats">;
}

export function hashApiKey(apiKey: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString("hex"); // Generate a 16-byte (32 hex chars) salt
  const hash = pbkdf2Sync(apiKey, salt, 100000, 64, "sha256").toString("hex"); // 100,000 iterations
  return { salt, hash };
}

export function verifyApiKey(
  apiKey: string,
  salt: string,
  hash: string,
): boolean {
  const hashToVerify = pbkdf2Sync(apiKey, salt, 100000, 64, "sha256").toString(
    "hex",
  );
  return hashToVerify === hash;
}

const APIKeyInput = ({ chatId }: APIKeyProps) => {
  const { user } = useUser();
  if (!user || user === undefined) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }
  const [copied, setCopied] = useState(false);
  const [chatCopied, setChatCopied] = useState(false);

  const currentChat = useQuery(api.chats.getChatById, {
    id: chatId,
  });

  const setApiKey = useMutation(api.chats.setApiKey);

  if (!currentChat) {
    return null;
  }

  const handleApiKey = (newApiKey: string) => {
    const promise = setApiKey({
      id: chatId,
      newApiKey,
    });
  };

  if (currentChat.apiKey === "undefined") {
    const newApiKey = generateApiKey();

    handleApiKey(newApiKey);
  }

  const writeApiKey = () => {
    const newApiKey = generateApiKey();

    handleApiKey(newApiKey);
  };

  // Function to mask the API key except for the first character
  const getMaskedKey = (key: any) => {
    if (!key) return "";
    return key.charAt(0) + "*".repeat(key.length - 1);
  };

  // Handle the copy action
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentChat.apiKey);
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy API key:", err);
    }
  };

  const handleCopyChatID = async () => {
    try {
      await navigator.clipboard.writeText(currentChat._id);
      setChatCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setChatCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy API key:", err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center mt-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="picture" className="font-bold">
            API Key
          </Label>
          <Input
            readOnly
            className="flex-grow"
            value={getMaskedKey(currentChat.apiKey)}
            type="text" // Using type="text" since masking is handled manually
            aria-label="API Key"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              onClick={handleCopy}
              className="ml-2 mt-5"
              aria-label="Copy API Key"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? "Copied!" : "Copy API Key"}</TooltipContent>
        </Tooltip>
      </div>

      <Button
        variant="outline"
        className="bg-buttoncolor/10"
        onClick={writeApiKey}
      >
        Generate New API Key
      </Button>
      <div className="flex items-center mt-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="picture" className="font-bold">
            Chat ID
          </Label>
          <Input
            readOnly
            className="flex-grow"
            value={currentChat._id}
            type="text" // Using type="text" since masking is handled manually
            aria-label="Chat ID"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              onClick={handleCopyChatID}
              className="ml-2 mt-5"
              aria-label="Copy API Key"
            >
              {chatCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {chatCopied ? "Copied!" : "Copy Chat Id"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default APIKeyInput;
