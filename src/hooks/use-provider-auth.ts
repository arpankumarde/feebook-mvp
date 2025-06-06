"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthService } from "@/lib/auth-service";
import { Provider } from "@prisma/client";
import { SLUGS } from "@/constants/slugs";

export function useProviderAuth() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const providerData = AuthService.getProviderAuth();
      setProvider(providerData);
      setLoading(false);

      // Don't redirect if on KYC routes
      if (path.startsWith("/pvd/kyc")) {
        return;
      }

      // Redirect if provider is not verified
      if (providerData && !providerData.isVerified) {
        router.push(`/${SLUGS.PROVIDER}/dashboard`);
      }
    };

    checkAuth();
  }, [router]);

  return {
    provider,
    isAuthenticated: !!provider,
    loading,
    logout: () => {
      AuthService.logoutProvider();
      setProvider(null);
    },
    refresh: () => {
      const providerData = AuthService.getProviderAuth();
      setProvider(providerData);
    },
  };
}
