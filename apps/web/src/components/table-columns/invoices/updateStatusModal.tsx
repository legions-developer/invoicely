"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContentContainer,
  DialogHeaderContainer,
  DialogIcon,
  DialogClose,
} from "@/components/ui/dialog";
import {
  FileAlertIcon,
  FileBanIcon,
  FileCheckIcon,
  FileRefreshIcon,
  HourglassStartIcon,
  PriorityMediumIcon,
} from "@/assets/icons";
import { updateInvoiceStatus } from "@/lib/indexdb-queries/updateInvoiceStatus";
import type { InvoiceTypeType } from "@invoicely/db/schema/invoice";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { invoiceStatusEnum } from "@invoicely/db/schema/invoice";
import { FormButton } from "@/components/ui/form/form-button";
import { FormSelect } from "@/components/ui/form/form-select";
import { asyncTryCatch } from "@/lib/neverthrow/tryCatch";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectItem } from "@/components/ui/select";
import { Form } from "@/components/ui/form/form";
import { Button } from "@/components/ui/button";
import { trpcProxyClient } from "@/trpc/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

interface UpdateStatusModalProps {
  type: InvoiceTypeType;
  invoiceId: string;
}

const invoiceStatusSchema = z.object({
  id: z.string(),
  status: z.enum(invoiceStatusEnum.enumValues),
});

type InvoiceStatusSchema = z.infer<typeof invoiceStatusSchema>;

const UpdateStatusModal = ({ invoiceId, type }: UpdateStatusModalProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<InvoiceStatusSchema>({
    resolver: zodResolver(invoiceStatusSchema),
    defaultValues: {
      id: invoiceId,
      status: "pending",
    },
  });

  const onSubmit = async (data: InvoiceStatusSchema) => {
    if (type === "postgres") {
      // Updating the status of the invoice in the database
      const updatedInvoice = await trpcProxyClient.invoice.updateStatus.mutate({
        id: invoiceId,
        status: data.status,
      });

      if (updatedInvoice.success) {
        toast.success("Status updated successfully!", {
          description: updatedInvoice.message,
        });
      } else {
        toast.error("Failed to update status!", {
          description: updatedInvoice.message,
        });
      }
    } else {
      // Updating status of invoice in local idb
      const { success, error } = await asyncTryCatch(updateInvoiceStatus(invoiceId, data.status));

      if (success) {
        toast.success("Status updated successfully!", {
          description: "The status of the invoice has been updated successfully.",
        });
      } else {
        toast.error("Failed to update status!", {
          description: parseCatchError(error),
        });
      }
    }

    // Close the modal
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <PriorityMediumIcon />
          <span>Update Status</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeaderContainer>
              <DialogIcon>
                <PriorityMediumIcon />
              </DialogIcon>
              <DialogHeader>
                <DialogTitle>Update Invoice Status</DialogTitle>
                <DialogDescription>Update the status of the invoice to the new status.</DialogDescription>
              </DialogHeader>
            </DialogHeaderContainer>
            <DialogContentContainer>
              <div className="flex flex-col gap-1.5">
                <Label>Invoice ID</Label>
                <Input disabled value={invoiceId} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Change Status</Label>
                <FormSelect name="status" reactform={form}>
                  <SelectItem value="pending">
                    <HourglassStartIcon />
                    <span>Pending</span>
                  </SelectItem>
                  <SelectItem value="success">
                    <FileCheckIcon />
                    <span>Success</span>
                  </SelectItem>
                  <SelectItem value="error">
                    <FileBanIcon />
                    <span>Error</span>
                  </SelectItem>
                  <SelectItem value="expired">
                    <FileAlertIcon />
                    <span>Expired</span>
                  </SelectItem>
                  <SelectItem value="refunded">
                    <FileRefreshIcon />
                    <span>Refunded</span>
                  </SelectItem>
                </FormSelect>
              </div>
            </DialogContentContainer>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <FormButton>Update</FormButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateStatusModal;
