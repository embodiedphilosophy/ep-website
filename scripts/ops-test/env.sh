# Point the app at the local mock (scripts/ops-test/mock.mjs) instead of Google, Kit, Motion, Make, Resend, Zoom.
# Usage: source scripts/ops-test/env.sh      (then build/start as usual; see README.md)
K="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$K/out"
[ -s "$K/out/ops_secret" ] || (umask 077; openssl rand -hex 32 > "$K/out/ops_secret")   # throwaway, local only
export M=http://localhost:4555
export GOOGLE_TOKEN_URL=$M/token SHEETS_BASE=$M CALENDAR_API_BASE=$M MOTION_BASE=$M/motion
export RESEND_BASE=$M/resend KIT_BASE=$M/kit/v4 KIT_API_KEY=mock ZOOM_API_BASE=$M/zoom ZOOM_OAUTH_BASE=$M/zoomauth
export SOCIAL_IMAGES_HOOK=$M/make-hook
# Tasks and the time clock live in Neon when DATABASE_URL is set: unset it so tests never touch the real database
# (tasks then come read-only from Motion through the mock; the time clock shows as unavailable).
unset RESEND_API_KEY CIRCLE_API_TOKEN CRON_SECRET OPS_ORIGIN CIRCLE_EVENT_SYNC DATABASE_URL POSTGRES_URL TASKS_BACKEND
export OPS_SECRET="$(cat "$K/out/ops_secret")"
export CALENDAR_SHEET_ID=mock-sheet SOCIAL_SHEET_ID=mock-social CATALOG_SHEET_ID=mock-catalog
# The Google key is only used to sign a token the mock ignores; make a throwaway one if the environment has none
export GOOGLE_SERVICE_ACCOUNT_EMAIL="${GOOGLE_SERVICE_ACCOUNT_EMAIL:-mock@example.iam.gserviceaccount.com}"
[ -n "$GOOGLE_PRIVATE_KEY" ] || { [ -s "$K/out/mock_key.pem" ] || (umask 077; openssl genrsa -out "$K/out/mock_key.pem" 2048 2>/dev/null); export GOOGLE_PRIVATE_KEY="$(cat "$K/out/mock_key.pem")"; }
export COURSES_REVALIDATE_SECRET=mock-courses-secret
export MOCK_LOG="$K/out/mock.log"
export NEXT_PUBLIC_COURSES_PREVIEW=1   # lets /courses?preview=member show the member view (never set on Vercel)
