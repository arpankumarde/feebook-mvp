"use client";

import { SLUGS } from "@/constants/slugs";
import { useAuth } from "@/hooks/use-auth";
import { UserType } from "@/types/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedTypes: UserType | UserType[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  allowedTypes,
  fallback,
  redirectTo = `/auth/${SLUGS.CONSUMER}/login`,
}: AuthGuardProps) {
  const { loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasPermission(allowedTypes)) {
      router.push(redirectTo);
    }
  }, [loading, hasPermission, allowedTypes, router, redirectTo]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasPermission(allowedTypes)) {
    return fallback || <div>Redirecting...</div>;
  }

  return <>{children}</>;
}

// Specific guards - simple role checks
export function ModeratorGuard({ children }: { children: React.ReactNode }) {
  const { isModerator, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isModerator) {
      router.push(`/auth/${SLUGS.MODERATOR}/login`);
    }
  }, [loading, isModerator, router]);

  if (loading) return <div>Loading...</div>;
  if (!isModerator) return <div>Redirecting...</div>;

  return <>{children}</>;
}

export function ProviderGuard({ children }: { children: React.ReactNode }) {
  const { isProvider, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isProvider) {
      router.push(`/auth/${SLUGS.PROVIDER}/login`);
    }
  }, [loading, isProvider, router]);

  if (loading) return <div>Loading...</div>;
  if (!isProvider) return <div>Redirecting...</div>;

  return <>{children}</>;
}

export function ConsumerGuard({ children }: { children: React.ReactNode }) {
  const { isConsumer, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isConsumer) {
      router.push(`/auth/${SLUGS.CONSUMER}/login`);
    }
  }, [loading, isConsumer, router]);

  if (loading) return <div>Loading...</div>;
  if (!isConsumer) return <div>Redirecting...</div>;

  return <>{children}</>;
}
