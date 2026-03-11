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
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { deleteInvoiceFromIDB } from "@/lib/indexdb-queries/deleteInvoice";
import type { InvoiceStatusType } from "@invoicely/db/schema/invoice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FormButton } from "@/components/ui/form/form-button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form/form";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/client-auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatabaseIcon } from "@/assets/icons";
import { useForm } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

interface MigrateToDbModalProps {
  invoiceId: string;
  invoiceFields: ZodCreateInvoiceSchema;
  status: InvoiceStatusType;
  paidAt: Date | null;
}

const migrateSchema = z.object({
  id: z.string(),
});

type MigrateSchema = z.infer<typeof migrateSchema>;

const MigrateToDbModal = ({ invoiceId, invoiceFields, status, paidAt }: MigrateToDbModalProps) => {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const migrateMutation = useMutation(
    trpc.invoice.migrateToDb.mutationOptions({
      onError: (error) => {
        toast.error("Failed to migrate invoice!", {
          description: parseCatchError(error),
        });
      },
    }),
  );

  const form = useForm<MigrateSchema>({
    resolver: zodResolver(migrateSchema),
    defaultValues: {
      id: invoiceId,
    },
  });

  const onSubmit = async () => {
    const result = await migrateMutation.mutateAsync({
      invoiceFields,
      status,
      paidAt,
    });

    if (!result.success) return;

    try {
      await deleteInvoiceFromIDB(invoiceId);
    } catch {
      toast.warning("Invoice saved to database, but failed to remove from local storage.", {
        description: "You may see a duplicate until you manually delete the local copy.",
      });
    }

    toast.success("Invoice migrated successfully!", {
      description: "Your local invoice has been saved to the database.",
    });

    queryClient.invalidateQueries({ queryKey: trpc.invoice.list.queryKey() });
    queryClient.invalidateQueries({ queryKey: ["idb-invoices"] });
    setOpen(false);
  };

  if (!session?.user?.allowedSavingData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <DatabaseIcon />
          <span>Migrate to Database</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeaderContainer>
              <DialogIcon>
                <DatabaseIcon />
              </DialogIcon>
              <DialogHeader>
                <DialogTitle>Migrate to Database</DialogTitle>
                <DialogDescription>
                  This will save your local invoice to the server database and remove it from local storage.
                </DialogDescription>
              </DialogHeader>
            </DialogHeaderContainer>
            <DialogContentContainer>
              <Alert>
                <AlertTitle>What will happen?</AlertTitle>
                <AlertDescription>
                  Your invoice will be uploaded to the server database. Once saved successfully, the local copy will be
                  automatically removed. The invoice status and all data will be preserved.
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
              <FormButton type="submit">Migrate</FormButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MigrateToDbModal;
