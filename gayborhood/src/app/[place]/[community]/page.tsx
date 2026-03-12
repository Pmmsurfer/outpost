import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";
import { isPowerUser } from "@/lib/powerUser";
import StickyNav from "@/components/StickyNav";
import SectionNav from "@/components/SectionNav";
import ThisWeekSection from "@/components/ThisWeekSection";
import PostCard from "@/components/PostCard";
import MissedConnectionCard from "@/components/MissedConnectionCard";
import AnonCard from "@/components/AnonCard";
import ClassifiedItem from "@/components/ClassifiedItem";
import PaidEventCard from "@/components/PaidEventCard";
import RecCard from "@/components/RecCard";
import MemberCard from "@/components/MemberCard";
import JoinCommunityButton from "./JoinCommunityButton";
import DirectoryOptInPrompt from "./DirectoryOptInPrompt";

type Params = { place: string; community: string };
type Props = { params: Params; searchParams?: { joined?: string } };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { place, community } = params;
  return {
    title: `${place}/${community} — Gayborhood`,
    description: `Community board for ${place}/${community}`,
  };
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const { place, community } = params;
  const showDirectoryPrompt = searchParams?.joined === "1";

  if (!supabase) throw new Error("Supabase not configured");

   // Lightweight auth lookup for power‑user and "member" state
  let userEmail: string | undefined;
  let userId: string | undefined;
  let isCommunityMember = false;
  try {
    const serverClient = await createClient();
    if (serverClient) {
      const { data } = await serverClient.auth.getUser();
      const user = data.user;
      if (user) {
        userEmail = user.email ?? undefined;
        userId = user.id;
        const { data: membership } = await serverClient
          .from("community_members")
          .select("id")
          .eq("place_slug", place)
          .eq("community_slug", community)
          .eq("user_id", user.id)
          .maybeSingle();
        isCommunityMember = !!membership;
      }
    }
  } catch {
    // Treat as signed out
  }
  const powerUser = isPowerUser(userEmail);
  const isMember = !!userEmail;

  // Ensure place + community exist
  const [{ data: placeRow }, { data: communityRow }] = await Promise.all([
    supabase.from("places").select("*").eq("slug", place).single(),
    supabase
      .from("communities")
      .select("*")
      .eq("place_slug", place)
      .eq("slug", community)
      .single(),
  ]);

  if (!placeRow || !communityRow) notFound();

  const today = new Date().toISOString().slice(0, 10);

  const [
    thisWeekRes,
    boardRes,
    missedRes,
    anonRes,
    classifiedsRes,
    hostedRes,
    recsRes,
    counts,
  ] = await Promise.all([
    // This Week: upcoming events
    supabase
      .from("posts")
      .select("*")
      .eq("place_slug", place)
      .eq("community_slug", community)
      .eq("is_approved", true)
      .not("event_date", "is", null)
      .gte("event_date", today)
      .order("event_date", { ascending: true }),
    // Board: non‑event, non‑classified
    supabase
      .from("posts")
      .select("*")
      .eq("place_slug", place)
      .eq("community_slug", community)
      .eq("is_approved", true)
      .is("event_date", null)
      .not(
        "category",
        "in",
        "(roommate,gear,borrow,lend,skill_swap,missed_connection,anonymous,recommendation)"
      )
      .order("created_at", { ascending: false }),
    // Missed connections
    supabase
      .from("posts")
      .select("*")
      .eq("place_slug", place)
      .eq("community_slug", community)
      .eq("category", "missed_connection")
      .eq("is_approved", true)
      .order("created_at", { ascending: false }),
    // Anonymous
    supabase
      .from("posts")
      .select("*")
      .eq("place_slug", place)
      .eq("community_slug", community)
      .eq("category", "anonymous")
      .eq("is_approved", true)
      .order("like_count", { ascending: false }),
    // Classifieds
    supabase
      .from("posts")
      .select("*")
      .eq("place_slug", place)
      .eq("community_slug", community)
      .eq("is_approved", true)
      .in("category", ["roommate", "gear", "borrow", "lend", "skill_swap"])
      .order("created_at", { ascending: false }),
    // Hosted experiences (paid)
    supabase
      .from("posts")
      .select("*")
      .eq("place_slug", place)
      .eq("community_slug", community)
      .eq("is_approved", true)
      .gt("price_cents", 0)
      .order("event_date", { ascending: true }),
    // Recommendations
    supabase
      .from("posts")
      .select("*")
      .eq("place_slug", place)
      .eq("community_slug", community)
      .eq("category", "recommendation")
      .eq("is_approved", true)
      .order("like_count", { ascending: false }),
    // Counts for section nav
    Promise.all([
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("place_slug", place)
        .eq("community_slug", community)
        .not("event_date", "is", null)
        .gte("event_date", today),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("place_slug", place)
        .eq("community_slug", community)
        .is("event_date", null)
        .not(
          "category",
          "in",
          "(roommate,gear,borrow,lend,skill_swap,missed_connection,anonymous,recommendation)"
        ),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("place_slug", place)
        .eq("community_slug", community)
        .eq("category", "missed_connection"),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("place_slug", place)
        .eq("community_slug", community)
        .eq("category", "anonymous"),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("place_slug", place)
        .eq("community_slug", community)
        .in("category", ["roommate", "gear", "borrow", "lend", "skill_swap"]),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("place_slug", place)
        .eq("community_slug", community)
        .gt("price_cents", 0),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("place_slug", place)
        .eq("community_slug", community)
        .eq("category", "recommendation"),
    ]),
  ]);

  const [
    thisWeekCount,
    boardCount,
    missedCount,
    anonCount,
    classifiedsCount,
    hostedCount,
    recsCount,
  ] = counts;

  const sectionCounts = {
    thisWeek: thisWeekCount.count ?? 0,
    board: boardCount.count ?? 0,
    missedConnections: missedCount.count ?? 0,
    anonymous: anonCount.count ?? 0,
    classifieds: classifiedsCount.count ?? 0,
    hosted: hostedCount.count ?? 0,
    recs: recsCount.count ?? 0,
    members: 0,
  };

  // Member count and directory (opt-in only; power users see all)
  let directoryMembers: Array<{
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    joined_at: string;
  }> = [];
  if (supabaseAdmin) {
    const [countRes, membersRes] = await Promise.all([
      supabaseAdmin
        .from("community_members")
        .select("id", { count: "exact", head: true })
        .eq("place_slug", place)
        .eq("community_slug", community),
      powerUser
        ? supabaseAdmin
            .from("community_members")
            .select("user_id, joined_at")
            .eq("place_slug", place)
            .eq("community_slug", community)
            .order("joined_at", { ascending: false })
        : supabaseAdmin
            .from("community_members")
            .select("user_id, joined_at")
            .eq("place_slug", place)
            .eq("community_slug", community)
            .eq("show_in_directory", true)
            .order("joined_at", { ascending: false }),
    ]);
    const totalMembers = countRes.count ?? 0;
    sectionCounts.members = totalMembers;

    const memberRows = (membersRes.data ?? []) as { user_id: string; joined_at: string }[];
    if (memberRows.length > 0) {
      const userIds = memberRows.map((r) => r.user_id);
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, avatar_url, bio")
        .in("id", userIds);
      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.id, p])
      );
      directoryMembers = memberRows.map((row) => {
        const p = profileMap.get(row.user_id) as any;
        return {
          id: row.user_id,
          display_name: p?.display_name ?? null,
          avatar_url: p?.avatar_url ?? null,
          bio: p?.bio ?? null,
          joined_at: row.joined_at,
        };
      });
    }
  }

  const classifieds = classifiedsRes.data ?? [];
  const leftClassifieds = classifieds.filter((p: any) =>
    ["roommate", "borrow", "lend", "skill_swap"].includes(p.category)
  );
  const rightClassifieds = classifieds.filter(
    (p: any) => p.category === "gear"
  );

  // Last activity label
  const allPosts = [
    ...(thisWeekRes.data ?? []),
    ...(boardRes.data ?? []),
    ...(missedRes.data ?? []),
    ...(anonRes.data ?? []),
    ...(classifiedsRes.data ?? []),
    ...(hostedRes.data ?? []),
    ...(recsRes.data ?? []),
  ] as any[];

  let lastPostLabel: string | null = null;
  if (allPosts.length > 0) {
    const latest = allPosts.reduce((latestDate, post) => {
      const d = new Date(post.created_at);
      return d > latestDate ? d : latestDate;
    }, new Date(allPosts[0].created_at));
    const days = Math.max(
      0,
      Math.round(
        (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    if (days === 0) lastPostLabel = "last post today";
    else if (days === 1) lastPostLabel = "last post 1 day ago";
    else lastPostLabel = `last post ${days} days ago`;
  }

  return (
    <div className="min-h-screen bg-paper">
      <StickyNav />

      <main
        id="main-content"
        className="mx-auto max-w-board px-[18px] pb-12 pt-6"
      >
        {/* Masthead */}
        <header className="mb-8">
          <h1 className="font-bebas text-3xl tracking-[2px] text-ink">
            <span className="text-faded">{place}/</span>
            <span className="text-ink">{community}</span>
          </h1>
          {/* Community description */}
          {communityRow.description && (
            <p className="mt-2 font-courier text-sm text-faded">
              {communityRow.description}
            </p>
          )}
          {!communityRow.description && powerUser && (
            <p className="mt-2 font-courier text-sm text-faded">
              <span className="text-link hover:underline">
                Add a description →
              </span>
            </p>
          )}
          {/* Member + activity signal */}
          <p className="mt-1 font-courier text-xs text-faded">
            {sectionCounts.members} {sectionCounts.members === 1 ? "member" : "members"}
            {lastPostLabel ? ` · ${lastPostLabel}` : null}
          </p>
          {/* Primary CTA */}
          <div className="mt-4">
            {isMember && isCommunityMember ? (
              <Link
                href={`/${place}/${community}/submit`}
                className="inline-block border border-ink bg-ink px-3 py-1 font-bebas text-xs tracking-[2px] text-paper hover:bg-transparent hover:text-ink"
              >
                Post something →
              </Link>
            ) : isMember && !isCommunityMember ? (
              <JoinCommunityButton place={place} community={community} />
            ) : (
              <Link
                href={`/login/sign-up?next=${encodeURIComponent(
                  `/${place}/${community}`
                )}`}
                className="inline-block border border-ink bg-paper px-3 py-1 font-bebas text-xs tracking-[2px] text-ink hover:bg-ink hover:text-paper"
              >
                Join the community →
              </Link>
            )}
          </div>
        </header>

        {showDirectoryPrompt && (
          <DirectoryOptInPrompt place={place} community={community} />
        )}

        <SectionNav counts={sectionCounts} />

        {/* This Week */}
        <ThisWeekSection events={(thisWeekRes.data ?? []) as any} />

        {/* Members directory */}
        <section id="members" className="mb-10">
          <h2 className="section-head font-bebas tracking-[2px] text-ink">
            MEMBERS
          </h2>
          {directoryMembers.length === 0 ? (
            <p className="font-courier text-sm text-faded">
              No members in the directory yet. Join and opt in to appear here.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {directoryMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </section>

        {/* The Board */}
        <section id="board" className="mb-10">
          <h2 className="section-head font-bebas tracking-[2px] text-ink">
            THE BOARD
          </h2>
          <div className="space-y-0">
            {(boardRes.data ?? []).length === 0 ? (
              <p className="font-courier text-sm text-faded">
                No posts yet. Be the first.
              </p>
            ) : (
              (boardRes.data ?? []).map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </section>

        {/* Missed Connections */}
        <section id="missed" className="mb-10">
          <h2 className="section-head font-bebas tracking-[2px] text-ink">
            MISSED CONNECTIONS
          </h2>
          <div className="space-y-0">
            {(missedRes.data ?? []).length === 0 ? (
              <p className="font-courier text-sm text-faded">
                No missed connections.
              </p>
            ) : (
              (missedRes.data ?? []).map((post: any) => (
                <MissedConnectionCard key={post.id} post={post} />
              ))
            )}
          </div>
        </section>

        {/* Anonymous */}
        <section id="anonymous" className="mb-10">
          <h2 className="section-head font-bebas tracking-[2px] text-ink">
            ANONYMOUS
          </h2>
          <div className="space-y-0">
            {(anonRes.data ?? []).length === 0 ? (
              <p className="font-courier text-sm text-faded">
                No anonymous posts.
              </p>
            ) : (
              (anonRes.data ?? []).map((post: any) => (
                <AnonCard key={post.id} post={post} />
              ))
            )}
          </div>
        </section>

        {/* Classifieds */}
        <section id="classifieds" className="mb-10">
          <h2 className="section-head font-bebas tracking-[2px] text-ink">
            CLASSIFIEDS
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 font-courier text-sm font-bold text-ink">
                Roommates · Borrowed & Lent · Skill Swaps
              </p>
              <div className="space-y-0">
                {leftClassifieds.length === 0 ? (
                  <p className="font-courier text-sm text-faded">—</p>
                ) : (
                  leftClassifieds.map((post: any) => (
                    <ClassifiedItem key={post.id} post={post} />
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 font-courier text-sm font-bold text-ink">
                Gear · Misc
              </p>
              <div className="space-y-0">
                {rightClassifieds.length === 0 ? (
                  <p className="font-courier text-sm text-faded">—</p>
                ) : (
                  rightClassifieds.map((post: any) => (
                    <ClassifiedItem key={post.id} post={post} />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Hosted Experiences */}
        <section id="hosted" className="mb-10">
          <h2 className="section-head font-bebas tracking-[2px] text-ink">
            HOSTED EXPERIENCES
          </h2>
          <div className="space-y-0">
            {(hostedRes.data ?? []).length === 0 ? (
              <p className="font-courier text-sm text-faded">
                No paid events right now.
              </p>
            ) : (
              (hostedRes.data ?? []).map((post: any) => (
                <PaidEventCard key={post.id} post={post} />
              ))
            )}
          </div>
        </section>

        {/* Recommendations */}
        <section id="recs" className="mb-10">
          <h2 className="section-head font-bebas tracking-[2px] text-ink">
            RECOMMENDATIONS
          </h2>
          <div className="space-y-0">
            {(recsRes.data ?? []).length === 0 ? (
              <p className="font-courier text-sm text-faded">
                No recommendations yet.
              </p>
            ) : (
              (recsRes.data ?? []).map((post: any) => (
                <RecCard key={post.id} post={post} />
              ))
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-rule pt-6 font-courier text-sm text-faded">
          {place}/{community} ·{" "}
          {isMember ? (
            <Link
              href={`/${place}/${community}/submit`}
              className="text-link hover:underline"
            >
              Post something →
            </Link>
          ) : (
            <Link
              href={`/login/sign-up?next=${encodeURIComponent(
                `/${place}/${community}/submit`
              )}`}
              className="text-link hover:underline"
            >
              Join to post →
            </Link>
          )}{" "}
          ·{" "}
          <a
            href="mailto:hello@gayborhood.com"
            className="text-link hover:underline"
          >
            email
          </a>
        </footer>
      </main>
    </div>
  );
}
