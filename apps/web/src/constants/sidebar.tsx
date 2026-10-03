import { DashboardIcon, FolderFeatherIcon, ReceiptIcon, VersionsIcon } from "@/assets/icons";
import type { ISidebar } from "@/types";
import { LINKS } from "./links";

export const SIDEBAR_ITEMS: ISidebar = {
  Navigation: [
    {
      name: "Dashboard",
      url: LINKS.DASHBOARD,
      icon: <DashboardIcon />,
    },
    {
      name: "Invoices",
      url: LINKS.INVOICES,
      icon: <VersionsIcon />,
    },
    {
      name: "Manage Assets",
      url: LINKS.ASSETS,
      icon: <FolderFeatherIcon />,
    },
  ],
  Create: [
    {
      name: "Create Invoice",
      url: LINKS.CREATE.INVOICE,
      icon: <ReceiptIcon />,
    },
  ],
};
