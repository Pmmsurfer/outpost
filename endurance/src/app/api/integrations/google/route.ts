import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Next.js route handlers require the request parameter; we don't use it in these handlers
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: conn, error } = await supabase
    .from("google_sheet_connections")
    .select("spreadsheet_id, spreadsheet_url, created_at")
    .eq("host_id", user.id)
    .single();
  if (error || !conn) {
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({
    connected: true,
    spreadsheetUrl: conn.spreadsheet_url ?? `https://docs.google.com/spreadsheets/d/${conn.spreadsheet_id}`,
    spreadsheetId: conn.spreadsheet_id,
    connectedAt: conn.created_at,
  });
}

// Next.js route handlers require the request parameter; we don't use it in these handlers
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { error } = await supabase
    .from("google_sheet_connections")
    .delete()
    .eq("host_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
