import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EyeScannerIcon, FileDownloadIcon, ImageSparkleIcon, InboxArrowDownIcon } from "@/assets/icons";
import { InvoiceDownloadManagerInstance } from "@/global/instances/invoice/invoice-download-manager";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { PostHogAnalytics } from "@/components/ui/posthog-analytics";
import { saveInvoiceToDatabase } from "@/lib/invoice/save-invoice";
import InvoiceErrorsModal from "./invoice-errors-modal";
import InvoiceTabSwitch from "./invoice-tab-switch";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { useUser } from "@/hooks/use-user";

type InvoiceOptionsProps = "view-pdf" | "download-pdf" | "download-png";

const InvoiceOptions = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  const formValues = form.getValues();
  const user = useUser();

  const handleDropDownAction = async (action: InvoiceOptionsProps) => {
    await InvoiceDownloadManagerInstance.initialize(formValues);

    switch (action) {
      case "view-pdf":
        InvoiceDownloadManagerInstance.previewPdf();
        break;
      case "download-pdf":
        InvoiceDownloadManagerInstance.downloadPdf();
        saveInvoiceToDatabase(formValues, user);
        break;
      case "download-png":
        InvoiceDownloadManagerInstance.downloadPng();
        saveInvoiceToDatabase(formValues, user);
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
