import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EyeScannerIcon, FileDownloadIcon, ImageSparkleIcon, InboxArrowDownIcon } from "@/assets/icons";
import { InvoiceDownloadManagerInstance } from "@/global/instances/invoice/invoice-download-manager";
import { EditInvoicePageSchema } from "@/zod-schemas/invoice/edit-invoice-page";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { PostHogAnalytics } from "@/components/ui/posthog-analytics";
import { saveInvoiceToDatabase } from "@/lib/invoice/save-invoice";
import { InvoiceTypeType } from "@invoicely/db/schema/invoice";
import { editInvoice } from "@/lib/invoice/edit-invoice";
import InvoiceErrorsModal from "./invoice-errors-modal";
import InvoiceTabSwitch from "./invoice-tab-switch";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { AuthUser } from "@/types/auth";

type InvoiceOptionsProps = "view-pdf" | "download-pdf" | "download-png" | "save-invoice-to-database";

const InvoiceOptions = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  const params = useParams() satisfies { type?: string; id?: string };
  const formValues = form.getValues();
  const user = useUser();

  const handleDropDownAction = async (action: InvoiceOptionsProps) => {
    await InvoiceDownloadManagerInstance.initialize(formValues);

    const { data } = EditInvoicePageSchema.safeParse({
      type: params.type,
      id: params.id,
    });

    switch (action) {
      case "save-invoice-to-database":
        SaveInvoiceToDatabase({ formValues, user, type: data?.type, id: data?.id });
        break;
      case "view-pdf":
        InvoiceDownloadManagerInstance.previewPdf();
        // dont save the invoice to database because we are not redirecting user to edit page
        break;
      case "download-pdf":
        InvoiceDownloadManagerInstance.downloadPdf();
        SaveInvoiceToDatabase({ formValues, user, type: data?.type, id: data?.id });
        break;
      case "download-png":
        InvoiceDownloadManagerInstance.downloadPng();
        SaveInvoiceToDatabase({ formValues, user, type: data?.type, id: data?.id });
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex h-12 shrink-0 flex-row items-center justify-between gap-2 border-b px-2">
      <InvoiceErrorsModal />
      <div className="flex flex-row items-center gap-2">
        <InvoiceTabSwitch />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default">
              <InboxArrowDownIcon />
              Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <PostHogAnalytics analytics={{ name: "save-invoice-action", group: "create-invoice-page" }}>
              <DropdownMenuItem onClick={() => handleDropDownAction("save-invoice-to-database")}>
                <InboxArrowDownIcon />
                <span>Save Invoice</span>
              </DropdownMenuItem>
            </PostHogAnalytics>
            <PostHogAnalytics analytics={{ name: "view-invoice-action", group: "create-invoice-page" }}>
              <DropdownMenuItem onClick={() => handleDropDownAction("view-pdf")}>
                <EyeScannerIcon />
                <span>View PDF</span>
              </DropdownMenuItem>
            </PostHogAnalytics>
            <PostHogAnalytics analytics={{ name: "download-invoice-action", group: "create-invoice-page" }}>
              <DropdownMenuItem onClick={() => handleDropDownAction("download-pdf")}>
                <FileDownloadIcon />
                <span>Download PDF</span>
              </DropdownMenuItem>
            </PostHogAnalytics>
            <PostHogAnalytics analytics={{ name: "download-invoice-png-action", group: "create-invoice-page" }}>
              <DropdownMenuItem onClick={() => handleDropDownAction("download-png")}>
                <ImageSparkleIcon />
                <span>Download PNG</span>
              </DropdownMenuItem>
            </PostHogAnalytics>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default InvoiceOptions;

const SaveInvoiceToDatabase = ({
  formValues,
  user,
  type,
  id,
}: {
  formValues: ZodCreateInvoiceSchema;
  user: AuthUser | undefined;
  type?: InvoiceTypeType;
  id?: string;
}) => {
  if (id && type) {
    // Edit the old invoice
    editInvoice(formValues, user, type, id);
  } else {
    saveInvoiceToDatabase(formValues, user);
  }
};
