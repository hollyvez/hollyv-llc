import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { personIds, channel, phone } = body as {
    personIds: string[];
    channel?: "email" | "sms";
    phone?: string;
  };

  if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
    return NextResponse.json({ error: "personIds required" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  // Get email from session
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const intent = await stripe.paymentIntents.create({
    amount: personIds.length * 100,
    currency: "usd",
    metadata: {
      personIds: personIds.join(","),
      email: email ?? "",
      channel: channel ?? "email",
      phone: phone ?? "",
    },
    receipt_email: email ?? undefined,
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: intent.client_secret });
}
