export type EventLocation = {
  beach: string;
  meetingPoint: string | null;
  nearbyReferences: string[];
  coordinates: { latitude: number; longitude: number };
  mapsUrl: string;
};

const startsAt = "2027-01-07T09:00:00-03:00";
const endsAt = "2027-01-07T17:00:00-03:00";
const timezone = "America/Sao_Paulo";
const age = 36;
const hour = (date: string) =>
  `${Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", timeZone: timezone }).format(new Date(date)))}h`;

export const event = {
  name: "Vôlei do Pesca",
  age,
  date: startsAt.slice(0, 10),
  startsAt,
  endsAt,
  timezone,
  location: {
    beach: "Praia de Copacabana",
    meetingPoint: null,
    nearbyReferences: [],
    coordinates: { latitude: -22.9711, longitude: -43.1822 },
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Praia+de+Copacabana+Rio+de+Janeiro",
  } satisfies EventLocation,
  copy: {
    invitation: "Você foi convidado para o Vôlei do Pesca!",
    subtitle: `Farei ${age} anos e espero que possamos comemorar juntos.`,
    intro: "Espero que possamos ter um dia saudável e divertido de praia.",
    courts: `Duas quadras de vôlei estarão reservadas para nós das ${hour(startsAt)} às ${hour(endsAt)}.`,
    shade: "Pretendo levar um gazebo e uns coolers para nossa hidratação.",
    bring:
      "Traga suas roupas de praia, não esqueça de passar o protetor solar e aproveite o dia de praia!",
  },
} as const;

export const dateLabel = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: event.timezone,
}).format(new Date(event.startsAt));

export const startHour = hour(startsAt);
export const hoursLabel = `${hour(startsAt)} às ${hour(endsAt)}`;
export const compactDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: timezone,
})
  .format(new Date(startsAt))
  .replace(/ de |\./g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toUpperCase();
export const eventYear = new Intl.DateTimeFormat("pt-BR", {
  year: "numeric",
  timeZone: timezone,
}).format(new Date(startsAt));
export const weekday = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  timeZone: timezone,
}).format(new Date(startsAt));

export function locationLabel(location: EventLocation = event.location) {
  return `${location.beach} — ${location.meetingPoint ?? "Posto a definir"} — ${location.nearbyReferences.length ? `próximo a ${location.nearbyReferences.join(", ")}` : "próximo às barracas a definir"}.`;
}
