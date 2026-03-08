import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/retreats/new",
  "/bookings",
  "/messages",
  "/financials",
  "/share",
  "/settings",
];

const PROTECTED_PATTERNS = [
  /^\/retreats\/[^/]+\/edit\/?$/,
  /^\/retreats\/[^/]+\/?$/,
];

function isProtectedPath(pathname: string): boolean {
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) return true;
  if (PROTECTED_PATTERNS.some((re) => re.test(pathname))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, (options as Record<string, unknown>) ?? {});
        });
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  if (isProtectedPath(path) && !session) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && (path === "/login" || path === "/signup")) {
    const next = req.nextUrl.searchParams.get("next");
    const destination = next && next.startsWith("/") ? next : "/dashboard";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
