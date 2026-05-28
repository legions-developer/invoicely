"use client";

import {
  defaultDetailsSchema,
  defaultDetailsSchemaDefaultValues,
  ZodDefaultDetailsSchema,
} from "@/zod-schemas/invoice/default-details";
import { getDefaultDetails, saveDefaultDetails } from "@/lib/indexdb-queries/defaultDetails";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { FormTextarea } from "@/components/ui/form/form-textarea";
import { FormInput } from "@/components/ui/form/form-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TrashIcon } from "@/assets/icons";
import { toast } from "sonner";
import React from "react";

const DefaultDetails = () => {
  // Fetch the saved details first so the form mounts with the correct defaults
  // (compute-before-mount instead of resetting via an effect).
  const { data, isPending } = useQuery({
    queryKey: ["idb-default-details"],
    queryFn: getDefaultDetails,
  });

  if (isPending) {
    return <p className="text-muted-foreground py-4 text-sm">Loading default details...</p>;
  }

  const defaultValues: ZodDefaultDetailsSchema = data
    ? { companyDetails: data.companyDetails, clientDetails: data.clientDetails }
    : defaultDetailsSchemaDefaultValues;

  return <DefaultDetailsForm defaultValues={defaultValues} />;
};

export default DefaultDetails;

const DefaultDetailsForm = ({ defaultValues }: { defaultValues: ZodDefaultDetailsSchema }) => {
  const queryClient = useQueryClient();

  const form = useForm<ZodDefaultDetailsSchema>({
    resolver: zodResolver(defaultDetailsSchema),
    defaultValues,
  });

  const saveMutation = useMutation({
    mutationFn: (values: ZodDefaultDetailsSchema) => saveDefaultDetails(values),
    onSuccess: () => {
      toast.success(SUCCESS_MESSAGES.DEFAULT_DETAILS_SAVED, {
        description: SUCCESS_MESSAGES.DEFAULT_DETAILS_SAVED_DESCRIPTION,
      });
      queryClient.invalidateQueries({ queryKey: ["idb-default-details"] });
    },
    onError: (error) => {
      toast.error(ERROR_MESSAGES.TOAST_DEFAULT_TITLE, { description: error.message });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div>
              <div className="instrument-serif text-xl font-bold">Company Details</div>
              <p className="text-muted-foreground text-xs">Your sender details, used to pre-fill new invoices.</p>
            </div>
            <FormInput name="companyDetails.name" reactform={form} label="Company Name" placeholder="John Doe ltd." />
            <FormTextarea
              className="h-20"
              name="companyDetails.address"
              reactform={form}
              label="Company Address"
              placeholder="123 Business St, City, Country"
            />
            <MetadataFields form={form} name="companyDetails.metadata" label="Company Fields" />
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <div className="instrument-serif text-xl font-bold">Client Details</div>
              <p className="text-muted-foreground text-xs">Optional default client, editable on each invoice.</p>
            </div>
            <FormInput name="clientDetails.name" reactform={form} label="Client Name" placeholder="John Doe" />
            <FormTextarea
              className="h-20"
              name="clientDetails.address"
              reactform={form}
              label="Client Address"
              placeholder="456 Client St, City, Country"
            />
            <MetadataFields form={form} name="clientDetails.metadata" label="Client Fields" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Details"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

interface MetadataFieldsProps {
  form: UseFormReturn<ZodDefaultDetailsSchema>;
  name: "companyDetails.metadata" | "clientDetails.metadata";
  label: string;
}

const MetadataFields: React.FC<MetadataFieldsProps> = ({ form, name, label }) => {
  const { fields, append, remove } = useFieldArray({ control: form.control, name });

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {fields.map((field, index) => (
        <div className="flex flex-row items-end gap-2" key={field.id}>
          <FormInput name={`${name}.${index}.label`} reactform={form} label="Label" placeholder="Label" />
          <FormInput name={`${name}.${index}.value`} reactform={form} label="Value" placeholder="Value" />
          <Button variant="destructive" size="icon" type="button" onClick={() => remove(index)}>
            <TrashIcon />
          </Button>
        </div>
      ))}
      <Button
        className="w-full border-dashed"
        variant="outline"
        type="button"
        onClick={() => append({ label: "", value: "" })}
      >
        Add New Field
      </Button>
    </div>
  );
};
