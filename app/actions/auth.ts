"use server";

import { auth } from "@/lib/auth/server";
import { siteOrigin } from "@/lib/site-origin";
import { revalidatePath } from "next/cache";

export async function signInWithGoogle(): Promise<{
  url?: string;
  error?: string;
}> {
  try {
    const origin = siteOrigin();
    const result = await auth?.signIn.social({
      provider: "google",
      callbackURL: new URL("/auth/callback", origin).href,
      errorCallbackURL: new URL("/auth/callback?auth_error=1", origin).href,
      disableRedirect: true,
    });
    const url = result?.data?.url;
    if (!result?.error && url) return { url };
    return { error: "O Google não abriu agora. Tente novamente em instantes." };
  } catch {
    return { error: "Não foi possível conectar ao Google. Tente novamente." };
  }
}

export async function signOut(): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await auth?.signOut();
    if (result?.error || !result) throw new Error("Sign-out failed");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Não conseguimos encerrar a sessão. Tente de novo.",
    };
  }
}
