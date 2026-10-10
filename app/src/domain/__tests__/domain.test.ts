import { geminiPrompt, itemText } from "../display";
import { ALL, availableCategories, selectFeed } from "../feed";
import { coverage, leanBucket, leanPosition, sortByLean } from "../lean";
import { storySignals } from "../signals";
import { isSafeHttpUrl } from "../links";
import { DEFAULT_PREFERENCES, parsePreferences, type Preferences } from "../preferences";
import { relativeTime } from "../time";
import type { SourceProfile, Story } from "../types";
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
  flags: [],
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
  quotes: [],
  insights: null,
  excluded: null,
  items: [item()],
  ...over,
});

const profile = (id: string, range: string | null, owner_group = id, language = "he"): SourceProfile => ({
  id, name: id, site: "https://x.com", language, region: "il", owner_group, owner: null, funding: null,
  press_council_member: null, corrections_policy_url: null, ifcn_signatory: null,
  audience_lean: { range, evidence_url: null }, evidence: {}, evidence_urls: [],
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

  it("hides untranslated foreign stories while translation is active, shows all when it is not", () => {
    const en = story({ id: "en", lang: "en", updated: "2026-10-09T13:00:00Z" });
    const translated = story({ id: "tr", lang: "he", title_ai: true, updated: "2026-10-09T12:30:00Z" });
    expect(selectFeed([en, translated, ...stories], DEFAULT_PREFERENCES, ALL).map((s) => s.id)).not.toContain("en");
    expect(selectFeed([en, ...stories], DEFAULT_PREFERENCES, ALL).map((s) => s.id)).toContain("en");
  });

  it("hides clickbait and non-news stories", () => {
    const bait = story({ id: "bait", excluded: "clickbait", updated: "2026-10-09T13:00:00Z" });
    const ad = story({ id: "ad", excluded: "not_news", updated: "2026-10-09T13:00:00Z" });
    const ids = selectFeed([bait, ad, ...stories], DEFAULT_PREFERENCES, ALL).map((s) => s.id);
    expect(ids).not.toContain("bait");
    expect(ids).not.toContain("ad");
  });

  it("availableCategories returns only categories that have stories", () => {
    expect(availableCategories(stories, DEFAULT_PREFERENCES)).toEqual(["אקטואליה", "עולם", "ספורט"]);
  });
});

describe("lean", () => {
  it("parses points and ranges", () => {
    expect(leanPosition("left")).toBe(0);
    expect(leanPosition("center-left..center")).toBe(1.5);
    expect(leanPosition("right")).toBe(4);
    expect(leanPosition("far-right")).toBeNull();
    expect(leanPosition(null)).toBeNull();
  });

  it("buckets: center-left is left, a center-left..center range is center", () => {
    expect(leanBucket(profile("a", "center-left"))).toBe("left");
    expect(leanBucket(profile("a", "center-left..center"))).toBe("center");
    expect(leanBucket(profile("a", "center-right"))).toBe("right");
    expect(leanBucket(undefined)).toBe("unknown");
  });

  it("coverage counts each owner once", () => {
    const sources = { a: profile("a", "left", "g1"), b: profile("b", "left", "g1"), c: profile("c", "right"), d: profile("d", null) };
    const s = story({ items: ["a", "b", "c", "d"].map((src, i) => item({ id: "i" + i, source: src })) as Story["items"] });
    expect(coverage(s, sources)).toEqual({ left: 1, center: 0, right: 1, unknown: 1, total: 3, known: 2 });
  });

  it("sortByLean: right first, unknown last", () => {
    const sources: Record<string, SourceProfile> = { l: profile("l", "left"), r: profile("r", "right"), u: profile("u", null) };
    expect(sortByLean(["u", "l", "r"], (x) => sources[x]!)).toEqual(["r", "l", "u"]);
  });
});

describe("storySignals", () => {
  const now = Date.parse("2026-10-09T12:00:00Z");
  const sources = { a: profile("a", "left"), b: profile("b", "right"), c: profile("c", "center") };
  const lean = { politicalLean: true };
  const noLean = { politicalLean: false };

  it("always includes the source count", () => {
    expect(storySignals(story(), {}, noLean, now)).toEqual([{ kind: "sources", count: 1 }]);
  });

  it("orders critical-thinking signals first: sponsored, unconfirmed, anonymous, ... then context", () => {
    const s = story({
      independent_sources: 2,
      regions: ["il", "world"],
      items: [
        item({ id: "1", source: "a", sponsored: true, flags: ["hedged", "opinion", "anonymous", "study"] }),
        item({ id: "2", source: "b", flags: ["hedged", "anonymous", "social"] }),
      ] as Story["items"],
    });
    expect(storySignals(s, sources, noLean, now).map((x) => x.kind)).toEqual([
      "sponsored", "unconfirmed", "anonymous", "social", "study", "opinion", "sources", "international",
    ]);
  });

  it("unconfirmed/anonymous need at least half of the articles", () => {
    const s = story({
      items: [item({ id: "1", flags: ["hedged"] }), item({ id: "2" }), item({ id: "3" })] as Story["items"],
    });
    expect(storySignals(s, {}, noLean, now).map((x) => x.kind)).not.toContain("unconfirmed");
  });

  it("sensational when the lead headline is", () => {
    const s = story({ id: "1", items: [item({ id: "1", flags: ["sensational"] }), item({ id: "2" }), item({ id: "3" })] as Story["items"] });
    expect(storySignals(s, {}, noLean, now).map((x) => x.kind)).toContain("sensational");
  });

  it("spectrum only when the political-lean feature is on", () => {
    const s = story({ items: [item({ id: "1", source: "a" }), item({ id: "2", source: "b" })] as Story["items"] });
    expect(storySignals(s, sources, noLean, now).map((x) => x.kind)).not.toContain("spectrum");
    expect(storySignals(s, sources, lean, now).find((x) => x.kind === "spectrum")).toMatchObject({ spread: "wide" });
    const one = story({ items: [item({ id: "1", source: "a" }), item({ id: "2", source: "a2" })] as Story["items"] });
    const src = { a: profile("a", "left"), a2: profile("a2", "center-left") };
    expect(storySignals(one, src, lean, now).find((x) => x.kind === "spectrum")).toMatchObject({ spread: "one-sided" });
  });

  it("developing: two new sources in the last 3 hours on an older story", () => {
    const s = story({
      items: [
        item({ id: "1", source: "a", published: "2026-10-09T05:00:00Z" }),
        item({ id: "2", source: "b", published: "2026-10-09T11:00:00Z" }),
        item({ id: "3", source: "c", published: "2026-10-09T11:30:00Z" }),
      ] as Story["items"],
    });
    expect(storySignals(s, sources, noLean, now).find((x) => x.kind === "developing")).toEqual({ kind: "developing", newSources: 2 });
  });
});

describe("parseLatest: flags and insights", () => {
  it("keeps known flags, maps the legacy opinion/hedged fields, validates insights", () => {
    const raw = {
      version: 1,
      stories: [
        {
          ...story(),
          insights: { questions: ["מה הרקע?", 5], viewpoints: [{ stance: "עמדה", check: "מה לבדוק" }, { stance: "חסר" }] },
          items: [item({ flags: ["study", "bogus"] }), item({ id: "i2", opinion: true, hedged: true })],
        },
      ],
    };
    const s = parseLatest(raw).stories[0]!;
    expect(s.items[0]!.flags).toEqual(["study"]);
    expect(s.items[1]!.flags).toEqual(["opinion", "hedged"]);
    expect(s.insights).toEqual({ questions: ["מה הרקע?"], viewpoints: [{ stance: "עמדה", check: "מה לבדוק" }] });
  });
});

describe("display", () => {
  it("shows the Hebrew translation of a foreign item, marked as AI", () => {
    const en = profile("bbc", null, "bbc", "en");
    const t = itemText(item({ title: "Hello", title_he: "שלום", summary_he: "" }) as Story["items"][number], en);
    expect(t).toMatchObject({ title: "שלום", lang: "he", ai: true, originalTitle: "Hello" });
    expect(itemText(item() as Story["items"][number], profile("ynet", null)).ai).toBe(false);
  });

  it("geminiPrompt includes the question, title and link", () => {
    const p = geminiPrompt("כותרת", "https://x.com/a", "מה הרקע?");
    expect(p).toContain("מה הרקע?");
    expect(p).toContain("https://x.com/a");
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
