// קיבוץ ידיעות לאירועים: דמיון מילים בכותרת (משוקלל לפי נדירות המילה), בתוך אותה שפה, בחלון של 36 שעות.

export const WINDOW_MS = 36 * 3600_000;
export const THRESHOLD = 0.3;

const STOPWORDS: Record<string, Set<string>> = {
  he: new Set(
    "של את על עם זה זו לא כי אם או גם רק כל יותר אחרי לפני בין אל עד מה מי איך למה הוא היא הם הן אני אנחנו יש אין היה היו יהיה כך כמו אחד אחת שני שתי בו בה לו לה להם עוד כבר מול נגד תחת ללא בלי אבל אך ועוד דרך אצל ליד כדי מאוד שלא".split(" "),
  ),
  en: new Set(
    "a an the of to in on at for from by with and or but is are was were be been being it its this that these those as after before over under into about than then he she they we you i his her their our not no new says said say will would could can may might has have had do does did up out more most".split(" "),
  ),
  ar: new Set("في من على إلى عن مع أن إن ما لا هذا هذه التي الذي بعد قبل بين حول كان كانت قد ثم أو و".split(" ")),
};

// אותיות שימוש בתחילת מילה בעברית ("והממשלה" ↔ "ממשלה"), ו"ال"/"و"/"ب" בערבית
const HE_PREFIX = /^[והבלמשכ]/;
const AR_PREFIX = /^(وال|بال|فال|كال|لل|ال|و|ب|ف|ل)/;

function variants(token: string, lang: string): string[] {
  const out = [token];
  let t = token;
  for (let i = 0; i < 2; i++) {
    const re = lang === "he" ? HE_PREFIX : lang === "ar" ? AR_PREFIX : null;
    if (!re) break;
    const stripped = t.replace(re, "");
    if (stripped === t || stripped.length < 3) break;
    out.push(stripped);
    t = stripped;
  }
  if (lang === "en" && token.length > 4 && token.endsWith("s")) out.push(token.slice(0, -1));
  return out;
}

export type Tokens = { words: string[]; forms: Set<string> };

export function tokenize(title: string, lang: string): Tokens {
  const stop = STOPWORDS[lang] ?? new Set<string>();
  const words = title
    .toLowerCase()
    .replace(/["'״׳`’‘]/g, "") // נתב"ג → נתבג
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 2 && !stop.has(w));
  const unique = [...new Set(words)];
  const forms = new Set(unique.flatMap((w) => variants(w, lang)));
  return { words: unique, forms };
}

// משקל IDF לכל צורה: מילים נפוצות ("ישראל", "נתניהו") שוות פחות
export function buildIdf(docs: Tokens[]): (form: string) => number {
  const df = new Map<string, number>();
  for (const d of docs) for (const f of d.forms) df.set(f, (df.get(f) ?? 0) + 1);
  const n = docs.length || 1;
  return (f) => Math.log(1 + n / (df.get(f) ?? 1));
}

function wordWeight(w: string, lang: string, idf: (f: string) => number): number {
  return Math.min(...variants(w, lang).map(idf));
}

export function similarity(a: Tokens, b: Tokens, lang: string, idf: (f: string) => number): number {
  if (!a.words.length || !b.words.length) return 0;
  let matched = 0;
  let count = 0;
  for (const w of a.words) {
    if (variants(w, lang).some((v) => b.forms.has(v))) {
      matched += wordWeight(w, lang, idf);
      count++;
    }
  }
  if (count < 2) return 0;
  const wa = a.words.reduce((s, w) => s + wordWeight(w, lang, idf), 0);
  const wb = b.words.reduce((s, w) => s + wordWeight(w, lang, idf), 0);
  return matched / Math.sqrt(wa * wb);
}

export type Clusterable = { title: string; lang: string; time: number };

// קיבוץ חמדני לפי סדר זמן: כל ידיעה מצטרפת לקבוצה הדומה ביותר (single-link) אם עברה את הסף
export function cluster<T extends Clusterable>(items: T[], threshold = THRESHOLD): T[][] {
  const byLang = new Map<string, T[]>();
  for (const it of items) byLang.set(it.lang, [...(byLang.get(it.lang) ?? []), it]);

  const result: T[][] = [];
  for (const [lang, group] of byLang) {
    const sorted = [...group].sort((x, y) => x.time - y.time);
    const toks = new Map(sorted.map((it) => [it, tokenize(it.title, lang)]));
    const idf = buildIdf([...toks.values()]);
    const clusters: { members: T[]; last: number }[] = [];
    for (const it of sorted) {
      const t = toks.get(it)!;
      let best: (typeof clusters)[number] | null = null;
      let bestScore = threshold;
      for (const c of clusters) {
        if (it.time - c.last > WINDOW_MS) continue;
        for (const m of c.members) {
          if (it.time - m.time > WINDOW_MS) continue;
          const s = similarity(t, toks.get(m)!, lang, idf);
          if (s >= bestScore) {
            bestScore = s;
            best = c;
          }
        }
      }
      if (best) {
        best.members.push(it);
        best.last = Math.max(best.last, it.time);
      } else {
        clusters.push({ members: [it], last: it.time });
      }
    }
    result.push(...clusters.map((c) => c.members));
  }
  return result;
}
