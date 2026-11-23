import { CalendarPlus, Clock3 } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { WeatherCard } from "@/components/ui/weather-card";
import { dateLabel, event, startHour } from "@/lib/event";

export function When() {
  const date = new Date(event.startsAt);
  const year = Number(
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: event.timezone,
    }).format(date),
  );
  const month =
    Number(
      new Intl.DateTimeFormat("en", {
        month: "numeric",
        timeZone: event.timezone,
      }).format(date),
    ) - 1;
  const selected = Number(
    new Intl.DateTimeFormat("en", {
      day: "numeric",
      timeZone: event.timezone,
    }).format(date),
  );
  const offset = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthName = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: event.timezone,
  }).format(date);
  return (
    <section
      id="quando"
      className="when section-pad"
      aria-labelledby="when-heading"
    >
      <div className="container when-grid">
        <Reveal className="when-copy">
          <p className="eyebrow">RESERVA ESSE DIA PRA GENTE</p>
          <h2 id="when-heading">
            Quando<span>?</span>
          </h2>
          <p className="section-lead">
            <time dateTime={event.startsAt}>
              {dateLabel},<br />
              às {startHour} da manhã.
            </time>
          </p>
          <p className="body-copy">
            Começar o ano com um mergulho, uma boa partida e gente querida. Tem
            jeito melhor?
          </p>
          <div className="inline-note">
            <Clock3 size={20} />
            <span>Dia inteiro de praia. Sem pressa de ir embora.</span>
          </div>
          <a
            href="/calendario"
            download="volei-do-pesca.ics"
            className="button button-outline"
          >
            <CalendarPlus size={18} /> Adicionar ao calendário
          </a>
          <p className="timezone-note">
            Horário de Brasília · {event.timezone}
          </p>
        </Reveal>
        <Reveal className="calendar-wrap" delay={0.12}>
          <div
            className="calendar"
            aria-label={`Calendário de ${monthName} de ${year}, dia ${selected} selecionado`}
          >
            <div className="calendar-rings" aria-hidden="true">
              <i />
              <i />
            </div>
            <div className="calendar-top">
              <span>{monthName}</span>
              <span>{year}</span>
            </div>
            <div
              className="calendar-grid"
              role="img"
              aria-label={`${selected} de ${monthName} é o dia da festa`}
            >
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                <span className="calendar-weekday" key={`weekday-${i}`}>
                  {day}
                </span>
              ))}
              {Array.from({ length: offset }, (_, i) => (
                <span key={`empty-${i}`} />
              ))}
              {Array.from({ length: days }, (_, i) => (
                <span
                  key={i}
                  className={i + 1 === selected ? "calendar-selected" : ""}
                >
                  {i + 1}
                  {i + 1 === selected && (
                    <span className="calendar-mark" aria-hidden="true">
                      ✳
                    </span>
                  )}
                </span>
              ))}
            </div>
            <div className="calendar-footer">
              <span aria-hidden="true">♡</span> ESSE DIA JÁ TEM DONO.
            </div>
          </div>
          <span className="calendar-scribble">pode circular na agenda!</span>
        </Reveal>
        <Reveal className="weather-wrap" delay={0.2}>
          <WeatherCard />
        </Reveal>
      </div>
    </section>
  );
}
