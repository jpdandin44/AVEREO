#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export AVEREO_CONFIG_FILE="$(mktemp)"
server_pid=''
trap 'if [ -n "$server_pid" ]; then sudo kill "$server_pid" || true; fi; rm -f "$AVEREO_CONFIG_FILE"' EXIT
php -r '$c = ["environment"=>"local", "auth_mode"=>"token", "api_token"=>bin2hex(random_bytes(32)), "admin_user_ids"=>["1"], "db"=>["host"=>"127.0.0.1", "port"=>3306, "name"=>"vision", "user"=>"root", "password"=>"vision-ci-only"]]; file_put_contents(getenv("AVEREO_CONFIG_FILE"), "<?php return " . var_export($c, true) . ";");'
php database/migrate.php
sudo --preserve-env=AVEREO_CONFIG_FILE "$(command -v php)" -S 127.0.0.1:80 -t frontend/public local/router.php > "${RUNNER_TEMP:-/tmp}/vision-http.log" 2>&1 &
server_pid=$!
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1/api/health.php >/dev/null; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1/api/health.php >/dev/null
cd frontend
npm ci
npm test
cd ..
node --test deploiement/*.test.mjs
php tests/api/run.php --strict
find frontend/public deploiement -type f -name '*.php' -print0 | xargs -0 -n1 php -l
cd frontend
npm run build
cd ..
find frontend/dist -type f -name '*.php' -print0 | xargs -0 -n1 php -l
token="$(php -r '$c=require getenv("AVEREO_CONFIG_FILE"); echo $c["api_token"];')"
digest="$(VITE_LOCAL_API_TOKEN="$token" node deploiement/valider-paquet.mjs frontend/dist)"
echo "SHA-256 du paquet : $digest"
if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "sha256=$digest" >> "$GITHUB_OUTPUT"; fi
