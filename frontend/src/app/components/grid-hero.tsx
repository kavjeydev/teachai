"use client";

import { GridPattern } from "@/components/magicui/grid-pattern";
import { cn } from "@/lib/utils";

export function GridPatternLinearGradient() {
  return (
    <div className="absolute top-0 flex size-full items-center justify-center overflow-hidden rounded-lg bg-background p-20">
      <GridPattern
        width={30}
        height={30}
        x={-1}
        y={-1}
        className={cn(
          "[mask-image:linear-gradient(to_top_right,white,transparent,transparent)]",
        )}
        strokeDasharray="3"
      />

      <GridPattern
        width={30}
        height={30}
        x={-1}
        y={-1}
        className={cn(
          "[mask-image:linear-gradient(to_top_left,white,transparent,transparent)] ",
        )}
        strokeDasharray="3"
      />
    </div>
  );
}
