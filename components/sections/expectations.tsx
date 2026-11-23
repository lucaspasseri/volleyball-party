import { Suspense } from "react";
import { Reveal } from "@/components/motion/reveal";
import { BeachExperience } from "@/components/beach/beach-experience";
import { getBeachView } from "@/lib/beach-data";
import "./beach.css";

async function PartyMap() {
  const { identity, ...props } = await getBeachView();
  return <BeachExperience key={identity + props.canEdit} {...props} />;
}

export function Expectations() {
  return (
    <section
      id="expectativas"
      className="expectations section-pad"
      aria-labelledby="expectations-heading"
    >
      <div className="container">
        <header className="beach-heading">
          <div>
            <p className="beach-kicker">
              <span aria-hidden="true">✳</span> Expectativas
            </p>
            <h2 id="expectations-heading">
              Seu lugar <em>na areia.</em>
            </h2>
          </div>
          <p>
            Da rede à beira-mar, cada canto tem sua turma. Explore a festa e
            marque onde a gente vai te encontrar.
          </p>
        </header>
        <Suspense
          fallback={
            <div className="beach-loading">Abrindo o mapa da festa…</div>
          }
        >
          <PartyMap />
        </Suspense>
        <Reveal className="closing-note">
          <span>Sol na pele. Sal no cabelo.</span>
          <strong>Gente querida por perto.</strong>
          <p>
            Te espero no Vôlei do Pesca. <span aria-hidden="true">♡</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
