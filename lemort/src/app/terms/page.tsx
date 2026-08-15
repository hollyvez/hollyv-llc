import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service · Les Morts",
  description: "The legal arrangement between you and us. It's short. We're not lawyers, but we did hire one.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f6] px-6 py-16">
      <div className="max-w-xl mx-auto">

        <div className="mb-10">
          <Link href="/" className="font-serif italic text-2xl text-[#1a1a14] hover:opacity-70 transition-opacity">
            Les Morts
          </Link>
          <span className="font-serif italic text-xs text-[#bbb] ml-2">aka Flatlined.</span>
          <p className="font-serif italic text-[10px] text-[#ccc] mt-1">not to be confused with la petite mort</p>
        </div>

        <h1 className="font-serif text-2xl font-bold text-[#1a1a14] mb-2">Terms of Service</h1>
        <p className="text-xs text-[#999] mb-10">Effective date: August 2026 &nbsp;·&nbsp; HollyV, LLC &nbsp;·&nbsp; Colorado</p>

        <div className="space-y-8 text-sm text-[#444] leading-relaxed">

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">What this is</h2>
            <p>
              Les Morts (also known as Flatlined) is a service that monitors public figures and notifies you when they die.
              That&rsquo;s it. We don&rsquo;t editorialize, eulogize, or celebrate. We watch. You live your life.
              When something happens, we tell you.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">The transaction</h2>
            <p>
              You pay $1 per person, per watch. In exchange, we notify you when that person dies — by email,
              or by SMS if you provided a phone number. One dollar. One notification. That&rsquo;s the whole deal.
            </p>
            <p className="mt-3">
              <strong className="text-[#1a1a14]">Refunds.</strong> There are none. The $1 is non-refundable, obviously.
              You&rsquo;re not paying for a guarantee that the person will die during your subscription —
              you&rsquo;re paying for us to watch. We watch regardless of outcome. The universe handles the rest.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">What we do</h2>
            <ul className="space-y-2 list-none">
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Monitor public records and Wikipedia for deaths of people on your watchlist.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Send you a notification when a death is confirmed via a reliable public source.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Try very hard not to be weird about it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">What we don&rsquo;t do</h2>
            <ul className="space-y-2 list-none">
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Guarantee timing. We check hourly. Breaking news moves faster than we do sometimes.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Monitor private individuals. Public figures only — people with a verifiable Wikipedia presence.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Sell your data. We have no interest in your email beyond sending you death notifications. That sentence sounds worse than it is.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Promise the service will run forever. We&rsquo;ll do our best. If we shut down, we&rsquo;ll let you know.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Acceptable use</h2>
            <p>
              Use this service for personal, non-commercial curiosity. Don&rsquo;t use it to harass anyone,
              build competing products, scrape our data, or do anything a reasonable person would find troubling.
              We reserve the right to terminate accounts that misuse the service, at our sole discretion,
              with no refund. (See: refund policy, above.)
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Limitation of liability</h2>
            <p>
              Les Morts is provided &ldquo;as is.&rdquo; HollyV, LLC is not liable for missed notifications,
              delayed notifications, incorrect information sourced from third parties (Wikipedia, Wikidata),
              or any decisions you make based on information received through this service.
              Our maximum liability to you, for any reason, is the amount you paid us. That&rsquo;s $1.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Governing law</h2>
            <p>
              These terms are governed by the laws of the State of Colorado. Any disputes will be resolved
              in Colorado courts. We hope it never comes to that. It&rsquo;s $1.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Changes</h2>
            <p>
              We may update these terms occasionally. If we make material changes, we&rsquo;ll notify you
              by email. Continuing to use the service after that constitutes acceptance.
              You&rsquo;ve read longer terms for free apps. This one cost you a dollar. Feels fair.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Contact</h2>
            <p>
              Questions? Concerns? Philosophical objections to the premise?{" "}
              <a href="mailto:hello@lesmorts.org" className="text-[#1a1a14] underline underline-offset-2 hover:opacity-60 transition-opacity">
                hello@lesmorts.org
              </a>
            </p>
          </section>

        </div>

        <div className="mt-14 pt-8 border-t border-[#e8e4dc] flex gap-6 text-xs text-[#bbb]">
          <Link href="/privacy" className="hover:text-[#999] transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-[#999] transition-colors">lesmorts.org</Link>
        </div>

      </div>
    </div>
  );
}
