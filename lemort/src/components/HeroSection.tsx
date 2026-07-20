export default function HeroSection() {
  return (
    <header className="pt-12 pb-8 px-5 text-center">
      {/* Logo lockup */}
      <div className="flex items-baseline justify-center gap-3 mb-1">
        <h1
          className="text-5xl font-playfair"
          style={{ fontStyle: "italic", fontWeight: 700, color: "#1a1a14" }}
        >
          Les Morts
        </h1>
        <span
          className="text-xl font-playfair"
          style={{ fontStyle: "italic", fontWeight: 400, color: "#5a5850" }}
        >
          aka Flatlined.
        </span>
      </div>

      {/* Not to be confused */}
      <p
        className="text-xs font-playfair mb-6"
        style={{ fontStyle: "italic", color: "#aaa8a2" }}
      >
        not to be confused with la petite mort
      </p>

      {/* Hero copy */}
      <p className="text-base font-medium text-[#1a1a14] mb-1 leading-snug">
        Pay $1. We watch them. You get on with your life.
      </p>
      <p
        className="text-sm font-playfair mb-3"
        style={{ fontStyle: "italic", color: "#5a5850" }}
      >
        (you get to keep living yours)
      </p>
      <p className="text-xs text-[#999] mb-6">
        Real-time alerts by SMS or email. No subscription. No next of kin required.
      </p>

      {/* Live badge */}
      <div className="flex items-center justify-center gap-1.5">
        <span className="live-dot inline-block h-2 w-2 rounded-full bg-green-500" />
        <span className="text-xs font-medium text-green-600 tracking-wide">
          live updates
        </span>
      </div>
    </header>
  );
}
