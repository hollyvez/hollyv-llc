import { NextRequest, NextResponse } from "next/server";
import { searchPeople } from "@/lib/wikidata";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query param `q` must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const people = await searchPeople(q, 8);

    const results = people.map((p) => ({
      wikidataId: p.wikidataId,
      name: p.name,
      dateOfBirth: p.dateOfBirth,
      age: p.dateOfBirth ? calcAge(p.dateOfBirth) : null,
      photo: p.photo,
      occupation: p.occupation,
      nationality: p.nationality,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 502 }
    );
  }
}

function calcAge(dobIso: string): number | null {
  const dob = new Date(dobIso);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const notYetHadBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (notYetHadBirthday) age--;
  return age;
}
