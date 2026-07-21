"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  onDismiss: () => void;
}

export default function AuthModal({ onDismiss }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-enter"
        style={{ background: "rgba(10,10,8,0.65)" }}
        onClick={onDismiss}
      />

      {/* Modal */}
      <div
        className="sheet-enter"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(92vw, 380px)",
          background: "#f8f8f6",
          borderRadius: 20,
          zIndex: 50,
          padding: "32px 28px",
        }}
      >
        {!sent ? (
          <>
            <h2
              className="font-playfair text-center mb-1"
              style={{ fontStyle: "italic", fontSize: 22, color: "#1a1a14" }}
            >
              Sign in
            </h2>
            <p className="text-center text-xs mb-6" style={{ color: "#999" }}>
              We&rsquo;ll email you a magic link. No password required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                className="w-full rounded-xl border border-[#e8e4dc] px-4 py-3 text-sm outline-none focus:border-[#5a5850] transition-colors"
                style={{ color: "#1a1a14" }}
              />
              {error && (
                <p className="text-xs" style={{ color: "#c0392b" }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-semibold"
                style={{
                  background: loading ? "#aaa" : "#1a1a14",
                  color: "#f0ede6",
                  transition: "background 0.15s",
                }}
              >
                {loading ? "sending…" : "Send magic link"}
              </button>
            </form>

            <button
              onClick={onDismiss}
              className="w-full text-center mt-4"
              style={{ fontSize: 11, color: "#bbb" }}
            >
              maybe later
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <p
              className="font-playfair mb-2"
              style={{ fontStyle: "italic", fontSize: 20, color: "#1a1a14" }}
            >
              Check your inbox.
            </p>
            <p className="text-sm mb-6" style={{ color: "#999" }}>
              We sent a link to <strong style={{ color: "#1a1a14" }}>{email}</strong>.
              Click it to sign in — no password needed.
            </p>
            <p
              className="font-playfair text-xs"
              style={{ fontStyle: "italic", color: "#aaa8a2" }}
            >
              not to be confused with la petite mort
            </p>
          </div>
        )}
      </div>
    </>
  );
}
