"use client";

import { useState } from "react";
import type { MockPerson } from "@/lib/mock-data";
import { ageQuip, deadQuip, formatDiedAt } from "@/lib/quips";
import CameoAvatar from "./CameoAvatar";

interface PersonCardProps {
  person: MockPerson;
  isFollowing: boolean;
  onFollow: (person: MockPerson) => void;
}

export default function PersonCard({ person, isFollowing, onFollow }: PersonCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const isDead = person.status === "dead";

  const Avatar = () => {
    if (person.isPrivate) {
      return <CameoAvatar gender={person.gender} size={48} dimmed={isDead} />;
    }
    if (person.photo && !imgErr) {
      return (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            filter: isDead ? "grayscale(100%) brightness(0.45)" : undefined,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.photo}
            alt={person.name}
            width={48}
            height={48}
            style={{ width: 48, height: 48, objectFit: "cover" }}
            onError={() => setImgErr(true)}
          />
        </div>
      );
    }
    return <CameoAvatar gender={person.gender} size={48} dimmed={isDead} />;
  };

  if (isDead) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-2"
        style={{
          background: "#252420",
          border: "1px solid #1a1916",
        }}
      >
        <Avatar />

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: "#9a9688" }}>
            {person.name}
          </p>
          <p className="text-xs truncate" style={{ color: "#5a5850" }}>
            Age {person.age} ·{" "}
            <span className="font-playfair" style={{ fontStyle: "italic" }}>
              {deadQuip(person.age)}
            </span>
          </p>
          {person.diedAt && (
            <p className="text-xs mt-0.5" style={{ color: "#4a4840" }}>
              Departed {formatDiedAt(person.diedAt)}
            </p>
          )}
        </div>

        <div>
          {person.notified ? (
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ background: "#2e2c28", color: "#6a6860" }}
            >
              Notified ✓
            </span>
          ) : (
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ background: "#1e1c18", color: "#4a4840" }}
            >
              Missed it · $1
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onFollow(person)}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-2 w-full text-left transition-shadow hover:shadow-md"
      style={{
        background: "#ffffff",
        border: "1px solid #e8e4dc",
      }}
    >
      <Avatar />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#1a1a14] truncate">{person.name}</p>
        <p className="text-xs text-[#999] truncate">
          {person.occupation}
          {person.age ? (
            <>
              {" "}· {person.age} ·{" "}
              <span className="font-playfair" style={{ fontStyle: "italic" }}>
                {ageQuip(person.age)}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {isFollowing ? (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ background: "#f0ede8", color: "#999" }}
          >
            Watching
          </span>
        ) : (
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: "#1a1a14", color: "#fff" }}
          >
            Follow · $1
          </span>
        )}
        <span className="text-[10px] text-[#ccc]">
          {person.watcherCount.toLocaleString()} watching
        </span>
      </div>
    </button>
  );
}
