"use client";

import { useEffect, useState } from "react";
import { KeyRound, Mail, Settings, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SessionResponse = {
  user?: {
    email?: string | null;
  };
};

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const payload = (await response
          .json()
          .catch(() => null)) as SessionResponse | null;

        if (!active) {
          return;
        }

        const nextEmail = payload?.user?.email?.trim() ?? "";
        setEmail(nextEmail);
      } catch {
        if (!active) {
          return;
        }
        setError("Unable to load current user session.");
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleChangePassword() {
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim()) {
      setError("Current password is required.");
      return;
    }

    if (!newPassword.trim()) {
      setError("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: { message?: string };
        data?: { email?: string };
      } | null;

      if (!response.ok) {
        setError(payload?.error?.message ?? "Unable to update settings.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch {
      setError("Unable to update settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative space-y-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-slate-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-zinc-200/20 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="mb-8">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-slate-600 to-zinc-700 text-white shadow-lg shadow-slate-500/25">
              <Settings className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Preferences
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            User Settings
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            View your account email and manage your password.
          </p>
        </div>
      </div>

      {/* Account card */}
      <div className="cogs-workspace-card">
        <div className="cogs-selector-bar">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Account Information
            </span>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Current email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              disabled
              className="rounded-xl border-gray-200 bg-gray-50/80 text-sm"
            />
          </div>

          {!showPasswordForm ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccess(null);
                setShowPasswordForm(true);
              }}
              disabled={!email}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-slate-700 to-zinc-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-500/15 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </button>
          ) : null}
        </div>
      </div>

      {/* Password form card */}
      {showPasswordForm ? (
        <div className="cogs-workspace-card">
          <div className="cogs-selector-bar">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Change Password
              </span>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <Label
                htmlFor="current-password"
                className="text-xs font-semibold uppercase tracking-wider text-gray-400"
              >
                Current password
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
                className="rounded-xl border-gray-200 bg-white text-sm focus:border-slate-400 focus:ring-slate-100"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="rounded-xl border-gray-200 bg-white text-sm focus:border-slate-400 focus:ring-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat new password"
                  className="rounded-xl border-gray-200 bg-white text-sm focus:border-slate-400 focus:ring-slate-100"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-slate-700 to-zinc-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-500/15 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              {isSaving ? "Changing…" : "Change password"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Feedback messages */}
      {error ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {success}
        </div>
      ) : null}
    </div>
  );
}
