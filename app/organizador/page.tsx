import type { Metadata } from "next";
import { getOrganizerRows } from "@/lib/organizer-data";
import { attendanceOptions } from "@/lib/rsvp";
import { ModerateButton } from "@/components/ui/moderate-button";
export const metadata: Metadata = {
  title: "Lista do organizador",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function OrganizerPage() {
  let content;
  try {
    const rows = await getOrganizerRows();
    if (!rows)
      content = (
        <p>
          Acesso restrito ao organizador. Entre com sua conta Google pelo
          convite.
        </p>
      );
    else {
      const going = rows.filter(
        (row) => row.attendance_status === "going" && !row.hidden,
      );
      content = (
        <>
          <p>
            {rows.length} respostas · {going.length} confirmados ·{" "}
            {going.reduce((total, row) => total + row.companions_count, 0)}{" "}
            acompanhantes confirmados
          </p>
          <div className="organizer-toolbar">
            <a className="button" href="/organizador/exportar">
              Exportar lista CSV
            </a>
            <a className="text-link" href="/organizador">
              Atualizar lista
            </a>
          </div>
          <p>
            Ocultar remove a resposta da lista pública, da contagem e da
            participação na praia. A resposta continua aqui para revisão, mesmo
            se o convidado editar.
          </p>
          {rows.length === 0 ? (
            <p>Ainda não há respostas.</p>
          ) : (
            <div className="organizer-table-wrap">
              <table className="organizer-table">
                <caption className="sr-only">
                  Respostas dos convidados, visíveis apenas ao organizador
                </caption>
                <thead>
                  <tr>
                    {[
                      "Nome",
                      "Presença",
                      "O que leva",
                      "+1",
                      "Mensagem",
                      "Privacidade",
                      "Moderação",
                    ].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.guest_profiles.full_name}</td>
                      <td>
                        {
                          attendanceOptions.find(
                            (o) => o.value === row.attendance_status,
                          )?.label
                        }
                        {row.hidden && " · Ocultado"}
                      </td>
                      <td>{row.contribution || "—"}</td>
                      <td>{row.companions_count}</td>
                      <td>{row.message || "—"}</td>
                      <td>
                        {row.public_visibility_consent
                          ? row.avatar_visibility_consent
                            ? "Nome e foto permitidos"
                            : "Nome permitido"
                          : "Privado"}
                      </td>
                      <td>
                        <ModerateButton id={row.id} hidden={row.hidden} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      );
    }
  } catch {
    content = (
      <p role="alert">
        Não conseguimos abrir a lista agora. Confira a configuração e tente
        novamente.
      </p>
    );
  }
  return (
    <main className="container organizer-page">
      <a className="text-link" href="/#presenca">
        Voltar ao convite
      </a>
      <h1>Lista do organizador</h1>
      {content}
    </main>
  );
}
