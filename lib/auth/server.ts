import "server-only";
import { cache } from "react";
import { createNeonAuth } from "@neon/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const secret = process.env.NEON_AUTH_COOKIE_SECRET;

export const auth =
  baseUrl && secret
    ? createNeonAuth({
        baseUrl: baseUrl.replace(/\/+$/, ""),
        cookies: { secret },
      })
    : null;

export const getGuest = cache(async () => {
  if (!auth) return null;
  // Read the live session even when a signed cache cookie is still present.
  // The SDK proxy handles cookie rotation before the protected handlers render.
  const { data, error } = await auth.getSession({
    query: { disableCookieCache: "true", disableRefresh: "true" },
  });
  if (error?.status === 401) return null;
  if (error) throw new Error("Não foi possível verificar a sessão");
  const user = data?.user;
  return user?.id ? { id: user.id, name: user.name, avatar: user.image } : null;
});
