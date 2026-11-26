#!/usr/bin/env bash
set -euo pipefail
private="$HOME/${1:?dossier privé}"
tools="$private/outils-${2:?run id}"
case "$1" in .avereo/vision|.avereo/vision-preprod) ;; *) exit 2 ;; esac
[[ "$2" =~ ^[0-9]+-[0-9]+$ ]] || exit 2
trap 'rm -rf -- "$tools"' EXIT
cd "$tools"
php deploiement/configuration-migration.php "$private/config.php" "$tools/config-migration.php"
export AVEREO_CONFIG_FILE="$tools/config-migration.php"
php database/migrate.php --dry-run
php database/migrate.php
php database/migrate.php --status
