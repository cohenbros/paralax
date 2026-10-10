import assert from "node:assert/strict";
import { test } from "node:test";
import { collectQuotes, extractQuote, isOffensive } from "../src/quotes.ts";
import { isHedged, isOpinion } from "../src/signals.ts";
import { buildStories } from "../src/stories.ts";
import { extractText, isCleanHebrew } from "../src/gemini.ts";
import { validateInsights } from "../src/insights.ts";
import { isClickbaitHeadline, itemFlags } from "../src/signals.ts";
import type { Item, Source } from "../src/types.ts";

test("isOpinion: נתיב או תגית של דעות", () => {
  assert.equal(isOpinion("https://www.theguardian.com/commentisfree/2026/oct/09/x", []), true);
  assert.equal(isOpinion("https://www.nytimes.com/2026/10/09/opinion/x.html", []), true);
  assert.equal(isOpinion("https://www.ynet.co.il/news/article/abc", ["דעות"]), true);
  assert.equal(isOpinion("https://www.ynet.co.il/news/article/abc", ["חדשות"]), false);
});

test("isHedged: דיווח לא מאושר", () => {
  assert.equal(isHedged("לפי דיווחים זרים: ישראל תקפה בסוריה", ""), true);
  assert.equal(isHedged("Iran reportedly moved missiles", ""), true);
  assert.equal(isHedged("أنباء عن انفجار قرب مطار عدن", ""), true);
  assert.equal(isHedged("הממשלה אישרה את התקציב", ""), false);
});

test("extractQuote: דובר וציטוט מתוך כותרת", () => {
  assert.deepEqual(extractQuote('יאיר גולן: "חד-משמעית - חיסול חמינאי האב היה טעות"'), {
    speaker: "יאיר גולן",
    text: "חד-משמעית - חיסול חמינאי האב היה טעות",
  });
  assert.deepEqual(extractQuote('גולן על חיסול חמינאי האב: "טעות שלא משרתת את האינטרס הישראלי"'), {
    speaker: "גולן",
    text: "טעות שלא משרתת את האינטרס הישראלי",
  });
  assert.equal(extractQuote('צפו: "רגע הפיצוץ"'), null);
  assert.equal(extractQuote("5 מפלגות צמודות בראש"), null);
  assert.equal(extractQuote('"שישראל תלך להז****": מפגן האנטישמיות'), null);
});

test("isOffensive: מילה שלמה בלבד", () => {
  assert.equal(isOffensive("איזה מניאק"), true);
  assert.equal(isOffensive("שישראל תלך לה****ן"), true);
  assert.equal(isOffensive("מזונה ומשקה לכולם"), false);
});

test("collectQuotes: דובר אחד פעם אחת, סימון AI לתרגום", () => {
  const quotes = collectQuotes([
    { id: "a", title: 'נתניהו: "לא נוותר"', ai: false },
    { id: "b", title: 'נתניהו: "נמשיך עד הסוף"', ai: false },
    { id: "c", title: 'Rubio: "Sanctions will continue"', ai: true },
    { id: "d", title: 'בנימין נתניהו: "אמירה נוספת"', ai: false },
  ]);
  assert.deepEqual(quotes, [
    { speaker: "נתניהו", text: "לא נוותר", item: "a" },
    { speaker: "Rubio", text: "Sanctions will continue", item: "c", ai: true },
  ]);
});

test("extractText: טקסט מתוך תשובת Interactions API", () => {
  const body = { steps: [{ type: "user_input" }, { type: "model_output", content: [{ type: "text", text: '{"items":[]}' }] }] };
  assert.equal(extractText(body), '{"items":[]}');
  assert.equal(extractText({}), "");
});

test("buildStories: כתבה מחו\"ל מצטרפת לאירוע ישראלי דרך התרגום, והכותרת בעברית", () => {
  const src = (id: string, language: string, region: "il" | "world", owner_group = id) =>
    ({ id, language, region, owner_group }) as Source;
  const sources = new Map([
    ["ynet", src("ynet", "he", "il")],
    ["bbc", src("bbc", "en", "world")],
  ]);
  const t = "2026-10-09T10:00:00.000Z";
  const item = (o: Partial<Item>): Item => ({
    id: "x", source: "ynet", title: "", summary: "", url: "https://x", published: t, category: "עולם", sponsored: false, ...o,
  });
  const items = [
    item({ id: "b1", source: "bbc", title: "Navi Pillay wins Nobel Peace Prize", title_he: "נאבי פילאי זוכה בפרס נובל לשלום" }),
    item({ id: "y1", title: "פרס נובל לשלום יוענק לנאבי פילאי" }),
    item({ id: "b2", source: "bbc", title: "Renoir paintings recovered", title_he: "ציורי רנואר שנגנבו נמצאו" }),
  ];
  const stories = buildStories(items, sources);
  const nobel = stories.find((s) => s.items.length === 2)!;
  assert.equal(nobel.title, "פרס נובל לשלום יוענק לנאבי פילאי");
  assert.equal(nobel.title_ai, undefined);
  assert.equal(nobel.independent_sources, 2);
  const renoir = stories.find((s) => s.id === "b2")!;
  assert.equal(renoir.title, "ציורי רנואר שנגנבו נמצאו");
  assert.equal(renoir.title_ai, true);
  assert.equal(renoir.lang, "he");
});

test("isCleanHebrew: דוחה תרגום עם אותיות מכתב אחר", () => {
  assert.equal(isCleanHebrew("רעידת אדמה בעוצמה 7.7 פוגעת בפנמה"), true);
  assert.equal(isCleanHebrew("טראמפ בוחר בפרשנית קייטי זכריה (CNN) לדוברת"), true);
  assert.equal(isCleanHebrew("רช่วยון אוקראיניים"), false);
  assert.equal(isCleanHebrew("סואيلا ברוורמן"), false);
  assert.equal(isCleanHebrew("Panama earthquake"), false);
});

test("itemFlags: מקורות אנונימיים, מחקר, תיעוד מהרשת, כותרת מתלהמת", () => {
  const u = "https://www.ynet.co.il/news/article/x";
  assert.deepEqual(itemFlags(u, [], "גורם בכיר: ההחלטה תתקבל השבוע", ""), ["anonymous"]);
  assert.deepEqual(itemFlags(u, [], "לפי מחקר חדש, קפה מאריך חיים", ""), ["study"]);
  assert.deepEqual(itemFlags(u, [], "בסקר: רוב הציבור תומך", ""), ["study"]);
  assert.deepEqual(itemFlags(u, [], "צפו: הרגע שבו הגשר קרס", ""), ["social"]);
  assert.deepEqual(itemFlags(u, [], "דרמה בכנסת: החוק נפל", ""), ["sensational"]);
  assert.deepEqual(itemFlags(u, [], "Officials said the deal is close, reportedly", ""), ["hedged", "anonymous"]);
  assert.deepEqual(itemFlags(u, [], "הממשלה אישרה את התקציב", "החוקרים במשטרה בודקים"), []);
  assert.deepEqual(itemFlags("https://www.nytimes.com/2026/10/09/opinion/x.html", [], "Why we must act", ""), ["opinion"]);
});

test("validateInsights: מסנן טקסט פגום ושומר רק חלקים שלמים", () => {
  const good = {
    questions: ["מתי נמדד שיא החום בישראל?", "מה ההבדל בין מזג אוויר לאקלים?", "רช่วยון לא תקין?"],
    viewpoints: [
      { stance: "כל שנה אומרים את זה, וזה פשוט מזג אוויר רגיל לעונה", check: "השוואה לממוצע הרב-שנתי של אותו חודש" },
      { stance: "זו התחממות גלובלית", check: "מגמות של עשרות שנים ולא יום בודד" },
    ],
  };
  const v = validateInsights(good)!;
  assert.equal(v.questions.length, 2);
  assert.equal(v.viewpoints.length, 2);
  // עמדה אחת בלבד לא מספיקה להשוואה – לא מציגים עמדות
  assert.deepEqual(validateInsights({ questions: good.questions.slice(0, 2), viewpoints: good.viewpoints.slice(0, 1) })!.viewpoints, []);
  const empty = { v: 2, kind: "news", questions: [], viewpoints: [] };
  assert.deepEqual(validateInsights({ questions: ["?"], viewpoints: [] }), empty);
  assert.deepEqual(validateInsights({ questions: "junk", viewpoints: null }), empty);
});

test("validateInsights: סיווג – פיתיון ולא-חדשות בלי שאלות; סיווג לא מוכר נחשב חדשות", () => {
  assert.deepEqual(validateInsights({ kind: "clickbait", questions: ["מה הרקע לאירוע?", "מה זה?"] }), {
    v: 2, kind: "clickbait", questions: [], viewpoints: [],
  });
  assert.equal(validateInsights({ kind: "not_news" })!.kind, "not_news");
  assert.equal(validateInsights({ kind: "weird" })!.kind, "news");
});

test("isClickbaitHeadline: כותרות פיתיון מובהקות בלבד", () => {
  assert.equal(isClickbaitHeadline("הוא פתח את הדלת ולא תאמינו מה הוא ראה"), true);
  assert.equal(isClickbaitHeadline("זו הסיבה שאתם מתעוררים עייפים"), true);
  assert.equal(isClickbaitHeadline("You won't believe what this dog did"), true);
  assert.equal(isClickbaitHeadline("הממשלה אישרה את התקציב"), false);
  assert.equal(isClickbaitHeadline("דרמה בכנסת: החוק נפל"), false);
});
