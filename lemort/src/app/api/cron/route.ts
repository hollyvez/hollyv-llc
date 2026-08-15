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
 * Called by GitHub Actions on a schedule.
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
  watchersNotified: number;
}

async function pollAndMarkDeaths(): Promise<CronSummary> {
  // Fetch deaths for the current month and previous month (catches late Wikipedia edits)
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
    return { checkedDeaths: 0, newlyMarked: 0, watchersNotified: 0 };
  }

  // Find watched Person records that match a death and aren't yet marked deceased
  const watchedPersons = await prisma.person.findMany({
    where: {
      wikidataId: { in: wikidataIds },
      isDeceased: false,
    },
    include: {
      watches: {
        include: {
          user: true,
          notifications: { where: { channel: "email" } },
        },
      },
    },
  });

  let newlyMarked = 0;
  let watchersNotified = 0;

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

    // Only notify watches that haven't already received an email notification
    const unwatches = person.watches.filter((w) => w.notifications.length === 0);

    console.log(
      `[cron] Marked ${person.name} (${person.wikidataId}) deceased on ${deathRecord.diedAt.toISOString()}. ` +
        `${unwatches.length} watcher(s) to notify.`
    );

    if (process.env.KNOCK_SECRET_KEY && unwatches.length > 0) {
      const knock = new Knock(process.env.KNOCK_SECRET_KEY);

      const age = person.dob
        ? Math.floor(
            (deathRecord.diedAt.getTime() - new Date(person.dob).getTime()) /
              31557600000
          )
        : null;

      const departedDate = deathRecord.diedAt.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });

      await knock.workflows.trigger("death-alert-email", {
        recipients: unwatches.map((w) => ({
          id: w.user.id,
          email: w.user.email,
        })),
        data: {
          subjectName: person.name,
          age,
          deathQuip: "a good run",
          departedDate,
          source: "Wikipedia",
          photoUrl: person.photo ?? "",
          unsubscribeUrl: "", // Knock fills recipient.unsubscribe_url via template
        },
      });

      // Record notifications to prevent double-sending
      await prisma.notification.createMany({
        data: unwatches.map((w) => ({
          watchId: w.id,
          channel: "email",
        })),
        skipDuplicates: true,
      });

      watchersNotified += unwatches.length;
    }
  }

  return {
    checkedDeaths: allDeaths.length,
    newlyMarked,
    watchersNotified,
  };
}
