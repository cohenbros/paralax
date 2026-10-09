/// <reference types="node" />
// חוזה בין האוסף לאפליקציה: הפלט האמיתי של collector עובר את האימות בלי לאבד ידיעות.
// רץ רק אם קיים פלט מקומי (cd collector && npm run collect), אחרת מדולג.
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { parseLatest, parseSources } from "../validate";

const dataDir = join(__dirname, "..", "..", "..", "..", "site", "data");
const hasData = existsSync(join(dataDir, "latest.json")) && existsSync(join(dataDir, "sources.json"));
const read = (name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf8"));

(hasData ? describe : describe.skip)("collector output contract", () => {
  it("latest.json is accepted in full", () => {
    const raw = read("latest.json");
    const parsed = parseLatest(raw);
    expect(parsed.stories).toHaveLength(raw.stories.length);
    const rawItems = raw.stories.reduce((n: number, s: { items: unknown[] }) => n + s.items.length, 0);
    expect(parsed.stories.reduce((n, s) => n + s.items.length, 0)).toBe(rawItems);
  });

  it("sources.json is accepted in full, and every story source has a profile", () => {
    const raw = read("sources.json");
    const sources = parseSources(raw);
    expect(Object.keys(sources)).toHaveLength(raw.sources.length);
    for (const story of parseLatest(read("latest.json")).stories) {
      for (const item of story.items) expect(sources[item.source]).toBeDefined();
    }
  });
});
