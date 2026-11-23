import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "./globals.css";
import { MotionProvider } from "@/components/motion/reveal";
import { compactDate, dateLabel, event, startHour } from "@/lib/event";

const siteUrl =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${event.name} — ${event.age} verões, uma festa na areia`,
  description: `Você foi convidado! Dia ${dateLabel}, às ${startHour}, na ${event.location.beach}. Vôlei, sol e gente querida para comemorar os ${event.age} do Pesca.`,
  applicationName: "Vôlei do Pesca",
  openGraph: {
    title: `${event.name} — Você está convidado!`,
    description: `${dateLabel} · ${startHour} · Copacabana, Rio de Janeiro. Bora comemorar os ${event.age} do Pesca com o pé na areia?`,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: event.name,
    description: `${event.age} verões, uma festa na areia. ${compactDate} · Copacabana.`,
  },
};

export const viewport: Viewport = { themeColor: "#173e52" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <noscript>
          <style>
            {
              ".hero-copy > *, .hero-art, .hero-ball, .birthday-stamp { opacity: 1 !important; transform: none !important; }"
            }
          </style>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
