"use client";

import { useRouter } from "next/navigation";
import { joinCommunity } from "@/actions/joinCommunity";

type Props = {
  place: string;
  community: string;
};

export default function JoinCommunityButton({ place, community }: Props) {
  const router = useRouter();

  async function handleJoin() {
    const result = await joinCommunity(place, community);
    if (result.ok) {
      router.push(`/${place}/${community}?joined=1`);
    } else {
      alert(result.error ?? "Something went wrong.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleJoin}
      className="inline-block border border-ink bg-ink px-3 py-1 font-bebas text-xs tracking-[2px] text-paper hover:bg-transparent hover:text-ink"
    >
      Join the community →
    </button>
  );
}
