import { createColumnConfigHelper } from "@/components/ui/data-table-filter/core/filters";
import { HeaderColumnButton, FormatTableDateObject } from "@/components/ui/data-table";
import { IDBInvoice, INVOICE_STATUS } from "@/types/indexdb/invoice";
import { Badge, BadgeVariants } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { getTotalValue } from "@/constants/pdf-helpers";
import getSymbolFromCurrency from "currency-symbol-map";
import { CalendarPenIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<IDBInvoice>();
const columnConfigHelper = createColumnConfigHelper<IDBInvoice>();

export const columns = [
  columnHelper.accessor((row) => row.id, {
    id: "id",
    header: ({ column }) => <HeaderColumnButton column={column}>ID</HeaderColumnButton>,
    cell: ({ row }) => <div className="text-muted-foreground text-xs">{row.original.id}</div>,
  }),

  columnHelper.accessor((row) => `${row.data.invoiceDetails.prefix}${row.data.invoiceDetails.serialNumber}`, {
    id: "serialNumber",
    header: ({ column }) => <HeaderColumnButton column={column}>Serial No</HeaderColumnButton>,
    cell: ({ row }) => (
      <div className="text-xs">{`${row.original.data.invoiceDetails.prefix}${row.original.data.invoiceDetails.serialNumber}`}</div>
    ),
  }),

  columnHelper.accessor((row) => getTotalValue(row.data), {
    id: "total",
    header: ({ column }) => <HeaderColumnButton column={column}>Total</HeaderColumnButton>,
    cell: ({ row }) => (
      <div className="text-xs">{`${getSymbolFromCurrency(row.original.data.invoiceDetails.currency)} ${getTotalValue(row.original.data)}`}</div>
    ),
  }),

  columnHelper.accessor((row) => row.data.items.length, {
    id: "items",
    header: ({ column }) => <HeaderColumnButton column={column}>Items</HeaderColumnButton>,
    cell: ({ row }) => <div className="text-xs">{row.original.data.items.length} Items</div>,
  }),

  columnHelper.accessor((row) => row.status, {
    id: "status",
    header: ({ column }) => <HeaderColumnButton column={column}>Status</HeaderColumnButton>,
    cell: ({ row }) => (
      <Badge className="capitalize" variant={getStatusBadgeVariant(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  }),

  columnHelper.accessor((row) => row.createdAt, {
    id: "createdAt",
    header: ({ column }) => <HeaderColumnButton column={column}>Created At</HeaderColumnButton>,
    cell: ({ row }) => <FormatTableDateObject date={row.original.createdAt} />,
  }),

  columnHelper.accessor((row) => row.paidAt, {
    id: "paidAt",
    header: ({ column }) => <HeaderColumnButton column={column}>Paid At</HeaderColumnButton>,
    cell: ({ row }) => <FormatTableDateObject date={row.original.paidAt} />,
  }),

  // Actions
  columnHelper.accessor(() => "actions", {
    id: "actions",
    header: ({ column }) => <HeaderColumnButton column={column}>Actions</HeaderColumnButton>,
    cell: ({}) => (
      <div className="flex flex-row items-center gap-2">
        <Button variant="secondary" size="xs">
          View
        </Button>
      </div>
    ),
  }),
];

export const columnConfig = [
  columnConfigHelper
    .text()
    .id("id")
    .displayName("ID")
    .accessor((row) => row.id)
    .icon(CalendarPenIcon)
    .build(),
  columnConfigHelper
    .date()
    .id("createdAt")
    .displayName("Created At")
    .accessor((row) => row.createdAt)
    .icon(CalendarPenIcon)
    .build(),
];

const getStatusBadgeVariant = (status: INVOICE_STATUS): BadgeVariants => {
  switch (status) {
    case INVOICE_STATUS.PENDING:
      return "yellow";
    case INVOICE_STATUS.SUCCESS:
      return "green";
    case INVOICE_STATUS.ERROR:
      return "destructive";
    case INVOICE_STATUS.EXPIRED:
      return "gray";
    case INVOICE_STATUS.REFUNDED:
      return "purple";
    default:
      return "gray";
  }
};
