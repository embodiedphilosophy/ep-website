import { systemPrompt, TOOLS } from "../../../lib/prompt";
import { createHandoffTicket, logHandoff } from "../../../lib/zendesk";
import { getEntries } from "../../../lib/kb";
import { getVercelOidcToken } from "@vercel/oidc";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const DRY_RUN = process.env.HANDOFF_DRY_RUN !== "0"; // tickets are only created when HANDOFF_DRY_RUN=0
const ALLOWED = (process.env.ALLOWED_ORIGINS ||
  "https://embodiedphilosophy.com,https://www.embodiedphilosophy.com,https://ep-website-beta.vercel.app")
  .split(",").map((s) => s.trim()).filter(Boolean);

const MAX_MESSAGES = 40;
const MAX_CHARS = 2000;

// Simple per-instance rate limit: 30 requests per 10 minutes per IP.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const ok = ALLOWED.includes(origin) || /^https:\/\/ep-(website|support-agent)[a-z0-9-]*\.vercel\.app$/.test(origin);
  return ok
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
}

export async function OPTIONS(req) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

function json(req, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...corsHeaders(req) } });
}

// Claude is reached through Vercel AI Gateway by default (billed to the Vercel team, no API key needed).
// Set LLM_PROVIDER=anthropic to call the Anthropic API directly with ANTHROPIC_API_KEY instead.
const PROVIDER = process.env.LLM_PROVIDER || "gateway";
const GATEWAY_MODEL = process.env.GATEWAY_MODEL || "anthropic/claude-sonnet-5.5";

async function callClaude(messages, system) {
  const gateway = PROVIDER === "gateway";
  const headers = { "content-type": "application/json", "anthropic-version": "2023-06-01" };
  if (gateway) {
    const token = process.env.AI_GATEWAY_API_KEY || (await getVercelOidcToken());
    headers.authorization = `Bearer ${token}`;
  } else {
    headers["x-api-key"] = process.env.ANTHROPIC_API_KEY;
  }
  const url = gateway ? "https://ai-gateway.vercel.sh/v1/messages" : "https://api.anthropic.com/v1/messages";
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: gateway ? GATEWAY_MODEL : MODEL, max_tokens: 700, system, tools: TOOLS, messages }),
  });
  if (!res.ok) throw new Error(`${gateway ? "Gateway" : "Anthropic"} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

export async function POST(req) {
  if ((process.env.LLM_PROVIDER || "gateway") === "anthropic" && !process.env.ANTHROPIC_API_KEY) return json(req, { error: "not_configured" }, 500);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return json(req, { error: "rate_limited" }, 429);

  let body;
  try { body = await req.json(); } catch { return json(req, { error: "bad_request" }, 400); }
  const incoming = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  const messages = incoming
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return json(req, { error: "bad_request" }, 400);

  const transcript = messages.map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`).join("\n\n");
  let handedOff = false;
  let ticketId = null;

  try {
    const system = systemPrompt(await getEntries());
    let convo = [...messages];
    for (let i = 0; i < 3; i++) {
      const out = await callClaude(convo, system);
      const toolUses = out.content.filter((c) => c.type === "tool_use");
      if (out.stop_reason !== "tool_use" || !toolUses.length) {
        const text = out.content.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
        return json(req, { reply: text, handedOff, ticketId, dryRun: DRY_RUN });
      }
      const results = [];
      for (const tu of toolUses) {
        if (tu.name !== "handoff_to_ichha" || handedOff) {
          results.push({ type: "tool_result", tool_use_id: tu.id, content: "Not available.", is_error: true });
          continue;
        }
        try {
          ticketId = DRY_RUN ? "TEST" : await createHandoffTicket({ ...tu.input, transcript });
          handedOff = true;
          await logHandoff({ ticket: ticketId, entry_id: tu.input.entry_id, topic: tu.input.topic, summary: tu.input.summary, test: DRY_RUN });
          results.push({ type: "tool_result", tool_use_id: tu.id, content: `Ticket created (${ticketId}).` });
        } catch (e) {
          console.error("handoff failed", e);
          results.push({ type: "tool_result", tool_use_id: tu.id, content: "Ticket creation failed.", is_error: true });
        }
      }
      convo = [...convo, { role: "assistant", content: out.content }, { role: "user", content: results }];
    }
    return json(req, { reply: "Sorry, something went wrong on my side. Please email hello@embodiedphilosophy.com and we'll help.", handedOff, ticketId });
  } catch (e) {
    console.error(e);
    return json(req, { error: "upstream_error" }, 502);
  }
}
