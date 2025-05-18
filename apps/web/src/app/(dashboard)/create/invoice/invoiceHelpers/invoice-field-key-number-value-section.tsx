"use client";

import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { FormSelect } from "@/components/ui/form/form-select";
import { FormInput } from "@/components/ui/form/form-input";
import { SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TrashIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import React from "react";

interface InvoiceFieldKeyNumberValuesSectionProps {
  reactform: UseFormReturn<ZodCreateInvoiceSchema>;
  name: "invoiceDetails.billingDetails";
  className?: string;
  label?: string | undefined;
  description?: string | undefined;
  isOptional?: boolean;
}

const InvoiceFieldKeyNumberValuesSection: React.FC<InvoiceFieldKeyNumberValuesSectionProps> = ({
  reactform,
  name,
  className,
  label,
}) => {
  const { fields, append, remove } = useFieldArray({
    control: reactform.control,
    name,
  });

  const addNewField = () => {
    append({
      label: "",
      value: 0,
      type: "fixed",
    });
  };

  return (
    <div className={cn(className, "flex flex-col gap-2")}>
      <div className="flex flex-row items-center gap-2">
        <Label>{label ?? "Fields"}</Label>
      </div>
      {fields.map((field, index) => (
        <div className="flex flex-col items-center gap-2 sm:flex-row" key={field.id}>
          <div className="flex w-full flex-row gap-2 sm:w-2/3">
            <FormInput
              name={`${name}.${index}.label`}
              reactform={reactform}
              label="Label"
              isOptional={true}
              sublabel="Tax/Discount/Other"
              placeholder="Label"
            />
            <FormSelect name={`${name}.${index}.type`} reactform={reactform} label="Type" placeholder="Type">
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
            </FormSelect>
          </div>
          <div className="flex w-full flex-row items-end gap-2 sm:w-1/3">
            <FormInput
              type="number"
              name={`${name}.${index}.value`}
              reactform={reactform}
              label="Value"
              placeholder="Value"
            />
            <Button variant="destructive" size="icon" onClick={() => remove(index)} type="button">
              <TrashIcon />
            </Button>
          </div>
        </div>
      ))}
      <Button className="w-full border-dashed" variant="outline" onClick={addNewField} type="button">
        Add New Field
      </Button>
    </div>
  );
};

export default InvoiceFieldKeyNumberValuesSection;
