"use client";

import {
  SortingState,
  flexRender,
  VisibilityState,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  Column,
  RowSelectionState,
  DisplayColumnDef,
  AccessorFnColumnDef,
} from "@tanstack/react-table";
import { createTSTColumns, createTSTFilters } from "@/components/ui/data-table-filter/integrations/tanstack-table";
import type { ColumnConfig, ColumnDataType, FiltersState } from "@/components/ui/data-table-filter/core/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableFilter, useDataTableFilters } from "@/components/ui/data-table-filter";
import { ArrowDownZaIcon, ArrowUpDownIcon, ArrowUpZaIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tanstackColumns: (DisplayColumnDef<TData, any> | AccessorFnColumnDef<TData, TValue>)[];
  data: TData[];
  configColumns: ColumnConfig<TData, ColumnDataType, TValue, string>[];
}

export function DataTable<TData, TValue>({ tanstackColumns, data, configColumns }: DataTableProps<TData, TValue>) {
  const [filtersState, setFiltersState] = useState<FiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { columns, filters, actions, strategy } = useDataTableFilters({
    strategy: "client",
    data: data,
    columnsConfig: configColumns,
    filters: filtersState,
    onFiltersChange: setFiltersState,
  });

  const tstColumns = useMemo(
    () =>
      createTSTColumns({
        columns: tanstackColumns, // own columns
        configs: columns, // advanced columns by bazza-ui
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns],
  );

  const tstFilters = useMemo(() => createTSTFilters(filters), [filters]);

  const table = useReactTable({
    data,
    columns: tstColumns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters: tstFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Advance Filtering */}
      <DataTableFilter filters={filters} columns={columns} actions={actions} strategy={strategy} />
      {/* Table Main */}
      <div className="max-w-[calc(100svw-2rem)] overflow-hidden rounded-md border md:max-w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground/70 h-24 text-center">
                  No Data Found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="text-muted-foreground text-xs">
          Page <span className="text-white">{table.getState().pagination.pageIndex + 1}</span> of{" "}
          <span className="text-white">{table.getPageCount()}</span> Page
        </div>
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HeaderColumnButton<TData>({
  column,
  children,
  disableChevron = false,
}: {
  column: Column<TData, unknown>;
  children: React.ReactNode;
  disableChevron?: boolean;
}) {
  const isSorted = column.getIsSorted();
  return (
    <button
      className={cn(
        disableChevron && "pr-0",
        "text-secondary-foreground -mx-2 my-auto inline-flex h-fit cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap select-none",
      )}
      onClick={() => column.toggleSorting(isSorted === "asc")}
    >
      {children}
      <div className={cn(disableChevron && "hidden", "hidden sm:inline-block")}>
        {isSorted === false && <ArrowUpDownIcon size={12} />}
        {isSorted === "asc" && <ArrowUpZaIcon size={12} />}
        {isSorted === "desc" && <ArrowDownZaIcon size={12} />}
      </div>
    </button>
  );
}

export const FormatTableDate = ({ date }: { date: number }) => {
  return (
    <div className="text-muted-foreground text-xs whitespace-nowrap">
      {format(new Date(date * 1000), "dd/MM/yyyy - hh:mm a")}
    </div>
  );
};

export const FormatTableDateString = ({ date }: { date: string }) => {
  return (
    <div className="text-muted-foreground text-xs whitespace-nowrap">
      {format(new Date(date), "dd/MM/yyyy - hh:mm a")}
    </div>
  );
};

export const FormatTableDateObject = ({ date }: { date: Date }) => {
  return <div className="text-muted-foreground text-xs whitespace-nowrap">{format(date, "dd/MM/yyyy - hh:mm a")}</div>;
};
