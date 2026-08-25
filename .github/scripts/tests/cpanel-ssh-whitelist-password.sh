#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

mock_log="$temporary_directory/curl.log"
mock_curl="$temporary_directory/curl"

cat > "$mock_curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail

output_file=""
url=""
arguments=("$@")

while [ "$#" -gt 0 ]; do
  case "$1" in
    -o|-w|-u|-m|-X|--data-urlencode)
      if [ "$1" = "-o" ]; then output_file="$2"; fi
      shift 2
      ;;
    -sS)
      shift
      ;;
    http*)
      url="$1"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

printf '%s\n' "${arguments[*]}" >> "$MOCK_CURL_LOG"

case "$url" in
  *'?r=list')
    printf '%s\n' '{"success":true,"data":{"list":[{"address":"203.0.113.42","port":8888,"direction":"in"}]}}' > "$output_file"
    ;;
  *'?r=add'|*'?r=remove&'*)
    printf '%s\n' '{"success":true,"message":"ok"}' > "$output_file"
    ;;
  *)
    printf '%s\n' '{"success":false,"message":"unexpected endpoint"}' > "$output_file"
    ;;
esac

printf '200'
MOCK
chmod +x "$mock_curl"

export PATH="$temporary_directory:$PATH"
export MOCK_CURL_LOG="$mock_log"
export CPANEL_USERNAME="test-user"
export CPANEL_PASSWORD="test-password"
export CPANEL_API_TOKEN="stale-token-must-not-be-used"
export CPANEL_SERVER="server.example.test"
export O2SWITCH_PORT="8888"
export RUNNER_IPV4="203.0.113.42"

bash "$repository_root/.github/scripts/cpanel-ssh-whitelist.sh" add
bash "$repository_root/.github/scripts/cpanel-ssh-whitelist.sh" list
bash "$repository_root/.github/scripts/cpanel-ssh-whitelist.sh" remove

grep -Fq -- '-u test-user:test-password' "$mock_log"
grep -Fq -- 'o2switch-ssh-whitelist/index.live.php?r=add' "$mock_log"
grep -Fq -- 'o2switch-ssh-whitelist/index.live.php?r=list' "$mock_log"
grep -Fq -- 'direction=in' "$mock_log"
grep -Fq -- 'direction=out' "$mock_log"
grep -Fq -- '--data-urlencode whitelist[address]=203.0.113.42' "$mock_log"
if grep -Fq -- '/execute/SshWhitelist/' "$mock_log"; then
  echo "Password mode must not call the token-only SshWhitelist UAPI endpoint." >&2
  exit 1
fi

echo "cPanel password whitelist flow: OK"
