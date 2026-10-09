import { ALL, availableCategories, selectFeed, verificationLabel } from "../feed";
import { isSafeHttpUrl } from "../links";
import { DEFAULT_PREFERENCES, parsePreferences, type Preferences } from "../preferences";
import { relativeTime } from "../time";
import type { Story } from "../types";
import { DataFormatError, parseLatest, parseSources } from "../validate";

const item = (over: Record<string, unknown> = {}) => ({
  id: "i1",
  source: "ynet",
  title: "כותרת",
  summary: "תקציר",
  url: "https://www.ynet.co.il/a/1",
  published: "2026-10-09T10:00:00.000Z",
  category: "אקטואליה",
  sponsored: false,
  ...over,
});

const story = (over: Partial<Story> = {}): Story => ({
  id: "s1",
  lang: "he",
  category: "אקטואליה",
  title: "כותרת",
  summary: "",
  updated: "2026-10-09T10:00:00.000Z",
  independent_sources: 1,
  regions: ["il"],
  items: [item()],
  ...over,
});

describe("parseLatest", () => {
  it("accepts valid data", () => {
    const latest = parseLatest({ version: 1, generated_at: "2026-10-09T10:00:00Z", stories: [story()] });
    expect(latest.stories).toHaveLength(1);
  });

  it("rejects an unknown version", () => {
    expect(() => parseLatest({ version: 2, stories: [] })).toThrow(DataFormatError);
    expect(() => parseLatest(null)).toThrow(DataFormatError);
  });

  it("drops items with unsafe links, and stories left with no items", () => {
    const bad = story({ id: "bad", items: [item({ url: "javascript:alert(1)" })] as Story["items"] });
    const mixed = story({ id: "ok", items: [item(), item({ id: "i2", url: "intent://x" })] as Story["items"] });
    const latest = parseLatest({ version: 1, stories: [bad, mixed, "junk"] });
    expect(latest.stories.map((s) => s.id)).toEqual(["ok"]);
    expect(latest.stories[0]!.items).toHaveLength(1);
  });

  it("normalizes a missing source count to 1", () => {
    const latest = parseLatest({ version: 1, stories: [{ ...story(), independent_sources: "x" }] });
    expect(latest.stories[0]!.independent_sources).toBe(1);
  });
});

describe("parseSources", () => {
  it("drops invalid evidence links and keeps null as unknown", () => {
    const sources = parseSources({
      version: 1,
      sources: [
        {
          id: "ynet",
          name: "ynet",
          site: "https://www.ynet.co.il",
          owner: null,
          evidence_urls: ["https://example.org/x", "file:///etc/passwd"],
          audience_lean: { range: null, evidence_url: "javascript:x" },
        },
        { id: "broken" },
      ],
    });
    expect(Object.keys(sources)).toEqual(["ynet"]);
    expect(sources.ynet!.evidence_urls).toEqual(["https://example.org/x"]);
    expect(sources.ynet!.audience_lean.evidence_url).toBeNull();
    expect(sources.ynet!.owner).toBeNull();
  });
});

describe("selectFeed", () => {
  const stories = [
    story({ id: "old", updated: "2026-10-09T08:00:00Z" }),
    story({ id: "new", updated: "2026-10-09T12:00:00Z" }),
    story({ id: "sport", category: "ספורט", updated: "2026-10-09T09:00:00Z" }),
    story({ id: "world", category: "עולם", regions: ["world"], updated: "2026-10-09T09:30:00Z" }),
  ];

  it("shows newest first", () => {
    expect(selectFeed(stories, DEFAULT_PREFERENCES, ALL).map((s) => s.id)).toEqual(["new", "world", "sport", "old"]);
  });

  it("filters by interests, region and category", () => {
    const prefs: Preferences = { ...DEFAULT_PREFERENCES, interests: ["אקטואליה", "עולם"], regions: "il" };
    expect(selectFeed(stories, prefs, ALL).map((s) => s.id)).toEqual(["new", "old"]);
    expect(selectFeed(stories, DEFAULT_PREFERENCES, "ספורט").map((s) => s.id)).toEqual(["sport"]);
  });

  it("availableCategories returns only categories that have stories", () => {
    expect(availableCategories(stories, DEFAULT_PREFERENCES)).toEqual(["אקטואליה", "עולם", "ספורט"]);
  });
});

describe("verificationLabel", () => {
  it("uses factual wording", () => {
    expect(verificationLabel(story({ independent_sources: 3 }))).toBe('דווח ע"י 3 מקורות בלתי תלויים');
    expect(verificationLabel(story())).toBe("עד עכשיו דיווח רק מקור אחד");
  });
});

describe("parsePreferences", () => {
  it("falls back to defaults on corrupt data", () => {
    expect(parsePreferences("junk")).toEqual(DEFAULT_PREFERENCES);
    const p = parsePreferences({ onboarded: true, interests: ["ספורט", "לא קיים"], regions: "mars" });
    expect(p.onboarded).toBe(true);
    expect(p.interests).toEqual(["ספורט"]);
    expect(p.regions).toBe("both");
  });

  it("does not allow an empty interests list", () => {
    expect(parsePreferences({ interests: [] }).interests).toEqual(DEFAULT_PREFERENCES.interests);
  });
});

describe("isSafeHttpUrl", () => {
  it.each([
    ["https://www.bbc.com/news/x", true],
    ["http://www.arab48.com/%D8%A3", true],
    ["javascript:alert(1)", false],
    ["intent://scan/#Intent;end", false],
    ["https://evil.com@good.com", false],
    ["file:///data", false],
    [42, false],
  ])("%s → %s", (url, ok) => expect(isSafeHttpUrl(url)).toBe(ok));
});

describe("relativeTime", () => {
  const now = Date.parse("2026-10-09T12:00:00Z");
  it.each([
    ["2026-10-09T12:00:00Z", "עכשיו"],
    ["2026-10-09T11:55:00Z", "לפני 5 דקות"],
    ["2026-10-09T10:00:00Z", "לפני שעתיים"],
    ["2026-10-08T20:00:00Z", "לפני 16 שעות"],
    ["2026-10-08T06:00:00Z", "אתמול"],
  ])("%s → %s", (iso, text) => expect(relativeTime(iso, now)).toBe(text));
});
