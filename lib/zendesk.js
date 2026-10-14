// Creates a Zendesk request (ticket) on behalf of the visitor.
// Uses Zendesk's anonymous Requests API, which EP's Zendesk already accepts from its web form,
// so no Zendesk credentials are stored in this app. Ichha replies in Zendesk; the visitor gets her reply by email.

const SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN || "embodiedphilosophy";

export async function createHandoffTicket({ name, email, topic, entry_id, summary, details, transcript }) {
  const entry = entry_id || "none";
  const body = [
    "Handed off by the website chat assistant.",
    "",
    `Topic: ${topic}`,
    `Knowledge-base entry: ${entry}${entry === "none" ? " (gap: no entry covered this)" : ""}`,
    `Summary: ${summary}`,
    details ? `Details: ${details}` : null,
    "",
    "Chat transcript:",
    transcript,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const res = await fetch(`https://${SUBDOMAIN}.zendesk.com/api/v2/requests.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request: {
        requester: { name, email },
        subject: `[Chat · ${entry}] ${topic}: ${summary.slice(0, 80)}`,
        comment: { body },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Zendesk ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.request?.id;
}

// Logs a handoff to the Handoffs tab of the EP Support KB sheet, so gaps feed the monthly review.
// Never blocks or fails the handoff itself.
export async function logHandoff({ ticket, entry_id, topic, summary, test }) {
  if (!process.env.KB_URL) return;
  try {
    await fetch(process.env.KB_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ token: process.env.KB_TOKEN || "", ticket, entry: entry_id || "none", topic, summary, test }),
      redirect: "follow",
    });
  } catch (e) {
    console.error("handoff log failed", e);
  }
}
