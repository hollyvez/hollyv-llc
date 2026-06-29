import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { personIds, email, channel, phone } = body;

  if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
    return NextResponse.json({ error: "personIds required" }, { status: 400 });
  }

  // TODO: wire Stripe — create PaymentIntent for amount: personIds.length * 100 cents
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const intent = await stripe.paymentIntents.create({
  //   amount: personIds.length * 100,
  //   currency: 'usd',
  //   metadata: { personIds: personIds.join(','), email, channel, phone },
  // })
  // return NextResponse.json({ clientSecret: intent.client_secret })

  // TODO: persist Watch records to DB
  // for (const personId of personIds) {
  //   await prisma.watch.create({ data: { personId, userEmail: email, channel, paidAt: new Date() } })
  // }

  console.log(`[/api/watch] watching ${personIds.length} people for ${email ?? "anonymous"} via ${channel ?? "email"}`);

  return NextResponse.json({
    ok: true,
    watched: personIds.length,
    // clientSecret: intent.client_secret  // uncomment when Stripe is wired
  });
}
