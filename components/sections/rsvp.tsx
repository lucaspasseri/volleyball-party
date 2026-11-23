import { PartyPopper } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Volleyball } from "@/components/illustrations/beach";
import { getRsvpView } from "@/lib/rsvp-data";
import { RsvpExperience } from "@/components/ui/rsvp-experience";
import type { ReactNode } from "react";

function RsvpShell({ children }: { children: ReactNode }) {
  return (
    <section
      id="presenca"
      className="rsvp section-pad"
      aria-labelledby="rsvp-heading"
    >
      <div className="container rsvp-grid">
        <Reveal className="rsvp-copy">
          <p className="eyebrow">A FESTA SÓ FICA COMPLETA COM VOCÊ</p>
          <h2 id="rsvp-heading">
            Confirme
            <br />
            sua <span>presença!</span>
          </h2>
          <p className="section-lead">
            Bora fazer parte
            <br />
            desse dia?
          </p>
          <p className="body-copy">
            Já separa a roupa de praia. Conta se você vem e deixa o resto com a
            gente. Pode mudar de ideia depois!
          </p>
          <div className="rsvp-note">
            <PartyPopper size={23} />
            <p>
              Uma turma querida.
              <br />
              Um dia pra guardar.
            </p>
          </div>
          <Volleyball className="rsvp-ball" />
        </Reveal>
        <Reveal className="rsvp-form-wrap" delay={0.12}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}
export function RsvpLoading() {
  return (
    <RsvpShell>
      <div className="rsvp-form" role="status">
        Preparando seu lugar ao sol…
      </div>
    </RsvpShell>
  );
}
export async function Rsvp({ authNotice }: { authNotice?: string }) {
  const view = await getRsvpView();
  return (
    <RsvpShell>
      <RsvpExperience view={view} authNotice={authNotice} />
    </RsvpShell>
  );
}
