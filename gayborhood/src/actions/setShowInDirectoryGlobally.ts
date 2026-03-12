"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Set show_in_directory for all community memberships of the current user. */
export async function setShowInDirectoryGlobally(show: boolean) {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Not signed in." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase
    .from("community_members")
    .update({ show_in_directory: show })
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  return { ok: true };
}
