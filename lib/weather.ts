import { event } from "./event";

export type Weather = {
  kind: "current" | "forecast";
  temperature: number;
  minimum?: number;
  code: number;
  wind: number;
  observedAt: string;
};

type OpenMeteoData = {
  current?: {
    time?: string;
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
    wind_speed_10m_max?: number[];
  };
};

export function localDate(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: event.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function selectWeather(
  data: OpenMeteoData,
  now = new Date(),
): Weather | null {
  const index = data.daily?.time?.indexOf(event.date) ?? -1;
  // A daily row, rather than an estimated range, is the source of truth.
  if (index >= 0 && localDate(now) <= event.date) {
    const daily = data.daily!;
    const temperature = daily.temperature_2m_max?.[index];
    const minimum = daily.temperature_2m_min?.[index];
    const code = daily.weather_code?.[index];
    const wind = daily.wind_speed_10m_max?.[index];
    if (
      [temperature, minimum, code, wind].every(
        (value) => typeof value === "number" && Number.isFinite(value),
      )
    ) {
      return {
        kind: "forecast",
        temperature: temperature!,
        minimum,
        code: code!,
        wind: wind!,
        observedAt: now.toISOString(),
      };
    }
  }
  const current = data.current;
  if (
    current?.time &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(current.time) &&
    [
      current.temperature_2m,
      current.weather_code,
      current.wind_speed_10m,
    ].every((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    return {
      kind: "current",
      temperature: current.temperature_2m!,
      code: current.weather_code!,
      wind: current.wind_speed_10m!,
      observedAt: `${current.time}-03:00`,
    };
  }
  return null;
}

export function weatherDescription(code: number) {
  if (code === 0) return "Céu limpo";
  if (code <= 2) return "Sol entre nuvens";
  if (code === 3) return "Céu nublado";
  if (code <= 48) return "Nevoeiro";
  if (code <= 57) return "Chuvisco";
  if (code <= 67) return "Chuva";
  if (code <= 77) return "Neve";
  if (code <= 82) return "Pancadas de chuva";
  if (code <= 86) return "Pancadas de neve";
  return "Trovoadas";
}

export async function getWeather(): Promise<Weather | null> {
  const { latitude, longitude } = event.location.coordinates;
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: event.timezone,
    current: "temperature_2m,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max",
    forecast_days: "16",
  });
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      {
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(7000),
      },
    );
    if (!response.ok) return null;
    return selectWeather(await response.json());
  } catch {
    return null;
  }
}
