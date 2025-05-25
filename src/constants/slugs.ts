export const SLUGS = {
  MODERATOR: "mod",
  PROVIDER: "pvd",
  CONSUMER: "cns",
};
export const SLUGS_MAP = {
  mod: "moderator",
  pvd: "provider",
  cns: "consumer",
} as const;

export type SlugType = keyof typeof SLUGS;
export type SlugValue = (typeof SLUGS)[SlugType];
export type SlugMapType = keyof typeof SLUGS_MAP;
