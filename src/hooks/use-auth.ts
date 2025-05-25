import { useState, useEffect } from "react";
import { AuthService, MultiAuthUser } from "@/lib/auth-service";
import { UserType } from "@/types/auth";

export function useAuth() {
  const [roles, setRoles] = useState<MultiAuthUser>({
    moderator: null,
    provider: null,
    consumer: null,
    activeRoles: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const currentRoles = AuthService.getAllUserRoles();
      setRoles(currentRoles);
      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = () => checkAuth();
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return {
    // Individual role data
    moderator: roles.moderator,
    provider: roles.provider,
    consumer: roles.consumer,

    // Simple boolean checks
    isModerator: !!roles.moderator,
    isProvider: !!roles.provider,
    isConsumer: !!roles.consumer,
    isLoggedIn: roles.activeRoles.length > 0,

    // Active roles
    activeRoles: roles.activeRoles,

    // State
    loading,

    // Methods
    hasRole: (role: UserType) => {
      if (role === "moderator") return !!roles.moderator;
      if (role === "provider") return !!roles.provider;
      if (role === "consumer") return !!roles.consumer;
      return false;
    },

    hasPermission: (requiredType: UserType | UserType[]) =>
      AuthService.hasPermission(requiredType),

    // Logout methods
    logout: () => {
      AuthService.logoutAll();
      setRoles({
        moderator: null,
        provider: null,
        consumer: null,
        activeRoles: [],
      });
    },

    logoutRole: (role: UserType) => {
      if (role === "moderator") AuthService.logoutModerator();
      else if (role === "provider") AuthService.logoutProvider();
      else if (role === "consumer") AuthService.logoutConsumer();

      // Refresh roles
      const currentRoles = AuthService.getAllUserRoles();
      setRoles(currentRoles);
    },

    refresh: () => {
      const currentRoles = AuthService.getAllUserRoles();
      setRoles(currentRoles);
    },
  };
}
