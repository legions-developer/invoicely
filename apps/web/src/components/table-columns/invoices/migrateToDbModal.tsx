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
import { moveInvoiceToServer } from "@/lib/invoice/move-invoice-to-server";
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
  const { data: session, isPending: isSessionPending } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const migrateMutation = useMutation(trpc.invoice.migrateToDb.mutationOptions());
  const canMove = !isSessionPending && !!session?.user?.allowedSavingData;

  const form = useForm<MigrateSchema>({
    resolver: zodResolver(migrateSchema),
    defaultValues: {
      id: invoiceId,
    },
  });

  const onSubmit = async () => {
    if (!canMove) return;

    let result: Awaited<ReturnType<typeof moveInvoiceToServer>>;
    try {
      result = await moveInvoiceToServer(
        { invoiceId, invoiceFields, status, paidAt },
        { saveInvoice: migrateMutation.mutateAsync, deleteLocalInvoice: deleteInvoiceFromIDB },
      );
    } catch (error) {
      toast.error("Could not move invoice to server", {
        description: `${parseCatchError(error)} Your local invoice has been kept.`,
      });
      return;
    }

    if (result.localCopyRemoved) {
      toast.success("Invoice moved to server", {
        description: "The invoice is saved to your account and its local copy has been removed.",
      });
    } else {
      toast.warning("Invoice saved to server; local copy still exists", {
        description: "The local copy could not be removed. Delete it manually instead of moving it again.",
      });
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.invoice.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: ["idb-invoices"] }),
    ]);
    setOpen(false);
  };

  const { isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <DatabaseIcon />
          <span>Move to server</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent hideCloseButton={isSubmitting}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeaderContainer>
              <DialogIcon>
                <DatabaseIcon />
              </DialogIcon>
              <DialogHeader>
                <DialogTitle>Move to server</DialogTitle>
                <DialogDescription>
                  Save this invoice to your account and remove it from this browser.
                </DialogDescription>
              </DialogHeader>
            </DialogHeaderContainer>
            <DialogContentContainer>
              <Alert>
                <AlertTitle>
                  {isSessionPending
                    ? "Checking your account"
                    : !session?.user
                      ? "Sign in to continue"
                      : !canMove
                        ? "Allow Data Sync is off"
                        : "Your local copy stays safe"}
                </AlertTitle>
                <AlertDescription>
                  {isSessionPending
                    ? "Please wait while we check whether server storage is enabled."
                    : !session?.user
                      ? "Sign in from the sidebar, then enable Allow Data Sync to move this invoice to your account."
                      : !canMove
                        ? "Enable Allow Data Sync in the sidebar to move this invoice to your account."
                        : "The local copy is removed only after the server confirms it has saved your invoice, including its images, status, and payment date."}
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-1.5">
                <Label>Invoice ID</Label>
                <Input disabled value={invoiceId} />
              </div>
            </DialogContentContainer>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <FormButton type="submit" disabled={!canMove}>
                Move to server
              </FormButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MigrateToDbModal;
