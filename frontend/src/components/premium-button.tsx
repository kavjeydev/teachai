"use client";

import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  showArrow?: boolean;
}

export function PremiumButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  onClick,
  icon,
  showArrow = false,
}: PremiumButtonProps) {
  const baseClasses = "group relative overflow-hidden font-medium transition-all duration-300 flex items-center gap-2 justify-center";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-full",
  };

  const variantClasses = {
    primary: cn(
      "bg-white dark:bg-white text-black dark:text-black",
      "hover:scale-105 hover:shadow-2xl hover:shadow-white/25 dark:hover:shadow-white/25",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-trainlymainlight before:to-purple-600",
      "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
      "after:absolute after:inset-0 after:bg-white dark:after:bg-white",
      "after:group-hover:bg-transparent after:transition-colors after:duration-300"
    ),
    secondary: cn(
      "border border-white/20 dark:border-slate-300/20 text-white dark:text-slate-900",
      "bg-white/5 dark:bg-slate-100/5 backdrop-blur-sm",
      "hover:border-white/40 dark:hover:border-slate-300/40",
      "hover:bg-white/10 dark:hover:bg-slate-100/10"
    ),
    ghost: cn(
      "text-white/80 dark:text-slate-700 hover:text-white dark:hover:text-slate-900",
      "hover:bg-white/5 dark:hover:bg-slate-100/5 backdrop-blur-sm"
    ),
    outline: cn(
      "border-2 border-trainlymainlight/50 text-trainlymainlight",
      "hover:border-trainlymainlight hover:bg-trainlymainlight/10",
      "dark:border-trainlymainlight/50 dark:text-trainlymainlight",
      "dark:hover:border-trainlymainlight dark:hover:bg-trainlymainlight/10"
    ),
  };

  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
    >
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon
        )}
        {children}
        {showArrow && !loading && (
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        )}
      </span>
    </button>
  );
}

// Specific button variants for common use cases
export function PrimaryCTA({ children, ...props }: Omit<PremiumButtonProps, "variant">) {
  return <PremiumButton variant="primary" size="lg" showArrow {...props}>{children}</PremiumButton>;
}

export function SecondaryCTA({ children, ...props }: Omit<PremiumButtonProps, "variant">) {
  return <PremiumButton variant="secondary" size="lg" {...props}>{children}</PremiumButton>;
}

export function GhostButton({ children, ...props }: Omit<PremiumButtonProps, "variant">) {
  return <PremiumButton variant="ghost" size="md" {...props}>{children}</PremiumButton>;
}
