// בדיקת פידים: מושך כל פיד ב-sources.json ומדווח אם עובד, כמה ידיעות, ומה הכותרת הראשונה.
// הרצה:  node src/check-feeds.ts            (דיווח בלבד)
//        node src/check-feeds.ts --update   (גם מעדכן feed_checked לפידים שעובדים)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describeError, fetchFeed } from "./fetch-feed.ts";
import { cleanText, parseDate } from "./normalize.ts";
import { parseFeed } from "./parse.ts";
import type { Source } from "./types.ts";

const SOURCES_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "sources.json");
const STALE_HOURS = 72;

type Result = { id: string; ok: boolean; items?: number; firstTitle?: string; newest?: Date; stale?: boolean; error?: string; redirect?: string };

async function check(src: Source): Promise<Result> {
  if (!/^https?:\/\//.test(src.feed)) return { id: src.id, ok: false, error: `אין כתובת פיד: "${src.feed}"` };
  try {
    const { xml, finalUrl } = await fetchFeed(src.feed);
    const redirect = finalUrl !== src.feed ? finalUrl : undefined;
    const items = parseFeed(xml);
    if (!items.length) return { id: src.id, ok: false, redirect, error: "לא נמצאו ידיעות (אולי לא RSS)" };
    const dates = items.map((i) => parseDate(i.date)).filter((d): d is Date => !!d);
    const newest = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined;
    const stale = newest ? Date.now() - newest.getTime() > STALE_HOURS * 3600_000 : undefined;
    return { id: src.id, ok: true, items: items.length, firstTitle: cleanText(items[0].title), newest, stale, redirect };
  } catch (e) {
    return { id: src.id, ok: false, error: describeError(e) };
  }
}

const data = JSON.parse(readFileSync(SOURCES_PATH, "utf8")) as { sources: Source[] };
const results = await Promise.all(data.sources.map(check));

for (const r of results) {
  const mark = r.ok ? (r.stale ? "~" : "✓") : "✗";
  const line = r.ok
    ? `${r.items} ידיעות | אחרונה: ${r.newest?.toISOString() ?? "?"}${r.stale ? " (ישן!)" : ""} | "${r.firstTitle?.slice(0, 80)}"`
    : r.error;
  console.log(`${mark} ${r.id.padEnd(12)} ${line}${r.redirect ? `  → הופנה ל-${r.redirect}` : ""}`);
}
const okCount = results.filter((r) => r.ok && !r.stale).length;
console.log(`\n${okCount}/${results.length} פידים עובדים ועדכניים`);

if (process.argv.includes("--update")) {
  const today = new Date().toISOString().slice(0, 10);
  for (const src of data.sources) {
    const r = results.find((x) => x.id === src.id)!;
    if (r.ok && !r.stale) src.feed_checked = today;
  }
  writeFileSync(SOURCES_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`sources.json עודכן (feed_checked = ${today})`);
}
