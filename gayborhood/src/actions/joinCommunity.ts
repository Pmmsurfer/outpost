"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function joinCommunity(placeSlug: string, communitySlug: string) {
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

  const { error } = await supabase.from("community_members").upsert(
    {
      place_slug: placeSlug,
      community_slug: communitySlug,
      user_id: user.id,
      show_in_directory: false,
    },
    { onConflict: "place_slug,community_slug,user_id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/${placeSlug}/${communitySlug}`);
  return { ok: true };
}

export async function setShowInDirectory(
  placeSlug: string,
  communitySlug: string,
  show: boolean
) {
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
    .eq("place_slug", placeSlug)
    .eq("community_slug", communitySlug)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/${placeSlug}/${communitySlug}`);
  return { ok: true };
}
