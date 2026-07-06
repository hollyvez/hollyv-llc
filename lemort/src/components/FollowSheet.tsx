"use client";

import { useRef, useState } from "react";
import type { MockPerson } from "@/lib/mock-data";
import { MOCK_PEOPLE } from "@/lib/mock-data";
import { ageQuip, getDeadQuip, formatDiedAt } from "@/lib/quips";
import CameoAvatar from "./CameoAvatar";

interface FollowSheetProps {
  person: MockPerson;
  following: Set<string>;
  onConfirm: (ids: string[]) => void;
  onDismiss: () => void;
}

function fireSparkles(originEl: HTMLElement, container: HTMLElement) {
  const chars = ["✦", "·", "+", "×", "✶"];
  const colors = ["#c0392b", "#b8860b", "#5a9a5a", "#888", "#1a1a14"];
  const rect = originEl.getBoundingClientRect();
  const pRect = container.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position: absolute;
      pointer-events: none;
      font-size: ${14 + Math.random() * 10}px;
      color: ${colors[i % colors.length]};
      left: ${rect.left - pRect.left + rect.width / 2 + (Math.random() - 0.5) * 40}px;
      top: ${rect.top - pRect.top + rect.height / 2 + (Math.random() - 0.5) * 20}px;
      animation: lemort-sparkle 0.8s ease forwards;
      --tx: ${(Math.random() - 0.5) * 70}px;
      --ty: ${-Math.random() * 60 - 10}px;
      z-index: 100;
    `;
    el.textContent = chars[i % chars.length];
    container.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
}

export default function FollowSheet({ person, following, onConfirm, onDismiss }: FollowSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Primary person is always selected; start with only them
  const [selected, setSelected] = useState<Set<string>>(new Set([person.id]));
  const isDead = person.status === "dead";

  const groupMembers = MOCK_PEOPLE.filter(
    (p) => person.groupSuggestions.includes(p.id) && p.id !== person.id
  );

  const toggle = (id: string, btnEl: HTMLElement) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (containerRef.current) fireSparkles(btnEl, containerRef.current);
      }
      return next;
    });
  };

  // New people = selected and not already following
  const newIds = Array.from(selected).filter((id) => !following.has(id) || id === person.id);
  const newCount = newIds.filter((id) => !following.has(id)).length;
  // For basket: count only truly new (not already paid for)
  const basketCount = Array.from(selected).filter((id) => !following.has(id)).length;
  const basketPeople = MOCK_PEOPLE.filter((p) => selected.has(p.id) && !following.has(p.id));

  const handleCta = () => {
    // TODO: wire Stripe — for now confirm directly
    onConfirm(Array.from(selected).filter((id) => !following.has(id)));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-enter"
        style={{ background: "rgba(10,10,8,0.65)" }}
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div
        ref={containerRef}
        className="fixed bottom-0 left-0 right-0 z-50 sheet-enter rounded-t-[20px] overflow-hidden"
        style={{ background: "#f8f8f6", maxHeight: "85vh", overflowY: "auto", position: "relative" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[#e8e4dc]" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Primary person */}
          <div className="flex items-center gap-4 py-4 border-b border-[#f0ede8]">
            <CameoAvatar
              gender={person.gender}
              size={72}
              dimmed={isDead}
              photo={person.photo}
            />
            <div className="flex-1 min-w-0">
              <h2
                className="font-playfair"
                style={{ fontStyle: "italic", fontSize: 22, color: isDead ? "#9a9688" : "#1a1a14" }}
              >
                {person.name}
              </h2>
              <p className="text-sm" style={{ color: "#999" }}>
                Age {person.age} · {person.occupation} ·{" "}
                <span className="font-playfair" style={{ fontStyle: "italic" }}>
                  {isDead ? getDeadQuip(person.name) : ageQuip(person.age)}
                </span>
              </p>
              {isDead && person.diedAt && (
                <p style={{ fontSize: 11, color: "#7a7060", fontStyle: "italic", marginTop: 2 }}>
                  Departed {formatDiedAt(person.diedAt)}
                </p>
              )}
            </div>
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#1a1a14" }}
            >
              <span className="text-white" style={{ fontSize: 12 }}>✓</span>
            </div>
          </div>

          {/* Complete the set */}
          {groupMembers.length > 0 && person.group && (
            <div className="mt-4 mb-2">
              <p
                className="text-center"
                style={{ fontSize: 11, fontWeight: 500, color: "#555", marginBottom: 10 }}
              >
                Complete the {person.group} set
              </p>

              <div className="space-y-2">
                {groupMembers.map((sug) => {
                  const isSelected = selected.has(sug.id);
                  const alreadyWatching = following.has(sug.id);

                  return (
                    <button
                      key={sug.id}
                      disabled={alreadyWatching}
                      onClick={(e) => {
                        if (!alreadyWatching) toggle(sug.id, e.currentTarget);
                      }}
                      onPointerDown={(e) => {
                        if (!alreadyWatching) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)";
                      }}
                      onPointerUp={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                      }}
                      onPointerLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                      }}
                      className="flex items-center gap-3 w-full rounded-[10px] px-4 py-3 text-left"
                      style={{
                        background: isSelected || alreadyWatching ? "#1a1a14" : "#fff",
                        border: `0.5px solid ${isSelected || alreadyWatching ? "#1a1a14" : "#e8e4dc"}`,
                        transition: "background 0.15s, transform 0.15s",
                        cursor: alreadyWatching ? "default" : "pointer",
                      }}
                    >
                      <CameoAvatar
                        gender={sug.gender}
                        size={30}
                        photo={sug.photo}
                        dimmed={sug.status === "dead"}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: isSelected || alreadyWatching ? "#f0ede6" : "#1a1a14" }}
                        >
                          {sug.name}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: isSelected || alreadyWatching ? "#888" : "#999" }}
                        >
                          {sug.occupation} · {sug.age}
                        </p>
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: isSelected || alreadyWatching ? "#f0ede6" : "#1a1a14", flexShrink: 0 }}
                      >
                        {alreadyWatching ? "✓ watching" : isSelected ? "✓ $1" : "+ $1"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Basket — only shown when at least 1 new person */}
          {basketCount > 0 && (
            <div
              className="mt-4 rounded-[10px] px-3 py-3"
              style={{ background: "#1a1a14" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* Stacked mini avatars */}
                  <div className="flex" style={{ marginRight: 4 }}>
                    {basketPeople.slice(0, 4).map((p, i) => (
                      <div
                        key={p.id}
                        style={{ marginLeft: i > 0 ? -8 : 0, zIndex: basketPeople.length - i }}
                      >
                        <CameoAvatar gender={p.gender} size={24} photo={p.photo} />
                      </div>
                    ))}
                  </div>
                  <span style={{ color: "#a0a090", fontSize: 13 }}>
                    <span style={{ color: "#f0ede6" }}>{basketCount} {basketCount === 1 ? "person" : "people"}</span>
                    {" · "}
                    <span style={{ color: "#f0ede6" }}>${basketCount}</span>
                  </span>
                </div>
                <button
                  onClick={handleCta}
                  onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                  onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  className="text-sm font-semibold text-white rounded-[7px] px-3 py-2"
                  style={{ background: "#c0392b", transition: "transform 0.15s", flexShrink: 0 }}
                >
                  Watch them · ${basketCount}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onDismiss}
            className="w-full text-center mt-4"
            style={{ fontSize: 11, color: "#bbb" }}
          >
            maybe later
          </button>
        </div>
      </div>
    </>
  );
}
