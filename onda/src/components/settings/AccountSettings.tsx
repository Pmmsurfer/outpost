"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function AccountSettings() {
  const [email, setEmail] = useState<string>("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? "");
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleUpdatePassword = async () => {
    if (!supabase) {
      setToast("Supabase is not configured.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setToast("Password must be at least 6 characters.");
      return;
    }
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdating(false);
    if (error) {
      setToast(error.message);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordOpen(false);
    setToast("Password updated");
  };

  return (
    <div className="rounded-2xl border border-[#D8D2C4] bg-[#FDFAF5] p-6">
      <h2 className="font-serif text-xl text-[#1A1A14]">Account</h2>
      <p className="mt-1 text-sm text-[#8A8478]">Your login and security settings</p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-[#1A1A14]">Email address</label>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-[#1A1A14]">{email || "—"}</span>
            <svg className="h-4 w-4 flex-shrink-0 text-[#8A8478]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="mt-1 text-xs text-[#8A8478]">To change your email contact support</p>
        </div>

        <div>
          {!changePasswordOpen ? (
            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="rounded-lg border-2 border-[#D8D2C4] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#1A1A14] transition-colors hover:border-[#1A1A14]"
            >
              Change password
            </button>
          ) : (
            <div className="space-y-4 rounded-lg border border-[#D8D2C4] bg-white p-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A14]">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A14]">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A14]">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={updating}
                  className="rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B8F62] disabled:opacity-60"
                >
                  {updating ? "Updating…" : "Update password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChangePasswordOpen(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-sm font-medium text-[#8A8478] underline hover:text-[#1A1A14]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="mt-4 rounded-lg border border-[#D8D2C4] bg-[#FDFAF5] px-4 py-3 text-sm text-[#1A1A14]">
          {toast}
        </div>
      )}
    </div>
  );
}
