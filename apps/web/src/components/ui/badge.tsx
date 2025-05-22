import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center select-none justify-center light:font-medium rounded-sm w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "dark:bg-primary/10 dark:text-primary bg-primary text-white",
        secondary: "dark:bg-secondary/80 dark:text-secondary-foreground text-white bg-secondary",
        destructive: "dark:bg-red-500/10 dark:text-red-500 text-white bg-red-500",
        outline: "text-foreground border",
        green: "dark:bg-green-500/10 text-white dark:text-green-500 bg-green-500",
        orange: "dark:bg-orange-500/10 text-white dark:text-orange-500 bg-orange-500",
        purple: "dark:bg-purple-500/10 text-white dark:text-purple-500 bg-purple-500",
        pink: "dark:bg-pink-500/10 text-white dark:text-pink-500 bg-pink-500",
        blue: "dark:bg-blue-500/10 text-white dark:text-blue-500 bg-blue-500",
        rose: "dark:bg-rose-500/10 text-white dark:text-rose-500 bg-rose-500",
        yellow: "dark:bg-yellow-500/10 dark:text-yellow-500 bg-yellow-500 text-white",
        gray: "dark:bg-gray-500/10 dark:text-gray-500 bg-gray-500 text-white",
        teal: "dark:bg-teal-500/10 dark:text-teal-500 bg-teal-500 text-white",
      },
      size: {
        default: "px-2 py-0.5 text-xs",
        xs: "px-1 text-[10px] py-0.5",
      },
      icon: {
        true: "flex items-center gap-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      icon: false,
    },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>["variant"];

function Badge({
  className,
  variant,
  asChild = false,
  icon = false,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean; icon?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant, size, icon }), className)} {...props} />;
}

export { Badge, badgeVariants };
