import {
  BoxIcon,
  CalendarCheckIcon,
  DatabaseIcon,
  FileAlertIcon,
  FileBanIcon,
  FileCheckIcon,
  FilePenIcon,
  FileRefreshIcon,
  HardDriveIcon,
  HourglassStartIcon,
  IdBadgeIcon,
  PriorityMediumIcon,
  SortNumDescendingIcon,
} from "@/assets/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createColumnConfigHelper } from "@/components/ui/data-table-filter/core/filters";
import { HeaderColumnButton, FormatTableDateObject } from "@/components/ui/data-table";
import type { InvoiceStatusType } from "@invoicely/db/schema/invoice";
import { Badge, BadgeVariants } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { getTotalValue } from "@/constants/pdf-helpers";
import getSymbolFromCurrency from "currency-symbol-map";
import DeleteInvoiceModal from "./deleteInvoiceModal";
import UpdateStatusModal from "./updateStatusModal";
import { Invoice } from "@/types/common/invoice";
import { CalendarPenIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const columnHelper = createColumnHelper<Invoice>();
const columnConfigHelper = createColumnConfigHelper<Invoice>();

export const columns = [
  columnHelper.accessor((row) => row.type, {
    id: "type",
    header: ({ column }) => <HeaderColumnButton column={column}>Storage</HeaderColumnButton>,
    cell: ({ row }) => (
      <Badge variant={row.original.type === "local" ? "default" : "rose"} icon>
        {row.original.type === "local" ? <HardDriveIcon /> : <DatabaseIcon />}
        {row.original.type === "local" ? "Local" : "Server"}
      </Badge>
    ),
    enableSorting: false,
  }),

  columnHelper.accessor((row) => row.id, {
    id: "id",
    header: ({ column }) => <HeaderColumnButton column={column}>ID</HeaderColumnButton>,
    cell: ({ row }) => <div className="text-muted-foreground text-xs">{row.original.id}</div>,
    enableSorting: false,
  }),

  columnHelper.accessor(
    (row) => `${row.invoiceFields.invoiceDetails.prefix}${row.invoiceFields.invoiceDetails.serialNumber}`,
    {
      id: "serialNumber",
      header: ({ column }) => <HeaderColumnButton column={column}>Serial No</HeaderColumnButton>,
      cell: ({ row }) => (
        <div className="text-xs">{`${row.original.invoiceFields.invoiceDetails.prefix}${row.original.invoiceFields.invoiceDetails.serialNumber}`}</div>
      ),
      enableSorting: false,
    },
  ),

  columnHelper.accessor((row) => getTotalValue(row.invoiceFields), {
    id: "total",
    header: ({ column }) => <HeaderColumnButton column={column}>Total</HeaderColumnButton>,
    cell: ({ row }) => (
      <div className="text-xs">{`${getSymbolFromCurrency(row.original.invoiceFields.invoiceDetails.currency)}${getTotalValue(row.original.invoiceFields)}`}</div>
    ),
  }),

  columnHelper.accessor((row) => row.invoiceFields.items.length, {
    id: "items",
    header: ({ column }) => <HeaderColumnButton column={column}>Items</HeaderColumnButton>,
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="gray" icon>
              <BoxIcon />
              <span>{row.original.invoiceFields.items.length}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{row.original.invoiceFields.items.length} items in this invoice</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  }),

  columnHelper.accessor((row) => row.status, {
    id: "status",
    header: ({ column }) => <HeaderColumnButton column={column}>Status</HeaderColumnButton>,
    cell: ({ row }) => (
      <Badge className="capitalize" variant={getStatusBadgeVariant(row.original.status)} icon>
        {getStatusIcon(row.original.status)}
        {row.original.status}
      </Badge>
    ),
    enableSorting: false,
  }),

  columnHelper.accessor((row) => row.createdAt, {
    id: "createdAt",
    header: ({ column }) => <HeaderColumnButton column={column}>Created At</HeaderColumnButton>,
    cell: ({ row }) => <FormatTableDateObject date={row.original.createdAt} />,
  }),

  columnHelper.accessor((row) => row.paidAt, {
    id: "paidAt",
    header: ({ column }) => <HeaderColumnButton column={column}>Paid At</HeaderColumnButton>,
    cell: ({ row }) =>
      row.original.paidAt ? <FormatTableDateObject date={row.original.paidAt} /> : <Badge variant="gray">Unpaid</Badge>,
  }),

  // Actions
  columnHelper.accessor(() => "actions", {
    id: "actions",
    header: ({ column }) => <HeaderColumnButton column={column}>Actions</HeaderColumnButton>,
    cell: ({ row }) => {
      const { id, type, status } = row.original;

      return (
        <div key={id} className="flex flex-row items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="xs">
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <UpdateStatusModal invoiceId={id} type={type} currentStatus={status} />
              <Link href={`/edit/${type}/${id}`}>
                <DropdownMenuItem>
                  <FilePenIcon />
                  <span>Edit</span>
                </DropdownMenuItem>
              </Link>
              <DeleteInvoiceModal invoiceId={id} type={type} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
  }),
];

export const importInvoiceColumns = [
  columnHelper.accessor(
    (row) => `${row.invoiceFields.invoiceDetails.prefix}${row.invoiceFields.invoiceDetails.serialNumber}`,
    {
      id: "serialNumber",
      header: ({ column }) => <HeaderColumnButton column={column}>Serial No</HeaderColumnButton>,
      cell: ({ row }) => (
        <div className="text-xs">{`${row.original.invoiceFields.invoiceDetails.prefix}${row.original.invoiceFields.invoiceDetails.serialNumber}`}</div>
      ),
      enableSorting: false,
    },
  ),

  columnHelper.accessor((row) => row.invoiceFields.clientDetails.name, {
    id: "clientDetails.name",
    header: ({ column }) => <HeaderColumnButton column={column}>Client</HeaderColumnButton>,
    cell: ({ row }) => <div className="text-xs">{row.original.invoiceFields.clientDetails.name}</div>,
    enableSorting: false,
  }),

  columnHelper.accessor((row) => getTotalValue(row.invoiceFields), {
    id: "total",
    header: ({ column }) => <HeaderColumnButton column={column}>Total</HeaderColumnButton>,
    cell: ({ row }) => (
      <div className="text-xs">{`${getSymbolFromCurrency(row.original.invoiceFields.invoiceDetails.currency)}${getTotalValue(row.original.invoiceFields)}`}</div>
    ),
  }),

  columnHelper.accessor((row) => row.invoiceFields.items.length, {
    id: "items",
    header: ({ column }) => <HeaderColumnButton column={column}>Items</HeaderColumnButton>,
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="gray" icon>
              <BoxIcon />
              <span>{row.original.invoiceFields.items.length}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{row.original.invoiceFields.items.length} items in this invoice</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  }),

  columnHelper.accessor((row) => row.createdAt, {
    id: "createdAt",
    header: ({ column }) => <HeaderColumnButton column={column}>Created At</HeaderColumnButton>,
    cell: ({ row }) => <FormatTableDateObject date={row.original.createdAt} />,
  }),
];

export const columnConfig = [
  // Storage
  columnConfigHelper
    .option()
    .id("type")
    .displayName("Storage")
    .accessor((row) => row.type)
    .icon(DatabaseIcon)
    .options([
      { label: "", value: "local", icon: <Badge variant="default">Local</Badge> },
      { label: "", value: "server", icon: <Badge variant="rose">Server</Badge> },
    ])
    .build(),
  // Id
  columnConfigHelper
    .text()
    .id("id")
    .displayName("ID")
    .accessor((row) => row.id)
    .icon(IdBadgeIcon)
    .build(),
  // Created At
  columnConfigHelper
    .date()
    .id("createdAt")
    .displayName("Created At")
    .accessor((row) => row.createdAt)
    .icon(CalendarPenIcon)
    .build(),
  // Paid At
  columnConfigHelper
    .date()
    .id("paidAt")
    .displayName("Paid At")
    .accessor((row) => row.paidAt)
    .icon(CalendarCheckIcon)
    .build(),
  // Serial No
  columnConfigHelper
    .text()
    .id("serialNumber")
    .displayName("Serial No")
    .accessor((row) => `${row.invoiceFields.invoiceDetails.prefix}${row.invoiceFields.invoiceDetails.serialNumber}`)
    .icon(SortNumDescendingIcon)
    .build(),
  // Status
  columnConfigHelper
    .option()
    .id("status")
    .displayName("Status")
    .accessor((row) => row.status)
    .icon(PriorityMediumIcon)
    .options([
      { label: "", value: "pending", icon: <Badge variant="yellow">Pending</Badge> },
      { label: "", value: "success", icon: <Badge variant="green">Success</Badge> },
      { label: "", value: "error", icon: <Badge variant="destructive">Error</Badge> },
      { label: "", value: "expired", icon: <Badge variant="gray">Expired</Badge> },
      { label: "", value: "refunded", icon: <Badge variant="purple">Refunded</Badge> },
    ])
    .build(),
];

export const importInvoiceColumnConfig = [
  // Storage
  columnConfigHelper
    .option()
    .id("type")
    .displayName("Storage")
    .accessor((row) => row.type)
    .icon(DatabaseIcon)
    .options([
      { label: "", value: "local", icon: <Badge variant="default">Local</Badge> },
      { label: "", value: "server", icon: <Badge variant="rose">Server</Badge> },
    ])
    .build(),
  // Id
  columnConfigHelper
    .text()
    .id("id")
    .displayName("ID")
    .accessor((row) => row.id)
    .icon(IdBadgeIcon)
    .build(),
  // Created At
  columnConfigHelper
    .date()
    .id("createdAt")
    .displayName("Created At")
    .accessor((row) => row.createdAt)
    .icon(CalendarPenIcon)
    .build(),
  // Paid At
  columnConfigHelper
    .date()
    .id("paidAt")
    .displayName("Paid At")
    .accessor((row) => row.paidAt)
    .icon(CalendarCheckIcon)
    .build(),
  // Serial No
  columnConfigHelper
    .text()
    .id("serialNumber")
    .displayName("Serial No")
    .accessor((row) => `${row.invoiceFields.invoiceDetails.prefix}${row.invoiceFields.invoiceDetails.serialNumber}`)
    .icon(SortNumDescendingIcon)
    .build(),
  // Status
  columnConfigHelper
    .option()
    .id("status")
    .displayName("Status")
    .accessor((row) => row.status)
    .icon(PriorityMediumIcon)
    .options([
      { label: "", value: "pending", icon: <Badge variant="yellow">Pending</Badge> },
      { label: "", value: "success", icon: <Badge variant="green">Success</Badge> },
      { label: "", value: "error", icon: <Badge variant="destructive">Error</Badge> },
      { label: "", value: "expired", icon: <Badge variant="gray">Expired</Badge> },
      { label: "", value: "refunded", icon: <Badge variant="purple">Refunded</Badge> },
    ])
    .build(),
];

const getStatusBadgeVariant = (status: InvoiceStatusType): BadgeVariants => {
  switch (status) {
    case "pending":
      return "yellow";
    case "success":
      return "green";
    case "error":
      return "destructive";
    case "expired":
      return "gray";
    case "refunded":
      return "purple";
    default:
      return "gray";
  }
};

const getStatusIcon = (status: InvoiceStatusType) => {
  switch (status) {
    case "pending":
      return <HourglassStartIcon />;
    case "success":
      return <FileCheckIcon />;
    case "error":
      return <FileBanIcon />;
    case "expired":
      return <FileAlertIcon />;
    case "refunded":
      return <FileRefreshIcon />;
    default:
      return <HourglassStartIcon />;
  }
};
