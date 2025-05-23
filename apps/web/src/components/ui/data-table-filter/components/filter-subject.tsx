import type { Column, ColumnDataType } from "../core/types";

interface FilterSubjectProps<TData, TType extends ColumnDataType> {
  column: Column<TData, TType>;
}

export function FilterSubject<TData, TType extends ColumnDataType>({ column }: FilterSubjectProps<TData, TType>) {
  const hasIcon = !!column.icon;
  return (
    <span className="flex items-center gap-1 px-2 font-medium whitespace-nowrap select-none">
      {hasIcon && <column.icon className="text-secondary-foreground/50 mr-0.5 size-3.5 stroke-[2.25px]" />}
      <span>{column.displayName}</span>
    </span>
  );
}
