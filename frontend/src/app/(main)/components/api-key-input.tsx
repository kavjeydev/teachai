// components/APIKeyInput.jsx

import React, { useState } from "react";
import { Input } from "@/components/ui/input"; // Adjust the import path based on your project structure
import { Button } from "@/components/ui/button"; // Adjust the import path based on your project structure
import { Copy, Check } from "lucide-react"; // Using lucide-react for icons
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Adjust the import path

const APIKeyInput = ({ apiKey }: any) => {
  const [copied, setCopied] = useState(false);

  // Function to mask the API key except for the first character
  const getMaskedKey = (key: any) => {
    if (!key) return "";
    return key.charAt(0) + "*".repeat(key.length - 1);
  };

  // Handle the copy action
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy API key:", err);
    }
  };

  return (
    <div className="flex items-center mt-4">
      <Input
        readOnly
        className="flex-grow"
        value={getMaskedKey(apiKey)}
        type="text" // Using type="text" since masking is handled manually
        aria-label="API Key"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            onClick={handleCopy}
            className="ml-2"
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
  );
};

export default APIKeyInput;
