import type { MockPerson } from "@/lib/mock-data";
import { formatDiedAt } from "@/lib/quips";
import { InitialsAvatar } from "./CameoAvatar";
import CameoAvatar from "./CameoAvatar";

interface LeaderboardTabProps {
  people: MockPerson[];
  onSelect: (person: MockPerson) => void;
}

const RANK_STYLES: Record<number, { color: string; label: string }> = {
  1: { color: "#b8962e", label: "①" },
  2: { color: "#8a8a8a", label: "②" },
  3: { color: "#8b5e3c", label: "③" },
};

export default function LeaderboardTab({ people, onSelect }: LeaderboardTabProps) {
  const sorted = [...people].sort((a, b) => b.watcherCount - a.watcherCount);

  return (
    <div className="space-y-2">
      {sorted.map((person, i) => {
        const rank = i + 1;
        const rankStyle = RANK_STYLES[rank];
        const isDead = person.status === "dead";

        return (
          <button
            key={person.id}
            onClick={() => !isDead && onSelect(person)}
            className="flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-left transition-shadow"
            style={{
              background: isDead ? "#252420" : "#ffffff",
              border: `1px solid ${isDead ? "#1a1916" : "#e8e4dc"}`,
            }}
          >
            {/* Rank */}
            <span
              className="text-lg font-black w-6 text-center flex-shrink-0"
              style={{ color: rankStyle ? rankStyle.color : "#ccc" }}
            >
              {rankStyle ? rankStyle.label : rank}
            </span>

            {/* Avatar */}
            {person.isPrivate ? (
              <CameoAvatar gender={person.gender} size={40} dimmed={isDead} />
            ) : (
              <InitialsAvatar name={person.name} size={40} dimmed={isDead} />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-sm truncate"
                style={{ color: isDead ? "#9a9688" : "#1a1a14" }}
              >
                {person.name}
              </p>
              <p className="text-xs truncate" style={{ color: isDead ? "#5a5850" : "#999" }}>
                {isDead && person.diedAt
                  ? `Departed ${formatDiedAt(person.diedAt)}`
                  : person.occupation}
              </p>
            </div>

            {/* Watcher count */}
            <div className="text-right flex-shrink-0">
              <p
                className="text-sm font-bold"
                style={{ color: isDead ? "#5a5850" : "#1a1a14" }}
              >
                {person.watcherCount.toLocaleString()}
              </p>
              <p className="text-[10px]" style={{ color: isDead ? "#3a3830" : "#ccc" }}>
                watching
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
