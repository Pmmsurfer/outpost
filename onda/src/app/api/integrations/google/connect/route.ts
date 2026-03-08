import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google integration not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 }
    );
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/integrations/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: user.id,
  });
  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
