import { Provider, Consumer, Moderator } from "@/generated/prisma";

export type UserType = "moderator" | "provider" | "consumer" | "none";

export interface AuthUser {
  type: UserType;
  data: Moderator | Provider | Consumer | null;
}

export interface LoginResponse<T = any> {
  success: boolean;
  user?: T;
  error?: string;
  message?: string;
}
