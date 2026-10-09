import assert from "node:assert/strict";
import { test } from "node:test";
import { cluster } from "../src/cluster.ts";
import { cleanText, fixLink, parseDate, resolvePublished, truncate } from "../src/normalize.ts";
import { parseFeed } from "../src/parse.ts";
import { isSponsored } from "../src/sponsored.ts";

test("parseDate: RFC 822, ISO, ופורמט ערב 48 בשעון ישראל", () => {
  assert.equal(parseDate("Fri, 09 Oct 2026 16:18:23 GMT")?.toISOString(), "2026-10-09T16:18:23.000Z");
  assert.equal(parseDate("2026-10-09T15:54:00+02:00")?.toISOString(), "2026-10-09T13:54:00.000Z");
  // אוקטובר – שעון קיץ ישראל (UTC+3)
  assert.equal(parseDate("09/10/2026 - 19:12")?.toISOString(), "2026-10-09T16:12:00.000Z");
  // ינואר – שעון חורף (UTC+2)
  assert.equal(parseDate("15/01/2027 - 08:00")?.toISOString(), "2027-01-15T06:00:00.000Z");
  assert.equal(parseDate("לא תאריך"), null);
});

test("resolvePublished: תאריך עתידי או חסר → זמן האיסוף; תאריך קודם נשמר", () => {
  const now = new Date("2026-10-09T17:00:00Z");
  assert.equal(resolvePublished(new Date("2026-10-10T17:00:00Z"), now), now.toISOString());
  assert.equal(resolvePublished(null, now), now.toISOString());
  assert.equal(resolvePublished(new Date("2026-10-09T10:00:00Z"), now), "2026-10-09T10:00:00.000Z");
  assert.equal(resolvePublished(null, now, "2026-10-08T00:00:00.000Z"), "2026-10-08T00:00:00.000Z");
});

test("fixLink: מוסיף / חסר אחרי הדומיין ומקודד תווים", () => {
  const fixed = fixLink("http://www.arab48.comأخبار/2026/10/09/خبر", "https://www.arab48.com");
  assert.ok(fixed?.startsWith("http://www.arab48.com/%D8%A3"));
  assert.equal(fixLink("/news/1", "https://www.ynet.co.il"), "https://www.ynet.co.il/news/1");
  assert.equal(fixLink("https://www.bbc.com/news/x", "https://www.bbc.com/news"), "https://www.bbc.com/news/x");
  assert.equal(fixLink("javascript:alert(1)", "https://x.com"), null);
});

test("cleanText ו-truncate", () => {
  assert.equal(cleanText("<![CDATA[<p>שלום &amp; <b>עולם</b></p>]]>"), "שלום & עולם");
  assert.equal(cleanText("&lt;p&gt;a&amp;nbsp;b&lt;/p&gt;"), "a b");
  assert.equal(cleanText("&#1601;&#1585;"), "فر");
  const long = "מילה ".repeat(100);
  const t = truncate(long);
  assert.ok(t.length <= 200 && t.endsWith("…"));
});

test("isSponsored: ביטויים, נתיבים, ובלי false positive על 'בשיתוף פעולה'", () => {
  const base = { title: "", summary: "", categories: [] as string[], author: "", url: "https://x.co.il/news/1" };
  assert.equal(isSponsored({ ...base, title: "החופשה המושלמת | תוכן שיווקי" }), true);
  assert.equal(isSponsored({ ...base, title: "בשיתוף בנק הפועלים: כך תחסכו" }), true);
  assert.equal(isSponsored({ ...base, url: "https://x.com/sponsored/abc" }), true);
  assert.equal(isSponsored({ ...base, summary: "In partnership with Acme" }), true);
  assert.equal(isSponsored({ ...base, title: "ישראל ומצרים בשיתוף פעולה ביטחוני" }), false);
  assert.equal(isSponsored({ ...base, title: "כפי שדווח מקודם, הממשלה התכנסה" }), false);
  assert.equal(isSponsored({ ...base, title: "Sponsorship deal collapses" }), false);
});

test("parseFeed: RSS, Atom ו-RDF", () => {
  const rss = `<?xml version="1.0"?><rss><channel>
    <item><title><![CDATA[כותרת]]></title><link>https://a.co.il/1</link><description>&lt;p&gt;תקציר&lt;/p&gt;</description>
    <pubDate>Fri, 09 Oct 2026 16:18:23 GMT</pubDate><category>ספורט</category></item></channel></rss>`;
  const [r] = parseFeed(rss);
  assert.equal(cleanText(r.title), "כותרת");
  assert.equal(r.link, "https://a.co.il/1");
  assert.equal(cleanText(r.description), "תקציר");
  assert.deepEqual(r.categories, ["ספורט"]);

  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>T</title>
    <link rel="alternate" href="https://b.com/2"/><updated>2026-10-09T10:00:00Z</updated><summary>S</summary></entry></feed>`;
  const [a] = parseFeed(atom);
  assert.equal(a.link, "https://b.com/2");
  assert.equal(a.date, "2026-10-09T10:00:00Z");

  const rdf = `<rdf:RDF xmlns:rdf="x" xmlns:dc="y"><item><title>R</title><link>https://c.com/3</link><dc:date>2026-10-09T10:00:00Z</dc:date></item></rdf:RDF>`;
  assert.equal(parseFeed(rdf)[0].link, "https://c.com/3");
});

test("cluster: מקבץ אותו אירוע, מפריד אירועים שונים ושפות שונות", () => {
  const t0 = Date.parse("2026-10-09T10:00:00Z");
  const items = [
    { title: "התובע הכללי באיחוד האמירויות: טייס המשנה של טיסת פליי-דובאי תכנן להתרסק בנתב\"ג", lang: "he", time: t0 },
    { title: "התובע הכללי של האמירויות: טייס המשנה ניסה לרסק את המטוס בנתב\"ג", lang: "he", time: t0 + 3600_000 },
    { title: "מכבי תל אביב ניצחה בדרבי", lang: "he", time: t0 },
    { title: "UAE: Omani Flydubai co-pilot planned suicide attack", lang: "en", time: t0 },
    { title: "FlyDubai co-pilot planned suicide attack on Tel Aviv airport", lang: "en", time: t0 },
    // אותה כותרת, אבל מחוץ לחלון של 36 שעות
    { title: "התובע הכללי של האמירויות: טייס המשנה ניסה לרסק את המטוס בנתב\"ג", lang: "he", time: t0 + 40 * 3600_000 },
  ];
  const groups = cluster(items).map((g) => g.map((i) => items.indexOf(i)).sort());
  assert.deepEqual(groups.sort((a, b) => a[0] - b[0]), [[0, 1], [2], [3, 4], [5]]);
});
