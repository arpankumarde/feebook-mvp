import { setCookie } from "cookies-next/client";
import { Provider, Consumer, Moderator } from "@/generated/prisma";
import { COOKIES, COOKIE_OPTIONS } from "@/constants/cookies";

export function setModeratorCookie(moderator: Moderator) {
  setCookie(COOKIES.MODERATOR, JSON.stringify(moderator), COOKIE_OPTIONS);
}

export function setProviderCookie(provider: Provider) {
  setCookie(COOKIES.PROVIDER, JSON.stringify(provider), COOKIE_OPTIONS);
}

export function setConsumerCookie(consumer: Consumer) {
  setCookie(COOKIES.CONSUMER, JSON.stringify(consumer), COOKIE_OPTIONS);
}
