"use client";

import { useState } from "react";

export interface PrivateFormData {
  name: string;
  birthYear: string;
  city: string;
  gender: "man" | "woman";
}

interface PrivatePersonFormProps {
  onSubmit: (data: PrivateFormData) => void;
}

export default function PrivatePersonForm({ onSubmit }: PrivatePersonFormProps) {
  const [form, setForm] = useState<PrivateFormData>({
    name: "",
    birthYear: "",
    city: "",
    gender: "woman",
  });

  const valid = form.name.trim().length > 1 && form.birthYear.length === 4;

  return (
    <div className="space-y-3 mt-2">
      <p className="text-xs text-[#999] leading-relaxed">
        Private individuals aren&apos;t on Wikipedia. We check obituaries and death records
        weekly. $1 non-refundable.
      </p>

      <input
        type="text"
        placeholder="Full name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-sm text-[#1a1a14] placeholder-[#ccc] outline-none focus:border-[#5a5850]"
      />

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Birth year"
          maxLength={4}
          value={form.birthYear}
          onChange={(e) => setForm((f) => ({ ...f, birthYear: e.target.value.replace(/\D/g, "") }))}
          className="w-28 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-sm text-[#1a1a14] placeholder-[#ccc] outline-none focus:border-[#5a5850]"
        />
        <input
          type="text"
          placeholder="City (US or UK)"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="flex-1 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-sm text-[#1a1a14] placeholder-[#ccc] outline-none focus:border-[#5a5850]"
        />
      </div>

      <div className="flex gap-2">
        {(["woman", "man"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setForm((f) => ({ ...f, gender: g }))}
            className="flex-1 rounded-xl border py-3 text-sm font-medium transition-colors"
            style={{
              background: form.gender === g ? "#1a1a14" : "#fff",
              color: form.gender === g ? "#fff" : "#5a5850",
              borderColor: form.gender === g ? "#1a1a14" : "#e8e4dc",
            }}
          >
            {g === "woman" ? "Woman" : "Man"}
          </button>
        ))}
      </div>

      <button
        onClick={() => valid && onSubmit(form)}
        disabled={!valid}
        className="w-full rounded-xl py-3.5 text-sm font-semibold transition-opacity"
        style={{
          background: "#1a1a14",
          color: "#fff",
          opacity: valid ? 1 : 0.35,
        }}
      >
        Continue · $1
      </button>
    </div>
  );
}
