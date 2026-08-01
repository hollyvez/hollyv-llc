import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ personIds: [] });
  }

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { supabaseId: user.id },
        { email: user.email ?? "" },
      ],
    },
    include: { watches: { include: { person: true } } },
  });

  if (!dbUser) {
    return NextResponse.json({ personIds: [] });
  }

  // Backfill supabaseId if missing
  if (!dbUser.supabaseId) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { supabaseId: user.id },
    }).catch(() => {});
  }

  const personIds = dbUser.watches.map((w) => w.person.wikidataId ?? w.person.id);
  return NextResponse.json({ personIds });
}
