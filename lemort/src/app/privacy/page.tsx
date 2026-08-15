import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Les Morts",
  description: "What we collect, what we do with it, and what we don't do with it. It's short.",
};

export default function PrivacyPage() {
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

        <h1 className="font-serif text-2xl font-bold text-[#1a1a14] mb-2">Privacy Policy</h1>
        <p className="text-xs text-[#999] mb-10">Effective date: August 2026 &nbsp;·&nbsp; HollyV, LLC &nbsp;·&nbsp; Colorado</p>

        <div className="space-y-8 text-sm text-[#444] leading-relaxed">

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">The short version</h2>
            <p>
              We collect the minimum necessary to run this service. We don&rsquo;t sell it,
              share it with advertisers, or use it to build a profile of you.
              You&rsquo;re here to be notified when someone dies, not to be monetized.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">What we collect</h2>
            <ul className="space-y-4 list-none">
              <li>
                <strong className="text-[#1a1a14] block mb-1">Email address</strong>
                Required. Used to send you death notifications and the occasional service update.
                That&rsquo;s all it&rsquo;s used for.
              </li>
              <li>
                <strong className="text-[#1a1a14] block mb-1">Phone number</strong>
                Optional. Only collected if you choose SMS notifications.
                Used solely to send you texts when someone on your watchlist dies.
              </li>
              <li>
                <strong className="text-[#1a1a14] block mb-1">Payment information</strong>
                We don&rsquo;t store your card details. Payment is processed by Stripe,
                who have their own{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1a1a14] underline underline-offset-2 hover:opacity-60 transition-opacity">
                  privacy policy
                </a>
                {" "}and are very serious about it.
                We retain a Stripe transaction ID to confirm your payment — that&rsquo;s it.
              </li>
              <li>
                <strong className="text-[#1a1a14] block mb-1">Your watchlist</strong>
                We store which public figures you&rsquo;ve paid to watch.
                This is what makes the service work.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">What we don&rsquo;t collect</h2>
            <ul className="space-y-2 list-none">
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Browsing behavior, cookies, or tracking pixels.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Location data beyond what&rsquo;s implicit in your IP (which we don&rsquo;t log).</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Anything we don&rsquo;t need. We&rsquo;re a small operation. Data is a liability, not an asset, as far as we&rsquo;re concerned.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">How we use it</h2>
            <ul className="space-y-2 list-none">
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>To send death notifications — the thing you paid for.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>To send follow-confirmation emails when you add someone to your watchlist.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>To communicate material changes to the service.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span>Nothing else. We&rsquo;re not subtle about this.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Who we share it with</h2>
            <p>
              Nobody, for commercial purposes. We use a small number of third-party services
              to operate:
            </p>
            <ul className="space-y-2 list-none mt-3">
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span><strong className="text-[#1a1a14]">Stripe</strong> — payment processing.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span><strong className="text-[#1a1a14]">Knock</strong> — notification delivery (email and SMS).</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span><strong className="text-[#1a1a14]">Supabase</strong> — database hosting.</li>
              <li className="flex gap-2"><span className="text-[#bbb] flex-shrink-0">—</span><strong className="text-[#1a1a14]">Netlify</strong> — application hosting.</li>
            </ul>
            <p className="mt-3">
              Each of these providers receives only the data necessary to perform their function.
              We&rsquo;re not broadcasting your watchlist to anyone.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Data retention</h2>
            <p>
              We keep your data for as long as your account is active. If you ask us to delete it,
              we will. Your watchlist, your email, your phone number — gone.
              We&rsquo;ll retain anonymized transaction records as required by law,
              but nothing that identifies you.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Unsubscribing</h2>
            <p>
              Every notification includes an unsubscribe link. Click it and we&rsquo;ll stop emailing you.
              No dark patterns, no confirmation loops, no &ldquo;are you sure?&rdquo; modals.
              One click. Done. We held up our end anyway.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Colorado privacy rights</h2>
            <p>
              If you&rsquo;re a Colorado resident, you have rights under the Colorado Privacy Act —
              including the right to access, correct, delete, and opt out of the sale of your personal data.
              We don&rsquo;t sell personal data, so the last one is moot. For the others,{" "}
              <a href="mailto:hello@lesmorts.org" className="text-[#1a1a14] underline underline-offset-2 hover:opacity-60 transition-opacity">
                email us
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#999] mb-3">Contact</h2>
            <p>
              Privacy questions, deletion requests, existential concerns:{" "}
              <a href="mailto:hello@lesmorts.org" className="text-[#1a1a14] underline underline-offset-2 hover:opacity-60 transition-opacity">
                hello@lesmorts.org
              </a>
              <br />
              <span className="text-[#bbb]">HollyV, LLC &nbsp;·&nbsp; Colorado, USA</span>
            </p>
          </section>

        </div>

        <div className="mt-14 pt-8 border-t border-[#e8e4dc] flex gap-6 text-xs text-[#bbb]">
          <Link href="/terms" className="hover:text-[#999] transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-[#999] transition-colors">lesmorts.org</Link>
        </div>

      </div>
    </div>
  );
}
