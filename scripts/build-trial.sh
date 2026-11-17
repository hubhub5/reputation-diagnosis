#!/bin/sh
# 테스터용 체험판 스냅샷. 사이트 어디에도 링크하지 않고, 이 경로를 아는 사람만 연다.
# 다시 만들면 지금 코드로 덮어쓴다. 1일차 그대로 두려면 다시 실행하지 않는다.
set -e
SLUG=t-4a8eea2bef38
VITE_TRIAL=1 npx vite build --outDir "snapshots/$SLUG" --emptyOutDir
sed -i '' 's#<head>#<head><meta name="robots" content="noindex,nofollow">#' "snapshots/$SLUG/index.html" 2>/dev/null || sed -i 's#<head>#<head><meta name="robots" content="noindex,nofollow">#' "snapshots/$SLUG/index.html"
echo "snapshots/$SLUG"
