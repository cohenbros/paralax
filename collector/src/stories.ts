// בניית אירועים מידיעות: קיבוץ (גם בין שפות, דרך התרגום לעברית), בחירת כותרת מובילה, ציטוטים
import { cluster } from "./cluster.ts";
import { collectQuotes } from "./quotes.ts";
import type { Item, Source, Story } from "./types.ts";

// הטקסט שלפיו מקבצים: עברית מקורית או תרגום לעברית, כך שכתבה מחו"ל מצטרפת לאירוע ישראלי
function clusterKey(it: Item, src: Source): { title: string; lang: string } {
  if (src.language === "he") return { title: it.title, lang: "he" };
  if (it.title_he) return { title: it.title_he, lang: "he" };
  return { title: it.title, lang: src.language };
}

// כותרת מובילה: עדיפות לכתבה חדשותית (לא ממומנת, לא דעה) שנכתבה בעברית, אחר כך מתורגמת, אחר כך כל השאר
function pickLead(members: Item[], sources: Map<string, Source>): Item {
  const news = members.filter((m) => !m.sponsored && !m.opinion);
  const pool = news.length ? news : members;
  return (
    pool.find((m) => sources.get(m.source)!.language === "he") ??
    pool.find((m) => m.title_he) ??
    pool[0]
  );
}

function majority<T extends string>(values: T[]): T {
  const votes = new Map<T, number>();
  for (const v of values) votes.set(v, (votes.get(v) ?? 0) + 1);
  return [...votes].sort((a, b) => b[1] - a[1])[0][0];
}

export function buildStories(items: Item[], sources: Map<string, Source>): Story[] {
  const groups = cluster(
    items.map((it) => ({ item: it, ...clusterKey(it, sources.get(it.source)!), time: Date.parse(it.published) })),
  );
  return groups
    .map((g): Story => {
      const members = g.sort((a, b) => a.time - b.time).map((m) => m.item);
      const lead = pickLead(members, sources);
      const leadSrc = sources.get(lead.source)!;
      const translated = leadSrc.language !== "he" && !!lead.title_he;
      const owners = new Set(members.map((m) => sources.get(m.source)!.owner_group));
      const quotes = collectQuotes(
        members.map((m) => ({ id: m.id, title: m.title_he ?? m.title, ai: !!m.title_he })),
      );
      return {
        id: lead.id,
        lang: translated ? "he" : leadSrc.language,
        ...(translated ? { title_ai: true as const } : {}),
        category: majority(members.map((m) => m.category)),
        title: translated ? lead.title_he! : lead.title,
        summary: translated ? (lead.summary_he ?? "") : lead.summary,
        updated: members[members.length - 1].published,
        independent_sources: owners.size,
        regions: [...new Set(members.map((m) => sources.get(m.source)!.region))],
        ...(quotes.length ? { quotes } : {}),
        items: [...members].reverse(),
      };
    })
    .sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated));
}
