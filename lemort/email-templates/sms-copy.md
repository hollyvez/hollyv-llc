# Les Morts — SMS Copy

All messages target a single GSM-7 segment (≤160 chars) with typical variable lengths. Char counts below assume "Warren Buffett" / "95" as worst-ish-case fill. Sender name: LESMORTS (alpha sender where supported).

Variables: `{{name}}`, `{{age}}`, `{{quip}}` (live quip), `{{deathQuip}}` (dead quip).

---

## Death notification

**Primary**
> Les Morts: {{name}} has departed, age {{age}}. You knew before almost everyone. That was the deal. Your watchlist has an opening: lesmorts.org

~135 chars. Deadpan, restates the value prop, CTA lands as "refill the list."

**Alt A — the dollar bit**
> Flatlined: {{name}}, {{age}}. Your dollar has matured. Find someone alive: lesmorts.org

~90 chars. Shortest. Good if you want room for carrier prefixes.

**Alt B — condolences optional**
> Les Morts: {{name}} has departed ({{age}}, {{deathQuip}}). Our condolences, or congratulations — whichever applies. More to follow? lesmorts.org

~140 chars. Uses the dead-state quip. "More to follow" doing double duty is intentional.

---

## Follow confirmation

**Primary**
> Les Morts: You're now watching {{name}} ({{age}}, {{quip}}). Nothing to do. We watch, you live. Add another: lesmorts.org

~120 chars.

**Alt — vigil bit**
> Les Morts: {{name}} is on your watchlist. A watchlist of one is just a vigil — complete the set: lesmorts.org

~105 chars.

---

## Private individual — weekly check, no news

(Optional. Only if you want a heartbeat message; probably opt-in, or it gets expensive and annoying.)

> Les Morts: {{name}} — still alive as of this week's check. No action needed. No refunds either. lesmorts.org

~105 chars.

---

## Notes for implementation

- Keep everything GSM-7: no em dashes render fine but curly quotes and "·" push to UCS-2 and cut the limit to 70 chars. The copy above uses only GSM-safe punctuation except the em dash in Alt B / vigil alt — replace with a hyphen if Twilio reports UCS-2 encoding.
- STOP/HELP compliance footer is appended by Twilio Messaging Service config on the first message; don't bake it into every template.
- Death alerts should bypass quiet hours — it's literally the product. Confirmations can respect them via Knock.
