"use client";

import CameoAvatar from "./CameoAvatar";
import type { PrivateFormData } from "./PrivatePersonForm";

interface PrivateConfirmScreenProps {
  data: PrivateFormData;
  onConfirm: () => void;
  onBack: () => void;
}

export default function PrivateConfirmScreen({ data, onConfirm, onBack }: PrivateConfirmScreenProps) {
  return (
    <div className="flex flex-col items-center text-center px-2 py-4">
      {/* Cameo */}
      <div className="mb-5">
        <CameoAvatar gender={data.gender} size={88} />
      </div>

      {/* Name */}
      <h2
        className="text-2xl font-playfair mb-1"
        style={{ fontStyle: "italic", color: "#1a1a14" }}
      >
        {data.name}
      </h2>
      <p className="text-xs text-[#999] mb-6">
        b. {data.birthYear}
        {data.city ? ` · ${data.city}` : ""}
      </p>

      {/* Amber info box */}
      <div
        className="w-full rounded-2xl p-4 mb-6 text-left space-y-2"
        style={{ background: "#fef9ec", border: "1px solid #f0d87c" }}
      >
        <p className="text-xs font-semibold text-[#7a6010] mb-2">
          Why this is different
        </p>
        <p className="text-xs text-[#7a6010] leading-relaxed">
          Famous people are monitored in real-time via Wikipedia. Private
          individuals aren&apos;t — we check obituaries and death records weekly.
        </p>
        <p className="text-xs text-[#7a6010]">US and UK only for now.</p>
        <p className="text-xs text-[#7a6010] font-medium">
          $1. Non-refundable. We&apos;ll do our best.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onConfirm}
        className="w-full rounded-xl py-4 text-sm font-semibold mb-3"
        style={{ background: "#c0392b", color: "#fff" }}
      >
        Watch {data.name} · $1
      </button>

      {/* Footer */}
      <p className="text-[10px] text-[#ccc] mb-4">
        no photo · no promises · no refunds · just $1
      </p>

      <button onClick={onBack} className="text-xs text-[#999]">
        ← go back
      </button>
    </div>
  );
}
