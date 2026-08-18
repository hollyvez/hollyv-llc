/**
 * Weekly private-person death check.
 *
 * For each active private-person watch, searches Legacy.com obituaries
 * by name + city. If a result matches the birth year (±1), marks the
 * person deceased and triggers a Knock death-alert notification.
 *
 * Run via GitHub Actions (see .github/workflows/death-check.yml).
 * Required env vars: DATABASE_URL, KNOCK_SECRET_KEY
 */

import { PrismaClient } from "@prisma/client";
import { Knock } from "@knocklabs/node";

const prisma = new PrismaClient();

async function searchLegacy(name, city) {
  const params = new URLSearchParams({ Name: name });
  if (city) params.set("Location", city);
  const url = `https://www.legacy.com/api/obituaries?${params}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LesmortsDotOrg/1.0 (hello@lesmorts.org)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.obituaries) ? data.obituaries : [];
  } catch (err) {
    console.warn(`[death-check] Legacy.com fetch failed for "${name}":`, err.message);
    return [];
  }
}

function extractBirthYear(obit) {
  // Legacy.com returns dateOfBirth as "YYYY-MM-DD" or "YYYY"
  const raw = obit.dateOfBirth ?? obit.BirthDate ?? "";
  const match = String(raw).match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

async function main() {
  const knock = new Knock({ apiKey: process.env.KNOCK_SECRET_KEY });

  // Fetch all active private-person watches
  const watches = await prisma.watch.findMany({
    where: {
      person: { isPrivate: true, isDeceased: false },
    },
    include: {
      person: true,
      user: true,
    },
  });

  console.log(`[death-check] checking ${watches.length} private watch(es)`);

  // Deduplicate by personId so we don't check the same person multiple times
  const checked = new Set();

  for (const watch of watches) {
    const { person, user } = watch;
    if (checked.has(person.id)) continue;
    checked.add(person.id);

    console.log(`[death-check] checking: ${person.name} (b. ${person.birthYear}, ${person.city ?? "no city"})`);

    const results = await searchLegacy(person.name, person.city);

    let matched = false;
    for (const obit of results) {
      const obitBirthYear = extractBirthYear(obit);
      // Match on birth year ±1 to account for data inconsistencies
      if (person.birthYear && obitBirthYear && Math.abs(obitBirthYear - person.birthYear) <= 1) {
        matched = true;

        const diedAtRaw = obit.dateOfDeath ?? obit.DeathDate ?? null;
        const diedAt = diedAtRaw ? new Date(diedAtRaw) : new Date();

        console.log(`[death-check] MATCH: ${person.name} — died ${diedAt.toISOString().split("T")[0]}`);

        // Mark person as deceased
        await prisma.person.update({
          where: { id: person.id },
          data: { isDeceased: true, diedAt },
        });

        break;
      }
    }

    if (!matched) {
      console.log(`[death-check] no match for ${person.name}`);
      continue;
    }

    // Notify all watchers of this person
    const allWatches = await prisma.watch.findMany({
      where: { personId: person.id },
      include: { user: true },
    });

    for (const w of allWatches) {
      const recipientEmail = w.user.email;
      try {
        await knock.workflows.trigger("death-alert-email", {
          recipients: [{ id: recipientEmail, email: recipientEmail }],
          data: {
            subjectName: person.name,
            age: person.birthYear ? new Date().getFullYear() - person.birthYear : null,
            deathQuip: "checked out",
            departedDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            source: "Legacy.com obituaries",
            photoUrl: "",
            unsubscribeUrl: `https://lesmorts.org/unsubscribe?email=${encodeURIComponent(recipientEmail)}`,
          },
        });

        // Record notification
        await prisma.notification.create({
          data: { watchId: w.id, channel: "email" },
        }).catch(() => {});

        console.log(`[death-check] Knock death-alert sent to ${recipientEmail} for ${person.name}`);
      } catch (err) {
        console.error(`[death-check] Knock error for ${recipientEmail}:`, err);
      }
    }
  }

  await prisma.$disconnect();
  console.log("[death-check] done");
}

main().catch(async (err) => {
  console.error("[death-check] fatal:", err);
  await prisma.$disconnect();
  process.exit(1);
});
