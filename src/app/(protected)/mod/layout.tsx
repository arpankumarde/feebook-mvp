import { ModeratorGuard } from "@/components/auth/auth-guard";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeratorGuard>
      <SidebarProvider>
        <main className="max-w-full w-full">{children}</main>
      </SidebarProvider>
    </ModeratorGuard>
  );
}
