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
    const { type, personId, personIds, email, channel, phone } = intent.metadata;

    if (!email) {
      console.warn("[webhook] missing email in metadata — skipping");
      return NextResponse.json({ received: true });
    }

    // --- Private person flow ---
    if (type === "private" && personId) {
      console.log(`[webhook] private person payment: personId=${personId}, email=${email}`);
      try {
        const user = await prisma.user.upsert({
          where: { email },
          create: { email, phone: phone || null },
          update: { phone: phone || null },
        });

        const person = await prisma.person.findUnique({ where: { id: personId } });
        if (!person) {
          console.warn(`[webhook] private person not found: ${personId}`);
        } else {
          await prisma.watch.upsert({
            where: { userId_personId: { userId: user.id, personId: person.id } },
            create: { userId: user.id, personId: person.id, stripeChargeId: intent.id },
            update: {},
          });
          await prisma.person.update({
            where: { id: person.id },
            data: { watcherCount: { increment: 1 } },
          }).catch(() => {});

          // Knock confirmation for private person
          if (process.env.KNOCK_SECRET_KEY) {
            const knock = new Knock({ apiKey: process.env.KNOCK_SECRET_KEY });
            await knock.workflows.trigger("follow-confirmation", {
              recipients: [{ id: email, email }],
              data: {
                subjectName: person.name,
                age: person.birthYear
                  ? new Date().getFullYear() - person.birthYear
                  : null,
                quip: "not on Wikipedia",
                watcherCount: person.watcherCount + 1,
                photoUrl: "",
                unsubscribeUrl: `https://lesmorts.org/unsubscribe?email=${encodeURIComponent(email)}`,
              },
            }).catch((err: unknown) => console.error("[webhook] Knock private:", err));
          }
          console.log(`[webhook] private watch created for ${email} → ${person.name}`);
        }
      } catch (err) {
        console.error("[webhook] private person DB error:", err);
      }
      return NextResponse.json({ received: true });
    }

    // --- Public person flow ---
    const ids = personIds?.split(",").filter(Boolean) ?? [];
    console.log(`[webhook] payment succeeded: ${ids.length} people, email=${email}, channel=${channel}`);

    if (ids.length === 0) {
      console.warn("[webhook] missing personIds in metadata — skipping");
      return NextResponse.json({ received: true });
    }

    try {
      // Upsert user (may already exist from auth flow)
      const user = await prisma.user.upsert({
        where: { email },
        create: { email, phone: phone || null },
        update: { phone: phone || null },
      });

      // For each person, find by wikidataId, then create Watch
      for (const wikidataId of ids) {
        const person = await prisma.person.findUnique({
          where: { wikidataId },
        });

        if (!person) {
          console.warn(`[webhook] person not found for wikidataId=${wikidataId} — skipping`);
          continue;
        }

        await prisma.watch.upsert({
          where: { userId_personId: { userId: user.id, personId: person.id } },
          create: {
            userId: user.id,
            personId: person.id,
            stripeChargeId: intent.id,
          },
          update: {},
        });

        await prisma.person.update({
          where: { id: person.id },
          data: { watcherCount: { increment: 1 } },
        }).catch(() => {});
      }

      console.log(`[webhook] created ${ids.length} watch record(s) for ${email}`);
    } catch (err) {
      console.error("[webhook] DB error:", err);
    }

    // Send follow confirmation via Knock
    if (process.env.KNOCK_SECRET_KEY) {
      try {
        const knock = new Knock({ apiKey: process.env.KNOCK_SECRET_KEY });

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
