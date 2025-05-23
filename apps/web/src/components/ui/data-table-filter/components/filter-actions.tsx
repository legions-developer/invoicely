import type { DataTableFilterActions } from "../core/types";
import { Button } from "@/components/ui/button";
import { SlidersIcon } from "@/assets/icons";
import { type Locale, t } from "../lib/i18n";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface FilterActionsProps {
  hasFilters: boolean;
  actions?: DataTableFilterActions;
  locale?: Locale;
}

export const FilterActions = memo(__FilterActions);
function __FilterActions({ hasFilters, actions, locale = "en" }: FilterActionsProps) {
  return (
    <Button
      className={cn("h-7 !px-2", !hasFilters && "hidden")}
      variant="destructive"
      onClick={actions?.removeAllFilters}
    >
      <SlidersIcon />
      <span className="hidden md:block">{t("clear", locale)}</span>
    </Button>
  );
}
