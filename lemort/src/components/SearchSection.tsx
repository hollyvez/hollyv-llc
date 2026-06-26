"use client";

import { useState, useEffect, useRef } from "react";
import PersonCard from "./PersonCard";

export interface SearchResult {
  wikidataId: string;
  name: string;
  dateOfBirth: string | null;
  age: number | null;
  photo: string | null;
  occupation: string | null;
  nationality: string | null;
}

type Status = "idle" | "loading" | "done" | "error";

export default function SearchSection() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.results ?? []);
        setStatus("done");
      } catch {
        setStatus("error");
      }
    }, 400);
  }, [query]);

  return (
    <div className="px-4 max-w-2xl mx-auto w-full">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anyone…"
          autoFocus
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-base text-white placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors pr-12"
        />
        {status === "loading" && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          </div>
        )}
        {query.length > 0 && status !== "loading" && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Results */}
      <div className="mt-4 space-y-2">
        {status === "error" && (
          <p className="text-center text-sm text-red-500 py-6">
            Search failed. Try again.
          </p>
        )}

        {status === "done" && results.length === 0 && (
          <p className="text-center text-sm text-zinc-600 py-6">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        {results.map((person) => (
          <PersonCard key={person.wikidataId} person={person} />
        ))}
      </div>

      {/* Hint */}
      {status === "idle" && query.length === 0 && (
        <p className="text-center text-xs text-zinc-700 mt-6">
          Try &ldquo;Taylor Swift&rdquo;, &ldquo;Elon Musk&rdquo;, or any public figure
        </p>
      )}
    </div>
  );
}
