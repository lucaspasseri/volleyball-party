import { Check, LockKeyhole, PartyPopper } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Volleyball } from "@/components/illustrations/beach";

// Goal 2: replace the disabled fieldset with the authenticated RSVP flow.
export function Rsvp() {
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
            sua <span>presença.</span>
          </h2>
          <p className="section-lead">
            Bora fazer parte
            <br />
            desse dia?
          </p>
          <p className="body-copy">
            Já separa a roupa de praia. Em breve, você vai poder deixar seu nome
            na nossa lista por aqui.
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
          <form className="rsvp-form" aria-describedby="rsvp-status">
            <div className="form-heading">
              <span className="eyebrow">SUA VAGA AO SOL</span>
              <span className="preview-badge">EM BREVE</span>
            </div>
            <h3>Tem lugar pra você.</h3>
            <p id="rsvp-status">
              Prévia do formulário. As confirmações ainda não estão abertas e
              nenhum dado será enviado.
            </p>
            <fieldset disabled>
              <legend className="sr-only">
                Prévia da confirmação de presença
              </legend>
              <label htmlFor="guest-name">Como você se chama?</label>
              <input
                id="guest-name"
                name="name"
                autoComplete="name"
                placeholder="Seu nome e sobrenome"
              />
              <label htmlFor="guest-email">Seu e-mail</label>
              <input
                id="guest-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
              />
              <div className="form-attendance">
                <Check size={18} />
                <span>Sim, quero comemorar com vocês!</span>
              </div>
              <button className="button button-disabled" type="button">
                <LockKeyhole size={17} /> Confirmações em breve
              </button>
            </fieldset>
            <p className="form-footnote">
              A confirmação será feita aqui, em uma próxima etapa.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
