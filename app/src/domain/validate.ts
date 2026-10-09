// אימות הנתונים שמגיעים מהרשת (או מהמטמון) לפני שהם נכנסים לאפליקציה.
// רשומה פגומה נזרקת; קובץ בגרסה לא מוכרת נדחה כולו.

import { isSafeHttpUrl } from "./links";
import { DATA_VERSION, EVIDENCE_FIELDS, type EvidenceField, type Item, type Latest, type Quote, type Region, type SourceProfile, type Story } from "./types";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === "string";
const strOrNull = (v: unknown): string | null => (str(v) ? v : null);
const boolOrNull = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const isDate = (v: unknown): v is string => str(v) && !Number.isNaN(Date.parse(v));
const isRegion = (v: unknown): v is Region => v === "il" || v === "world";

export class DataFormatError extends Error {}

function parseItem(v: unknown): Item | null {
  if (!isObj(v)) return null;
  const { id, source, title, summary, url, published, category, sponsored, title_he, summary_he } = v;
  if (!str(id) || !str(source) || !str(title) || !title || !isSafeHttpUrl(url) || !isDate(published)) return null;
  return {
    id,
    source,
    title,
    summary: str(summary) ? summary : "",
    url,
    published,
    category: str(category) ? category : "",
    sponsored: sponsored === true,
    ...(str(title_he) && title_he ? { title_he, summary_he: str(summary_he) ? summary_he : "" } : {}),
    opinion: v.opinion === true,
    hedged: v.hedged === true,
  };
}

function parseQuote(v: unknown, itemIds: Set<string>): Quote | null {
  if (!isObj(v) || !str(v.speaker) || !str(v.text) || !str(v.item) || !itemIds.has(v.item)) return null;
  return { speaker: v.speaker, text: v.text, item: v.item, ai: v.ai === true };
}

function parseStory(v: unknown): Story | null {
  if (!isObj(v) || !Array.isArray(v.items)) return null;
  const items = v.items.map(parseItem).filter((i): i is Item => i !== null);
  const { id, lang, category, title, summary, updated, independent_sources } = v;
  if (!items.length || !str(id) || !str(title) || !isDate(updated)) return null;
  const itemIds = new Set(items.map((i) => i.id));
  return {
    id,
    lang: str(lang) ? lang : "he",
    title_ai: v.title_ai === true,
    category: str(category) ? category : "",
    title,
    summary: str(summary) ? summary : "",
    updated,
    independent_sources: typeof independent_sources === "number" && independent_sources >= 1 ? independent_sources : 1,
    regions: Array.isArray(v.regions) ? v.regions.filter(isRegion) : [],
    quotes: Array.isArray(v.quotes) ? v.quotes.map((q) => parseQuote(q, itemIds)).filter((q): q is Quote => q !== null) : [],
    items,
  };
}

export function parseLatest(raw: unknown): Latest {
  if (!isObj(raw) || raw.version !== DATA_VERSION || !Array.isArray(raw.stories)) {
    throw new DataFormatError("latest.json בפורמט לא מוכר");
  }
  return {
    version: DATA_VERSION,
    generated_at: isDate(raw.generated_at) ? raw.generated_at : new Date(0).toISOString(),
    window_hours: typeof raw.window_hours === "number" ? raw.window_hours : 48,
    failed_sources: Array.isArray(raw.failed_sources) ? raw.failed_sources.filter(str) : [],
    stories: raw.stories.map(parseStory).filter((s): s is Story => s !== null),
  };
}

function parseEvidence(v: unknown): Partial<Record<EvidenceField, string>> {
  if (!isObj(v)) return {};
  const out: Partial<Record<EvidenceField, string>> = {};
  for (const f of EVIDENCE_FIELDS) {
    const url = v[f];
    if (isSafeHttpUrl(url)) out[f] = url;
  }
  return out;
}

function parseSource(v: unknown): SourceProfile | null {
  if (!isObj(v) || !str(v.id) || !str(v.name) || !isSafeHttpUrl(v.site)) return null;
  const lean = isObj(v.audience_lean) ? v.audience_lean : {};
  const leanEvidence = strOrNull(lean.evidence_url);
  const corrections = strOrNull(v.corrections_policy_url);
  return {
    id: v.id,
    name: v.name,
    site: v.site,
    language: str(v.language) ? v.language : "he",
    region: isRegion(v.region) ? v.region : "il",
    owner_group: str(v.owner_group) ? v.owner_group : v.id,
    owner: strOrNull(v.owner),
    funding: strOrNull(v.funding),
    press_council_member: boolOrNull(v.press_council_member),
    corrections_policy_url: isSafeHttpUrl(corrections) ? corrections : null,
    ifcn_signatory: boolOrNull(v.ifcn_signatory),
    audience_lean: {
      range: strOrNull(lean.range),
      evidence_url: isSafeHttpUrl(leanEvidence) ? leanEvidence : null,
    },
    evidence: parseEvidence(v.evidence),
    evidence_urls: Array.isArray(v.evidence_urls) ? v.evidence_urls.filter(isSafeHttpUrl) : [],
  };
}

export function parseSources(raw: unknown): Record<string, SourceProfile> {
  if (!isObj(raw) || raw.version !== DATA_VERSION || !Array.isArray(raw.sources)) {
    throw new DataFormatError("sources.json בפורמט לא מוכר");
  }
  const out: Record<string, SourceProfile> = {};
  for (const s of raw.sources.map(parseSource)) if (s) out[s.id] = s;
  return out;
}
