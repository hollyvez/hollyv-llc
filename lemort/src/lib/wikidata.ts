export interface WikidataPerson {
  wikidataId: string;
  name: string;
  dateOfBirth: string | null;
  photo: string | null;
  occupation: string | null;
  nationality: string | null;
}

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const UA = "Flatlined/1.0 (lemort-app)";

/** Search Wikidata for living public figures by name. */
export async function searchPeople(query: string, limit = 8): Promise<WikidataPerson[]> {
  // Step 1: Search for candidate entity IDs
  const searchParams = new URLSearchParams({
    action: "wbsearchentities",
    search: query,
    language: "en",
    type: "item",
    limit: String(limit * 4), // fetch extra, we'll filter down
    format: "json",
    origin: "*",
  });

  const searchRes = await fetch(`${WIKIDATA_API}?${searchParams}`, {
    headers: { "User-Agent": UA },
  });
  if (!searchRes.ok) throw new Error(`Wikidata search failed: ${searchRes.status}`);

  const searchData = await searchRes.json();
  const candidates: { id: string; label: string; description?: string }[] =
    searchData.search ?? [];

  if (candidates.length === 0) return [];

  // Step 2: Fetch entity claims + labels in one batch call (no SPARQL)
  const ids = candidates.map((c) => c.id).join("|");
  const entityParams = new URLSearchParams({
    action: "wbgetentities",
    ids,
    props: "claims|labels",
    languages: "en",
    format: "json",
    origin: "*",
  });

  const entityRes = await fetch(`${WIKIDATA_API}?${entityParams}`, {
    headers: { "User-Agent": UA },
  });
  if (!entityRes.ok) throw new Error(`Wikidata entities failed: ${entityRes.status}`);

  const entityData = await entityRes.json();
  const entities = entityData.entities ?? {};

  // Step 3: Filter client-side to living humans, extract raw claim values
  type RawResult = WikidataPerson & { occQid: string | null; natQid: string | null };
  const rawResults: RawResult[] = [];

  for (const candidate of candidates) {
    if (rawResults.length >= limit) break;

    const entity = entities[candidate.id];
    if (!entity || entity.missing) continue;

    // Must be instance of human (P31 = Q5)
    const p31 = entity.claims?.P31 ?? [];
    const isHuman = p31.some(
      (c: { mainsnak?: { datavalue?: { value?: { id?: string } } } }) =>
        c.mainsnak?.datavalue?.value?.id === "Q5"
    );
    if (!isHuman) continue;

    // Must not be deceased (no P570 death date)
    if ((entity.claims?.P570 ?? []).length > 0) continue;

    // Date of birth (P569)
    const dob =
      entity.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time ?? null;

    // Photo filename (P18)
    const photoFile: string | null =
      entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? null;

    // Occupation QID (P106) — resolve to label in step 4
    const occQid: string | null =
      entity.claims?.P106?.[0]?.mainsnak?.datavalue?.value?.id ?? null;

    // Nationality QID (P27)
    const natQid: string | null =
      entity.claims?.P27?.[0]?.mainsnak?.datavalue?.value?.id ?? null;

    const name =
      entity.labels?.en?.value ?? candidate.label ?? candidate.id;

    rawResults.push({
      wikidataId: candidate.id,
      name,
      dateOfBirth: dob ? wikidataDateToISO(dob) : null,
      photo: photoFile ? wikimediaThumb(photoFile, 200) : null,
      occupation: occQid,   // placeholder — replaced in step 4
      nationality: natQid,  // placeholder
      occQid,
      natQid,
    });
  }

  if (rawResults.length === 0) return [];

  // Step 4: Batch-resolve occupation + nationality QIDs to English labels
  const qidsToResolve = Array.from(
    new Set(
      rawResults.flatMap((r) => [r.occQid, r.natQid].filter(Boolean) as string[])
    )
  );
  const labels = await fetchLabels(qidsToResolve);

  return rawResults.map(({ occQid, natQid, ...r }) => ({
    ...r,
    occupation: occQid ? (labels[occQid] ?? null) : null,
    nationality: natQid ? (labels[natQid] ?? null) : null,
  }));
}

/** Fetch a single person's details by Wikidata entity ID. */
export async function getPersonById(wikidataId: string): Promise<WikidataPerson | null> {
  const params = new URLSearchParams({
    action: "wbgetentities",
    ids: wikidataId,
    props: "claims|labels",
    languages: "en",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`${WIKIDATA_API}?${params}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const entity = data.entities?.[wikidataId];
  if (!entity || entity.missing) return null;

  const occQid: string | null =
    entity.claims?.P106?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
  const natQid: string | null =
    entity.claims?.P27?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
  const labels = await fetchLabels([occQid, natQid].filter(Boolean) as string[]);

  return {
    wikidataId,
    name: entity.labels?.en?.value ?? wikidataId,
    dateOfBirth:
      entity.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time
        ? wikidataDateToISO(entity.claims.P569[0].mainsnak.datavalue.value.time)
        : null,
    photo:
      entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value
        ? wikimediaThumb(entity.claims.P18[0].mainsnak.datavalue.value, 200)
        : null,
    occupation: occQid ? (labels[occQid] ?? null) : null,
    nationality: natQid ? (labels[natQid] ?? null) : null,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchLabels(qids: string[]): Promise<Record<string, string>> {
  if (qids.length === 0) return {};

  const params = new URLSearchParams({
    action: "wbgetentities",
    ids: qids.join("|"),
    props: "labels",
    languages: "en",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`${WIKIDATA_API}?${params}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) return {};

  const data = await res.json();
  const result: Record<string, string> = {};
  for (const [qid, entity] of Object.entries(data.entities ?? {}) as [
    string,
    { labels?: { en?: { value: string } } }
  ][]) {
    if (entity.labels?.en?.value) result[qid] = entity.labels.en.value;
  }
  return result;
}

/** Convert Wikidata time string (+1946-06-14T00:00:00Z) to ISO date. */
function wikidataDateToISO(time: string): string {
  const m = time.match(/^[+-](\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : time;
}

/**
 * Build a Wikimedia thumbnail URL from a bare filename (the value of P18).
 * Uses the Special:FilePath redirect which handles all naming quirks.
 */
function wikimediaThumb(filename: string, width: number): string {
  const encoded = encodeURIComponent(filename.replace(/ /g, "_"));
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${width}`;
}
