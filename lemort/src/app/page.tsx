export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Le Mort
        </p>
        <h1 className="text-6xl font-black tracking-tight text-white">
          Flatlined.
        </h1>
        <p className="mx-auto max-w-sm text-zinc-400">
          Pay once. Get notified the moment they go.
        </p>
      </div>

      <form
        action="/api/search"
        className="flex w-full max-w-md items-center gap-2"
      >
        <input
          name="q"
          type="text"
          placeholder="Search for a person…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-400"
        />
        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          Search
        </button>
      </form>

      <p className="text-xs text-zinc-600">$1 per person · SMS or email</p>
    </main>
  );
}
