import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { google } from "googleapis";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: conn, error: connError } = await supabase
    .from("google_sheet_connections")
    .select("refresh_token, spreadsheet_id")
    .eq("host_id", user.id)
    .single();
  if (connError || !conn) {
    return NextResponse.json(
      { error: "No Google Sheet connected. Connect a sheet first." },
      { status: 400 }
    );
  }
  const { data: retreats } = await supabase
    .from("retreats")
    .select("id")
    .eq("host_id", user.id);
  const retreatIds = (retreats ?? []).map((r) => r.id);
  if (retreatIds.length === 0) {
    return NextResponse.json(
      { error: "No retreats found. Create a retreat first." },
      { status: 400 }
    );
  }
  const { data: bookingsData, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, retreat_id, guest_name, guest_email, retreat_name, total_cents, status, waiver_signed, booked_at")
    .in("retreat_id", retreatIds)
    .order("booked_at", { ascending: false });
  if (bookingsError) {
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: bookingsError.message },
      { status: 500 }
    );
  }
  const bookings = (bookingsData ?? []) as Array<{
    retreat_id: string;
    guest_name: string;
    guest_email: string;
    retreat_name: string;
    total_cents: number;
    status: string;
    waiver_signed: boolean;
    booked_at: string;
  }>;
  const { data: retreatRows } = await supabase
    .from("retreats")
    .select("id, start_date, end_date")
    .in("id", Array.from(new Set(bookings.map((b) => b.retreat_id))));
  const retreatMap = new Map(
    (retreatRows ?? []).map((r) => [r.id, r as { id: string; start_date: string; end_date: string }])
  );
  const rows = bookings.map((b) => {
    const r = retreatMap.get(b.retreat_id);
    const start = r?.start_date ? formatDate(String(r.start_date)) : "";
    const end = r?.end_date ? formatDate(String(r.end_date)) : "";
    const dates = start && end ? `${start} – ${end}` : "";
    return [
      b.guest_name ?? "",
      b.guest_email ?? "",
      b.retreat_name ?? "",
      dates,
      formatCurrency(b.total_cents ?? 0),
      (b.status ?? "").charAt(0).toUpperCase() + (b.status ?? "").slice(1),
      b.waiver_signed ? "Signed" : "Pending",
      formatDate(b.booked_at ?? ""),
    ];
  });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/integrations/google/callback`;
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  auth.setCredentials({ refresh_token: conn.refresh_token });
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = "Bookings";
  try {
    const spreadsheetId = conn.spreadsheet_id as string;
    const range = `${sheetName}!A2:H`;
    if (rows.length > 0) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A2:H1000`,
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows },
      });
    } else {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A2:H1000`,
      });
    }
    return NextResponse.json({ ok: true, rowsSynced: rows.length });
  } catch (e) {
    console.error("Google Sheets sync error:", e);
    return NextResponse.json(
      { error: "Failed to sync to Google Sheet", details: String(e) },
      { status: 500 }
    );
  }
}
