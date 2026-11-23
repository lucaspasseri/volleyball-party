import { Navigation } from "@/components/ui/navigation";
import { Hero } from "@/components/sections/hero";
import { When } from "@/components/sections/when";
import { Where } from "@/components/sections/where";
import { How } from "@/components/sections/how";
import { Rsvp, RsvpLoading } from "@/components/sections/rsvp";
import { Suspense } from "react";
import { Expectations } from "@/components/sections/expectations";
import { Volleyball } from "@/components/illustrations/beach";
import { event } from "@/lib/event";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const { auth } = await searchParams;
  const authNotice =
    auth === "canceled"
      ? "Tudo bem! A entrada foi cancelada. Quando quiser, tente de novo."
      : auth === "error"
        ? "Não conseguimos concluir sua entrada. Tente com Google novamente."
        : undefined;
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
        <Suspense fallback={<RsvpLoading />}>
          <Rsvp authNotice={authNotice} />
        </Suspense>
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
