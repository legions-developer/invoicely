import { ReceiptIcon } from "@/assets/icons";
import type { ISidebar } from "@/types";
import { LINKS } from "./links";

export const SIDEBAR_ITEMS: ISidebar = {
  Navigation: [
    // {
    //   name: "Dashboard",
    //   url: LINKS.DASHBOARD,
    //   icon: <SquareWandSparkleIcon />,
    // },
    {
      name: "Invoices",
      url: LINKS.INVOICES,
      icon: <ReceiptIcon />,
    },
    // {
    //   name: "Analytics",
    //   url: LINKS.ANALYTICS,
    //   icon: <GaugeIcon />,
    // },
  ],
  Create: [
    {
      name: "Create Invoice",
      url: LINKS.CREATE.INVOICE,
      icon: <ReceiptIcon />,
    },
  ],
};
