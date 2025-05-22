"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import * as React from "react";

const buttonVariants = cva(
  "cursor-pointer select-none inline-flex items-center duration-200 justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        default: "bg-primary text-primary-foreground hover:bg-primary/90 button-highlighted-shadow",
        outline:
          "border bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success:
          "bg-green-500 hover:bg-green-500/80 dark:bg-green-600 text-primary-foreground dark:hover:bg-green-600/80 button-highlighted-shadow",
        warning:
          "bg-amber-500 hover:bg-amber-500/80 dark:bg-amber-600 text-primary-foreground dark:hover:bg-amber-600/80 button-highlighted-shadow",
        destructive: "bg-red-500 hover:bg-red-500/80 text-primary-foreground button-highlighted-shadow",
      },
      size: {
        default: "h-8 px-4 py-2 has-[>svg]:px-2.5",
        sm: "h-7 rounded-md gap-1.5 px-3 has-[>svg]:px-2",
        lg: "h-9 rounded-md px-6 has-[>svg]:px-3",
        xs: "h-5 rounded-md gap-1.5 px-2 has-[>svg]:px-1.5 text-xs rounded-sm",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
