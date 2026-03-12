"use client";

type Member = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  joined_at: string;
};

function initials(displayName: string | null): string {
  if (!displayName || !displayName.trim()) return "?";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

function formatMemberSince(joinedAt: string): string {
  const d = new Date(joinedAt);
  return `Member since ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
}

export default function MemberCard({ member }: { member: Member }) {
  const name = member.display_name?.trim() || "Anonymous";
  const oneLineBio = member.bio?.trim().replace(/\s+/g, " ").slice(0, 120) || null;

  return (
    <div className="border border-rule bg-paper p-4 font-courier">
      <div className="flex items-start gap-3">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt=""
            className="h-12 w-12 shrink-0 border border-rule object-cover"
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-rule bg-faded/20 font-bebas text-lg text-ink"
            aria-hidden
          >
            {initials(name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{name}</p>
          <p className="text-xs text-faded">{formatMemberSince(member.joined_at)}</p>
          {oneLineBio && (
            <p className="mt-1 text-sm text-faded">{oneLineBio}</p>
          )}
        </div>
      </div>
    </div>
  );
}
