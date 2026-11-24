"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Volleyball } from "@/components/illustrations/beach";

const links = [
  ["quando", "Quando"],
  ["onde", "Onde"],
  ["como", "Como"],
  ["expectativas", "Expectativas"],
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    // Let the browser track a fresh fragment through initial layout changes.
    // Enable smooth scrolling when the visitor starts navigating.
    const enableSmoothScroll = () => {
      document.documentElement.dataset.scrollBehavior = "smooth";
    };
    document.addEventListener("click", enableSmoothScroll, {
      capture: true,
      once: true,
    });
    return () => {
      document.removeEventListener("click", enableSmoothScroll, true);
      delete document.documentElement.dataset.scrollBehavior;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="site-header">
      <div className="nav-shell">
        <a
          href="#inicio"
          className="brand"
          aria-label="Vôlei do Pesca, início"
          onClick={() => setOpen(false)}
        >
          <Volleyball />
          <span>
            VÔLEI DO PESCA
            <span className="brand-caption">SOL, SAL E MAIS UM ANO.</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <a
          href="#presenca"
          className="button button-small nav-cta"
          onClick={() => setOpen(false)}
        >
          Eu vou! <span aria-hidden="true">✳</span>
        </a>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Navegação móvel"
            className="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
          >
            {[...links, ["presenca", "Confirmar presença"]].map(
              ([id, label]) => (
                <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
                  {label}
                </a>
              ),
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
