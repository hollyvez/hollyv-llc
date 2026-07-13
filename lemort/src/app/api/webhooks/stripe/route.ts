import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Knock } from "@knocklabs/node";

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

    console.log(`[webhook] payment succeeded: ${ids.length} people, ${email}, via ${channel}`);

    // TODO: persist Watch records
    // for (const personId of ids) {
    //   await db.watch.create({ data: { personId, userEmail: email, channel, phone, paidAt: new Date() } });
    // }

    // TODO: send confirmation via Knock
    // await knock.notify("watch-confirmed", { recipients: [{ email }], data: { personIds: ids } });
  }

  return NextResponse.json({ received: true });
}
