import EducatorSidebar from "@/components/layout/EducatorSidebar";
import EducatorSidebarTriggerHeader from "@/components/layout/EducatorSidebarTriggerHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <EducatorSidebar variant="inset" collapsible="icon" />

      <SidebarInset>
        <main>
          <EducatorSidebarTriggerHeader />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
