import DashboardSidebarHeader from "@/components/layout/sidebar/dashboard-sidebar-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/sidebar";
import { generateWebsiteMetadata } from "@/constants";
import type { Metadata } from "next";

export const metadata: Metadata = generateWebsiteMetadata({
  title: "Invoicely | Dashboard",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <div className="dash-page h-full overflow-hidden">
          <DashboardSidebarHeader />
          <main className="dash-layout-page-content-height scroll-bar-hidden overflow-y-scroll">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
