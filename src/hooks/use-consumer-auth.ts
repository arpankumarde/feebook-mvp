"use client";

import { useState, useEffect } from "react";
import { AuthService } from "@/lib/auth-service";
import { Consumer } from "@/generated/prisma";

export function useConsumerAuth() {
  const [consumer, setConsumer] = useState<Consumer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const consumerData = AuthService.getConsumerAuth();
      setConsumer(consumerData);
      setLoading(false);
    };

    checkAuth();
  }, []);

  return {
    consumer,
    isAuthenticated: !!consumer,
    loading,
    logout: () => {
      AuthService.logoutConsumer();
      setConsumer(null);
    },
    refresh: () => {
      const consumerData = AuthService.getConsumerAuth();
      setConsumer(consumerData);
    },
  };
}
