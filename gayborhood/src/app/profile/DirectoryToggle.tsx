"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setShowInDirectoryGlobally } from "@/actions/setShowInDirectoryGlobally";

type Props = {
  showInDirectoryDefault: boolean;
};

export default function DirectoryToggle({ showInDirectoryDefault }: Props) {
  const router = useRouter();
  const [on, setOn] = useState(showInDirectoryDefault);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const result = await setShowInDirectoryGlobally(!on);
    setLoading(false);
    if (result.ok) {
      setOn(!on);
      router.refresh();
    } else {
      alert(result.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="font-courier text-sm">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={on}
          onChange={handleToggle}
          disabled={loading}
          className="h-4 w-4 border-rule"
        />
        <span className="font-bold text-ink">Show me in community directories</span>
      </label>
      <p className="mt-1 text-xs text-faded">
        When on, your name and profile appear in the Members tab of communities you’ve joined.
      </p>
    </div>
  );
}
