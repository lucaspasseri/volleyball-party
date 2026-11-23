"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function signInWithGoogle(): Promise<{
  url?: string;
  error?: string;
}> {
  try {
    const origin = new URL(process.env.SITE_URL || "http://127.0.0.1:3000")
      .origin;
    const db = await createClient();
    const { data, error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        scopes: "openid email profile",
      },
    });
    if (error || !data.url)
      return {
        error: "O Google não abriu agora. Tente novamente em instantes.",
      };
    return { url: data.url };
  } catch {
    return {
      error:
        "Não foi possível conectar ao Google. Tente novamente em instantes.",
    };
  }
}

export async function signOut(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await (
      await createClient()
    ).auth.signOut({ scope: "local" });
    if (error)
      return {
        ok: false,
        error: "Não conseguimos encerrar a sessão. Tente de novo.",
      };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "A conexão deu uma pausa. Tente sair novamente.",
    };
  }
}
