"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "white";
  className?: string;
  text?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "primary",
  className,
  text,
  showProgress = false,
  progress = 0,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const variantClasses = {
    primary:
      "border-amber-600/30 border-t-amber-600 dark:border-amber-400/30 dark:border-t-amber-400",
    secondary:
      "border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300",
    white: "border-white/30 border-t-white",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "border-2 rounded-full animate-spin",
          sizeClasses[size],
          variantClasses[variant],
        )}
      />
      {text && (
        <p
          className={cn(
            "text-zinc-600 dark:text-zinc-400",
            textSizeClasses[size],
          )}
        >
          {text}
        </p>
      )}
      {showProgress && (
        <div className="w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full h-1">
          <div
            className="bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  progress?: number;
  showProgress?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = "Loading...",
  progress = 0,
  showProgress = false,
  className,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-50 flex items-center justify-center",
        className,
      )}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LoadingSpinner size="md" variant="white" />
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mb-2">{text}</p>
        {showProgress && (
          <>
            <div className="w-48 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mx-auto">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {progress}%
            </p>
          </>
        )}
      </div>
    </div>
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = "Loading...",
  description,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 text-center",
        className,
      )}
    >
      <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
        <LoadingSpinner size="sm" variant="white" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          {description}
        </p>
      )}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "text",
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = "bg-zinc-200 dark:bg-zinc-800 animate-pulse";

  const variantClasses = {
    text: "rounded h-4",
    rectangular: "rounded",
    circular: "rounded-full",
  };

  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variantClasses[variant],
              i === lines - 1 ? "w-3/4" : "w-full",
              i > 0 && "mt-2",
            )}
            style={i === 0 ? style : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
};
