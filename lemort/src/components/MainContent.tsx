"use client";

import { useState, useEffect, useRef } from "react";
import { MOCK_PEOPLE, INITIAL_FOLLOWING, type MockPerson } from "@/lib/mock-data";
import PersonCard from "./PersonCard";
import AvatarStrip from "./AvatarStrip";
import LeaderboardTab from "./LeaderboardTab";
import FollowSheet from "./FollowSheet";
import ConfirmationScreen from "./ConfirmationScreen";
import PrivatePersonForm, { type PrivateFormData } from "./PrivatePersonForm";
import PrivateConfirmScreen from "./PrivateConfirmScreen";

type Tab = "following" | "leaderboard";
type SearchPath = "famous" | "private";

export default function MainContent() {
  const [tab, setTab] = useState<Tab>("following");
  const [searchPath, setSearchPath] = useState<SearchPath>("famous");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MockPerson[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [following, setFollowing] = useState<Set<string>>(INITIAL_FOLLOWING);
  const [followSheet, setFollowSheet] = useState<MockPerson | null>(null);
  const [confirmation, setConfirmation] = useState<MockPerson[] | null>(null);

  const [privateFormData, setPrivateFormData] = useState<PrivateFormData | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulated search against mock data
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2 || searchPath === "private") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounce.current = setTimeout(() => {
      const results = MOCK_PEOPLE.filter(
        (p) => !p.isPrivate && p.name.toLowerCase().includes(q)
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 350);
  }, [query, searchPath]);

  const followedPeople = MOCK_PEOPLE.filter((p) => following.has(p.id));
  const livingFirst = [
    ...followedPeople.filter((p) => p.status === "alive"),
    ...followedPeople.filter((p) => p.status === "dead"),
  ];

  const handleFollow = (person: MockPerson) => {
    if (person.status === "dead") return;
    setFollowSheet(person);
  };

  const handleConfirm = (ids: string[]) => {
    const newPeople = MOCK_PEOPLE.filter(
      (p) => ids.includes(p.id) && !following.has(p.id)
    );
    setFollowing((prev) => new Set([...prev, ...ids]));
    setFollowSheet(null);
    setConfirmation(newPeople.length > 0 ? newPeople : [MOCK_PEOPLE.find((p) => p.id === ids[0])!]);
  };

  const handlePrivateSubmit = (data: PrivateFormData) => {
    setPrivateFormData(data);
  };

  const handlePrivateConfirm = () => {
    setPrivateFormData(null);
    setQuery("");
    setTab("following");
    // In real app: trigger Stripe + DB
  };

  const showingSearch = query.trim().length >= 2 && searchPath === "famous";
  const displayList = showingSearch ? searchResults : [];

  return (
    <div className="max-w-md mx-auto px-4 pb-16">
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchPath === "famous" ? "Find someone alive…" : "Full name…"
            }
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
          onConfirm={handlePrivateConfirm}
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

      {/* Follow sheet */}
      {followSheet && (
        <FollowSheet
          person={followSheet}
          following={following}
          onConfirm={handleConfirm}
          onDismiss={() => setFollowSheet(null)}
        />
      )}

      {/* Confirmation screen */}
      {confirmation && (
        <ConfirmationScreen
          people={confirmation}
          onDone={() => { setConfirmation(null); setTab("following"); }}
          onAddMore={() => { setConfirmation(null); setQuery(""); }}
        />
      )}
    </div>
  );
}
