import { vi } from "vitest";
import suggestions from "./suggestions";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

const request = () =>
  document.querySelector('script[src*="suggestqueries.google.com"]');

test("preserves special characters as part of the query", async () => {
  const result = suggestions("c++ & café vs ");
  const url = new URL(request().src);
  expect(url.searchParams.get("q")).toBe("c++ & café vs ");
  const callback = url.searchParams.get("callback");
  window[callback](["c++ & café vs ", ["c++ & café vs tea"]]);
  await expect(result).resolves.toEqual([
    "c++ & café vs ",
    ["c++ & café vs tea"],
  ]);
  expect(request()).toBeNull();
  expect(window[callback]).toBeUndefined();
});

test("rejects malformed suggestions and cleans up the callback", async () => {
  const result = suggestions("react");
  const callback = new URL(request().src).searchParams.get("callback");
  window[callback](["react", [null]]);
  await expect(result).rejects.toThrow(/try again/i);
  expect(request()).toBeNull();
  expect(window[callback]).toBeUndefined();
});

test("cancels an abandoned request and removes its script", async () => {
  const controller = new AbortController();
  const result = suggestions("react", { signal: controller.signal });
  controller.abort();
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
  expect(request()).toBeNull();
});
