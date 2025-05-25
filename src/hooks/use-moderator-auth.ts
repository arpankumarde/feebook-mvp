"use client";

import { useState, useEffect } from "react";
import { AuthService } from "@/lib/auth-service";
import { Moderator } from "@/generated/prisma";

export function useModeratorAuth() {
  const [moderator, setModerator] = useState<Moderator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const moderatorData = AuthService.getModeratorAuth();
      setModerator(moderatorData);
      setLoading(false);
    };

    checkAuth();
  }, []);

  return {
    moderator,
    isAuthenticated: !!moderator,
    loading,
    logout: () => {
      AuthService.logoutModerator();
      setModerator(null);
    },
    refresh: () => {
      const moderatorData = AuthService.getModeratorAuth();
      setModerator(moderatorData);
    },
  };
}
