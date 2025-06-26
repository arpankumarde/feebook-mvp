import { ModeratorGuard } from "@/components/auth/auth-guard";
import { ModeratorSidebar } from "@/components/layout/moderator/ModeratorSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeratorGuard>
      <SidebarProvider>
        <ModeratorSidebar />
        <main className="max-w-full w-full">{children}</main>
      </SidebarProvider>
    </ModeratorGuard>
  );
}
