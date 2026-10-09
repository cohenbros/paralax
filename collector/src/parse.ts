import { XMLParser } from "fast-xml-parser";
import type { RawItem } from "./types.ts";

// שדות טקסט נשמרים כמחרוזת גולמית (כולל HTML/CDATA) ומנוקים ב-normalize
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: true,
  htmlEntities: true,
  stopNodes: ["*.title", "*.description", "*.summary", "*.content", "*.content:encoded"],
  isArray: (name) => ["item", "entry", "category", "link"].includes(name),
});

type Node = unknown;

function text(node: Node): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (typeof node === "object") {
    const o = node as Record<string, Node>;
    if ("#text" in o) return text(o["#text"]);
    return "";
  }
  return "";
}

function linkOf(links: Node): string {
  if (!Array.isArray(links)) return text(links);
  // Atom: <link rel="alternate" href="..."/>; RSS: <link>...</link>
  for (const l of links) {
    if (typeof l === "object" && l && "@_href" in l) {
      const rel = (l as Record<string, string>)["@_rel"];
      if (!rel || rel === "alternate") return (l as Record<string, string>)["@_href"];
    }
  }
  for (const l of links) {
    const t = text(l).trim();
    if (t) return t;
  }
  return "";
}

function categoriesOf(cats: Node): string[] {
  if (!Array.isArray(cats)) return [];
  return cats
    .map((c) => (typeof c === "object" && c && "@_term" in c ? (c as Record<string, string>)["@_term"] : text(c)))
    .map((c) => c.trim())
    .filter(Boolean);
}

export function parseFeed(xml: string): RawItem[] {
  const doc = parser.parse(xml) as Record<string, any>;
  const nodes: Record<string, Node>[] =
    doc.rss?.channel?.item ?? doc["rdf:RDF"]?.item ?? doc.feed?.entry ?? doc.channel?.item ?? [];
  return nodes.map((n) => ({
    title: text(n.title),
    link: linkOf(n.link) || text(n.guid),
    description: text(n.description) || text(n.summary) || text(n["content:encoded"]) || text(n.content),
    date: text(n.pubDate) || text(n["dc:date"]) || text(n.published) || text(n.updated) || null,
    categories: categoriesOf(n.category),
    author: text(n.author) || text(n["dc:creator"]),
  }));
}
