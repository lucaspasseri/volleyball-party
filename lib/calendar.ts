import { event, locationLabel } from "./event";

function escapeText(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function calendarFile() {
  const stamp = (date: string) =>
    new Date(date)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Volei do Pesca//Convite//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.date.replaceAll("-", "")}-volei-do-pesca@convite.local`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt)}`,
    `X-EVENT-TIMEZONE:${event.timezone}`,
    `SUMMARY:${escapeText(`${event.name} — ${event.age} anos`)}`,
    `LOCATION:${escapeText(locationLabel())}`,
    `DESCRIPTION:${escapeText(`${event.copy.intro}\n${event.copy.courts}\n${event.copy.bring}\nO ponto exato será anunciado depois.`)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545: fold at 75 UTF-8 octets without splitting accented characters.
  return (
    lines
      .map((line) => {
        const parts: string[] = [];
        let part = "";
        for (const character of line) {
          if (Buffer.byteLength(part + character, "utf8") > 75) {
            parts.push(part);
            part = " ";
          }
          part += character;
        }
        parts.push(part);
        return parts.join("\r\n");
      })
      .join("\r\n") + "\r\n"
  );
}
