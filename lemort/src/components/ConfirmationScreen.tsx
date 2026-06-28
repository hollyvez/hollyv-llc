"use client";

import type { MockPerson } from "@/lib/mock-data";
import { InitialsAvatar } from "./CameoAvatar";
import CameoAvatar from "./CameoAvatar";

interface ConfirmationScreenProps {
  people: MockPerson[];
  onDone: () => void;
  onAddMore: () => void;
}

export default function ConfirmationScreen({ people, onDone, onAddMore }: ConfirmationScreenProps) {
  const primary = people[0];
  const names = people.map((p) => p.name.split(" ")[0]).join(", ");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-enter"
        style={{ background: "rgba(26,26,20,0.7)" }}
      />

      {/* Card */}
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-3xl p-7 confirm-enter text-center"
        style={{ background: "#fff" }}
      >
        {/* Stacked avatars */}
        <div className="flex justify-center -space-x-3 mb-6">
          {people.slice(0, 5).map((p, i) => (
            <div
              key={p.id}
              className="rounded-full border-4 border-white"
              style={{ zIndex: people.length - i }}
            >
              {p.isPrivate ? (
                <CameoAvatar gender={p.gender} size={52} />
              ) : (
                <InitialsAvatar name={p.name} size={52} />
              )}
            </div>
          ))}
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-playfair mb-2"
          style={{ fontStyle: "italic", color: "#1a1a14" }}
        >
          You&apos;re watching {people.length} {people.length === 1 ? "person" : "more people"}.
        </h2>

        {/* Subtext */}
        <p
          className="text-sm font-playfair mb-1"
          style={{ fontStyle: "italic", color: "#5a5850" }}
        >
          we&apos;ll notify you the moment {primary ? primary.name.split(" ")[0] : names} dies.
        </p>
        <p
          className="text-sm font-playfair mb-5"
          style={{ fontStyle: "italic", color: "#aaa" }}
        >
          try not to check too often.
        </p>

        {/* Charge line */}
        <p className="text-xs text-[#ccc] mb-6">
          ${people.length} charged · alerts via email or SMS · no further charges
        </p>

        {/* CTAs */}
        <button
          onClick={onDone}
          className="w-full rounded-xl py-4 text-sm font-semibold mb-3"
          style={{ background: "#1a1a14", color: "#fff" }}
        >
          back to the living
        </button>

        <button
          onClick={onAddMore}
          className="w-full text-xs text-[#999]"
        >
          add more subjects
        </button>
      </div>
    </>
  );
}
