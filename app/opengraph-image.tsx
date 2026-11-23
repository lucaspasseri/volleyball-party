import { ImageResponse } from "next/og";
import { compactDate, dateLabel, event, startHour } from "@/lib/event";

export const alt = `${event.name} — ${event.age} anos. ${dateLabel}, às ${startHour}, em Copacabana.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#fcf7e9",
        color: "#173e52",
        padding: "70px 80px",
        position: "relative",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 23, letterSpacing: 5, marginBottom: 25 }}>
        UM ANIVERSÁRIO COM O PÉ NA AREIA
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 104,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        VÔLEI
        <br />
        DO PESCA!
      </div>
      <div style={{ display: "flex", marginTop: 35, fontSize: 28 }}>
        {compactDate} · {startHour.toUpperCase()} · COPACABANA, RJ
      </div>
      <div
        style={{
          position: "absolute",
          right: 75,
          top: 170,
          display: "flex",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "#f8c74b",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          transform: "rotate(12deg)",
        }}
      >
        <span style={{ fontSize: 100, fontWeight: 900 }}>{event.age}</span>
        <span style={{ fontSize: 23 }}>BEM VIVIDOS!</span>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 25,
          background: "#3ba7ae",
          display: "flex",
        }}
      />
    </div>,
    size,
  );
}
