import { ExternalLink, MapPin, Waves } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { event, locationLabel, type EventLocation } from "@/lib/event";

export function Where() {
  const location: EventLocation = event.location;
  const finalized = Boolean(location.meetingPoint);
  const mapQuery = finalized
    ? `${location.coordinates.latitude},${location.coordinates.longitude}`
    : `${location.beach}, Rio de Janeiro`;
  return (
    <section
      id="onde"
      className="where section-pad"
      aria-labelledby="where-heading"
    >
      <div className="container where-grid">
        <Reveal className="map-composition">
          <div className="map-frame">
            <div className="map-top">
              <span className="eyebrow">
                {finalized
                  ? "NOSSO PONTO DE ENCONTRO"
                  : "MAPA GERAL · COPACABANA"}
              </span>
              <MapPin size={17} />
            </div>
            <iframe
              title={
                finalized
                  ? "Mapa do ponto de encontro"
                  : "Mapa geral de Copacabana — ponto exato ainda não definido"
              }
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${finalized ? 17 : 14}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="map-caption">
              <Waves size={20} />
              <span>
                {finalized
                  ? location.meetingPoint
                  : "O endereço é a praia. O cantinho, a gente já te conta."}
              </span>
            </div>
          </div>
          <div className="map-sticker" aria-hidden="true">
            RIO,
            <br />
            EU TE <span>♡</span>
          </div>
        </Reveal>
        <Reveal className="where-copy" delay={0.12}>
          <p className="eyebrow">NOSSO PONTO DE ENCONTRO</p>
          <h2 id="where-heading">
            Onde<span>?</span>
          </h2>
          <p className="section-lead">
            Na princesinha
            <br />
            do mar.
          </p>
          <p className="location-name">
            <MapPin size={21} />
            {location.beach}
          </p>
          <p className="body-copy">{locationLabel(location)}</p>
          {!finalized && (
            <div className="location-notice">
              <span className="notice-star" aria-hidden="true">
                ✳
              </span>
              <p>
                Estamos escolhendo nosso cantinho na areia. O ponto exato será
                anunciado aqui. Por enquanto, o mapa mostra a região de
                Copacabana.
              </p>
            </div>
          )}
          <a
            href={location.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="button button-outline"
          >
            Abrir no Google Maps <ExternalLink size={17} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
