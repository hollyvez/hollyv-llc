import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const UA = "Flatlined/1.0 (lemort-app)";

async function wbPost(params: Record<string, string>) {
  const body = new URLSearchParams({ ...params, format: "json" });
  const res = await fetch(WIKIDATA_API, {
    method: "POST",
    headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return res.json();
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ error: "Query param `q` must be at least 3 characters" }, { status: 400 });
  }

  try {
    // MediaWiki full-text search filtered to living humans (POST avoids proxy URL filtering)
    const searchData = await wbPost({
      action: "query",
      list: "search",
      srsearch: `${q} haswbstatement:P31=Q5 -haswbstatement:P570`,
      srnamespace: "0",
      srlimit: "8",
    });
    const hits: { title: string }[] = searchData.query?.search ?? [];
    const ids = hits.map((h) => h.title);

    if (ids.length === 0) return NextResponse.json({ results: [] });

    // Fetch claims and labels in separate calls — Trump's claims are huge and
    // collapse labels when bundled together in one response.
    const [claimsData, labelsData] = await Promise.all([
      wbPost({ action: "wbgetentities", ids: ids.join("|"), props: "claims" }),
      wbPost({ action: "wbgetentities", ids: ids.join("|"), props: "labels|sitelinks", languages: "en", sitefilter: "enwiki" }),
    ]);

    const claimsEntities = claimsData.entities ?? {};
    const labelEntities = labelsData.entities ?? {};

    type Raw = { wikidataId: string; name: string; dateOfBirth: string | null; photo: string | null; gender: "man" | "woman"; occQid: string | null; natQid: string | null };
    const raw: Raw[] = [];

    for (const id of ids) {
      const ec = claimsEntities[id];
      const el = labelEntities[id];
      if (!ec || ec.missing) continue;

      const dobTime: string | null = (ec.claims?.P569 as { mainsnak?: { datavalue?: { value?: { time?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.time ?? null;
      const photoFile: string | null = (ec.claims?.P18 as { mainsnak?: { datavalue?: { value?: string } } }[])?.[0]?.mainsnak?.datavalue?.value ?? null;
      const occQid: string | null = (ec.claims?.P106 as { mainsnak?: { datavalue?: { value?: { id?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
      const natQid: string | null = (ec.claims?.P27 as { mainsnak?: { datavalue?: { value?: { id?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
      const genderQid: string | null = (ec.claims?.P21 as { mainsnak?: { datavalue?: { value?: { id?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
      const sitelinkTitle: string | undefined = (el?.sitelinks as { enwiki?: { title?: string } })?.enwiki?.title;
      const name: string = (el?.labels as { en?: { value?: string } })?.en?.value ?? sitelinkTitle ?? id;

      raw.push({
        wikidataId: id,
        name,
        dateOfBirth: dobTime ? (dobTime.match(/[+-](\d{4}-\d{2}-\d{2})/)?.[1] ?? null) : null,
        photo: photoFile ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(photoFile.replace(/ /g, "_"))}?width=200` : null,
        gender: genderQid === "Q6581072" ? "woman" : "man",
        occQid,
        natQid,
      });
    }

    if (raw.length === 0) return NextResponse.json({ results: [] });

    // Resolve occupation + nationality QIDs to English labels
    const qids = Array.from(new Set(raw.flatMap((r) => [r.occQid, r.natQid].filter(Boolean) as string[])));
    const labelMap: Record<string, string> = {};
    if (qids.length > 0) {
      const ld = await wbPost({ action: "wbgetentities", ids: qids.join("|"), props: "labels", languages: "en" });
      for (const [qid, ent] of Object.entries(ld.entities ?? {}) as [string, { labels?: { en?: { value: string } } }][]) {
        if (ent.labels?.en?.value) labelMap[qid] = ent.labels.en.value;
      }
    }

    const results = raw.map((r) => ({
      wikidataId: r.wikidataId,
      name: r.name,
      dateOfBirth: r.dateOfBirth,
      age: r.dateOfBirth ? calcAge(r.dateOfBirth) : null,
      photo: r.photo,
      gender: r.gender,
      occupation: r.occQid ? (labelMap[r.occQid] ?? null) : null,
      nationality: r.natQid ? (labelMap[r.natQid] ?? null) : null,
    }));

    return NextResponse.json({ results });

  } catch (err) {
    console.error("[/api/search] error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }
}

function calcAge(dobIso: string): number | null {
  const dob = new Date(dobIso);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
  return age;
}
