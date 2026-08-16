import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const { id, email, user_metadata } = data.user;
      // Upsert user in Prisma — create if new, backfill supabaseId if existing
      await prisma.user.upsert({
        where: { email: email! },
        create: {
          email: email!,
          supabaseId: id,
          phone: user_metadata?.phone ?? null,
        },
        update: {
          supabaseId: id,
          // Only set phone if they provided one and don't already have one
          ...(user_metadata?.phone ? { phone: user_metadata.phone } : {}),
        },
      }).catch(() => {});
    }
  }

  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
  return NextResponse.redirect(redirectTo);
}
