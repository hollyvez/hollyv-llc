import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const UA = "Flatlined/1.0 (lemort-app)";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query param `q` must be at least 2 characters" }, { status: 400 });
  }

  try {
    // Use MediaWiki full-text search with Wikidata statement filters:
    // haswbstatement:P31=Q5  → must be a human
    // -haswbstatement:P570   → must NOT have a death date
    const searchParams = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: `${q} haswbstatement:P31=Q5 -haswbstatement:P570`,
      srnamespace: "0",
      srlimit: "16",
      format: "json",
      origin: "*",
    });

    const searchRes = await fetch(`${WIKIDATA_API}?${searchParams}`, {
      headers: { "User-Agent": UA },
    });
    const searchText = await searchRes.text();
    console.log(`[search] status=${searchRes.status} body preview: ${searchText.slice(0, 200)}`);
    const searchData = JSON.parse(searchText);
    const hits: { title: string }[] = searchData.query?.search ?? [];
    const ids = hits.map((h) => h.title); // titles are Q-numbers on Wikidata

    console.log(`[search] "${q}" → ${ids.length} human hits: ${ids.join(", ")}`);
    if (ids.length === 0) return NextResponse.json({ results: [] });

    // Fetch labels, photo, occupation, nationality — POST to avoid URL length limits
    const entityBody = new URLSearchParams({
      action: "wbgetentities",
      ids: ids.join("|"),
      props: "claims|labels",
      languages: "en",
      format: "json",
    });
    const entityRes = await fetch(WIKIDATA_API, {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: entityBody.toString(),
    });
    const entityData = await entityRes.json();
    const entities = entityData.entities ?? {};
    console.log(`[search] Q22686 label check:`, JSON.stringify((entities["Q22686"] as { labels?: unknown })?.labels));

    type Raw = { wikidataId: string; name: string; dateOfBirth: string | null; photo: string | null; occQid: string | null; natQid: string | null };
    const raw: Raw[] = [];

    for (const id of ids) {
      if (raw.length >= 8) break;
      const e = entities[id];
      if (!e || e.missing) continue;

      const dobTime: string | null = (e.claims?.P569 as { mainsnak?: { datavalue?: { value?: { time?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.time ?? null;
      const photoFile: string | null = (e.claims?.P18 as { mainsnak?: { datavalue?: { value?: string } } }[])?.[0]?.mainsnak?.datavalue?.value ?? null;
      const occQid: string | null = (e.claims?.P106 as { mainsnak?: { datavalue?: { value?: { id?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
      const natQid: string | null = (e.claims?.P27 as { mainsnak?: { datavalue?: { value?: { id?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
      const name: string = (e.labels as { en?: { value?: string } })?.en?.value ?? id;

      console.log(`  ✓ ${id} (${name}) photo=${photoFile} occ=${occQid}`);
      raw.push({
        wikidataId: id,
        name,
        dateOfBirth: dobTime ? (dobTime.match(/[+-](\d{4}-\d{2}-\d{2})/)?.[1] ?? null) : null,
        photo: photoFile ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(photoFile.replace(/ /g, "_"))}?width=200` : null,
        occQid,
        natQid,
      });
    }

    if (raw.length === 0) return NextResponse.json({ results: [] });

    // Resolve occupation + nationality QIDs to English labels
    const qids = Array.from(new Set(raw.flatMap((r) => [r.occQid, r.natQid].filter(Boolean) as string[])));
    const labelMap: Record<string, string> = {};
    if (qids.length > 0) {
      const lp = new URLSearchParams({ action: "wbgetentities", ids: qids.join("|"), props: "labels", languages: "en", format: "json" });
      const lr = await fetch(WIKIDATA_API, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, body: lp.toString() });
      const ld = await lr.json();
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
      occupation: r.occQid ? (labelMap[r.occQid] ?? null) : null,
      nationality: r.natQid ? (labelMap[r.natQid] ?? null) : null,
    }));

    console.log(`[search] returning ${results.length} results`);
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
