import { z } from "zod";

export const attendanceOptions = [
  { value: "going", label: "Vou", emoji: "☀️" },
  { value: "maybe", label: "Talvez", emoji: "🌤️" },
  { value: "not_going", label: "Não vou", emoji: "🌊" },
] as const;
export const contributions = [
  "Gelo",
  "Bebidas",
  "Petiscos",
  "Bola de vôlei",
  "Cadeiras",
  "Guarda-sol",
  "Outro",
] as const;
const attendanceSchema = z.enum(["going", "maybe", "not_going"], {
  error: "Escolha Vou, Talvez ou Não vou.",
});

export const rsvpInputSchema = z
  .object({
    full_name: z
      .string({ error: "Conta pra gente seu nome." })
      .trim()
      .min(1, "Conta pra gente seu nome.")
      .max(100, "Use até 100 caracteres."),
    attendance_status: attendanceSchema,
    message: z
      .string()
      .trim()
      .max(500, "A mensagem pode ter até 500 caracteres."),
    contribution: z.union([z.literal(""), z.enum(contributions)], {
      error: "Escolha uma das opções do que levar.",
    }),
    companions_count: z
      .number({ error: "Informe um número de acompanhantes." })
      .int("Informe um número inteiro de acompanhantes.")
      .min(0, "O número de acompanhantes não pode ser negativo.")
      .max(5, "Você pode incluir até 5 acompanhantes."),
    public_visibility_consent: z.boolean(),
    avatar_visibility_consent: z.boolean(),
    invite_code: z.string().trim().max(128, "Confira o código do convite."),
  })
  .refine((v) => !v.avatar_visibility_consent || v.public_visibility_consent, {
    path: ["avatar_visibility_consent"],
    message: "Para compartilhar a foto, permita também seu nome na lista.",
  });
export type RsvpInput = z.infer<typeof rsvpInputSchema>;

export const savedRsvpSchema = z.object({
  id: z.uuid(),
  guest_id: z.string().min(1),
  attendance_status: attendanceSchema,
  message: z.string(),
  contribution: z.string(),
  companions_count: z.number().int(),
  public_visibility_consent: z.boolean(),
  avatar_visibility_consent: z.boolean(),
  hidden: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SavedRsvp = z.infer<typeof savedRsvpSchema>;
export const profileSchema = z.object({
  full_name: z.string(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
});
export const publicAttendanceSchema = z.object({
  going: z.number().int().nonnegative(),
  maybe: z.number().int().nonnegative(),
  companions: z.number().int().nonnegative(),
  guests: z.array(
    z.object({ display_name: z.string(), avatar_url: z.string().nullable() }),
  ),
});
export type PublicAttendance = z.infer<typeof publicAttendanceSchema>;
export function canPlaceSticker(
  authenticated: boolean,
  rsvp: Pick<SavedRsvp, "attendance_status" | "hidden"> | null,
): boolean {
  return authenticated && rsvp?.attendance_status === "going" && !rsvp.hidden;
}

export function safeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      /^lh[0-9]+\.googleusercontent\.com$/.test(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0].slice(0, 40);
}

export type RsvpView = {
  configured: boolean;
  user: { name: string; avatarUrl: string | null } | null;
  rsvp: SavedRsvp | null;
  profile: z.infer<typeof profileSchema> | null;
  attendance: PublicAttendance | null;
  inviteRequired: boolean;
  organizer: boolean;
  error?: string;
};
export type MutationResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  rsvp?: SavedRsvp;
};
