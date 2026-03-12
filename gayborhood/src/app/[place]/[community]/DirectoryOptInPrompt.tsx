"use client";

import { useRouter } from "next/navigation";
import { setShowInDirectory } from "@/actions/joinCommunity";

type Props = {
  place: string;
  community: string;
};

export default function DirectoryOptInPrompt({ place, community }: Props) {
  const router = useRouter();

  async function handleChoice(show: boolean) {
    await setShowInDirectory(place, community, show);
    router.replace(`/${place}/${community}`, { scroll: false });
  }

  return (
    <div className="mb-6 border border-rule bg-paper p-4 font-courier text-sm">
      <p className="text-ink">
        Appear in the member directory? It helps neighbors find each other.
      </p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => handleChoice(true)}
          className="border border-ink bg-ink px-3 py-1 text-paper hover:bg-transparent hover:text-ink"
        >
          Yes, show me
        </button>
        <button
          type="button"
          onClick={() => handleChoice(false)}
          className="border border-rule px-3 py-1 text-faded hover:border-ink hover:text-ink"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
