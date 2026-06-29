"use client";

import { useState } from "react";
import type { MockPerson } from "@/lib/mock-data";
import { ageQuip, getDeadQuip, formatDiedAt } from "@/lib/quips";
import CameoAvatar from "./CameoAvatar";

type PillState = "watch" | "watching" | "notified" | "missed";

function getPillState(person: MockPerson, isWatching: boolean): PillState {
  if (person.status === "dead" && isWatching) return "notified";
  if (person.status === "dead" && !isWatching) return "missed";
  if (isWatching) return "watching";
  return "watch";
}

const PILL_STYLES: Record<PillState, React.CSSProperties> = {
  watch:    { background: "#1a1a14", color: "#f0ede6" },
  watching: { background: "#f0ede8", border: "1px solid #ddd8ce", color: "#888" },
  notified: { background: "#3a3830", color: "#8a8878" },
  missed:   { background: "#1e1d1a", border: "1px solid #2e2d28", color: "#5a5850" },
};

const PILL_LABELS: Record<PillState, string> = {
  watch:    "Watch · $1",
  watching: "Watching",
  notified: "Notified ✓",
  missed:   "Missed it · $1",
};

interface PersonCardProps {
  person: MockPerson;
  isFollowing: boolean;
  onFollow: (person: MockPerson) => void;
}

export default function PersonCard({ person, isFollowing, onFollow }: PersonCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isDead = person.status === "dead";
  const pill = getPillState(person, isFollowing);

  const photo = person.photo && !imgErr ? person.photo : null;

  return (
    <button
      onClick={() => onFollow(person)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-2 w-full text-left"
      style={{
        background: isDead ? "#252420" : "#ffffff",
        border: `1px solid ${isDead ? "#1a1916" : "#e8e4dc"}`,
        transform: pressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.15s",
        cursor: "pointer",
      }}
    >
      <CameoAvatar
        gender={person.gender}
        size={48}
        dimmed={isDead}
        photo={photo}
      />

      <div className="flex-1 min-w-0">
        <p
          className="font-semibold truncate"
          style={{ color: isDead ? "#9a9688" : "#1a1a14" }}
        >
          {person.name}
        </p>
        <p className="text-xs truncate" style={{ color: isDead ? "#5a5850" : "#999" }}>
          {isDead ? (
            <>
              Age {person.age} ·{" "}
              <span className="font-playfair" style={{ fontStyle: "italic" }}>
                {getDeadQuip(person.name)}
              </span>
            </>
          ) : (
            <>
              {person.occupation}
              {person.age ? (
                <>
                  {" "}· {person.age} ·{" "}
                  <span className="font-playfair" style={{ fontStyle: "italic" }}>
                    {ageQuip(person.age)}
                  </span>
                </>
              ) : null}
            </>
          )}
        </p>
        {isDead && person.diedAt && (
          <p className="text-xs mt-0.5" style={{ color: "#4a4840", fontStyle: "italic" }}>
            Departed {formatDiedAt(person.diedAt)}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={PILL_STYLES[pill]}
        >
          {PILL_LABELS[pill]}
        </span>
        {!isDead && (
          <span className="text-[10px] text-[#ccc]">
            {person.watcherCount.toLocaleString()} watching
          </span>
        )}
      </div>
    </button>
  );
}
