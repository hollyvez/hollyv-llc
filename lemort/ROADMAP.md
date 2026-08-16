# Les Morts — Roadmap

## 🔴 Blocking (must do before real users)

### Email delivery
1. Sign up at resend.com (free tier)
2. Verify lesmorts.org sending domain in Resend
3. Knock → Settings → Integrations → add Resend, paste API key
4. Update `channel_key` in `scripts/push-knock-templates.mjs` from `knock-email` to Resend channel key
5. Re-run push script to production: `KNOCK_SERVICE_TOKEN=... node scripts/push-knock-templates.mjs --env production`
6. Click Publish on all 3 workflows in Knock Production UI

## 🟡 Soon

- **Customize Stripe receipts** — brand the default Stripe payment receipt email (Stripe Dashboard → Settings → Email receipts)
- **Twilio upgrade** — upgrade Twilio account to use Messaging Service for SMS (better deliverability, required for scale)
- **Sentry** — add error monitoring (post-launch config)

## 🟢 Working
- Auth (magic link → session → redirect)
- Search (Wikidata, sorted by fame/sitelink count)
- Payment (Stripe end to end)
- DB writes (User + Watch records)
- Stripe webhook delivery
- Cron job (hourly death check, GitHub Actions)
- SMS channel (Twilio configured in Knock)
- Rate limiting (search + watch endpoints)
- ToS + Privacy pages
- Mobile layout
