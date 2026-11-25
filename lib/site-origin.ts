import "server-only";

export function siteOrigin() {
  return new URL(process.env.SITE_URL || "http://localhost:3000").origin;
}
