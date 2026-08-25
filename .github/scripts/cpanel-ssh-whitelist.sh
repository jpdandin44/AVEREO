#!/usr/bin/env bash
set -euo pipefail

command_name="${1:-}"
if [ -z "$command_name" ]; then
  echo "Usage: cpanel-ssh-whitelist.sh <add|list|remove>" >&2
  exit 2
fi

port="${O2SWITCH_PORT:-}"
if [ -z "$port" ]; then port=8888; fi

if [ -z "${CPANEL_USERNAME:-}" ] || [ -z "${CPANEL_SERVER:-}" ]; then
  echo "CPANEL_USERNAME and CPANEL_SERVER secrets are required." >&2
  exit 1
fi

if [ -n "${CPANEL_PASSWORD:-}" ]; then
  auth_mode="password"
  auth_args=(-u "${CPANEL_USERNAME}:${CPANEL_PASSWORD}")
elif [ -n "${CPANEL_API_TOKEN:-}" ]; then
  auth_mode="token"
  auth_args=(-H "Authorization: cpanel ${CPANEL_USERNAME}:${CPANEL_API_TOKEN}")
else
  echo "Either CPANEL_PASSWORD or CPANEL_API_TOKEN secret is required." >&2
  exit 1
fi

legacy_endpoint="https://${CPANEL_SERVER}:2083/frontend/o2switch/o2switch-ssh-whitelist/index.live.php"

case "$command_name" in
  add)
    if [ -z "${RUNNER_IPV4:-}" ]; then
      echo "RUNNER_IPV4 is required for '$command_name'." >&2
      exit 1
    fi
    if [ "$auth_mode" = "password" ]; then
      endpoints=("${legacy_endpoint}?r=add")
    else
      endpoints=("https://${CPANEL_SERVER}:2083/execute/SshWhitelist/${command_name}?address=${RUNNER_IPV4}&port=${port}")
    fi
    ;;
  remove)
    if [ -z "${RUNNER_IPV4:-}" ]; then
      echo "RUNNER_IPV4 is required for '$command_name'." >&2
      exit 1
    fi
    if [ "$auth_mode" = "password" ]; then
      endpoints=(
        "${legacy_endpoint}?r=remove&address=${RUNNER_IPV4}&port=${port}&direction=in"
        "${legacy_endpoint}?r=remove&address=${RUNNER_IPV4}&port=${port}&direction=out"
      )
    else
      endpoints=(
        "https://${CPANEL_SERVER}:2083/execute/SshWhitelist/${command_name}?address=${RUNNER_IPV4}&port=${port}&direction=in"
        "https://${CPANEL_SERVER}:2083/execute/SshWhitelist/${command_name}?address=${RUNNER_IPV4}&port=${port}&direction=out"
      )
    fi
    ;;
  list)
    if [ "$auth_mode" = "password" ]; then
      endpoints=("${legacy_endpoint}?r=list")
    else
      endpoints=("https://${CPANEL_SERVER}:2083/execute/SshWhitelist/list")
    fi
    ;;
  *)
    echo "Unknown command: $command_name" >&2
    exit 2
    ;;
esac

response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

for endpoint in "${endpoints[@]}"; do
  curl_args=(-sS -m 45 -o "$response_file" -w "%{http_code}" "${auth_args[@]}")
  if [ "$auth_mode" = "password" ] && [ "$command_name" = "add" ]; then
    curl_args+=(
      -X POST
      --data-urlencode "whitelist[address]=${RUNNER_IPV4}"
      --data-urlencode "whitelist[port]=${port}"
    )
  fi

  if ! http_status="$(curl "${curl_args[@]}" "$endpoint")"; then
    echo "cPanel whitelist request failed before receiving an HTTP response (${auth_mode} authentication)." >&2
    exit 1
  fi
  case "$http_status" in
    2*) ;;
    *)
      echo "cPanel whitelist request returned HTTP ${http_status} (${auth_mode} authentication)." >&2
      exit 1
      ;;
  esac

  python - "$command_name" "${RUNNER_IPV4:-}" "$response_file" "$auth_mode" <<'PY'
import json
import sys

command_name, runner_ip, path, auth_mode = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
with open(path, "r", encoding="utf-8-sig") as handle:
    payload = json.load(handle)

def fail(message):
    print(f"::error::{message}", file=sys.stderr)
    sys.exit(1)

if auth_mode == "password":
    success = payload.get("success")
    if success not in (1, "1", True):
        details = payload.get("message") or payload.get("error") or json.dumps(payload, ensure_ascii=False)
        normalized_details = str(details).lower()
        missing_exception = command_name == "remove" and (
            "n'existe pas" in normalized_details
            or "does not exist" in normalized_details
            or "not exist" in normalized_details
        )
        if missing_exception:
            print(f"::warning::cPanel legacy whitelist remove already absent: {details}")
            sys.exit(0)
        fail(f"cPanel legacy whitelist {command_name} failed: {details}")

    if command_name == "list" and runner_ip:
        raw_payload = json.dumps(payload, ensure_ascii=False)
        if runner_ip not in raw_payload:
            fail(f"Runner IP {runner_ip} was not found in cPanel SSH whitelist.")

    print(f"cPanel legacy whitelist {command_name} OK")
    sys.exit(0)

result = payload.get("result") if isinstance(payload.get("result"), dict) else payload
metadata = result.get("metadata") or {}
status = result.get("status")
errors = result.get("errors") or []
warnings = result.get("warnings") or []
messages = result.get("messages") or []

if status not in (1, "1", True):
    details = (
        "; ".join(str(item) for item in errors)
        or "; ".join(str(item) for item in messages)
        or json.dumps(result, ensure_ascii=False)
    )
    normalized_details = details.lower()
    missing_exception = command_name == "remove" and (
        "n'existe pas" in normalized_details
        or "does not exist" in normalized_details
        or "not exist" in normalized_details
    )
    if missing_exception:
        print(f"::warning::cPanel SshWhitelist/remove already absent: {details}")
        sys.exit(0)
    fail(f"cPanel SshWhitelist/{command_name} failed: {details}")

if warnings:
    print("::warning::" + "; ".join(str(item) for item in warnings))

if command_name == "list" and runner_ip:
    raw_payload = json.dumps(payload, ensure_ascii=False)
    if runner_ip not in raw_payload:
        fail(f"Runner IP {runner_ip} was not found in cPanel SSH whitelist.")

print(f"cPanel SshWhitelist/{command_name} OK")
PY
done
