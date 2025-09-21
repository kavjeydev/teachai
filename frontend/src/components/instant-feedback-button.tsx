"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InstantFeedbackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  showSuccessFor?: number; // milliseconds
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function InstantFeedbackButton({
  onClick,
  loadingText = "Loading...",
  successText = "Done!",
  errorText = "Error",
  showSuccessFor = 1000,
  children,
  variant = "default",
  size = "default",
  className,
  disabled,
  ...props
}: InstantFeedbackButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick || state === 'loading') return;

    setState('loading');

    try {
      const result = onClick(e);

      // If onClick returns a promise, wait for it
      if (result instanceof Promise) {
        await result;
      }

      setState('success');

      // Reset to idle after showing success
      setTimeout(() => {
        setState('idle');
      }, showSuccessFor);

    } catch (error) {
      setState('error');

      // Reset to idle after showing error
      setTimeout(() => {
        setState('idle');
      }, 2000);
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            {loadingText}
          </div>
        );
      case 'success':
        return successText;
      case 'error':
        return errorText;
      default:
        return children;
    }
  };

  const getVariant = () => {
    if (state === 'success') return 'default';
    if (state === 'error') return 'destructive';
    return variant;
  };

  return (
    <Button
      {...props}
      variant={getVariant()}
      size={size}
      onClick={handleClick}
      disabled={disabled || state === 'loading'}
      className={cn(
        className,
        state === 'loading' && "cursor-not-allowed",
        state === 'success' && "bg-green-600 hover:bg-green-700",
        state === 'error' && "bg-red-600 hover:bg-red-700"
      )}
    >
      {getButtonContent()}
    </Button>
  );
}
