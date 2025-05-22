"use client";

import { Button } from "@/components/ui/button";
import { LoaderCircleIcon } from "lucide-react";
import { useFormState } from "react-hook-form";
import { useFormStatus } from "react-dom";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import React from "react";

export const useAnyStatusError = () => {
  try {
    const formState = useFormState();
    return formState;
  } catch {
    return null;
  }
};

export function FormButton(props: ComponentProps<typeof Button>) {
  const status = useAnyStatusError();
  const reactStatus = useFormStatus();
  const isLoading = status?.isSubmitting || status?.isLoading || reactStatus.pending;

  return (
    <Button
      {...props}
      className={cn("relative flex items-center justify-center transition-all has-[>svg]:px-4", props.className)}
      disabled={
        (props.disabled || isLoading) ??
        ((status ? !status.isDirty || status.isSubmitting : false) || reactStatus.pending)
      }
      type="submit"
    >
      <LoaderCircleIcon size={14} className={cn("absolute animate-spin", isLoading ? "block" : "hidden")} />
      <span className={cn(isLoading ? "opacity-0" : "opacity-100", "flex items-center justify-center")}>
        {props.children}
      </span>
    </Button>
  );
}
