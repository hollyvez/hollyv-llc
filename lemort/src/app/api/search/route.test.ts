import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Minimal Wikidata API response builders
const makeSearchResponse = (ids: string[]) => ({
  query: { search: ids.map((id) => ({ title: id })) },
});

const makeEntityResponse = (
  entities: Record<string, { labels?: Record<string, { value: string }>; sitelinks?: Record<string, { title: string }>; claims?: Record<string, unknown[]> }>
) => ({ entities });

function mockFetch(handlers: ((body: URLSearchParams) => unknown)[]) {
  let call = 0;
  return vi.fn(async (_url: unknown, init?: RequestInit) => {
    const body = new URLSearchParams(init?.body as string);
    const handler = handlers[call++];
    const data = handler(body);
    const text = JSON.stringify(data);
    return { text: async () => text } as unknown as Response;
  });
}

function makeRequest(q: string) {
  return new NextRequest(`http://localhost/api/search?q=${encodeURIComponent(q)}`);
}

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when query is too short", async () => {
    const res = await GET(makeRequest("x"));
    expect(res.status).toBe(400);
  });

  it("returns empty results when Wikidata finds no matches", async () => {
    vi.stubGlobal("fetch", mockFetch([() => makeSearchResponse([])]));
    const res = await GET(makeRequest("xyzzy"));
    const body = await res.json();
    expect(body.results).toEqual([]);
  });

  it("uses POST for all Wikidata requests", async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => makeSearchResponse([]),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    await GET(makeRequest("test"));

    for (const call of (fetchMock as ReturnType<typeof vi.fn>).mock.calls) {
      expect(call[1]?.method).toBe("POST");
    }
  });

  it("returns name from sitelink when en label is empty (Trump edge case)", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch([
        // 1. MediaWiki search
        () => makeSearchResponse(["Q22686"]),
        // 2. claims fetch
        () =>
          makeEntityResponse({
            Q22686: {
              claims: {
                P569: [{ mainsnak: { datavalue: { value: { time: "+1946-06-14T00:00:00Z" } } } }],
                P18: [{ mainsnak: { datavalue: { value: "Donald Trump photo.jpg" } } }],
                P106: [{ mainsnak: { datavalue: { value: { id: "Q82955" } } } }],
                P27: [{ mainsnak: { datavalue: { value: { id: "Q30" } } } }],
              },
            },
          }),
        // 3. labels+sitelinks fetch — en label intentionally empty (proxy filters it)
        () =>
          makeEntityResponse({
            Q22686: {
              labels: {},
              sitelinks: { enwiki: { title: "Donald Trump" } },
            },
          }),
        // 4. occupation/nationality label resolution
        () =>
          makeEntityResponse({
            Q82955: { labels: { en: { value: "politician" } } },
            Q30: { labels: { en: { value: "United States of America" } } },
          }),
      ])
    );

    const res = await GET(makeRequest("trump"));
    const body = await res.json();
    expect(body.results[0].name).toBe("Donald Trump");
    expect(body.results[0].occupation).toBe("politician");
    expect(body.results[0].nationality).toBe("United States of America");
    expect(body.results[0].age).toBeTypeOf("number");
  });

  it("uses en label when present", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch([
        () => makeSearchResponse(["Q9696"]),
        () =>
          makeEntityResponse({
            Q9696: {
              claims: {
                P569: [{ mainsnak: { datavalue: { value: { time: "+1935-08-16T00:00:00Z" } } } }],
              },
            },
          }),
        () =>
          makeEntityResponse({
            Q9696: { labels: { en: { value: "Elvis Presley" } }, sitelinks: {} },
          }),
        () => makeEntityResponse({}),
      ])
    );

    const res = await GET(makeRequest("elvis"));
    const body = await res.json();
    expect(body.results[0].name).toBe("Elvis Presley");
  });

  it("falls back to Q-id when both label and sitelink are missing", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch([
        () => makeSearchResponse(["Q99999"]),
        () => makeEntityResponse({ Q99999: { claims: {} } }),
        () => makeEntityResponse({ Q99999: { labels: {}, sitelinks: {} } }),
        () => makeEntityResponse({}),
      ])
    );

    const res = await GET(makeRequest("nobody"));
    const body = await res.json();
    expect(body.results[0].name).toBe("Q99999");
  });
});
