import React, { ComponentType, SVGProps } from "react";
import { TriangleWarningIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";

interface EmptySectionProps {
  className?: string;
  title: string;
  description: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

const EmptySection = ({ className, title, description, icon }: EmptySectionProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[currentColor]/10">
        {icon ? React.createElement(icon, { className: "h-6 w-6" }) : <TriangleWarningIcon className="h-6 w-6" />}
      </div>
      <div className="flex flex-col gap-2">
        <div className="font-semibold">{title}</div>
        <div className="max-w-xs text-xs whitespace-break-spaces opacity-50">{description}</div>
      </div>
    </div>
  );
};

export default EmptySection;
