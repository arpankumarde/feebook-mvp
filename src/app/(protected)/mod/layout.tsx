import { ModeratorGuard } from "@/components/auth/auth-guard";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModeratorGuard>{children}</ModeratorGuard>;
}
