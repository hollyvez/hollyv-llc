"use client";

import { useState } from "react";
import Image from "next/image";
import type { SearchResult } from "./SearchSection";

export default function PersonCard({ person }: { person: SearchResult }) {
  const [following, setFollowing] = useState(false);
  const [imgError, setImgError] = useState(false);

  const initials = person.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 hover:border-zinc-700 transition-colors">
      {/* Avatar */}
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-zinc-800">
        {person.photo && !imgError ? (
          <Image
            src={person.photo}
            alt={person.name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-400">
            {initials}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{person.name}</p>
        <p className="text-xs text-zinc-500 truncate">
          {[
            person.occupation,
            person.nationality,
            person.age != null ? `${person.age} yrs` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => setFollowing((f) => !f)}
        className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
          following
            ? "bg-zinc-800 text-zinc-400 hover:bg-red-950 hover:text-red-400"
            : "bg-white text-black hover:bg-zinc-200"
        }`}
      >
        {following ? "Following" : "Follow · $1"}
      </button>
    </div>
  );
}
