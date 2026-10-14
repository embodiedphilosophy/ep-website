// Knowledge base for Ether, read live from the "EP Support KB" Google Sheet (Entries tab)
// through the sheet's Apps Script web app (see sheet-connector/Code.gs).
// Only rows whose Status is in KB_STATUSES (default "Live") reach Ether.
// The sheet is re-read at most once per KB_TTL_SECONDS (default 1 hour), so an edit
// in the sheet reaches Ether within the hour, with no code change or redeploy.

const KB_URL = process.env.KB_URL || "";
const KB_TOKEN = process.env.KB_TOKEN || "";
const STATUSES = (process.env.KB_STATUSES || "Live").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const TTL_MS = Number(process.env.KB_TTL_SECONDS || 3600) * 1000;
const RETRY_MS = 5 * 60 * 1000;

const DEFAULT_HANDOFF =
  "I've passed this to Ichha on our support team, along with everything you've shared here. She'll reply by email within 2 business days. We're a small team of four, so thank you for your patience.";

let cache = null; // { at, entries }

async function fetchSheet() {
  const res = await fetch(`${KB_URL}?token=${encodeURIComponent(KB_TOKEN)}`, { cache: "no-store", redirect: "follow" });
  if (!res.ok) throw new Error(`KB ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.entries)) throw new Error(`KB bad response: ${JSON.stringify(data).slice(0, 200)}`);
  return data.entries;
}

// Returns every row of the Entries tab (all statuses). Falls back to the last good copy if the sheet is unreachable.
export async function getEntries() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.entries;
  if (!KB_URL) return [];
  try {
    const entries = await fetchSheet();
    cache = { at: Date.now(), entries };
  } catch (e) {
    console.error("kb fetch failed", e);
    if (cache) cache.at = Date.now() - TTL_MS + RETRY_MS; // keep the last good copy, try again in 5 minutes
  }
  return cache ? cache.entries : [];
}

export function liveEntries(entries) {
  return entries.filter((e) => e.id && e.id !== "h01" && STATUSES.includes(String(e.status).toLowerCase()));
}

export function handoffMessage(entries) {
  const h = entries.find((e) => e.id === "h01" && STATUSES.includes(String(e.status).toLowerCase()));
  return (h && h.answer) || DEFAULT_HANDOFF;
}

export function kbAsText(entries) {
  if (!entries.length) return "(The knowledge base is unavailable right now. Answer nothing from memory: offer to pass every question to Ichha.)";
  return entries
    .map((e) => {
      const lines = [`[${e.id}] ${e.topic}${e.programs ? ` (programs: ${e.programs})` : ""}${e.platform ? ` (platform: ${e.platform})` : ""}`];
      lines.push(`Visitor asks: ${e.question}${e.phrasings ? ` Also asked as: ${e.phrasings}` : ""}`);
      lines.push(`Answer: ${e.answer}`);
      if (e.notes) lines.push(`Private guidance for Ether: ${e.notes}`);
      if (e.handoff) lines.push(`Hand to Ichha when: ${e.handoff}`);
      return lines.join("\n");
    })
    .join("\n\n");
}
