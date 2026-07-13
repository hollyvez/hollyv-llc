"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentSheetProps {
  personIds: string[];
  onSuccess: () => void;
  onBack: () => void;
}

function CheckoutForm({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState("");
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="w-full rounded-xl border border-[#e8e4dc] px-4 py-3 text-sm outline-none focus:border-[#5a5850] transition-colors"
        style={{ color: "#1a1a14" }}
      />
      <PaymentElement />
      {error && <p className="text-sm" style={{ color: "#c0392b" }}>{error}</p>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full rounded-xl py-4 text-sm font-semibold"
        style={{
          background: loading ? "#aaa" : "#c0392b",
          color: "#fff",
          transition: "background 0.15s",
        }}
      >
        {loading ? "processing…" : "confirm payment"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-center"
        style={{ fontSize: 11, color: "#bbb" }}
      >
        ← back
      </button>
    </form>
  );
}

export default function PaymentSheet({ personIds, onSuccess, onBack }: PaymentSheetProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personIds }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setFetchError(d.error ?? "Could not start payment");
      })
      .catch(() => setFetchError("Network error"));
  }, [personIds]);

  if (fetchError) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm mb-4" style={{ color: "#c0392b" }}>{fetchError}</p>
        <button onClick={onBack} className="text-xs" style={{ color: "#bbb" }}>← back</button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="py-8 flex justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e8e4dc] border-t-[#5a5850]" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "stripe", variables: { fontFamily: "inherit" } } }}
    >
      <CheckoutForm onSuccess={onSuccess} onBack={onBack} />
    </Elements>
  );
}
