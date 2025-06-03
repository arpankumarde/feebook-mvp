import { ConsumerGuard } from "@/components/auth/auth-guard";
import { ConsumerSidebar } from "@/components/layout/consumer/ConsumerSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsumerGuard>
      <SidebarProvider>
        <ConsumerSidebar />
        <main className="max-w-full w-full">{children}</main>
      </SidebarProvider>
    </ConsumerGuard>
  );
}
