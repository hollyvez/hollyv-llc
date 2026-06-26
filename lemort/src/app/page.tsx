import SearchSection from "@/components/SearchSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="flex flex-col items-center pt-20 pb-10 px-4 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 mb-3">
          Le Mort
        </p>
        <h1 className="text-7xl font-black tracking-tighter text-white leading-none mb-4">
          Flatlined.
        </h1>
        <p className="text-zinc-400 max-w-xs text-sm leading-relaxed">
          Pay $1. Get notified the moment they die.
        </p>
      </div>

      {/* Search */}
      <SearchSection />

      {/* Footer */}
      <p className="text-center text-xs text-zinc-700 py-12">
        SMS · email · $1 per person · no recurring fees
      </p>
    </main>
  );
}
