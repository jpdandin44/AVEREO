#!/usr/bin/env bash
set -euo pipefail

command_name="${1:-}"
if [ -z "$command_name" ]; then
  echo "Usage: cpanel-ssh-whitelist.sh <add|list|remove>" >&2
  exit 2
fi

port="${O2SWITCH_PORT:-}"
if [ -z "$port" ]; then port=22; fi

if [ -z "${CPANEL_USERNAME:-}" ] || [ -z "${CPANEL_SERVER:-}" ]; then
  echo "CPANEL_USERNAME and CPANEL_SERVER secrets are required." >&2
  exit 1
fi

if [ -n "${CPANEL_PASSWORD:-}" ]; then
  auth_args=(-u "${CPANEL_USERNAME}:${CPANEL_PASSWORD}")
elif [ -n "${CPANEL_API_TOKEN:-}" ]; then
  auth_args=(-H "Authorization: cpanel ${CPANEL_USERNAME}:${CPANEL_API_TOKEN}")
else
  echo "Either CPANEL_PASSWORD or CPANEL_API_TOKEN secret is required." >&2
  exit 1
fi

case "$command_name" in
  add|remove)
    if [ -z "${RUNNER_IPV4:-}" ]; then
      echo "RUNNER_IPV4 is required for '$command_name'." >&2
      exit 1
    fi
    endpoint="https://${CPANEL_SERVER}:2083/execute/SshWhitelist/${command_name}?address=${RUNNER_IPV4}&port=${port}"
    ;;
  list)
    endpoint="https://${CPANEL_SERVER}:2083/execute/SshWhitelist/list"
    ;;
  *)
    echo "Unknown command: $command_name" >&2
    exit 2
    ;;
esac

response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

curl -fsS -m 45 "${auth_args[@]}" "$endpoint" > "$response_file"

python - "$command_name" "${RUNNER_IPV4:-}" "$response_file" <<'PY'
import json
import sys

command_name, runner_ip, path = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, "r", encoding="utf-8-sig") as handle:
    payload = json.load(handle)

metadata = payload.get("metadata") or {}
status = metadata.get("status")
errors = metadata.get("errors") or []
warnings = metadata.get("warnings") or []

def fail(message):
    print(f"::error::{message}", file=sys.stderr)
    sys.exit(1)

if status not in (1, "1", True):
    details = "; ".join(str(item) for item in errors) or json.dumps(metadata, ensure_ascii=False)
    fail(f"cPanel SshWhitelist/{command_name} failed: {details}")

if warnings:
    print("::warning::" + "; ".join(str(item) for item in warnings))

if command_name == "list" and runner_ip:
    raw_payload = json.dumps(payload, ensure_ascii=False)
    if runner_ip not in raw_payload:
        fail(f"Runner IP {runner_ip} was not found in cPanel SSH whitelist.")

print(f"cPanel SshWhitelist/{command_name} OK")
PY