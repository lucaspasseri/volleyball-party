import { getOrganizerRows } from "@/lib/organizer-data";
import { attendanceCsv } from "@/lib/organizer";

export async function GET() {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  try {
    const rows = await getOrganizerRows();
    if (!rows)
      return new Response("Acesso restrito ao organizador.", {
        status: 403,
        headers,
      });
    return new Response(attendanceCsv(rows), {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="volei-do-pesca-presencas.csv"',
      },
    });
  } catch {
    return new Response("Não foi possível exportar a lista. Tente novamente.", {
      status: 503,
      headers,
    });
  }
}
