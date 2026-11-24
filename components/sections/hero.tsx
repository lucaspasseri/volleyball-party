"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { MapPin, CalendarDays, Plus } from "lucide-react";
import { useRef } from "react";
import {
  BeachScene,
  SunDoodle,
  Volleyball,
  Wave,
} from "@/components/illustrations/beach";
import { compactDate, event, eventYear, startHour, weekday } from "@/lib/event";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Scale the drift with the artwork so its caption stays clear of the wave on phones.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "8%"]);
  return (
    <section
      id="inicio"
      ref={ref}
      className="hero"
      aria-label={event.copy.invitation}
    >
      <div className="hero-inner container">
        <motion.div
          className="hero-copy"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: reduced ? 0 : 0.12 } },
          }}
        >
          <motion.p className="eyebrow hero-eyebrow" variants={entrance}>
            UM ANIVERSÁRIO COM O PÉ NA AREIA <span aria-hidden="true">✳</span>
          </motion.p>
          <motion.p className="invited" variants={entrance}>
            Você foi convidado para o
          </motion.p>
          <motion.h1 variants={entrance}>
            VÔLEI
            <br />
            <span>DO PESCA</span>
            <span className="title-dot">!</span>
          </motion.h1>
          <motion.div className="hero-description" variants={entrance}>
            <p>{event.copy.subtitle}</p>
            <p>
              O melhor presente é ter você por perto.
              <span className="handdrawn-underline" />
            </p>
          </motion.div>
          <motion.div className="hero-actions" variants={entrance}>
            <motion.a
              href="#presenca"
              className="button button-coral"
              whileHover={{ y: -3, rotate: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              Confirmar presença <Plus size={19} />
            </motion.a>
            <a href="#quando" className="text-link">
              Explorar a festa{" "}
              <span className="small-wave" aria-hidden="true">
                〰
              </span>
            </a>
          </motion.div>
          <motion.div className="hero-facts" variants={entrance}>
            <span>
              <CalendarDays size={17} /> {compactDate} ·{" "}
              {startHour.toUpperCase()}
            </span>
            <span>
              <MapPin size={17} /> COPACABANA, RJ
            </span>
          </motion.div>
        </motion.div>
        <motion.div
          className="hero-art"
          style={{ y }}
          initial={{
            opacity: 0,
            scale: 0.92,
            rotate: 3,
          }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <BeachScene />
          <motion.div
            className="hero-ball"
            initial={{ y: -120, rotate: -60 }}
            animate={{ y: 0, rotate: 12 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 11,
              delay: 0.4,
            }}
            whileHover={{ y: -20, rotate: 55 }}
          >
            <Volleyball />
          </motion.div>
          <motion.div
            className="birthday-stamp"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 11 }}
            transition={{ type: "spring", delay: 0.65 }}
          >
            <span>MAIS UM ANO</span>
            <strong>{event.age}</strong>
            <span>BEM VIVIDOS!</span>
          </motion.div>
          <span className="art-note">o verão tem encontro marcado.</span>
        </motion.div>
        <SunDoodle className="hero-sun" />
      </div>
      <div className="hero-bottom">
        <span>RIO DE JANEIRO</span>
        <span>{weekday.toUpperCase()} COM O PÉ NA AREIA</span>
        <span>VERÃO DE {eventYear}</span>
      </div>
      <Wave className="hero-wave" />
    </section>
  );
}

const entrance = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};
