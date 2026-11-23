import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // Fixed local destination: no user-controlled redirect or provider error text.
  let destination = "/?auth=error#presenca";
  if (request.nextUrl.searchParams.get("error") === "access_denied")
    destination = "/?auth=canceled#presenca";
  else if (code) {
    try {
      const { error } = await (
        await createClient()
      ).auth.exchangeCodeForSession(code);
      if (!error) destination = "/#presenca";
    } catch {
      /* Friendly failure handled by the RSVP section. */
    }
  }
  // Next's internal request URL can use localhost behind a local/proxy server.
  // Keep the browser on the configured origin so PKCE/session cookies stay attached.
  const origin = new URL(process.env.SITE_URL || "http://127.0.0.1:3000")
    .origin;
  const response = NextResponse.redirect(new URL(destination, origin));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
