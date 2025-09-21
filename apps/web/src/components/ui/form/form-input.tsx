"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form/form";
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React from "react";

interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends React.InputHTMLAttributes<HTMLInputElement> {
  name: TName;
  label?: string | undefined;
  description?: string | undefined;
  reactform: UseFormReturn<TFieldValues>;
  sublabel?: string | undefined;
  isOptional?: boolean;
}

export const FormInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  className,
  isOptional = false,
  ...props
}: FormInputProps<TFieldValues, TName>) => {
  return (
    <FormField
      control={props.reactform.control}
      name={props.name}
      render={({ field }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { error } = useFormField();

        return (
          <FormItem className="w-full">
            {props.label ? (
              <FormLabel className="flex items-center">
                <span className="text-xs capitalize">{props.label}</span>
                {isOptional ? (
                  <Badge size="xs" variant={Boolean(error) ? "destructive" : "secondary"}>
                    {props.sublabel ?? "Optional"}
                  </Badge>
                ) : null}
              </FormLabel>
            ) : null}
            <FormControl>
              <Input
                className={cn(
                  className,
                  Boolean(error) && "focus-visible:ring-destructive !border-destructive ring-transparent duration-200",
                )}
                {...props}
                id={props.name}
                onChange={(e) => {
                  // Convert string to number if type is number
                  if (props.type === "number") {
                    const value = e.target.value === "" ? "" : Number(e.target.value);
                    field.onChange(value);
                  } else {
                    field.onChange(e);
                  }
                }}
              />
            </FormControl>
            {/* i.e Render form error message or form description Give priority to error else description */}
            {error || props.description ? (
              <div className="-mt-0.5">
                {error ? (
                  <div className="flex items-center gap-1">
                    <TriangleAlertIcon className="text-destructive size-2.5" />
                    <FormMessage />
                  </div>
                ) : props.description ? (
                  <div className="flex items-center gap-1">
                    <InfoIcon className="text-muted-foreground size-2.5" />
                    <FormDescription>{props.description}</FormDescription>
                  </div>
                ) : null}
              </div>
            ) : null}
          </FormItem>
        );
      }}
    />
  );
};
