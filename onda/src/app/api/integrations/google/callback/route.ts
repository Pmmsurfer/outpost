import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { google } from "googleapis";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ refresh_token?: string; access_token: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  const data = (await res.json()) as { refresh_token?: string; access_token: string };
  return data;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/bookings?error=missing_params", request.url)
    );
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.redirect(
      new URL("/dashboard/bookings?error=server_config", request.url)
    );
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== state) {
    return NextResponse.redirect(
      new URL("/dashboard/bookings?error=session", request.url)
    );
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/integrations/google/callback`;
  let refreshToken: string;
  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    refreshToken = tokens.refresh_token!;
    if (!refreshToken) {
      return NextResponse.redirect(
        new URL("/dashboard/bookings?error=no_refresh_token", request.url)
      );
    }
  } catch (e) {
    console.error("Google token exchange error:", e);
    return NextResponse.redirect(
      new URL("/dashboard/bookings?error=token_exchange", request.url)
    );
  }
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  auth.setCredentials({ refresh_token: refreshToken });
  const sheets = google.sheets({ version: "v4", auth });
  try {
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `Outpost Bookings – ${new Date().toISOString().slice(0, 10)}` },
        sheets: [{ properties: { title: "Bookings" } }],
      },
    });
    const spreadsheetId = createRes.data.spreadsheetId!;
    const spreadsheetUrl = createRes.data.spreadsheetUrl!;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Bookings!A1:H1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Guest name", "Email", "Retreat", "Dates", "Amount", "Status", "Waiver", "Booked at"]],
      },
    });
    const { error } = await supabase.from("google_sheet_connections").upsert(
      {
        host_id: user.id,
        refresh_token: refreshToken,
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: spreadsheetUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "host_id" }
    );
    if (error) {
      console.error("Supabase upsert google_sheet_connections error:", error);
      return NextResponse.redirect(
        new URL("/dashboard/bookings?error=db", request.url)
      );
    }
    return NextResponse.redirect(
      new URL("/dashboard/bookings?google_connected=1", request.url)
    );
  } catch (e) {
    console.error("Google Sheets create error:", e);
    return NextResponse.redirect(
      new URL("/dashboard/bookings?error=sheet_create", request.url)
    );
  }
}
