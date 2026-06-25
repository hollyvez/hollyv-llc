export interface WikidataPerson {
  wikidataId: string;
  name: string;
  dateOfBirth: string | null;
  photo: string | null;
  occupation: string | null;
  nationality: string | null;
}

const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const WIKIDATA_SEARCH = "https://www.wikidata.org/w/api.php";

/** Search Wikidata for a person by name. Returns up to `limit` results. */
export async function searchPeople(
  query: string,
  limit = 8
): Promise<WikidataPerson[]> {
  // Step 1: use the Wikidata search API to get candidate entity IDs
  const searchParams = new URLSearchParams({
    action: "wbsearchentities",
    search: query,
    language: "en",
    type: "item",
    limit: String(limit * 2), // fetch extra since we filter to humans below
    format: "json",
    origin: "*",
  });

  const searchRes = await fetch(`${WIKIDATA_SEARCH}?${searchParams}`, {
    headers: { "User-Agent": "Flatlined/1.0 (https://github.com/lemort)" },
  });
  if (!searchRes.ok) throw new Error("Wikidata search failed");

  const searchData = await searchRes.json();
  const ids: string[] = (searchData.search ?? []).map(
    (r: { id: string }) => r.id
  );

  if (ids.length === 0) return [];

  // Step 2: SPARQL query to enrich candidates — filter to living humans only
  const values = ids.map((id) => `wd:${id}`).join(" ");
  const sparql = `
    SELECT ?item ?itemLabel ?dob ?photo ?occupationLabel ?nationalityLabel WHERE {
      VALUES ?item { ${values} }
      ?item wdt:P31 wd:Q5 .            # instance of human
      FILTER NOT EXISTS { ?item wdt:P570 [] } # not deceased
      OPTIONAL { ?item wdt:P569 ?dob }
      OPTIONAL { ?item wdt:P18 ?photo }
      OPTIONAL { ?item wdt:P106 ?occupation }
      OPTIONAL { ?item wdt:P27 ?nationality }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    LIMIT ${limit}
  `;

  const sparqlParams = new URLSearchParams({ query: sparql, format: "json" });
  const sparqlRes = await fetch(`${WIKIDATA_SPARQL}?${sparqlParams}`, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "Flatlined/1.0 (https://github.com/lemort)",
    },
  });
  if (!sparqlRes.ok) throw new Error("Wikidata SPARQL query failed");

  const sparqlData = await sparqlRes.json();
  const bindings: Record<string, { value: string }>[] =
    sparqlData.results?.bindings ?? [];

  return bindings.map((b) => ({
    wikidataId: b.item.value.replace("http://www.wikidata.org/entity/", ""),
    name: b.itemLabel?.value ?? "",
    dateOfBirth: b.dob?.value ?? null,
    photo: b.photo ? wikimediaThumb(b.photo.value, 200) : null,
    occupation: b.occupationLabel?.value ?? null,
    nationality: b.nationalityLabel?.value ?? null,
  }));
}

/** Fetch full person details for a single Wikidata entity ID. */
export async function getPersonById(
  wikidataId: string
): Promise<WikidataPerson | null> {
  const sparql = `
    SELECT ?item ?itemLabel ?dob ?photo ?occupationLabel ?nationalityLabel WHERE {
      BIND(wd:${wikidataId} AS ?item)
      ?item wdt:P31 wd:Q5 .
      OPTIONAL { ?item wdt:P569 ?dob }
      OPTIONAL { ?item wdt:P18 ?photo }
      OPTIONAL { ?item wdt:P106 ?occupation }
      OPTIONAL { ?item wdt:P27 ?nationality }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    LIMIT 1
  `;

  const params = new URLSearchParams({ query: sparql, format: "json" });
  const res = await fetch(`${WIKIDATA_SPARQL}?${params}`, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "Flatlined/1.0 (https://github.com/lemort)",
    },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const b = data.results?.bindings?.[0];
  if (!b) return null;

  return {
    wikidataId,
    name: b.itemLabel?.value ?? "",
    dateOfBirth: b.dob?.value ?? null,
    photo: b.photo ? wikimediaThumb(b.photo.value, 200) : null,
    occupation: b.occupationLabel?.value ?? null,
    nationality: b.nationalityLabel?.value ?? null,
  };
}

/**
 * Convert a full Wikimedia Commons file URL to a thumbnail URL.
 * Uses the Wikimedia thumbnail API convention.
 */
function wikimediaThumb(fileUrl: string, width: number): string {
  // fileUrl looks like: http://commons.wikimedia.org/wiki/Special:FilePath/Foo.jpg
  const filename = decodeURIComponent(fileUrl.split("/").pop() ?? "");
  if (!filename) return fileUrl;

  // Wikimedia thumbnail URL format
  const encoded = encodeURIComponent(filename.replace(/ /g, "_"));
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${width}`;
}
