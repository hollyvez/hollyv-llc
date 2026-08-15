import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit } from "./rate-limit";

afterEach(() => vi.restoreAllMocks());

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const key = `test:${Math.random()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });

  it("resets after the window expires", () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;
    rateLimit(key, 1, 1_000);
    expect(rateLimit(key, 1, 1_000)).toBe(false);

    vi.advanceTimersByTime(1_001);
    expect(rateLimit(key, 1, 1_000)).toBe(true);
    vi.useRealTimers();
  });
});
