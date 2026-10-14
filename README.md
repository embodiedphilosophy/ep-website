# Ether: EP Support Agent

Ether is Embodied Philosophy's website chat assistant, powered by Claude.

- `public/widget.js`: the chat bubble. Add it to any page with `<script src="https://ep-support-agent.vercel.app/widget.js" defer></script>`.
- `app/api/chat/route.js`: the chat service. It calls Claude with the knowledge base and hands conversations to Ichha.
- `lib/kb.js`: reads the knowledge base live from the "EP Support KB" Google Sheet (Entries tab), re-reading it at most once an hour. Only rows with Status = Live reach Ether.
- `sheet-connector/Code.gs`: the Apps Script that lives in the sheet. It serves the Entries tab to Ether, logs every handoff to the Handoffs tab, and copies Zendesk tickets into the Zendesk Log tab daily.
- `lib/prompt.js`: Ether's instructions.
- `lib/zendesk.js`: creates a Zendesk ticket for Ichha when Ether hands off (subject starts `[Chat · <entry ID>]`, or `[Chat · none]` when no entry covered the question), and logs the handoff to the sheet.

Claude is reached through Vercel AI Gateway by default, billed to the Vercel team. No API key is needed.

Required environment variables:
- `KB_URL`: the Apps Script web app URL (ends in `/exec`).
- `KB_TOKEN`: the same value as `KB_TOKEN` in the Apps Script's script properties.

Optional environment variables:
- `KB_STATUSES`: which Status values Ether reads. Default `Live`. Set `Live,Draft` on Preview to test drafts.
- `KB_TTL_SECONDS`: how often the sheet is re-read. Default `3600`.
- `HANDOFF_DRY_RUN`: leave unset while testing (no real tickets). Set to `0` to create real Zendesk tickets.
- `GATEWAY_MODEL`: defaults to `anthropic/claude-sonnet-5.5`.
- `LLM_PROVIDER=anthropic` with `ANTHROPIC_API_KEY`: call Anthropic directly instead of the gateway.
- `ALLOWED_ORIGINS`, `ZENDESK_SUBDOMAIN`.
