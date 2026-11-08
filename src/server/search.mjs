// Small-collection keyword search; no external embeddings or model calls.
import { text, invalid } from "./records.mjs";

const STOP = new Set(["the", "a", "an", "about", "anything", "notes", "remember", "saying", "said", "my", "i", "me", "do", "did", "have"]);
function normalized(value) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}
export function searchRecords(records, query, limit = 5) {
  text(query, "search query", 200, true);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) invalid("Invalid search limit.");
  const phrase = normalized(query.trim());
  const terms = [...new Set((phrase.match(/[\p{L}\p{N}]+/gu) ?? []).filter(term => !STOP.has(term)))];
  if (phrase && !terms.length) return { results: [], total: 0, truncated: false, searchMode: "keyword" };
  const matches = records.map(record => {
    const content = normalized(`${record.content} ${record.topic ?? ""} ${record.type ?? ""}`);
    const score = !phrase ? 1 : (content.includes(phrase) ? 10 : 0) + terms.filter(term => content.includes(term)).length;
    return { record, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score ||
    String(b.record.updatedAt ?? b.record.createdAt ?? b.record.date ?? "").localeCompare(String(a.record.updatedAt ?? a.record.createdAt ?? a.record.date ?? "")));
  return { results: matches.slice(0, limit).map(item => item.record), total: matches.length,
    truncated: matches.length > limit, searchMode: "keyword" };
}
