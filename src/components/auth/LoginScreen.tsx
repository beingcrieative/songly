"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentEmail, setSentEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(true);
    } catch (err: any) {
      setError(err?.message ?? "Er ging iets mis bij het versturen van de code");
      console.error("Error sending magic code:", err);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email, code });
      // Success! The user will be automatically logged in
      // No need to redirect - the parent component will handle the state change
    } catch (err: any) {
      setError(err?.message ?? "Ongeldige code, probeer het opnieuw");
      console.error("Error verifying magic code:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !busy) {
      action();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fffbf7] via-[#fef4ef] to-[#ffeae3]">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1f1b2d] mb-2">
            🎵 Liefdesliedje Studio
          </h1>
          <p className="text-[rgba(31,27,45,0.6)]">
            Maak binnen minuten een persoonlijk liefdesliedje
          </p>
        </div>

        {/* Login Card */}
        <div className="surface-card p-8 shadow-xl">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#7f5af0]/30 bg-[#7f5af0]/10 px-4 py-1 text-xs font-semibold text-[#7f5af0]">
              Log in om te beginnen
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-[#1f1b2d]">
              Magic Link Login
            </h2>
            <p className="mt-2 text-sm text-[rgba(31,27,45,0.6)]">
              We sturen je een code. Geen wachtwoord nodig.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!sentEmail ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.32em] text-[rgba(31,27,45,0.45)] mb-2">
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, sendCode)}
                  placeholder="jij@email.com"
                  autoFocus
                  disabled={busy}
                  className="w-full rounded-2xl border border-white/50 bg-white/90 px-4 py-3 text-sm text-[rgba(31,27,45,0.75)] placeholder:text-[rgba(31,27,45,0.4)] focus:border-[#7f5af0]/40 focus:outline-none focus:ring-2 focus:ring-[#7f5af0]/20 disabled:opacity-50"
                />
              </div>
              <button
                onClick={sendCode}
                disabled={busy || !email.trim()}
                className="w-full rounded-full bg-gradient-to-r from-[#7f5af0] to-[#ff6aa2] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7f5af0]/25 hover:shadow-xl hover:shadow-[#7f5af0]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Versturen..." : "Stuur code"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 mb-4">
                <p className="text-sm text-green-700">
                  ✓ Code verstuurd naar <strong>{email}</strong>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Controleer je inbox en spam folder
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.32em] text-[rgba(31,27,45,0.45)] mb-2">
                  Verificatie Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyPress={(e) => handleKeyPress(e, verifyCode)}
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                  disabled={busy}
                  className="w-full rounded-2xl border border-white/50 bg-white/90 px-4 py-3 text-center text-lg tracking-[0.6em] focus:border-[#7f5af0]/40 focus:outline-none focus:ring-2 focus:ring-[#7f5af0]/20 disabled:opacity-50"
                />
              </div>

              <button
                onClick={verifyCode}
                disabled={busy || code.trim().length < 6}
                className="w-full rounded-full bg-gradient-to-r from-[#7f5af0] to-[#ff6aa2] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7f5af0]/25 hover:shadow-xl hover:shadow-[#7f5af0]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Verifiëren..." : "Log in"}
              </button>

              <button
                onClick={() => {
                  setSentEmail(false);
                  setCode("");
                  setError(null);
                }}
                disabled={busy}
                className="w-full rounded-full border border-white/60 bg-white/80 px-6 py-3 text-sm text-[rgba(31,27,45,0.6)] hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ander e-mailadres gebruiken
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[rgba(31,27,45,0.5)]">
          <p>Door in te loggen ga je akkoord met onze voorwaarden</p>
        </div>
      </div>
    </div>
  );
}
