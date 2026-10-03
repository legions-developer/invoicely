import { generateWebsiteMetadata } from "@/constants/meta-data";
import { FinancialDashboard } from "./dashboard.client";
import type { Metadata } from "next";

export const metadata: Metadata = generateWebsiteMetadata({
  title: "Financial Dashboard | Invoicely",
});

function DashboardPage() {
  return <FinancialDashboard />;
}

export default DashboardPage;
