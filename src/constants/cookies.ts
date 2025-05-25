export const COOKIES = {
  MODERATOR: "__fb_moderator",
  PROVIDER: "__fb_provider",
  CONSUMER: "__fb_consumer",
} as const;

export const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
} as const;
