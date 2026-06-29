"use client";

import { useState } from "react";
import type { MockPerson } from "@/lib/mock-data";
import { MOCK_PEOPLE } from "@/lib/mock-data";
import { ageQuip } from "@/lib/quips";
import CameoAvatar from "./CameoAvatar";

interface FollowSheetProps {
  person: MockPerson;
  following: Set<string>;
  onConfirm: (ids: string[]) => void;
  onDismiss: () => void;
}

function SparkleRing({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span
      className="sparkle-particle absolute inset-0 rounded-full pointer-events-none"
      style={{ background: "radial-gradient(circle, #f0d060 0%, transparent 70%)", zIndex: 10 }}
    />
  );
}

export default function FollowSheet({ person, following, onConfirm, onDismiss }: FollowSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set([person.id])
  );
  const [sparkled, setSparkled] = useState<string | null>(null);

  const suggestions = MOCK_PEOPLE.filter(
    (p) => person.groupSuggestions.includes(p.id) && !following.has(p.id)
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (id === person.id) return next; // can't deselect primary
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setSparkled(id);
        setTimeout(() => setSparkled(null), 600);
      }
      return next;
    });
  };

  const total = selected.size;
  const allSelected = MOCK_PEOPLE.filter((p) => selected.has(p.id));

  const SmallAvatar = ({ p, size = 40 }: { p: MockPerson; size?: number }) =>
    <CameoAvatar gender={p.gender} size={size} />;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-enter"
        style={{ background: "rgba(26,26,20,0.55)" }}
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 sheet-enter rounded-t-3xl overflow-hidden"
        style={{ background: "#fff", maxHeight: "85vh", overflowY: "auto" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[#e8e4dc]" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Primary person */}
          <div className="flex items-center gap-4 py-4 border-b border-[#f0ede8]">
            <div className="relative">
              <SmallAvatar p={person} size={64} />
            </div>
            <div className="flex-1">
              <h2
                className="text-xl font-playfair"
                style={{ fontStyle: "italic", color: "#1a1a14" }}
              >
                {person.name}
              </h2>
              <p className="text-sm text-[#999]">
                {person.occupation} · {person.age} ·{" "}
                <span className="font-playfair" style={{ fontStyle: "italic" }}>
                  {ageQuip(person.age)}
                </span>
              </p>
            </div>
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center"
              style={{ background: "#1a1a14" }}
            >
              <span className="text-white text-xs">✓</span>
            </div>
          </div>

          {/* Complete the set */}
          {suggestions.length > 0 && (
            <div className="mt-4 mb-2">
              <p className="text-xs text-[#999] mb-3 uppercase tracking-wider">
                Complete the {person.group} set
              </p>

              <div className="space-y-2">
                {suggestions.map((sug) => {
                  const isSelected = selected.has(sug.id);
                  const isSparkled = sparkled === sug.id;

                  return (
                    <button
                      key={sug.id}
                      onClick={() => toggle(sug.id)}
                      className="flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-left transition-colors"
                      style={{
                        background: isSelected ? "#1a1a14" : "#f8f8f6",
                        border: `1px solid ${isSelected ? "#1a1a14" : "#e8e4dc"}`,
                      }}
                    >
                      <div className="relative">
                        <SmallAvatar p={sug} size={40} />
                        <SparkleRing active={isSparkled} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: isSelected ? "#fff" : "#1a1a14" }}
                        >
                          {sug.name}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: isSelected ? "#888" : "#999" }}
                        >
                          {sug.occupation} · {sug.age}
                        </p>
                      </div>
                      <div
                        className="h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: isSelected ? "#fff" : "#ccc",
                          background: isSelected ? "#fff" : "transparent",
                        }}
                      >
                        {isSelected && (
                          <span style={{ color: "#1a1a14", fontSize: 12 }}>✓</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Basket summary */}
          {total > 0 && (
            <div className="mt-4 pt-4 border-t border-[#f0ede8]">
              <div className="flex items-center gap-2 mb-4">
                {/* Stacked mini avatars */}
                <div className="flex -space-x-2">
                  {allSelected.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="h-6 w-6 rounded-full border-2 border-white overflow-hidden"
                    >
                      <InitialsAvatar name={p.name} size={24} />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#5a5850]">
                  {total} {total === 1 ? "person" : "people"} · ${total}
                </p>
              </div>

              <button
                onClick={() => onConfirm(Array.from(selected))}
                className="w-full rounded-xl py-4 text-sm font-semibold"
                style={{ background: "#c0392b", color: "#fff" }}
              >
                Watch {total === 1 ? "them" : `all ${total}`} · ${total}
              </button>
            </div>
          )}

          <button
            onClick={onDismiss}
            className="w-full text-center mt-4 text-xs text-[#ccc]"
          >
            maybe later
          </button>
        </div>
      </div>
    </>
  );
}
