import {
  GlassWater,
  Shirt,
  Sun,
  Tent,
  Volleyball as BallIcon,
} from "lucide-react";
import { SunDoodle, Wave } from "@/components/illustrations/beach";
import { Reveal } from "@/components/motion/reveal";
import { event, hoursLabel } from "@/lib/event";

const activities = [
  {
    Icon: BallIcon,
    label: "Bola pra cima!",
    detail: event.copy.courts,
    note: `DUAS QUADRAS · ${hoursLabel.toUpperCase()}`,
    color: "yellow",
  },
  {
    Icon: Tent,
    label: "Sombra e água fresca.",
    detail: event.copy.shade,
    note: "GAZEBO + COOLERS",
    color: "mint",
  },
  {
    Icon: Sun,
    label: "Vem no modo verão.",
    detail: event.copy.bring,
    note: "ROUPA DE PRAIA + PROTETOR",
    color: "coral",
  },
];

export function How() {
  return (
    <section
      id="como"
      className="how section-pad"
      aria-labelledby="how-heading"
    >
      <Wave className="how-wave" />
      <div className="container">
        <Reveal className="how-heading">
          <div>
            <p className="eyebrow">O PLANO É NÃO COMPLICAR</p>
            <h2 id="how-heading">
              Como<span>?</span>
            </h2>
          </div>
          <p>
            {event.copy.intro}
            <br />
            <span>O resto é deixar o verão acontecer.</span>
          </p>
          <SunDoodle className="how-sun" />
        </Reveal>
        <div className="activities">
          {activities.map(({ Icon, label, detail, note, color }, i) => (
            <Reveal
              className={`activity activity-${color}`}
              key={label}
              delay={i * 0.1}
            >
              <div className="activity-icon">
                <Icon size={54} strokeWidth={1.3} />
              </div>
              <span className="activity-note">{note}</span>
              <h3>{label}</h3>
              <p>{detail}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="packing-note">
          <Shirt size={22} />
          <span>Na bolsa: roupa de praia, protetor e disposição.</span>
          <GlassWater size={22} />
          <span>No coração: vontade de estar junto.</span>
        </Reveal>
      </div>
    </section>
  );
}
