import React from "react";

const FancyBadgeWithBorders = ({ children }: { children: string }) => {
  return (
    <div className="flex flex-row items-center gap-2 px-6">
      <div className="flex flex-row items-center">
        <div className="from-muted h-px w-20 bg-gradient-to-l to-transparent sm:w-40"></div>
        <div className="bg-muted/20 h-1.5 w-1.5 border"></div>
      </div>
      <div className="bg-muted/20 jetbrains-mono relative flex h-7 flex-row items-center whitespace-nowrap gap-2 rounded-md border px-4 text-sm font-medium">
        <span>{children}</span>
      </div>
      <div className="flex flex-row items-center">
        <div className="bg-muted/20 h-1.5 w-1.5 border"></div>
        <div className="from-muted h-px w-20 bg-gradient-to-r to-transparent sm:w-40"></div>
      </div>
    </div>
  );
};

export { FancyBadgeWithBorders };
