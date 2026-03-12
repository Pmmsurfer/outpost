import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";
import DirectoryToggle from "./DirectoryToggle";

export const metadata: Metadata = {
  title: "Profile — Gayborhood",
  description: "Your profile and display name.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login?next=" + encodeURIComponent("/profile"));
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=" + encodeURIComponent("/profile"));
  }

  let displayName = "Anonymous";
  let showInDirectoryDefault = false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  if (profile?.display_name) displayName = profile.display_name;

  const { data: memberships } = await supabase
    .from("community_members")
    .select("show_in_directory")
    .eq("user_id", user.id)
    .limit(1);
  showInDirectoryDefault = memberships?.some((m: any) => m.show_in_directory) ?? false;

  return (
    <div className="min-h-screen bg-paper">
      <main
        id="main-content"
        className="mx-auto max-w-board px-[18px] pb-12 pt-8"
      >
        <h1 className="font-bebas text-2xl tracking-[2px] text-ink">
          PROFILE
        </h1>
        <p className="mt-2 font-courier text-sm text-faded">
          Update how you appear on the board.
        </p>
        <div className="mt-8 max-w-sm space-y-8">
          <ProfileForm displayName={displayName} />
          <div className="border-t border-rule pt-6">
            <DirectoryToggle showInDirectoryDefault={showInDirectoryDefault} />
          </div>
        </div>
        <footer className="mt-8 border-t border-rule pt-4 font-courier text-xs text-faded">
          <Link href="/" className="text-link hover:underline">
            ← Home
          </Link>
        </footer>
      </main>
    </div>
  );
}
