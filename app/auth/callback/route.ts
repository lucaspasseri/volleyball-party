import { NextResponse, type NextRequest } from "next/server";
import { getGuest } from "@/lib/auth/server";
import { siteOrigin } from "@/lib/site-origin";

export async function GET(request: NextRequest) {
  let destination = "/?auth=error#presenca";
  if (request.nextUrl.searchParams.get("error") === "access_denied") {
    destination = "/?auth=canceled#presenca";
  } else if (
    !request.nextUrl.searchParams.has("auth_error") &&
    !request.nextUrl.searchParams.has("error")
  ) {
    try {
      if (await getGuest()) destination = "/#presenca";
    } catch {
      // The RSVP section shows a generic sign-in error.
    }
  }
  return NextResponse.redirect(new URL(destination, siteOrigin()), {
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
