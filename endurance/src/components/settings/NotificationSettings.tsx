"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface HostPreferences {
  notification_new_booking: boolean;
  notification_cancellation: boolean;
  notification_new_message: boolean;
  notification_waiver_signed: boolean;
  notification_retreat_reminder: boolean;
}

const DEFAULT_PREFS: HostPreferences = {
  notification_new_booking: true,
  notification_cancellation: true,
  notification_new_message: true,
  notification_waiver_signed: false,
  notification_retreat_reminder: true,
};

const ROWS: { key: keyof HostPreferences; label: string; description: string }[] = [
  { key: "notification_new_booking", label: "New booking", description: "Get notified when someone books your retreat" },
  { key: "notification_cancellation", label: "Booking cancelled", description: "Get notified when a guest cancels" },
  { key: "notification_new_message", label: "New message", description: "Get notified when a guest messages you" },
  { key: "notification_waiver_signed", label: "Waiver signed", description: "Get notified when a guest signs their waiver" },
  { key: "notification_retreat_reminder", label: "Retreat reminder", description: "7-day reminder before your retreat starts" },
];

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4A6741]/30 focus:ring-offset-2 disabled:opacity-50 ${
        on ? "bg-[#4A6741]" : "bg-[#8A8478]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<HostPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("host_preferences")
      .select("*")
      .eq("host_id", user.id)
      .maybeSingle();
    if (data) {
      const row = data as Record<string, unknown>;
      setPrefs({
        notification_new_booking: row.notification_new_booking !== false,
        notification_cancellation: row.notification_cancellation !== false,
        notification_new_message: row.notification_new_message !== false,
        notification_waiver_signed: row.notification_waiver_signed === true,
        notification_retreat_reminder: row.notification_retreat_reminder !== false,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (key: keyof HostPreferences, value: boolean) => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const next = { ...prefs, [key]: value };
      setPrefs(next);

      await supabase.from("host_preferences").upsert(
        {
          host_id: user.id,
          ...next,
        },
        { onConflict: "host_id" }
      );
    },
    [prefs]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#D8D2C4] bg-[#FDFAF5] p-6">
        <h2 className="font-serif text-xl text-[#1A1A14]">Notifications</h2>
        <p className="mt-1 text-sm text-[#8A8478]">Choose what you hear about</p>
        <p className="mt-6 text-sm text-[#8A8478]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D8D2C4] bg-[#FDFAF5] p-6">
      <h2 className="font-serif text-xl text-[#1A1A14]">Notifications</h2>
      <p className="mt-1 text-sm text-[#8A8478]">Choose what you hear about</p>

      <div className="mt-6 space-y-4">
        {ROWS.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-lg border border-[#D8D2C4] bg-white px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1A1A14]">{label}</p>
              <p className="mt-0.5 text-xs text-[#8A8478]">{description}</p>
            </div>
            <Toggle
              on={prefs[key]}
              onChange={(on) => update(key, on)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
