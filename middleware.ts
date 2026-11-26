import { NextRequest, NextResponse } from "next/server";
// Cheap gate only (cookie present). Real session checks happen in getUser()/requireUser().
export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  const isAuthPage = p === "/login" || p === "/signup";
  const has = !!req.cookies.get("tv_session")?.value;
  if (!has && !isAuthPage) return NextResponse.redirect(new URL("/login", req.url));
  if (has && isAuthPage) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|api/blob|favicon.ico).*)"] };
