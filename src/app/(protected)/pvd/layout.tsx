import { ProviderGuard } from "@/components/auth/auth-guard";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProviderGuard>{children}</ProviderGuard>;
}
