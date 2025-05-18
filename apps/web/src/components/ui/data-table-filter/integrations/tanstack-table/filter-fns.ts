import type { FilterModel } from "../../core/types";
import type { Row } from "@tanstack/react-table";
import * as f from "../../lib/filter-fns";

export function dateFilterFn<TData>(row: Row<TData>, columnId: string, filterValue: FilterModel<"date">): boolean {
  const value = row.getValue<Date>(columnId);

  return f.dateFilterFn(value, filterValue);
}

export function textFilterFn<TData>(row: Row<TData>, columnId: string, filterValue: FilterModel<"text">): boolean {
  const value = row.getValue<string>(columnId) ?? "";

  return f.textFilterFn(value, filterValue);
}

export function numberFilterFn<TData>(row: Row<TData>, columnId: string, filterValue: FilterModel<"number">): boolean {
  const value = row.getValue<number>(columnId);

  return f.numberFilterFn(value, filterValue);
}
