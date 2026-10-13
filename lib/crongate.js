// The back-office jobs (daily, auto, Zoom sync, Weekly Scaffolding) are moving to the ep-ops project.
// Both projects carry them during the move; exactly one may run the real thing, or teachers get every
// reminder twice. Once OPS_ORIGIN is set here (e.g. https://ops.embodiedphilosophy.com), this site stops
// running them and ep-ops (OPS_LIVE=1) takes over. Previews and dry runs always work.
export const jobsHere = () => !process.env.OPS_ORIGIN;
export const SKIPPED = { skipped: true, reason: 'Back-office jobs now run on the ops app (OPS_ORIGIN is set).' };
