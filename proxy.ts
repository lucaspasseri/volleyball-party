import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

const sessionProxy = auth?.middleware({
  publicRoutes: ["/", "/auth/callback", "/organizador"],
});

export async function proxy(request: NextRequest) {
  // The organizer page, CSV and actions each enforce authorization at the data boundary.
  const response = sessionProxy
    ? await sessionProxy(request)
    : NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  if (request.nextUrl.pathname === "/auth/callback")
    response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = {
  matcher: ["/", "/auth/callback", "/organizador/:path*"],
};
