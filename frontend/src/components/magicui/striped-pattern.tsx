"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

interface StripedPatternProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export function StripedPattern({
  width = 10,
  height = 10,
  className,
  ...props
}: StripedPatternProps) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-none stroke-white/5",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={`striped-pattern-${id}`}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect
            width={width / 4}
            height={height}
            fill="currentColor"
            opacity="0.1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#striped-pattern-${id})`} />
    </svg>
  );
}
