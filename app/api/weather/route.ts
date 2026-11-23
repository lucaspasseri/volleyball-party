import { getWeather } from "@/lib/weather";

export async function GET() {
  const weather = await getWeather();
  return Response.json(
    { weather },
    {
      status: weather ? 200 : 503,
      headers: {
        "Cache-Control": weather
          ? "public, s-maxage=1800, stale-while-revalidate=300"
          : "no-store",
      },
    },
  );
}
