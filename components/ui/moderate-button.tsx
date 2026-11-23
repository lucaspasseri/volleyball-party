"use client";
import { useState, useTransition } from "react";
import { moderateRsvp } from "@/app/actions/organizer";

export function ModerateButton({
  id,
  hidden,
}: {
  id: string;
  hidden: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        className="button button-small button-outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              setMessage((await moderateRsvp({ id, hidden: !hidden })).message);
            } catch {
              setMessage("Falha de conexão. Tente novamente.");
            }
          })
        }
      >
        {pending ? "Salvando…" : hidden ? "Restaurar" : "Ocultar"}
      </button>
      <p role="status">{message}</p>
    </>
  );
}
