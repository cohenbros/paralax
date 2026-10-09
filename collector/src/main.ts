// מנגנון האיסוף: sources.json → פידים → ידיעות מנורמלות → אירועים → site/data/latest.json + sources.json
// הרצה: node src/main.ts
// משתני סביבה:
//   OUT_DIR                – תיקיית הפלט (ברירת מחדל: <repo>/site)
//   PREVIOUS_LATEST_URL    – כתובת latest.json שפורסם בריצה הקודמת (כדי לשמור 48 שעות גם כשהפיד קצר)
//   COLLECTOR_CONTACT_URL  – קישור למאגר, נכנס ל-User-Agent
//   GEMINI_API_KEY         – לתרגום כותרות לעברית (אופציונלי; בלעדיו מדלגים על התרגום)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describeError, fetchFeed } from "./fetch-feed.ts";
import { cleanText, detectCategory, fixLink, itemId, parseDate, resolvePublished, truncate } from "./normalize.ts";
import { parseFeed } from "./parse.ts";
import { isHedged, isOpinion } from "./signals.ts";
import { isSponsored } from "./sponsored.ts";
import { buildStories } from "./stories.ts";
import { translateToHebrew } from "./translate.ts";
import type { Item, Latest, Source } from "./types.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT_DIR = process.env.OUT_DIR ?? join(REPO, "site");
const WINDOW_HOURS = 48;

export function loadSources(): Source[] {
  return (JSON.parse(readFileSync(join(REPO, "sources.json"), "utf8")) as { sources: Source[] }).sources;
}

export function isFetchable(s: Source): boolean {
  return /^https?:\/\//.test(s.feed) && s.feed_terms_ok !== false;
}

async function loadPrevious(): Promise<Item[]> {
  try {
    let data: Latest;
    if (process.env.PREVIOUS_LATEST_URL) {
      const res = await fetch(process.env.PREVIOUS_LATEST_URL, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = (await res.json()) as Latest;
    } else {
      const file = join(OUT_DIR, "data", "latest.json");
      if (!existsSync(file)) return [];
      data = JSON.parse(readFileSync(file, "utf8")) as Latest;
    }
    return data.stories.flatMap((s) => s.items);
  } catch (e) {
    console.warn(`לא נטען latest.json קודם: ${describeError(e)}`);
    return [];
  }
}

async function collectSource(src: Source, now: Date, prevById: Map<string, Item>): Promise<Item[]> {
  const { xml } = await fetchFeed(src.feed);
  const items: Item[] = [];
  for (const raw of parseFeed(xml)) {
    const title = cleanText(raw.title);
    const url = fixLink(cleanText(raw.link), src.site);
    if (!title || !url) continue;
    let summary = truncate(cleanText(raw.description));
    if (summary === title || title.startsWith(summary.replace(/…$/, ""))) summary = "";
    const id = itemId(url);
    const prev = prevById.get(id);
    const categories = raw.categories.map(cleanText);
    // תרגום קודם נשמר כל עוד הכותרת לא השתנתה
    const keepTranslation = prev?.title === title && prev.title_he;
    items.push({
      id,
      source: src.id,
      title,
      summary,
      url,
      published: resolvePublished(parseDate(raw.date), now, prev?.published),
      category: detectCategory(raw, url, src),
      sponsored: isSponsored({ title, summary, categories, author: cleanText(raw.author), url }),
      ...(isOpinion(url, categories) ? { opinion: true as const } : {}),
      ...(isHedged(title, summary) ? { hedged: true as const } : {}),
      ...(keepTranslation ? { title_he: prev.title_he, summary_he: prev.summary_he ?? "" } : {}),
    });
  }
  return items;
}

// פרופילים לתצוגה: בלי שדות פנימיים, וערך שמסומן "לאמת" לא מתפרסם
function publicSources(sources: Source[]) {
  const verified = <T>(v: T): T | null => (typeof v === "string" && v.includes("לאמת") ? null : v);
  return {
    version: 1,
    sources: sources.map((s) => ({
      id: s.id,
      name: s.name,
      site: s.site,
      language: s.language,
      region: s.region,
      owner_group: s.owner_group,
      owner: verified(s.owner),
      funding: verified(s.funding),
      press_council_member: s.press_council_member,
      corrections_policy_url: s.corrections_policy_url,
      ifcn_signatory: s.ifcn_signatory,
      audience_lean: s.audience_lean,
      evidence_urls: s.evidence_urls,
    })),
  };
}

async function main() {
  const now = new Date();
  const sources = loadSources();
  const byId = new Map(sources.map((s) => [s.id, s]));
  const previous = (await loadPrevious()).filter((it) => byId.has(it.source));
  const prevById = new Map(previous.map((it) => [it.id, it]));

  const active = sources.filter(isFetchable);
  const results = await Promise.allSettled(active.map((s) => collectSource(s, now, prevById)));
  const failed: string[] = [];
  const fresh = new Map<string, Item>();
  results.forEach((r, i) => {
    const src = active[i];
    if (r.status === "fulfilled") {
      for (const it of r.value) if (!fresh.has(it.id)) fresh.set(it.id, it);
      console.log(`✓ ${src.id.padEnd(12)} ${r.value.length}`);
    } else {
      failed.push(src.id);
      console.log(`✗ ${src.id.padEnd(12)} ${describeError(r.reason)}`);
    }
  });

  // ידיעות מהריצה הקודמת שכבר ירדו מהפיד נשמרות עד שיוצאות מחלון ה-48 שעות
  for (const it of previous) if (!fresh.has(it.id)) fresh.set(it.id, it);
  const cutoff = now.getTime() - WINDOW_HOURS * 3600_000;
  const items = [...fresh.values()].filter((it) => Date.parse(it.published) >= cutoff);

  // תרגום לעברית רק לידיעות חדשות (או שהכותרת שלהן השתנתה), החדשות ביותר קודם
  const untranslated = items
    .filter((it) => byId.get(it.source)!.language !== "he" && !it.title_he)
    .sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  const translations = await translateToHebrew(
    untranslated.map((it) => ({ id: it.id, title: it.title, summary: it.summary, lang: byId.get(it.source)!.language })),
  );
  for (const it of items) {
    const t = translations.get(it.id);
    if (t) Object.assign(it, { title_he: t.title, summary_he: t.summary });
  }
  if (untranslated.length) console.log(`תורגמו ${translations.size}/${untranslated.length} ידיעות`);

  const stories = buildStories(items, byId);
  const latest: Latest = {
    version: 1,
    generated_at: now.toISOString(),
    window_hours: WINDOW_HOURS,
    failed_sources: failed,
    stories,
  };

  mkdirSync(join(OUT_DIR, "data"), { recursive: true });
  writeFileSync(join(OUT_DIR, "data", "latest.json"), JSON.stringify(latest));
  writeFileSync(join(OUT_DIR, "data", "sources.json"), JSON.stringify(publicSources(sources)));

  const multi = stories.filter((s) => s.independent_sources > 1).length;
  const size = Buffer.byteLength(JSON.stringify(latest));
  console.log(
    `\n${items.length} ידיעות → ${stories.length} אירועים (${multi} עם יותר ממקור אחד), ` +
      `${failed.length} מקורות נכשלו, ${(size / 1024).toFixed(0)}KB`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
