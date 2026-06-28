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
    // Step 1: search for candidate entity IDs
    const searchParams = new URLSearchParams({
      action: "wbsearchentities",
      search: q,
      language: "en",
      type: "item",
      limit: "32",
      format: "json",
      origin: "*",
    });
    const searchRes = await fetch(`${WIKIDATA_API}?${searchParams}`, { headers: { "User-Agent": UA } });
    const searchData = await searchRes.json();
    const candidates: { id: string; label: string }[] = searchData.search ?? [];
    console.log(`[search] "${q}" → ${candidates.length} candidates:`, candidates.map(c => c.id).join(", "));

    if (candidates.length === 0) return NextResponse.json({ results: [] });

    // Step 2: fetch claims+labels for all candidates
    const entityParams = new URLSearchParams({
      action: "wbgetentities",
      ids: candidates.map(c => c.id).join("|"),
      props: "claims|labels",
      languages: "en",
      format: "json",
      origin: "*",
    });
    const entityRes = await fetch(`${WIKIDATA_API}?${entityParams}`, { headers: { "User-Agent": UA } });
    const entityData = await entityRes.json();
    const entities = entityData.entities ?? {};
    console.log(`[search] got ${Object.keys(entities).length} entities`);

    // Step 3: filter to living humans
    type Raw = { wikidataId: string; name: string; dateOfBirth: string | null; photo: string | null; occQid: string | null; natQid: string | null };
    const raw: Raw[] = [];

    for (const c of candidates) {
      if (raw.length >= 8) break;
      const e = entities[c.id];
      if (!e || e.missing) { console.log(`  skip ${c.id}: missing`); continue; }

      const p31 = (e.claims?.P31 ?? []) as { mainsnak?: { datavalue?: { value?: { id?: string } } } }[];
      const isHuman = p31.some(x => x.mainsnak?.datavalue?.value?.id === "Q5");
      if (!isHuman) { console.log(`  skip ${c.id} (${c.label}): not human, P31=${p31.map(x=>x.mainsnak?.datavalue?.value?.id).join(",")}`); continue; }

      const hasDeath = ((e.claims?.P570 ?? []) as unknown[]).length > 0;
      if (hasDeath) { console.log(`  skip ${c.id} (${c.label}): deceased`); continue; }

      const dobTime: string | null = (e.claims?.P569 as { mainsnak?: { datavalue?: { value?: { time?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.time ?? null;
      const photoFile: string | null = (e.claims?.P18 as { mainsnak?: { datavalue?: { value?: string } } }[])?.[0]?.mainsnak?.datavalue?.value ?? null;
      const occQid: string | null = (e.claims?.P106 as { mainsnak?: { datavalue?: { value?: { id?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
      const natQid: string | null = (e.claims?.P27 as { mainsnak?: { datavalue?: { value?: { id?: string } } } }[])?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
      const name: string = (e.labels as { en?: { value?: string } })?.en?.value ?? c.label;

      console.log(`  ✓ ${c.id} (${name}) dob=${dobTime} photo=${photoFile} occ=${occQid} nat=${natQid}`);
      raw.push({ wikidataId: c.id, name, dateOfBirth: dobTime ? dobTime.match(/[+-](\d{4}-\d{2}-\d{2})/)?.[1] ?? null : null, photo: photoFile ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(photoFile.replace(/ /g, "_"))}?width=200` : null, occQid, natQid });
    }

    if (raw.length === 0) return NextResponse.json({ results: [] });

    // Step 4: resolve occupation + nationality labels
    const qids = Array.from(new Set(raw.flatMap(r => [r.occQid, r.natQid].filter(Boolean) as string[])));
    const labelMap: Record<string, string> = {};
    if (qids.length > 0) {
      const lp = new URLSearchParams({ action: "wbgetentities", ids: qids.join("|"), props: "labels", languages: "en", format: "json", origin: "*" });
      const lr = await fetch(`${WIKIDATA_API}?${lp}`, { headers: { "User-Agent": UA } });
      const ld = await lr.json();
      for (const [qid, ent] of Object.entries(ld.entities ?? {}) as [string, { labels?: { en?: { value: string } } }][]) {
        if (ent.labels?.en?.value) labelMap[qid] = ent.labels.en.value;
      }
    }

    const results = raw.map(r => ({
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
