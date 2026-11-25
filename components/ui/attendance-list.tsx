"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Users } from "lucide-react";
import { safeAvatarUrl, type PublicAttendance } from "@/lib/rsvp";

export function AttendanceList({
  attendance,
  configured,
}: {
  attendance: PublicAttendance | null;
  configured: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="attendance-list" aria-labelledby="attendance-heading">
      <div className="attendance-list-heading">
        <Users size={22} />
        <h3 id="attendance-heading">A turma tá chegando</h3>
      </div>
      {attendance ? (
        <>
          <p className="attendance-count" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.strong
                key={attendance.going}
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {attendance.going}
              </motion.strong>
            </AnimatePresence>{" "}
            {attendance.going === 1
              ? "pessoa confirmada"
              : "pessoas confirmadas"}
          </p>
          <p className="attendance-meta">
            + {attendance.companions} acompanhantes ·{" "}
            {attendance.maybe} talvez
          </p>
          {attendance.guests.length > 0 ? (
            <ul className="guest-chips">
              {attendance.guests.map((guest, index) => {
                const avatar = safeAvatarUrl(guest.avatar_url);
                return (
                  <li key={`${guest.display_name}-${index}`}>
                    {avatar ? (
                      <img
                        src={avatar}
                        width={32}
                        height={32}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="guest-initial" aria-hidden="true">
                        {guest.display_name.slice(0, 1)}
                      </span>
                    )}
                    <span>{guest.display_name}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="attendance-meta">
              A lista pública ainda está quietinha. Sua confirmação pode ficar
              só entre você e o organizador.
            </p>
          )}
          <p className="attendance-meta">
            Só aparece aqui quem marcou “Vou” e permitiu compartilhar o nome.
            A contagem inclui confirmações privadas.
          </p>
        </>
      ) : (
        <p className="attendance-meta">
          {configured
            ? "Não conseguimos carregar a lista agora. Recarregue para tentar de novo."
            : "A turma vai aparecer por aqui quando as confirmações abrirem."}
        </p>
      )}
    </div>
  );
}
