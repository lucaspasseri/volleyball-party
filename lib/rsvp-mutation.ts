import { z } from "zod";
import {
  rsvpInputSchema,
  safeAvatarUrl,
  savedRsvpSchema,
  type MutationResult,
} from "./rsvp";

// Small dependency boundary lets tests exercise authorization and failures without Next or live credentials.
export type MutationDependencies = {
  user: () => Promise<{ id: string; avatar: unknown } | null>;
  save: (
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>;
};
export async function persistRsvp(
  input: unknown,
  dependencies: MutationDependencies,
): Promise<MutationResult> {
  try {
    const user = await dependencies.user();
    if (!user)
      return {
        ok: false,
        message: "Sua sessão terminou. Entre com Google de novo para salvar.",
      };
    const parsed = rsvpInputSchema.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        message: "Confira os campos destacados e tente de novo.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      };
    const { invite_code, ...values } = parsed.data;
    // No submitted user ID is ever forwarded. The RPC derives auth.uid() again.
    const result = await dependencies.save({
      p_input: { ...values, avatar_url: safeAvatarUrl(user.avatar) },
      p_invite_code: invite_code,
    });
    if (result.error)
      return {
        ok: false,
        message:
          "Não conseguimos salvar agora. Seus campos continuam aqui; tente de novo.",
      };
    const response = z
      .object({
        ok: z.boolean(),
        code: z.string().optional(),
        rsvp: savedRsvpSchema.optional(),
      })
      .safeParse(result.data);
    if (!response.success)
      return {
        ok: false,
        message: "Não foi possível verificar a confirmação. Tente de novo.",
      };
    if (!response.data.ok || !response.data.rsvp) {
      const messages: Record<string, string> = {
        rate_limited:
          "Muitas tentativas em pouco tempo. Espere um minuto e tente de novo.",
        invite_required: "Confira o código que veio com seu convite.",
        invalid_input: "Confira os campos do formulário e tente de novo.",
        unauthenticated:
          "Sua sessão terminou. Entre com Google de novo para salvar.",
      };
      return {
        ok: false,
        message:
          messages[response.data.code ?? ""] ??
          "Não conseguimos salvar sua resposta. Tente de novo.",
      };
    }
    return {
      ok: true,
      message:
        "Resposta salva com carinho! Você pode mudar de ideia quando quiser.",
      rsvp: response.data.rsvp,
    };
  } catch {
    return {
      ok: false,
      message:
        "A conexão deu uma pausa. Seus campos continuam aqui; tente de novo.",
    };
  }
}
