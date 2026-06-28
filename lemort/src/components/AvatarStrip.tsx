"use client";

import type { MockPerson } from "@/lib/mock-data";
import CameoAvatar, { InitialsAvatar } from "./CameoAvatar";

interface AvatarStripProps {
  people: MockPerson[];
  onSelect: (person: MockPerson) => void;
}

function concernLevel(person: MockPerson): "elevated" | "normal" {
  return person.age >= 85 ? "elevated" : "normal";
}

export default function AvatarStrip({ people, onSelect }: AvatarStripProps) {
  const alive = people.filter((p) => p.status === "alive");

  if (alive.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-3 px-1 no-scrollbar">
      {alive.map((person) => {
        const concern = concernLevel(person);
        const isDotElevated = concern === "elevated";

        return (
          <button
            key={person.id}
            onClick={() => onSelect(person)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            {/* Avatar with dot ring */}
            <div className="relative">
              <div
                style={{
                  padding: isDotElevated ? 2 : 0,
                  borderRadius: "50%",
                  background: isDotElevated ? "#c0392b" : "transparent",
                }}
              >
                {person.isPrivate ? (
                  <CameoAvatar gender={person.gender} size={44} />
                ) : (
                  <InitialsAvatar name={person.name} size={44} />
                )}
              </div>
              {/* Status dot */}
              <span
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#f8f8f6]"
                style={{
                  background: isDotElevated ? "#c0392b" : "#22c55e",
                }}
              />
            </div>

            <span className="text-[10px] text-[#5a5850] max-w-[48px] text-center leading-tight truncate">
              {person.name.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
