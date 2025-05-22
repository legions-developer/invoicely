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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { deleteInvoiceFromIDB } from "@/lib/indexdb-queries/deleteInvoice"; // New import
import type { InvoiceTypeType } from "@invoicely/db/schema/invoice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FormButton } from "@/components/ui/form/form-button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrashIcon } from "@/assets/icons";
import { useForm } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

interface DeleteInvoiceModalProps {
  type: InvoiceTypeType;
  invoiceId: string;
}

const deleteInvoiceSchema = z.object({
  id: z.string(),
});

type DeleteInvoiceSchema = z.infer<typeof deleteInvoiceSchema>;

const DeleteInvoiceModal = ({ invoiceId, type }: DeleteInvoiceModalProps) => {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Postgres Mutation
  const deleteServerInvoiceMutation = useMutation(
    trpc.invoice.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice deleted successfully!", {
          description: "The invoice has been deleted from the database.",
        });
        queryClient.invalidateQueries({ queryKey: trpc.invoice.list.queryKey() });
      },
      onError: (error) => {
        toast.error("Failed to delete invoice!", {
          description: parseCatchError(error),
        });
      },
    }),
  );

  // IDB Mutation
  const deleteIDBInvoiceMutation = useMutation({
    mutationFn: async (data: DeleteInvoiceSchema) => {
      await deleteInvoiceFromIDB(data.id);
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully!", {
        description: "The invoice has been deleted from local storage.",
      });
      queryClient.invalidateQueries({ queryKey: ["idb-invoices"] });
    },
    onError: (error) => {
      toast.error("Failed to delete invoice!", {
        description: parseCatchError(error),
      });
    },
  });

  const form = useForm<DeleteInvoiceSchema>({
    resolver: zodResolver(deleteInvoiceSchema),
    defaultValues: {
      id: invoiceId,
    },
  });

  const onSubmit = async () => {
    if (type === "postgres") {
      await deleteServerInvoiceMutation.mutateAsync({
        id: invoiceId,
      });
    } else {
      await deleteIDBInvoiceMutation.mutateAsync({
        id: invoiceId,
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <TrashIcon />
          <span>Delete Invoice</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeaderContainer>
              <DialogIcon>
                <TrashIcon />
              </DialogIcon>
              <DialogHeader>
                <DialogTitle>Delete Invoice</DialogTitle>
                <DialogDescription>This action cannot be undone.</DialogDescription>
              </DialogHeader>
            </DialogHeaderContainer>
            <DialogContentContainer>
              <Alert variant="destructive">
                <AlertTitle>Proceed with caution!</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. It will remove the invoice permanently from the database. You will not
                  be able to recover it.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-1.5">
                <Label>Invoice ID</Label>
                <Input disabled value={invoiceId} />
              </div>
            </DialogContentContainer>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <FormButton variant="destructive" type="submit">
                Delete
              </FormButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteInvoiceModal;
