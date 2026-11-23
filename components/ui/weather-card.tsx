"use client";

import { AnimatePresence, motion } from "motion/react";
import { Cloud, CloudRain, CloudSun, Sun, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { event } from "@/lib/event";
import { weatherDescription, type Weather } from "@/lib/weather";

export function WeatherCard() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/weather", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Clima indisponível");
        const data: { weather: Weather | null } = await response.json();
        setWeather(data.weather);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  const Icon =
    !weather || weather.code === 0
      ? Sun
      : weather.code <= 2
        ? CloudSun
        : weather.code <= 48
          ? Cloud
          : CloudRain;
  return (
    <aside
      className="weather"
      aria-label="Clima em Copacabana"
      aria-busy={loading}
    >
      <div className="weather-heading">
        <span className="eyebrow">DIRETO DE COPACABANA</span>
        <Icon size={38} strokeWidth={1.5} className="weather-icon" />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={loading ? "loading" : weather ? weather.kind : "error"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-live="polite"
        >
          {loading ? (
            <p className="weather-loading">Consultando o céu de Copa…</p>
          ) : weather ? (
            <>
              <p className="weather-label">
                {weather.kind === "forecast"
                  ? "Previsão para o dia da festa"
                  : "Condições atuais"}
              </p>
              <div className="weather-value">
                <strong>
                  {Math.round(weather.temperature)}°<span>C</span>
                </strong>
                <div>
                  <p>{weatherDescription(weather.code)}</p>
                  <span>
                    <Wind size={15} /> {Math.round(weather.wind)} km/h
                  </span>
                </div>
              </div>
              {weather.kind === "forecast" && (
                <p className="weather-note">
                  Mínima de {Math.round(weather.minimum!)} °C ·{" "}
                  {new Date(event.startsAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    timeZone: event.timezone,
                  })}
                  . A previsão pode mudar.
                </p>
              )}
              {weather.kind === "current" && (
                <p className="weather-note">
                  Este é o clima de agora. A previsão da festa aparece aqui
                  quando estiver disponível.
                </p>
              )}
              <p className="weather-source">
                Atualizado às{" "}
                {new Date(weather.observedAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: event.timezone,
                })}{" "}
                ·{" "}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open-Meteo
                </a>
              </p>
            </>
          ) : (
            <>
              <p className="weather-label">O céu fez uma pausa por aqui.</p>
              <p className="weather-note">
                Não foi possível consultar o clima agora. Tente novamente ao
                visitar a página mais tarde.
              </p>
              <a
                className="weather-source"
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
              >
                Dados: Open-Meteo
              </a>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
