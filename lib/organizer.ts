import { z } from "zod";
import { savedRsvpSchema, attendanceOptions } from "./rsvp";

export const organizerRowSchema = savedRsvpSchema.extend({
  guest_profiles: z.object({ full_name: z.string() }),
});
export type OrganizerRow = z.infer<typeof organizerRowSchema>;

function csvCell(value: unknown) {
  const raw = String(value ?? "");
  // Prevent spreadsheet formula execution, including whitespace-prefixed formulas.
  const safe =
    /^[\s]*[=+\-@]/.test(raw) || /^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function attendanceCsv(rows: OrganizerRow[]) {
  const records = [
    [
      "Nome",
      "Presença",
      "Contribuição",
      "Acompanhantes",
      "Mensagem",
      "Nome público",
      "Foto pública",
      "Ocultado",
      "Atualizado em",
    ],
    ...rows.map((row) => [
      row.guest_profiles.full_name,
      attendanceOptions.find((o) => o.value === row.attendance_status)?.label,
      row.contribution,
      row.companions_count,
      row.message,
      row.public_visibility_consent ? "Sim" : "Não",
      row.avatar_visibility_consent ? "Sim" : "Não",
      row.hidden ? "Sim" : "Não",
      row.updated_at,
    ]),
  ];
  return (
    "\uFEFF" +
    records.map((row) => row.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}
