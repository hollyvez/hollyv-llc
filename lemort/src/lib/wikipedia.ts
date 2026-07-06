export interface WikipediaDeath {
  name: string;
  wikidataId: string | null;
  diedAt: Date;
}

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

/**
 * Fetch the Wikipedia "Deaths in [Month Year]" article and parse names.
 * Optionally pass a specific year/month; defaults to the current month.
 */
export async function fetchMonthlyDeaths(
  year?: number,
  month?: number
): Promise<WikipediaDeath[]> {
  const now = new Date();
  const y = year ?? now.getUTCFullYear();
  const m = month ?? now.getUTCMonth() + 1;
  const monthName = new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
  });

  const title = `Deaths in ${monthName} ${y}`;
  const wikitext = await fetchWikitext(title);
  if (!wikitext) return [];

  const names = parseNamesFromWikitext(wikitext, y, m);
  const enriched = await enrichWithWikidataIds(names.map((n) => n.name));

  return names.map((n) => ({
    ...n,
    wikidataId: enriched[n.name] ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function fetchWikitext(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`${WIKIPEDIA_API}?${params}`, {
    headers: { "User-Agent": "Flatlined/1.0 (https://github.com/lemort)" },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0] as
    | { revisions?: { slots?: { main?: { "*": string } } }[] }
    | undefined;

  return page?.revisions?.[0]?.slots?.main?.["*"] ?? null;
}

interface ParsedEntry {
  name: string;
  diedAt: Date;
}

/**
 * Parse the wikitext of a "Deaths in Month Year" article.
 *
 * The page is structured as:
 *   ==Day header (e.g. ==1==, ==2==)==
 *   * [[Person Name]], age, description
 *
 * We extract the day from each header and the linked name from each bullet.
 */
function parseNamesFromWikitext(
  wikitext: string,
  year: number,
  month: number
): ParsedEntry[] {
  const results: ParsedEntry[] = [];
  let currentDay = 1;

  for (const line of wikitext.split("\n")) {
    // Day header: ==15== or === 15 ===
    const dayMatch = line.match(/^={2,3}\s*(\d{1,2})\s*={2,3}/);
    if (dayMatch) {
      currentDay = parseInt(dayMatch[1], 10);
      continue;
    }

    // Bullet entry: * [[Name]], ...
    if (line.startsWith("*")) {
      const nameMatch = line.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        // Skip non-person links (categories, years, etc.)
        if (!name.includes(":") && /[A-Z]/.test(name[0])) {
          results.push({
            name,
            diedAt: new Date(Date.UTC(year, month - 1, currentDay)),
          });
        }
      }
    }
  }

  return results;
}

/**
 * Batch-resolve Wikipedia article names to Wikidata QIDs.
 * Returns a map of { [name]: wikidataId }.
 */
async function enrichWithWikidataIds(
  names: string[]
): Promise<Record<string, string>> {
  if (names.length === 0) return {};

  const result: Record<string, string> = {};

  // Wikidata sitelinks API can handle up to 50 titles at once
  const CHUNK = 50;
  for (let i = 0; i < names.length; i += CHUNK) {
    const chunk = names.slice(i, i + CHUNK);
    const params = new URLSearchParams({
      action: "wbgetentities",
      sites: "enwiki",
      titles: chunk.join("|"),
      props: "info",
      format: "json",
      origin: "*",
    });

    const res = await fetch(`${WIKIDATA_API}?${params}`, {
      headers: { "User-Agent": "Flatlined/1.0 (https://github.com/lemort)" },
    });
    if (!res.ok) continue;

    const data = await res.json();
    const entities = data.entities ?? {};

    for (const [qid, entity] of Object.entries(entities) as [
      string,
      { sitelinks?: { enwiki?: { title: string } }; missing?: string }
    ][]) {
      if (qid.startsWith("Q") && !entity.missing) {
        const title = entity.sitelinks?.enwiki?.title;
        if (title) result[title] = qid;
      }
    }
  }

  return result;
}
