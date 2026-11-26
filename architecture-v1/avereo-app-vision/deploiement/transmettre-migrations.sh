#!/usr/bin/env bash
set -euo pipefail
if [ -z "${VISION_DB_MIGRATION_USER:-}" ] || [ -z "${VISION_DB_MIGRATION_PASSWORD:-}" ]; then
  echo 'Secrets VISION_DB_MIGRATION_USER et VISION_DB_MIGRATION_PASSWORD requis dans cet environnement.' >&2
  exit 1
fi
cd "$(dirname "$0")/.."
run="$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
tools="$PRIVATE_DIR/outils-$run"
ssh_args=(-o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=30 -p "$O2SWITCH_PORT" "$O2SWITCH_USER@$O2SWITCH_HOST")
# Nettoyage aussi si le transfert s'interrompt avant le lancement du trap distant.
trap 'ssh "${ssh_args[@]}" "rm -rf -- \"\$HOME/$tools\""' EXIT
tar -cf - database/migrate.php database/migrations frontend/public/api/lib/config.php deploiement/configuration-migration.php deploiement/migrer-serveur.sh |
  ssh "${ssh_args[@]}" "umask 077; mkdir \"\$HOME/$tools\" && tar -xf - -C \"\$HOME/$tools\""
node -e 'process.stdout.write(JSON.stringify({user:process.env.VISION_DB_MIGRATION_USER,password:process.env.VISION_DB_MIGRATION_PASSWORD}))' |
  ssh "${ssh_args[@]}" "bash \"\$HOME/$tools/deploiement/migrer-serveur.sh\" '$PRIVATE_DIR' '$run'" |
  tee "$RUNNER_TEMP/vision-migrations.log"
