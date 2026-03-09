import { HostProfileSettings } from "@/components/host/HostProfileSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-[28px] tracking-tight text-ink">Settings</h1>
      <p className="mt-2 text-warm-gray">Manage your account and host profile.</p>
      <div className="mt-8 space-y-8">
        <HostProfileSettings />
        <AccountSettings />
        <NotificationSettings />
      </div>
    </div>
  );
}
