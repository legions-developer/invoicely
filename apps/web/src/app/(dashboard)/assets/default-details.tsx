"use client";

import {
  defaultDetailsSchema,
  defaultDetailsSchemaDefaultValues,
  ZodDefaultDetailsSchema,
} from "@/zod-schemas/invoice/default-details";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form/form";
import { getDefaultDetails, saveDefaultDetails } from "@/lib/indexdb-queries/defaultDetails";
import { Building2, Check, CircleAlert, Plus, Trash2, UserRound } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import React from "react";

const DefaultDetails = () => {
  // Only mount the form once its saved values are available. A read failure must
  // not present empty defaults that could replace the user's existing details.
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["idb-default-details"],
    queryFn: getDefaultDetails,
    retry: false,
  });

  if (isPending) {
    return (
      <p role="status" className="text-muted-foreground py-10 text-center text-sm">
        Loading your invoice defaults…
      </p>
    );
  }

  if (isError && data === undefined) {
    return (
      <div role="alert" className="bg-muted/30 flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-center">
        <CircleAlert aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">Your saved details couldn’t be loaded</p>
          <p className="text-muted-foreground text-sm">Try again to safely edit the defaults saved in this browser.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Trying again…" : "Try again"}
        </Button>
      </div>
    );
  }

  const defaultValues: ZodDefaultDetailsSchema = data
    ? { companyDetails: data.companyDetails, clientDetails: data.clientDetails }
    : defaultDetailsSchemaDefaultValues;

  return <DefaultDetailsForm defaultValues={defaultValues} />;
};

export { DefaultDetails };

const DefaultDetailsForm = ({ defaultValues }: { defaultValues: ZodDefaultDetailsSchema }) => {
  const queryClient = useQueryClient();
  const [hasSaved, setHasSaved] = React.useState(false);
  const form = useForm<ZodDefaultDetailsSchema>({
    resolver: zodResolver(defaultDetailsSchema),
    defaultValues,
  });
  const { isDirty } = form.formState;

  const saveMutation = useMutation({
    mutationFn: (values: ZodDefaultDetailsSchema) => saveDefaultDetails(values),
    onSuccess: (_, savedValues) => {
      const currentValues = form.getValues();
      const editedWhileSaving = JSON.stringify(currentValues) !== JSON.stringify(savedValues);

      // Move the dirty baseline to the saved snapshot, preserving any newer edits.
      form.reset(savedValues, { keepValues: true, keepTouched: true });
      if (editedWhileSaving) {
        form.reset(currentValues, { keepDefaultValues: true, keepValues: true, keepTouched: true });
      }

      setHasSaved(true);
      toast.success(SUCCESS_MESSAGES.DEFAULT_DETAILS_SAVED, {
        description: SUCCESS_MESSAGES.DEFAULT_DETAILS_SAVED_DESCRIPTION,
      });
      void queryClient.invalidateQueries({ queryKey: ["idb-default-details"] });
    },
    onError: (error) => {
      toast.error(ERROR_MESSAGES.TOAST_DEFAULT_TITLE, { description: error.message });
    },
  });

  const saveStatus = saveMutation.isPending
    ? "Saving your defaults…"
    : isDirty
      ? saveMutation.isError
        ? "Couldn’t save. Your changes are still here."
        : "You have unsaved changes"
      : hasSaved
        ? "Saved in this browser"
        : "Ready for your next invoice";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          if (!saveMutation.isPending) saveMutation.mutate(structuredClone(values));
        })}
        className="flex flex-col gap-7"
      >
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-0 lg:divide-x">
          <fieldset className="min-w-0 space-y-5 lg:pr-7">
            <legend className="mb-1 flex w-full items-start gap-3">
              <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Building2 aria-hidden="true" className="size-4" />
              </span>
              <span className="space-y-1">
                <span className="block text-sm font-semibold">Your business</span>
                <span className="text-muted-foreground block text-sm font-normal">
                  The sender details on new invoices.
                </span>
              </span>
            </legend>
            <DetailsField
              name="companyDetails.name"
              form={form}
              label="Business name"
              placeholder="e.g. Acme Studio"
              autoComplete="section-business organization"
            />
            <DetailsField
              multiline
              name="companyDetails.address"
              form={form}
              label="Business address"
              placeholder="Street address, city, postal code and country"
              autoComplete="section-business street-address"
            />
            <MetadataFields form={form} name="companyDetails.metadata" owner="business" />
          </fieldset>
          <fieldset className="min-w-0 space-y-5 border-t pt-7 lg:border-t-0 lg:pt-0 lg:pl-7">
            <legend className="mb-1 flex w-full items-start gap-3">
              <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
              <span className="space-y-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  Default client
                  <Badge variant="outline" className="text-muted-foreground font-normal">
                    Optional
                  </Badge>
                </span>
                <span className="text-muted-foreground block text-sm font-normal">
                  Useful if you often invoice the same client.
                </span>
              </span>
            </legend>
            <DetailsField
              name="clientDetails.name"
              form={form}
              label="Client name"
              placeholder="e.g. Jamie Smith or Northstar Ltd."
              autoComplete="section-client organization"
            />
            <DetailsField
              multiline
              name="clientDetails.address"
              form={form}
              label="Client address"
              placeholder="Street address, city, postal code and country"
              autoComplete="section-client street-address"
            />
            <MetadataFields form={form} name="clientDetails.metadata" owner="client" />
          </fieldset>
        </div>
        <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-sm font-medium">
              {!isDirty && hasSaved && <Check aria-hidden="true" className="size-4" />}
              {saveStatus}
            </p>
            <p className="text-muted-foreground text-xs">You can change these details on any invoice.</p>
          </div>
          <Button type="submit" disabled={saveMutation.isPending || !isDirty} className="h-10 px-5">
            {saveMutation.isPending ? "Saving…" : "Save defaults"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

type DetailsFieldName =
  | `${"companyDetails" | "clientDetails"}.${"name" | "address"}`
  | `${"companyDetails" | "clientDetails"}.metadata.${number}.${"label" | "value"}`;

const DetailsField = ({
  form,
  name,
  label,
  placeholder,
  autoComplete,
  multiline = false,
}: {
  form: UseFormReturn<ZodDefaultDetailsSchema>;
  name: DetailsFieldName;
  label: string;
  placeholder: string;
  autoComplete?: string;
  multiline?: boolean;
}) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem className="min-w-0 gap-2">
        <FormLabel className="text-sm font-medium">{label}</FormLabel>
        <FormControl>
          {multiline ? (
            <Textarea
              {...field}
              className="bg-background min-h-24 resize-y"
              placeholder={placeholder}
              autoComplete={autoComplete}
            />
          ) : (
            <Input {...field} className="bg-background h-10" placeholder={placeholder} autoComplete={autoComplete} />
          )}
        </FormControl>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

const MetadataFields = ({
  form,
  name,
  owner,
}: {
  form: UseFormReturn<ZodDefaultDetailsSchema>;
  name: "companyDetails.metadata" | "clientDetails.metadata";
  owner: "business" | "client";
}) => {
  const { fields, append, remove } = useFieldArray({ control: form.control, name });

  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-1 text-sm font-medium">Additional details</legend>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Add a tax number, email, or any other detail to include on invoices.
      </p>
      {fields.map((field, index) => (
        <div
          className="bg-muted/20 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 rounded-lg border p-3"
          key={field.id}
        >
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <DetailsField name={`${name}.${index}.label`} form={form} label="Label" placeholder="e.g. Tax ID" />
            <DetailsField name={`${name}.${index}.value`} form={form} label="Value" placeholder="e.g. 123456789" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="text-muted-foreground hover:text-destructive mb-0.5 size-9"
            aria-label={`Remove ${owner} detail ${index + 1}`}
            onClick={() => remove(index)}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        className="h-9 gap-1.5 border-dashed"
        variant="outline"
        type="button"
        aria-label={`Add ${owner} detail`}
        onClick={() => append({ label: "", value: "" })}
      >
        <Plus aria-hidden="true" className="size-3.5" />
        Add a detail
      </Button>
    </fieldset>
  );
};
