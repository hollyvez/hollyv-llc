import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Knock } from "@knocklabs/node";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { personIds, email, channel, phone } = intent.metadata;
    const ids = personIds?.split(",").filter(Boolean) ?? [];

    console.log(`[webhook] payment succeeded: ${ids.length} people, email=${email}, channel=${channel}`);

    if (!email || ids.length === 0) {
      console.warn("[webhook] missing email or personIds in metadata — skipping DB + Knock");
      return NextResponse.json({ received: true });
    }

    try {
      // Upsert user (may already exist from auth flow)
      const user = await prisma.user.upsert({
        where: { email },
        create: { email, phone: phone || null },
        update: { phone: phone || null },
      });

      // For each person, find or create the Person record, then create Watch
      for (const wikidataId of ids) {
        // Find person by wikidataId
        const person = await prisma.person.findUnique({
          where: { wikidataId },
        });

        if (!person) {
          console.warn(`[webhook] person not found for wikidataId=${wikidataId} — skipping`);
          continue;
        }

        // Create watch (skip if already exists)
        await prisma.watch.upsert({
          where: { userId_personId: { userId: user.id, personId: person.id } },
          create: {
            userId: user.id,
            personId: person.id,
            stripeChargeId: intent.id,
          },
          update: {}, // already watching — no-op
        });

        // Increment watcher count
        await prisma.person.update({
          where: { id: person.id },
          data: { watcherCount: { increment: 1 } },
        }).catch(() => {}); // non-critical
      }

      console.log(`[webhook] created ${ids.length} watch record(s) for ${email}`);
    } catch (err) {
      console.error("[webhook] DB error:", err);
      // Don't return error — Stripe will retry. Log and continue to Knock.
    }

    // Send follow confirmation via Knock
    if (process.env.KNOCK_SECRET_KEY) {
      try {
        const knock = new Knock({ apiKey: process.env.KNOCK_SECRET_KEY });

        // Look up person details for the first person (confirmation email shows one)
        const firstPerson = await prisma.person.findUnique({
          where: { wikidataId: ids[0] },
        }).catch(() => null);

        await knock.workflows.trigger("follow-confirmation", {
          recipients: [{ id: email, email }],
          data: {
            subjectName: firstPerson?.name ?? "your person",
            age: firstPerson?.dob
              ? Math.floor((Date.now() - new Date(firstPerson.dob).getTime()) / 31557600000)
              : null,
            quip: "against all odds",
            watcherCount: firstPerson?.watcherCount ?? 1,
            photoUrl: firstPerson?.photo ?? "",
            unsubscribeUrl: `https://lesmorts.org/unsubscribe?email=${encodeURIComponent(email)}`,
          },
        });

        console.log(`[webhook] Knock follow-confirmation sent to ${email}`);
      } catch (err) {
        console.error("[webhook] Knock error:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
