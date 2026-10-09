#!/usr/bin/env bash
# Before merging anything to main: build origin/main and this checkout against the LIVE sheet (real credentials
# from the environment, nothing mocked) and compare every public page. Reads only; writes nothing.
#   bash scripts/ops-test/site-check.sh      → "15 pages compared, 0 differ" is the bar
set -e
cd "$(dirname "$0")/../.."
H=$(sha1sum package-lock.json | cut -c1-40); [ "$(cat node_modules/.ops-lock 2>/dev/null)" = "$H" ] || { npm ci --no-audit --no-fund > /dev/null 2>&1 && echo "$H" > node_modules/.ops-lock; }   # deps changed since the last install
K=scripts/ops-test; mkdir -p $K/out
unset M GOOGLE_TOKEN_URL SHEETS_BASE CALENDAR_API_BASE MOTION_BASE RESEND_BASE KIT_BASE ZOOM_API_BASE ZOOM_OAUTH_BASE SOCIAL_IMAGES_HOOK MOCK_LOG
[ "$KIT_API_KEY" = mock ] && unset KIT_API_KEY
[ "$CALENDAR_SHEET_ID" = mock-sheet ] && unset CALENDAR_SHEET_ID SOCIAL_SHEET_ID
pkill -f '^next-server' || true; pkill -f '^npm exec next start' || true; sleep 1
MAIN=../ep-main
git fetch -q origin main
git worktree remove --force $MAIN 2>/dev/null || rm -rf $MAIN
git worktree add -q $MAIN origin/main
if cmp -s package-lock.json $MAIN/package-lock.json; then cp -al node_modules $MAIN/ 2>/dev/null || cp -a node_modules $MAIN/   # a symlink breaks Turbopack
else (cd $MAIN && npm ci --no-audit --no-fund > /dev/null 2>&1); fi
(cd $MAIN && npx next build > ../ep-website/$K/out/build-main.log 2>&1) || { tail -20 $K/out/build-main.log; exit 1; }
npx next build > $K/out/build.log 2>&1 || { tail -20 $K/out/build.log; exit 1; }
(cd $MAIN && nohup npx next start -p 3200 > /dev/null 2>&1 &)
nohup npx next start -p 3100 > /dev/null 2>&1 &
sleep 6
python3 scripts/compare-site.py 3200 3100
pkill -f '^next-server' || true; pkill -f '^npm exec next start' || true
git worktree remove --force $MAIN
