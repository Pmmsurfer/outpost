import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  let body: {
    retreatId: string;
    retreatName: string;
    guestName?: string;
    guestEmail?: string;
    roomTypeId?: string | null;
    selectedActivities?: string[];
    dietaryRequirements?: string[];
    dietaryNotes?: string | null;
    emergencyContactName: string;
    emergencyContactPhone: string;
    referralSource?: string | null;
    roommateRequest?: string | null;
    totalCents: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const {
    retreatId,
    retreatName,
    guestName = "",
    guestEmail = "",
    roomTypeId = null,
    selectedActivities = [],
    dietaryRequirements = [],
    dietaryNotes = null,
    emergencyContactName,
    emergencyContactPhone,
    referralSource = null,
    roommateRequest = null,
    totalCents,
  } = body;
  if (!retreatId || !retreatName || totalCents == null) {
    return NextResponse.json({ error: "Missing required fields: retreatId, retreatName, totalCents" }, { status: 400 });
  }
  if (!emergencyContactName?.trim() || !emergencyContactPhone?.trim()) {
    return NextResponse.json({ error: "Emergency contact name and phone are required" }, { status: 400 });
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("bookings").insert({
    retreat_id: retreatId,
    retreat_name: retreatName,
    guest_name: guestName.trim() || "Guest",
    guest_email: guestEmail.trim() || "",
    total_cents: totalCents,
    status: "pending",
    waiver_signed: false,
    room_type_id: roomTypeId || null,
    selected_activities: Array.isArray(selectedActivities) ? selectedActivities : [],
    dietary_requirements: Array.isArray(dietaryRequirements) ? dietaryRequirements : [],
    dietary_notes: dietaryNotes?.trim() || null,
    emergency_contact_name: emergencyContactName.trim(),
    emergency_contact_phone: emergencyContactPhone.trim(),
    referral_source: referralSource || null,
    roommate_request: roommateRequest?.trim() || null,
  }).select("id").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data?.id, ok: true });
}
