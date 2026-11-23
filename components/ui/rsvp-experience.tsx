"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useTransition, type FormEvent } from "react";
import { Check, LogOut, ShieldCheck, Sparkles, Users } from "lucide-react";
import { saveRsvp } from "@/app/actions/rsvp";
import { signInWithGoogle, signOut } from "@/app/actions/auth";
import {
  attendanceOptions,
  contributions,
  firstName,
  safeAvatarUrl,
  type MutationResult,
  type RsvpInput,
  type RsvpView,
} from "@/lib/rsvp";

export function RsvpExperience({
  view,
  authNotice,
}: {
  view: RsvpView;
  authNotice?: string;
}) {
  const reduced = useReducedMotion();
  const [saved, setSaved] = useState(view.rsvp);
  const [editing, setEditing] = useState(!view.rsvp);
  const [values, setValues] = useState<RsvpInput>({
    full_name: view.profile?.full_name ?? view.user?.name ?? "",
    attendance_status: view.rsvp?.attendance_status ?? "going",
    message: view.rsvp?.message ?? "",
    contribution: (view.rsvp?.contribution ?? "") as RsvpInput["contribution"],
    companions_count: view.rsvp?.companions_count ?? 0,
    public_visibility_consent: view.rsvp?.public_visibility_consent ?? false,
    avatar_visibility_consent: view.rsvp?.avatar_visibility_consent ?? false,
    invite_code: "",
  });
  const [result, setResult] = useState<MutationResult | null>(null);
  const [authError, setAuthError] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [pending, startTransition] = useTransition();
  const [authPending, startAuthTransition] = useTransition();
  function update<K extends keyof RsvpInput>(key: K, value: RsvpInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      try {
        const response = await saveRsvp(values);
        setResult(response);
        if (response.ok && response.rsvp) {
          setSaved(response.rsvp);
          setEditing(false);
          update("invite_code", "");
          setCelebrate(
            response.rsvp.attendance_status === "going" &&
              !response.rsvp.hidden,
          );
        }
      } catch {
        setResult({
          ok: false,
          message:
            "A conexão deu uma pausa. Seus campos continuam aqui; tente de novo.",
        });
      }
    });
  }
  function authenticate(logout = false) {
    setAuthError("");
    startAuthTransition(async () => {
      try {
        if (logout) {
          const response = await signOut();
          if (response.ok) window.location.assign("/#presenca");
          else setAuthError(response.error ?? "Tente sair novamente.");
        } else {
          const response = await signInWithGoogle();
          if (response.url) window.location.assign(response.url);
          else setAuthError(response.error ?? "Tente entrar novamente.");
        }
      } catch {
        setAuthError("A conexão deu uma pausa. Tente de novo.");
      }
    });
  }
  function fieldError(key: string) {
    const errors = result?.fieldErrors?.[key];
    return errors?.length ? (
      <p className="field-error" id={`error-${key}`}>
        {errors[0]}
      </p>
    ) : null;
  }
  const selection = attendanceOptions.find(
    (option) => option.value === saved?.attendance_status,
  );
  const unavailable = Boolean(view.error);
  return (
    <>
      <motion.div
        layout="size"
        transition={{ layout: { duration: reduced ? 0 : 0.25 } }}
        className="rsvp-form rsvp-live"
        aria-busy={pending || authPending}
      >
        <div className="form-heading">
          <span className="eyebrow">SUA VAGA AO SOL</span>
          <ShieldCheck size={21} aria-label="Confirmação com conta Google" />
        </div>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="rsvp-feedback"
        >
          {pending ? "Guardando sua resposta…" : result?.message}
        </div>
        {(authError || authNotice || view.error) && (
          <p className="rsvp-alert" role="alert">
            {authError || view.error || authNotice}
          </p>
        )}
        <AnimatePresence mode="wait" initial={false}>
          {!view.configured ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3>Tem lugar pra você.</h3>
              <p>
                As confirmações estão sendo preparadas. Volte em breve para
                entrar com Google e contar se você vem.
              </p>
              <p className="form-footnote">
                Nenhuma informação é enviada enquanto as confirmações não abrem.
              </p>
            </motion.div>
          ) : !view.user ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3>Tem lugar pra você.</h3>
              <p>
                Entre com Google para confirmar rapidinho e poder editar sua
                resposta depois.
              </p>
              <button
                className="button google-button"
                onClick={() => authenticate()}
                disabled={authPending}
              >
                {authPending ? "Conectando…" : "Continuar com Google"}
              </button>
              <p className="form-footnote">
                Sua resposta começa privada. Seu e-mail nunca aparece na lista
                pública. Entrar não confirma sua presença automaticamente.
              </p>
            </motion.div>
          ) : !editing && saved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="rsvp-success-icon" aria-hidden="true">
                <Check size={28} />
              </div>
              <h3>
                {saved.attendance_status === "going"
                  ? "Seu lugar ao sol tá garantido!"
                  : saved.attendance_status === "maybe"
                    ? "Vamos torcer pra você vir!"
                    : "Você vai fazer falta!"}
              </h3>
              <p>
                {firstName(values.full_name)}, sua resposta está salva:{" "}
                <strong>{selection?.label}</strong>.
              </p>
              <p className="form-footnote">
                {saved.public_visibility_consent
                  ? "Seu primeiro nome pode aparecer na lista se você estiver confirmado."
                  : "Sua resposta é privada e só o organizador vê seus detalhes."}
              </p>
              {saved.hidden && (
                <p className="rsvp-alert">
                  Sua resposta foi ocultada pelo organizador. Ela não aparece na
                  lista nem na contagem.
                </p>
              )}
              {saved.attendance_status === "going" && !saved.hidden && (
                <a
                  className="button button-coral beach-entry"
                  href="#expectativas"
                >
                  <Sparkles size={18} />
                  Escolher meu lugar na praia!
                </a>
              )}
              <button
                className="text-link edit-rsvp"
                onClick={() => {
                  setEditing(true);
                  setCelebrate(false);
                  setResult(null);
                }}
              >
                Editar minha resposta
              </button>
              <AnimatePresence>
                {celebrate && !reduced && (
                  <motion.div
                    className="rsvp-celebration"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0.4, y: 10 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0.4, 1.1, 1],
                      y: [10, -15, -20],
                    }}
                    transition={{ duration: 2 }}
                    onAnimationComplete={() => setCelebrate(false)}
                  >
                    ☀️ 🏐 ✦ 🎉 ✦
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={submit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3>{saved ? "Mudou os planos?" : "Bora pra praia?"}</h3>
              <fieldset disabled={pending || authPending || unavailable}>
                <legend className="sr-only">Sua confirmação de presença</legend>
                <label htmlFor="guest-name">
                  Nome <span aria-hidden="true">*</span>
                </label>
                <input
                  id="guest-name"
                  name="full_name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={values.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  aria-invalid={Boolean(result?.fieldErrors?.full_name)}
                  aria-describedby={
                    result?.fieldErrors?.full_name
                      ? "error-full_name"
                      : undefined
                  }
                  placeholder="Como você se chama?"
                />
                {fieldError("full_name")}
                <fieldset className="attendance-choices">
                  <legend>
                    Presença <span aria-hidden="true">*</span>
                  </legend>
                  <div className="attendance-cards">
                    {attendanceOptions.map((option) => (
                      <motion.label
                        key={option.value}
                        tabIndex={-1}
                        className={
                          values.attendance_status === option.value
                            ? "attendance-card selected"
                            : "attendance-card"
                        }
                        whileTap={{
                          scale: reduced
                            ? 1
                            : option.value === "going"
                              ? 0.94
                              : 0.98,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 18,
                        }}
                      >
                        <input
                          type="radio"
                          name="attendance_status"
                          value={option.value}
                          checked={values.attendance_status === option.value}
                          onChange={() =>
                            update("attendance_status", option.value)
                          }
                          required
                        />
                        <span aria-hidden="true">{option.emoji}</span>
                        <span>{option.label}</span>
                      </motion.label>
                    ))}
                  </div>
                </fieldset>
                {fieldError("attendance_status")}
                {view.inviteRequired && !saved && (
                  <>
                    <label htmlFor="invite-code">Código do convite</label>
                    <input
                      id="invite-code"
                      type="password"
                      autoComplete="off"
                      required
                      maxLength={128}
                      value={values.invite_code}
                      onChange={(e) => update("invite_code", e.target.value)}
                      aria-describedby="invite-help"
                    />
                    <p id="invite-help" className="form-footnote">
                      Use o código que veio no convite. Ele ajuda a cuidar da
                      lista; não verifica quem você é.
                    </p>
                  </>
                )}
                <details className="rsvp-extras">
                  <summary>
                    Mais um carinho? <span>Mensagem, o que levar e +1</span>
                  </summary>
                  <label htmlFor="guest-message">
                    Mensagem para o aniversariante <span>(opcional)</span>
                  </label>
                  <textarea
                    id="guest-message"
                    name="message"
                    rows={3}
                    maxLength={500}
                    value={values.message}
                    onChange={(e) => update("message", e.target.value)}
                    aria-describedby={
                      result?.fieldErrors?.message ? "error-message" : undefined
                    }
                  />
                  {fieldError("message")}
                  <label htmlFor="guest-contribution">
                    O que posso levar? <span>(opcional)</span>
                  </label>
                  <select
                    id="guest-contribution"
                    name="contribution"
                    value={values.contribution}
                    onChange={(e) =>
                      update(
                        "contribution",
                        e.target.value as RsvpInput["contribution"],
                      )
                    }
                  >
                    <option value="">Decido depois</option>
                    {contributions.map((choice) => (
                      <option key={choice}>{choice}</option>
                    ))}
                  </select>
                  {fieldError("contribution")}
                  <label htmlFor="guest-companions">
                    Acompanhantes / +1 <span>(além de você, até 5)</span>
                  </label>
                  <input
                    id="guest-companions"
                    name="companions_count"
                    type="number"
                    min={0}
                    max={5}
                    step={1}
                    value={values.companions_count}
                    onChange={(e) =>
                      update(
                        "companions_count",
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                    aria-describedby={
                      result?.fieldErrors?.companions_count
                        ? "error-companions_count"
                        : undefined
                    }
                  />
                  {fieldError("companions_count")}
                  <p className="form-footnote">
                    Mensagem, contribuição e acompanhantes ficam só com o
                    organizador.
                  </p>
                </details>
                <div className="rsvp-privacy">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={values.public_visibility_consent}
                      onChange={(e) =>
                        setValues((current) => ({
                          ...current,
                          public_visibility_consent: e.target.checked,
                          avatar_visibility_consent: e.target.checked
                            ? current.avatar_visibility_consent
                            : false,
                        }))
                      }
                    />
                    <span>
                      Quero aparecer na lista com meu primeiro nome
                      {values.full_name.trim()
                        ? ` (${firstName(values.full_name)})`
                        : ""}
                      {" e mostrar minha figurinha se eu guardar um lugar na praia."}
                    </span>
                  </label>
                  {values.public_visibility_consent && view.user.avatarUrl && (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={values.avatar_visibility_consent}
                        onChange={(e) =>
                          update("avatar_visibility_consent", e.target.checked)
                        }
                      />
                      <span>Também permito mostrar minha foto do Google.</span>
                    </label>
                  )}
                  {fieldError("avatar_visibility_consent")}
                  <p>
                    Sem marcar, sua confirmação fica privada. Você pode retirar
                    a permissão a qualquer momento.
                  </p>
                </div>
                <button
                  className="button button-coral rsvp-submit"
                  type="submit"
                  disabled={pending || unavailable}
                >
                  {pending
                    ? "Guardando sua resposta…"
                    : saved
                      ? "Salvar alterações"
                      : "Salvar minha resposta"}
                </button>
              </fieldset>
              {unavailable && (
                <a className="text-link" href="/#presenca">
                  Recarregar para tentar de novo
                </a>
              )}
            </motion.form>
          )}
        </AnimatePresence>
        {view.user && (
          <div className="rsvp-account">
            <span>Conectado com Google</span>
            <button
              className="text-link"
              onClick={() => authenticate(true)}
              disabled={authPending || pending}
            >
              <LogOut size={15} />
              {authPending ? "Saindo…" : "Sair"}
            </button>
            {view.organizer && (
              <a className="text-link" href="/organizador">
                Lista do organizador
              </a>
            )}
          </div>
        )}
      </motion.div>
      <div className="attendance-list" aria-labelledby="attendance-heading">
        <div className="attendance-list-heading">
          <Users size={22} />
          <h3 id="attendance-heading">A turma tá chegando</h3>
        </div>
        {view.attendance ? (
          <>
            <p className="attendance-count" aria-live="polite">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.strong
                  key={view.attendance.going}
                  initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {view.attendance.going}
                </motion.strong>
              </AnimatePresence>{" "}
              {view.attendance.going === 1
                ? "pessoa confirmada"
                : "pessoas confirmadas"}
            </p>
            <p className="attendance-meta">
              + {view.attendance.companions} acompanhantes ·{" "}
              {view.attendance.maybe} talvez
            </p>
            {view.attendance.guests.length > 0 ? (
              <ul className="guest-chips">
                {view.attendance.guests.map((guest, index) => (
                  <li key={`${guest.display_name}-${index}`}>
                    {safeAvatarUrl(guest.avatar_url) ? (
                      <img
                        src={safeAvatarUrl(guest.avatar_url)!}
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
                ))}
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
            {view.configured
              ? "Não conseguimos carregar a lista agora. Recarregue para tentar de novo."
              : "A turma vai aparecer por aqui quando as confirmações abrirem."}
          </p>
        )}
      </div>
    </>
  );
}
