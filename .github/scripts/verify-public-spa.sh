#!/usr/bin/env bash
set -euo pipefail

app_slug="${1:-}"
public_url="${2:-}"

if [ -z "$app_slug" ] || [ -z "$public_url" ]; then
  echo "Usage: verify-public-spa.sh <app-slug> <public-url>" >&2
  exit 2
fi

html_file="$(mktemp)"
headers_file="$(mktemp)"
trap 'rm -f "$html_file" "$headers_file"' EXIT

last_error=""
tls_warning=""
for attempt in {1..12}; do
  set +e
  curl -fsSL --max-time 20 -D "$headers_file" "$public_url" -o "$html_file"
  curl_status="$?"
  set -e
  if [ "$curl_status" -eq 0 ]; then
    break
  fi
  if [ "$curl_status" -eq 60 ]; then
    tls_warning="TLS certificate verification failed for $public_url. Retrying content verification with --insecure; fix the public certificate before treating this URL as production-ready."
    echo "::warning::$tls_warning"
    set +e
    curl -k -fsSL --max-time 20 -D "$headers_file" "$public_url" -o "$html_file"
    insecure_status="$?"
    set -e
    if [ "$insecure_status" -eq 0 ]; then
      break
    fi
  fi
  last_error="Public URL not ready yet: $public_url (attempt $attempt/12)"
  echo "::warning::$last_error"
  sleep 10
done

if [ ! -s "$html_file" ]; then
  echo "::error::Unable to fetch public URL after deploy: $public_url. $last_error" >&2
  exit 1
fi

if [ -n "$tls_warning" ]; then
  echo "::warning::$tls_warning"
fi

python - "$app_slug" "$public_url" "$html_file" <<'PY'
import re
import sys

app_slug, public_url, html_path = sys.argv[1], sys.argv[2], sys.argv[3]
with open(html_path, "r", encoding="utf-8", errors="replace") as handle:
    html = handle.read()

def fail(message):
    print(f"::error::{message}", file=sys.stderr)
    sys.exit(1)

title_match = re.search(r"<title>(.*?)</title>", html, flags=re.I | re.S)
title = re.sub(r"\s+", " ", title_match.group(1)).strip() if title_match else ""

if "wp-content" in html.lower() or "wordpress" in html.lower() or "my blog" in title.lower():
    fail(f"{public_url} appears to serve WordPress/default hosting instead of AVEREO {app_slug}. Title: {title!r}")

if 'id="root"' not in html and "id='root'" not in html:
    fail(f"{public_url} does not contain the expected React root element.")

if not re.search(r"assets/[^\"']+\.(js|css)", html, flags=re.I):
    fail(f"{public_url} does not reference built Vite assets.")

print(f"Public URL verification OK for {app_slug}: {public_url} (title={title!r})")
PY
