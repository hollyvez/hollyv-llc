"use client";

import { useEffect, useRef } from "react";
import type { MockPerson } from "@/lib/mock-data";
import CameoAvatar from "./CameoAvatar";

interface ConfirmationScreenProps {
  people: MockPerson[];
  onDone: () => void;
  onAddMore: () => void;
}

function fireConfirmSparkles(container: HTMLElement) {
  const chars = ["✦", "·", "+", "×", "✶"];
  const colors = ["#c0392b", "#b8860b", "#5a9a5a", "#888", "#1a1a14"];
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const el = document.createElement("div");
      el.style.cssText = `
        position: absolute;
        pointer-events: none;
        font-size: ${14 + Math.random() * 12}px;
        color: ${colors[i % colors.length]};
        left: ${Math.random() * w}px;
        top: ${Math.random() * h * 0.6}px;
        animation: lemort-sparkle 0.9s ease forwards;
        --tx: ${(Math.random() - 0.5) * 80}px;
        --ty: ${-Math.random() * 70 - 10}px;
        z-index: 10;
      `;
      el.textContent = chars[i % chars.length];
      container.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    }, i * 60);
  }
}

function notifySubcopy(people: MockPerson[]): string {
  if (people.length === 1) return `we'll notify you the moment ${people[0].name.split(" ")[0]} dies.`;
  if (people.length === 2) return `we'll notify you the moment ${people[0].name.split(" ")[0]} and ${people[1].name.split(" ")[0]} die.`;
  return "we'll notify you the moment any of them die.";
}

export default function ConfirmationScreen({ people, onDone, onAddMore }: ConfirmationScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) fireConfirmSparkles(containerRef.current);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-enter"
        style={{ background: "rgba(26,26,20,0.7)" }}
      />

      {/* Card */}
      <div
        ref={containerRef}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-3xl p-7 confirm-enter text-center overflow-hidden"
        style={{ background: "#fff", position: "fixed" }}
      >
        {/* Stacked avatars */}
        <div className="flex justify-center mb-6" style={{ marginLeft: 10 }}>
          {people.slice(0, 5).map((p, i) => (
            <div
              key={p.id}
              className="rounded-full border-[3px] border-white"
              style={{ marginLeft: i > 0 ? -10 : 0, zIndex: people.length - i }}
            >
              <CameoAvatar gender={p.gender} size={44} photo={p.photo} />
            </div>
          ))}
          {people.length > 5 && (
            <div
              className="rounded-full border-[3px] border-white flex items-center justify-center text-xs font-semibold"
              style={{ width: 44, height: 44, marginLeft: -10, background: "#e8e4dc", color: "#5a5850" }}
            >
              +{people.length - 5}
            </div>
          )}
        </div>

        <h2
          className="font-playfair mb-2"
          style={{ fontStyle: "italic", fontSize: 22, color: "#1a1a14" }}
        >
          You&apos;re watching {people.length} {people.length === 1 ? "person" : "more people"}.
        </h2>

        <p
          className="font-playfair mb-1"
          style={{ fontStyle: "italic", fontSize: 13, color: "#5a5850" }}
        >
          {notifySubcopy(people)}
        </p>
        <p
          className="font-playfair mb-5"
          style={{ fontStyle: "italic", fontSize: 13, color: "#aaa" }}
        >
          try not to check too often.
        </p>

        <p className="mb-6" style={{ fontSize: 11, color: "#ccc" }}>
          ${people.length} charged · alerts via email or SMS · no further charges
        </p>

        <button
          onClick={onDone}
          onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          className="w-full rounded-xl py-4 text-sm font-semibold mb-3"
          style={{ background: "#1a1a14", color: "#fff", transition: "transform 0.15s" }}
        >
          back to the living
        </button>

        <button
          onClick={onAddMore}
          className="w-full"
          style={{ fontSize: 11, color: "#c0392b" }}
        >
          add more subjects
        </button>
      </div>
    </>
  );
}
