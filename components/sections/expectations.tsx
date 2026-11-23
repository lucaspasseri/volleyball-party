import { MousePointer2, Sparkles } from "lucide-react";
import { BeachScene } from "@/components/illustrations/beach";
import { Reveal } from "@/components/motion/reveal";
import { event } from "@/lib/event";

// Goal 3: mount the interactive beach, avatar picker and sticker layer here.
export function Expectations() {
  return (
    <section
      id="expectativas"
      className="expectations section-pad"
      aria-labelledby="expectations-heading"
    >
      <div className="container">
        <Reveal className="expectations-heading">
          <p className="eyebrow">UM PEDACINHO DA NOSSA BAGUNÇA</p>
          <h2 id="expectations-heading">
            Expectativas<span>✳</span>
          </h2>
          <p className="section-lead">{event.copy.expectations}</p>
        </Reveal>
        <Reveal className="expectations-scene">
          <div className="scene-label">
            <Sparkles size={16} /> PRÉVIA DO QUE VEM POR AÍ
          </div>
          <BeachScene variant="preview" />
          <div className="scene-caption">
            <MousePointer2 size={24} />
            <p>
              Seu lugar na areia está chegando.
              <span>
                Em breve, escolha seu avatar e entre nessa praia com a turma.
              </span>
            </p>
            <span className="preview-badge">EXPERIÊNCIA EM BREVE</span>
          </div>
          <span className="scene-handwriting" aria-hidden="true">
            falta você aqui!
          </span>
        </Reveal>
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
