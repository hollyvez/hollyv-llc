import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!rateLimit(`watch-private:${getIp(req)}`, 3, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const { name, birthYear, city, gender, channel, phone } = body as {
    name: string;
    birthYear: string;
    city?: string;
    gender: "man" | "woman";
    channel?: "email" | "sms";
    phone?: string;
  };

  if (!name?.trim() || !birthYear) {
    return NextResponse.json({ error: "name and birthYear required" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;

  // Create private person record (no wikidataId)
  let person;
  try {
    person = await prisma.person.create({
      data: {
        name: name.trim(),
        isPrivate: true,
        gender,
        birthYear: parseInt(birthYear, 10),
        city: city?.trim() || null,
      },
    });
  } catch (err) {
    console.error("[watch-private] DB error creating person:", err);
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const intent = await stripe.paymentIntents.create({
    amount: 100,
    currency: "usd",
    metadata: {
      personId: person.id,
      type: "private",
      email: email ?? "",
      channel: channel ?? "email",
      phone: phone ?? "",
    },
    receipt_email: email ?? undefined,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  });

  return NextResponse.json({ clientSecret: intent.client_secret });
}
