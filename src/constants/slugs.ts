export const SLUGS = {
  MODERATOR: "admin",
  PROVIDER: "org",
  CONSUMER: "user",
};
export const SLUGS_MAP = {
  admin: "moderator",
  org: "provider",
  user: "consumer",
} as const;

export type SlugType = keyof typeof SLUGS;
export type SlugValue = (typeof SLUGS)[SlugType];
export type SlugMapType = keyof typeof SLUGS_MAP;
