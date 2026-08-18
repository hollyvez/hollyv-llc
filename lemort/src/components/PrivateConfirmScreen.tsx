"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import CameoAvatar from "./CameoAvatar";
import type { PrivateFormData } from "./PrivatePersonForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PrivateConfirmScreenProps {
  data: PrivateFormData;
  userEmail?: string;
  onSuccess: () => void;
  onBack: () => void;
}

function PrivateCheckoutForm({ name, prefillEmail, onSuccess, onBack }: {
  name: string;
  prefillEmail?: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !email.trim()) return;
    setLoading(true);
    setError(null);

    const { error: submitErr } = await elements.submit();
    if (submitErr) { setError(submitErr.message ?? "Payment failed"); setLoading(false); return; }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href, receipt_email: email },
      redirect: "if_required",
    });

    if (confirmErr) {
      setError(confirmErr.message ?? "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {!prefillEmail && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full rounded-xl border border-[#e8e4dc] px-4 py-3 text-sm outline-none focus:border-[#5a5850] transition-colors"
          style={{ color: "#1a1a14" }}
        />
      )}
      <PaymentElement />
      {error && <p className="text-sm" style={{ color: "#c0392b" }}>{error}</p>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full rounded-xl py-4 text-sm font-semibold"
        style={{ background: loading ? "#aaa" : "#c0392b", color: "#fff", transition: "background 0.15s" }}
      >
        {loading ? "processing…" : `Watch ${name} · $1`}
      </button>
      <button type="button" onClick={onBack} className="w-full text-center" style={{ fontSize: 11, color: "#bbb" }}>
        ← back
      </button>
    </form>
  );
}

export default function PrivateConfirmScreen({ data, userEmail, onSuccess, onBack }: PrivateConfirmScreenProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!showPayment) return;
    fetch("/api/watch-private", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        birthYear: data.birthYear,
        city: data.city,
        gender: data.gender,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setFetchError(d.error ?? "Could not start payment");
      })
      .catch(() => setFetchError("Network error"));
  }, [showPayment, data]);

  return (
    <div className="flex flex-col items-center text-center px-2 py-4">
      <div className="mb-5">
        <CameoAvatar gender={data.gender} size={88} />
      </div>

      <h2 className="text-2xl font-playfair mb-1" style={{ fontStyle: "italic", color: "#1a1a14" }}>
        {data.name}
      </h2>
      <p className="text-xs text-[#999] mb-6">
        b. {data.birthYear}{data.city ? ` · ${data.city}` : ""}
      </p>

      <div
        className="w-full rounded-2xl p-4 mb-6 text-left space-y-2"
        style={{ background: "#fef9ec", border: "1px solid #f0d87c" }}
      >
        <p className="text-xs font-semibold text-[#7a6010] mb-2">Why this is different</p>
        <p className="text-xs text-[#7a6010] leading-relaxed">
          Famous people are monitored in real-time via Wikipedia. Private
          individuals aren&apos;t — we check obituaries and death records weekly.
        </p>
        <p className="text-xs text-[#7a6010]">US and UK only for now.</p>
        <p className="text-xs text-[#7a6010] font-medium">$1. Non-refundable. We&apos;ll do our best.</p>
      </div>

      {!showPayment && !clientSecret && (
        <>
          <button
            onClick={() => setShowPayment(true)}
            className="w-full rounded-xl py-4 text-sm font-semibold mb-3"
            style={{ background: "#c0392b", color: "#fff" }}
          >
            Watch {data.name} · $1
          </button>
          <p className="text-[10px] text-[#ccc] mb-4">no photo · no promises · no refunds · just $1</p>
          <button onClick={onBack} className="text-xs text-[#999]">← go back</button>
        </>
      )}

      {showPayment && fetchError && (
        <div className="w-full">
          <p className="text-sm mb-4" style={{ color: "#c0392b" }}>{fetchError}</p>
          <button onClick={onBack} className="text-xs" style={{ color: "#bbb" }}>← back</button>
        </div>
      )}

      {showPayment && !clientSecret && !fetchError && (
        <div className="py-6 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e8e4dc] border-t-[#5a5850]" />
        </div>
      )}

      {showPayment && clientSecret && (
        <div className="w-full">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe", variables: { fontFamily: "inherit" } } }}
          >
            <PrivateCheckoutForm
              name={data.name}
              prefillEmail={userEmail}
              onSuccess={onSuccess}
              onBack={() => { setShowPayment(false); setClientSecret(null); }}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}
