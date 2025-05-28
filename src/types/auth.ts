import { Provider, Consumer, Moderator } from "@prisma/client";

export type UserType = "moderator" | "provider" | "consumer" | "none";

export interface AuthUser {
  type: UserType;
  data: Moderator | Provider | Consumer | null;
}

export interface LoginResponse<T = UserType> {
  success: boolean;
  user?: T;
  error?: string;
  message?: string;
}
