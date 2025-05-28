import { getCookie, deleteCookie } from "cookies-next/client";
import { Provider, Consumer, Moderator } from "@prisma/client";
import { COOKIES } from "@/constants/cookies";
import { UserType } from "@/types/auth";

export interface AuthUser {
  type: UserType;
  data: Moderator | Provider | Consumer | null;
}

export interface MultiAuthUser {
  moderator: Moderator | null;
  provider: Provider | null;
  consumer: Consumer | null;
  activeRoles: UserType[];
}

export class AuthService {
  static getModeratorAuth(): Moderator | null {
    try {
      const cookie = getCookie(COOKIES.MODERATOR);
      if (!cookie) return null;
      return JSON.parse(cookie as string) as Moderator;
    } catch {
      return null;
    }
  }

  static getProviderAuth(): Provider | null {
    try {
      const cookie = getCookie(COOKIES.PROVIDER);
      if (!cookie) return null;
      return JSON.parse(cookie as string) as Provider;
    } catch {
      return null;
    }
  }

  static getConsumerAuth(): Consumer | null {
    try {
      const cookie = getCookie(COOKIES.CONSUMER);
      if (!cookie) return null;
      return JSON.parse(cookie as string) as Consumer;
    } catch {
      return null;
    }
  }

  // Get all user roles simultaneously - NO PRIORITY
  static getAllUserRoles(): MultiAuthUser {
    const moderator = this.getModeratorAuth();
    const provider = this.getProviderAuth();
    const consumer = this.getConsumerAuth();

    const activeRoles: UserType[] = [];
    if (moderator) activeRoles.push("moderator");
    if (provider) activeRoles.push("provider");
    if (consumer) activeRoles.push("consumer");

    return {
      moderator,
      provider,
      consumer,
      activeRoles,
    };
  }

  // Simple role checking - just check if logged in
  static isLoggedIn(): boolean {
    return this.isModerator() || this.isProvider() || this.isConsumer();
  }

  static isModerator(): boolean {
    return this.getModeratorAuth() !== null;
  }

  static isProvider(): boolean {
    return this.getProviderAuth() !== null;
  }

  static isConsumer(): boolean {
    return this.getConsumerAuth() !== null;
  }

  // Get specific user data directly
  static getCurrentModerator(): Moderator | null {
    return this.getModeratorAuth();
  }

  static getCurrentProvider(): Provider | null {
    return this.getProviderAuth();
  }

  static getCurrentConsumer(): Consumer | null {
    return this.getConsumerAuth();
  }

  // Logout methods
  static logoutModerator(): void {
    deleteCookie(COOKIES.MODERATOR);
  }

  static logoutProvider(): void {
    deleteCookie(COOKIES.PROVIDER);
  }

  static logoutConsumer(): void {
    deleteCookie(COOKIES.CONSUMER);
  }

  static logoutAll(): void {
    this.logoutModerator();
    this.logoutProvider();
    this.logoutConsumer();
  }

  // Simple permission checking
  static hasPermission(requiredType: UserType | UserType[]): boolean {
    if (Array.isArray(requiredType)) {
      return requiredType.some((type) => {
        if (type === "moderator") return this.isModerator();
        if (type === "provider") return this.isProvider();
        if (type === "consumer") return this.isConsumer();
        return false;
      });
    }

    if (requiredType === "moderator") return this.isModerator();
    if (requiredType === "provider") return this.isProvider();
    if (requiredType === "consumer") return this.isConsumer();

    return false;
  }

  // Backward compatibility - returns first found user (optional)
  static getCurrentUser(): AuthUser {
    const moderator = this.getModeratorAuth();
    if (moderator) {
      return { type: "moderator", data: moderator };
    }

    const provider = this.getProviderAuth();
    if (provider) {
      return { type: "provider", data: provider };
    }

    const consumer = this.getConsumerAuth();
    if (consumer) {
      return { type: "consumer", data: consumer };
    }

    return { type: "none", data: null };
  }
}
