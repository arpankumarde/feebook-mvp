import { ProviderGuard } from "@/components/auth/auth-guard";
import { ProviderSidebar } from "@/components/layout/provider/ProviderSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProviderGuard>
      <SidebarProvider>
        <ProviderSidebar />
        <main className="max-w-full w-full">{children}</main>
      </SidebarProvider>
    </ProviderGuard>
  );
}
