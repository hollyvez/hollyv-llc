import { NextRequest, NextResponse } from "next/server";
import { Knock } from "@knocklabs/node";
import { prisma } from "@/lib/prisma";
import { fetchMonthlyDeaths } from "@/lib/wikipedia";

export const runtime = "nodejs";
// Allow up to 60 seconds — this does real work
export const maxDuration = 60;

/**
 * GET /api/cron
 *
 * Intended to be called by a cron service (e.g. Vercel Cron, GitHub Actions).
 * Protect with a shared secret in the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await pollAndMarkDeaths();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[/api/cron]", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------

interface CronSummary {
  checkedDeaths: number;
  newlyMarked: number;
  watchersToNotify: number;
}

async function pollAndMarkDeaths(): Promise<CronSummary> {
  // Fetch deaths for the current month (and the previous month to catch
  // late additions to Wikipedia).
  const now = new Date();
  const [currentDeaths, prevDeaths] = await Promise.all([
    fetchMonthlyDeaths(now.getUTCFullYear(), now.getUTCMonth() + 1),
    fetchMonthlyDeaths(
      now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear(),
      now.getUTCMonth() === 0 ? 12 : now.getUTCMonth()
    ),
  ]);

  const allDeaths = [...currentDeaths, ...prevDeaths];
  const wikidataIds = allDeaths
    .map((d) => d.wikidataId)
    .filter((id): id is string => id !== null);

  if (wikidataIds.length === 0) {
    return { checkedDeaths: 0, newlyMarked: 0, watchersToNotify: 0 };
  }

  // Find watched Person records that match a death and aren't yet marked.
  const watchedPersons = await prisma.person.findMany({
    where: {
      wikidataId: { in: wikidataIds },
      isDeceased: false,
    },
    include: {
      watches: {
        include: { user: true },
      },
    },
  });

  let newlyMarked = 0;
  let watchersToNotify = 0;

  for (const person of watchedPersons) {
    const deathRecord = allDeaths.find((d) => d.wikidataId === person.wikidataId);
    if (!deathRecord) continue;

    // Mark the person as deceased
    await prisma.person.update({
      where: { id: person.id },
      data: {
        isDeceased: true,
        diedAt: deathRecord.diedAt,
      },
    });

    newlyMarked++;
    watchersToNotify += person.watches.length;

    console.log(
      `[cron] Marked ${person.name} (${person.wikidataId}) deceased on ${deathRecord.diedAt.toISOString()}. ` +
        `${person.watches.length} watcher(s) to notify.`
    );

    // Notify each watcher via Knock
    if (process.env.KNOCK_SECRET_KEY && person.watches.length > 0) {
      const knock = new Knock({ apiKey: process.env.KNOCK_SECRET_KEY });
      await knock.workflows.trigger("death-alert-email", {
        recipients: person.watches.map((w) => ({
          id: w.user.id,
          email: w.user.email,
        })),
        data: {
          person_name: person.name,
          died_on: deathRecord.diedAt.toISOString().split("T")[0],
        },
      });
    }
  }

  return {
    checkedDeaths: allDeaths.length,
    newlyMarked,
    watchersToNotify,
  };
}
