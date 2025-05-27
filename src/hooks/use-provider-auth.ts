"use client";

import { useState, useEffect } from "react";
import { AuthService } from "@/lib/auth-service";
import { Provider } from "@prisma/client";

export function useProviderAuth() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const providerData = AuthService.getProviderAuth();
      setProvider(providerData);
      setLoading(false);
    };

    checkAuth();
  }, []);

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
