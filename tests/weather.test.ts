import { test } from "node:test";
import assert from "node:assert/strict";
import { localDate, selectWeather } from "../lib/weather";

const current = {
  time: "2026-11-23T09:15",
  temperature_2m: 27.3,
  weather_code: 2,
  wind_speed_10m: 12,
};
const now = new Date("2026-11-23T12:20:00Z");

test("far before the event, shows current conditions with a zoned observation time", () => {
  const result = selectWeather({ current }, now);
  assert.equal(result?.kind, "current");
  assert.equal(result?.observedAt, "2026-11-23T09:15-03:00");
  assert.equal(result?.temperature, 27.3);
});

test("uses event-day forecast only when a complete row is returned", () => {
  const daily = {
    time: ["2027-01-06", "2027-01-07"],
    temperature_2m_max: [28, 30],
    temperature_2m_min: [22, 23],
    weather_code: [1, 2],
    wind_speed_10m_max: [12, 16],
  };
  const result = selectWeather(
    { daily, current },
    new Date("2027-01-01T12:00:00Z"),
  );
  assert.equal(result?.kind, "forecast");
  assert.equal(result?.temperature, 30);
  assert.equal(result?.minimum, 23);
});

test("does not mistake missing or null data for zero-degree weather", () => {
  assert.equal(selectWeather({}, now), null);
  assert.equal(selectWeather({ current: { time: current.time } }, now), null);
  assert.equal(
    selectWeather(
      { current: { ...current, temperature_2m: null as unknown as number } },
      now,
    ),
    null,
  );
});

test("incomplete event forecast falls back to real current conditions", () => {
  assert.equal(
    selectWeather({ current, daily: { time: ["2027-01-07"] } }, now)?.kind,
    "current",
  );
});

test("São Paulo date uses the correct day around UTC midnight", () => {
  assert.equal(localDate(new Date("2027-01-08T01:00:00Z")), "2027-01-07");
  assert.equal(localDate(new Date("2027-01-08T04:00:00Z")), "2027-01-08");
});

test("does not present a past event as an upcoming forecast", () => {
  const daily = {
    time: ["2027-01-07"],
    temperature_2m_max: [30],
    temperature_2m_min: [23],
    weather_code: [0],
    wind_speed_10m_max: [8],
  };
  assert.equal(
    selectWeather({ current, daily }, new Date("2027-01-09T12:00:00Z"))?.kind,
    "current",
  );
});
