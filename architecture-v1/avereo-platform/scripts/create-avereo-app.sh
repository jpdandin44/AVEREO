#!/usr/bin/env bash
set -euo pipefail

repo="${1:?repo required}"
slug="${2:?slug required}"
display_name="${3:?display name required}"
kind="${4:?type required: react, legacy, or react-ts}"

case "$kind" in
  react|legacy|react-ts) ;;
  *) echo "type must be react, legacy, or react-ts" >&2; exit 1 ;;
esac

mkdir -p "$repo"/{frontend/src/{components,pages,hooks,services,utils,config},frontend/public,backend,database/migrations,database/seeds,docs,.github/workflows}
git -C "$repo" init

cat <<NEXT
Application scaffold created.

Next:
  cd $repo/frontend
  npm install
  npm run build

No secrets were created. Backend and MySQL stay disabled in V1.
NEXT
