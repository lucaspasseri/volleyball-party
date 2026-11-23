import { Navigation } from "@/components/ui/navigation";
import { Hero } from "@/components/sections/hero";
import { When } from "@/components/sections/when";
import { Where } from "@/components/sections/where";
import { How } from "@/components/sections/how";
import { Rsvp } from "@/components/sections/rsvp";
import { Expectations } from "@/components/sections/expectations";
import { Volleyball } from "@/components/illustrations/beach";
import { event } from "@/lib/event";

export default function Page() {
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Navigation />
      <main id="conteudo" className="isolate min-w-0">
        <Hero />
        <When />
        <Where />
        <How />
        <Rsvp />
        <Expectations />
      </main>
      <footer className="footer container">
        <a href="#inicio" className="footer-brand">
          <Volleyball /> VÔLEI DO PESCA
        </a>
        <p>FEITO DE SOL, SAL E BOAS COMPANHIAS.</p>
        <span>
          {new Date(event.startsAt).toLocaleDateString("pt-BR", {
            timeZone: event.timezone,
          })}{" "}
          · COPACABANA
        </span>
      </footer>
    </>
  );
}
