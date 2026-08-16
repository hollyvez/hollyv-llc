import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!rateLimit(`watch:${getIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const { personIds, persons, channel, phone } = body as {
    personIds: string[];
    persons?: { wikidataId: string; name: string; photo: string | null }[];
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

  // Upsert Person records so the webhook can find them by wikidataId.
  // persons array is provided by the client with wikidataId, name, photo.
  const wikidataIds: string[] = [];
  if (persons && persons.length > 0) {
    for (const p of persons) {
      if (!p.wikidataId) continue;
      await prisma.person.upsert({
        where: { wikidataId: p.wikidataId },
        create: { wikidataId: p.wikidataId, name: p.name, photo: p.photo ?? null },
        update: { name: p.name, photo: p.photo ?? null },
      }).catch(() => {});
      wikidataIds.push(p.wikidataId);
    }
  }

  // Fall back to raw personIds if no wikidataIds resolved (shouldn't happen in practice)
  const metaIds = wikidataIds.length > 0 ? wikidataIds : personIds;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const intent = await stripe.paymentIntents.create({
    amount: metaIds.length * 100,
    currency: "usd",
    metadata: {
      personIds: metaIds.join(","),
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
