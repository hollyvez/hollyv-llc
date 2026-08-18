"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MOCK_PEOPLE, INITIAL_FOLLOWING, type MockPerson } from "@/lib/mock-data";
import PersonCard from "./PersonCard";
import AvatarStrip from "./AvatarStrip";
import LeaderboardTab from "./LeaderboardTab";
import FollowSheet from "./FollowSheet";
import PrivatePersonForm, { type PrivateFormData } from "./PrivatePersonForm";
import PrivateConfirmScreen from "./PrivateConfirmScreen";
import AuthModal from "./AuthModal";
import { useSession } from "@/lib/useSession";
import { createClient } from "@/lib/supabase/client";

function calcAge(dob: string): number {
  const d = new Date(dob.replace(" ", "T"));
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

type Tab = "following" | "leaderboard";
type SearchPath = "famous" | "private";

export default function MainContent() {
  const { user, loading: sessionLoading } = useSession();
  const [showAuth, setShowAuth] = useState(false);
  const [pendingPerson, setPendingPerson] = useState<MockPerson | null>(null);

  const [tab, setTab] = useState<Tab>("following");
  const [searchPath, setSearchPath] = useState<SearchPath>("famous");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MockPerson[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [following, setFollowing] = useState<Set<string>>(new Set());
  // Wikidata people who've been followed — not in MOCK_PEOPLE
  const [watchedReal, setWatchedReal] = useState<MockPerson[]>([]);
  const [followSheet, setFollowSheet] = useState<MockPerson | null>(null);

  const [privateFormData, setPrivateFormData] = useState<PrivateFormData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load watches from DB when user signs in
  useEffect(() => {
    if (!user) return;
    fetch("/api/watches")
      .then((r) => r.json())
      .then((data: {
        personIds: string[];
        persons?: {
          wikidataId: string; name: string; photo: string | null;
          gender: "man" | "woman"; watcherCount: number;
          isDeceased: boolean; dob: string | null; diedAt: string | null;
        }[];
      }) => {
        if (data.personIds?.length) {
          setFollowing((prev) => new Set(Array.from(prev).concat(data.personIds)));
        }
        if (data.persons?.length) {
          setWatchedReal((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const incoming = data.persons!
              .filter((p) => !existingIds.has(p.wikidataId))
              .map((p) => ({
                id: p.wikidataId,
                wikidataId: p.wikidataId,
                name: p.name,
                photo: p.photo,
                gender: p.gender,
                watcherCount: p.watcherCount,
                status: (p.isDeceased ? "dead" : "alive") as "alive" | "dead",
                diedAt: p.diedAt,
                age: p.dob ? calcAge(p.dob) : 0,
                occupation: "Public figure",
                nationality: "",
                isPrivate: false,
                notified: false,
                followedAt: "",
                group: "",
                groupSuggestions: [],
              }));
            return [...prev, ...incoming];
          });
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Live search via Wikidata API
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = query.trim();
    if (!q || q.length < 3 || searchPath === "private") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        // Map API results to MockPerson shape for display
        const results: MockPerson[] = (data.results ?? []).map(
          (r: {
            wikidataId: string;
            name: string;
            age: number | null;
            dateOfBirth: string | null;
            photo: string | null;
            gender: "man" | "woman";
            occupation: string | null;
            nationality: string | null;
          }) => ({
            id: r.wikidataId,
            name: r.name,
            age: r.age ?? 0,
            photo: r.photo,
            occupation: r.occupation ?? "Public figure",
            nationality: r.nationality ?? "",
            isPrivate: false,
            gender: r.gender ?? ("man" as const),
            status: "alive" as const,
            watcherCount: 0,
            diedAt: null,
            notified: false,
            followedAt: "",
            wikidataId: r.wikidataId,
            dateOfBirth: r.dateOfBirth ?? null,
            group: "",
            groupSuggestions: [],
          })
        );
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 700);
  }, [query, searchPath]);

  const allKnownPeople = [...MOCK_PEOPLE, ...watchedReal];
  const followedPeople = allKnownPeople.filter((p) => following.has(p.id));
  const livingFirst = [
    ...followedPeople.filter((p) => p.status === "alive"),
    ...followedPeople.filter((p) => p.status === "dead"),
  ];

  // When user signs in after being prompted, open the sheet they wanted
  useEffect(() => {
    if (user && pendingPerson) {
      setFollowSheet(pendingPerson);
      setPendingPerson(null);
      setShowAuth(false);
    }
  }, [user, pendingPerson]);

  const handleFollow = (person: MockPerson) => {
    if (sessionLoading) return; // wait for session to resolve
    if (!user) {
      setPendingPerson(person);
      setShowAuth(true);
      return;
    }
    setFollowSheet(person);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  const handleConfirm = (ids: string[]) => {
    if (ids.length === 0) { setFollowSheet(null); return; }
    // Capture any Wikidata search results being followed for the first time
    const newRealPeople = searchResults.filter(
      (p) => ids.includes(p.id) && !following.has(p.id)
    );
    if (newRealPeople.length > 0) {
      setWatchedReal((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        // Bump watcherCount by 1 for newly watched people
        return [...prev, ...newRealPeople.filter((p) => !existingIds.has(p.id)).map((p) => ({ ...p, watcherCount: p.watcherCount + 1 }))];
      });
    }
    const newPeople = allKnownPeople.filter(
      (p) => ids.includes(p.id) && !following.has(p.id)
    );
    setFollowing((prev) => new Set(Array.from(prev).concat(ids)));
    setFollowSheet(null);
    setQuery("");
    setTab("following");
    if (newPeople.length > 0) {
      const firstName = newPeople[0].name.split(" ")[0];
      const msg = newPeople.length === 1
        ? `Watching ${firstName}. We'll let you know first.`
        : `Watching ${newPeople.length} people. We've got eyes on them.`;
      showToast(msg);
    }
  };

  const handlePrivateSubmit = (data: PrivateFormData) => {
    setPrivateFormData(data);
  };

  const handlePrivateConfirm = () => {
    const name = privateFormData?.name.split(" ")[0] ?? "them";
    setPrivateFormData(null);
    setQuery("");
    setSearchPath("famous");
    setTab("following");
    showToast(`Watching ${name}. We check weekly. We'll tell you first.`);
  };

  const showingSearch = query.trim().length >= 3 && searchPath === "famous";
  const displayList = showingSearch ? searchResults : [];

  return (
    <div className="max-w-md mx-auto px-4 pb-16">
      {/* Auth bar */}
      {!sessionLoading && (
        <div className="flex justify-end mb-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#999" }}>{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-xs"
                style={{ color: "#bbb" }}
              >
                sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="text-xs font-medium"
              style={{ color: "#5a5850" }}
            >
              sign in
            </button>
          )}
        </div>
      )}

      {/* Search bar */}
      <div className="mb-4">
        <div className={`relative${searchPath === "private" ? " hidden" : ""}`}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find someone alive…"
            className="w-full rounded-2xl border border-[#e8e4dc] bg-white px-5 py-4 text-sm text-[#1a1a14] placeholder-[#ccc] outline-none focus:border-[#5a5850] transition-colors"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e8e4dc] border-t-[#5a5850]" />
            </div>
          )}
          {query.length > 0 && !isSearching && (
            <button
              onClick={() => { setQuery(""); setPrivateFormData(null); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#999] text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Path toggle */}
        <div className="flex gap-3 mt-2 px-1">
          <button
            onClick={() => { setSearchPath("famous"); setPrivateFormData(null); }}
            className="text-xs transition-colors"
            style={{ color: searchPath === "famous" ? "#1a1a14" : "#ccc", fontWeight: searchPath === "famous" ? 600 : 400 }}
          >
            Public figure
          </button>
          <span className="text-xs text-[#e8e4dc]">·</span>
          <button
            onClick={() => { setSearchPath("private"); setSearchResults([]); }}
            className="text-xs transition-colors"
            style={{ color: searchPath === "private" ? "#1a1a14" : "#ccc", fontWeight: searchPath === "private" ? 600 : 400 }}
          >
            Private person
          </button>
        </div>
      </div>

      {/* Private individual path */}
      {searchPath === "private" && !privateFormData && (
        <PrivatePersonForm onSubmit={handlePrivateSubmit} />
      )}
      {searchPath === "private" && privateFormData && (
        <PrivateConfirmScreen
          data={privateFormData}
          userEmail={user?.email ?? undefined}
          onSuccess={handlePrivateConfirm}
          onBack={() => setPrivateFormData(null)}
        />
      )}

      {/* Famous person search results */}
      {searchPath === "famous" && showingSearch && (
        <div className="mb-4">
          {searchResults.length === 0 && !isSearching && (
            <p className="text-center text-sm text-[#ccc] py-6">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {searchResults.map((p) => (
            <PersonCard
              key={p.id}
              person={p}
              isFollowing={following.has(p.id)}
              onFollow={handleFollow}
            />
          ))}
        </div>
      )}

      {/* Tabs — only when not searching */}
      {!showingSearch && searchPath === "famous" && (
        <>
          <div className="flex gap-6 mb-4 border-b border-[#e8e4dc]">
            {(["following", "leaderboard"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="pb-2 text-sm font-medium capitalize transition-colors relative"
                style={{ color: tab === t ? "#1a1a14" : "#ccc" }}
              >
                {t === "following" ? "Following" : "Leaderboard"}
                {tab === t && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "#1a1a14" }}
                  />
                )}
              </button>
            ))}
          </div>

          {tab === "following" && (
            <>
              <AvatarStrip
                people={followedPeople}
                onSelect={handleFollow}
              />
              <div className="mt-4 space-y-0">
                {livingFirst.length === 0 ? (
                  <p className="text-center text-sm text-[#ccc] py-10">
                    No one yet.{" "}
                    <span className="font-playfair" style={{ fontStyle: "italic" }}>
                      Find someone alive to follow.
                    </span>
                  </p>
                ) : (
                  livingFirst.map((p) => (
                    <PersonCard
                      key={p.id}
                      person={p}
                      isFollowing={true}
                      onFollow={handleFollow}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {tab === "leaderboard" && (
            <LeaderboardTab people={MOCK_PEOPLE} onSelect={handleFollow} />
          )}
        </>
      )}

      {/* Auth modal */}
      {showAuth && (
        <AuthModal onDismiss={() => { setShowAuth(false); setPendingPerson(null); }} />
      )}

      {/* Follow sheet */}
      {followSheet && (
        <FollowSheet
          person={followSheet}
          following={following}
          userEmail={user?.email ?? undefined}
          onConfirm={handleConfirm}
          onDismiss={() => setFollowSheet(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg"
          style={{
            background: "#1a1a14",
            color: "#f0ede6",
            whiteSpace: "nowrap",
            animation: "lemort-toast-in 0.3s ease",
          }}
        >
          {toast}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pb-6 text-center" style={{ fontSize: 10, color: "#ccc" }}>
        <a href="/terms" style={{ color: "#bbb", textDecoration: "underline" }}>Terms</a>
        {" · "}
        <a href="/privacy" style={{ color: "#bbb", textDecoration: "underline" }}>Privacy</a>
        {" · "}
        <span>© 2025 HollyV, LLC</span>
      </div>
    </div>
  );
}
