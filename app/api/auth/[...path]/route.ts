import { auth } from "@/lib/auth/server";

const handlers = auth?.handler();
type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context) {
  const { path } = await context.params;
  if (path.join("/") !== "get-session" || !handlers)
    return new Response(null, { status: 404 });
  const response = await handlers.GET(request, context);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: Request, context: Context) {
  const { path } = await context.params;
  if (path.join("/") !== "sign-out" || !handlers)
    return new Response(null, { status: 404 });
  const response = await handlers.POST(request, context);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
