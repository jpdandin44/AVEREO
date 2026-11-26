#!/usr/bin/env bash
# Autorisation SSH temporaire du runner chez O2Switch (API cPanel par jeton, compatible avec la 2FA).
# Usage : autoriser-ssh.sh add|remove
# Constat du 26/11/2026 : le script commun créait l'autorisation sur le port du secret partagé (8888) et en
# connexion sortante ; O2Switch reçoit le SSH sur le port 22, en connexion entrante.
set -euo pipefail
action="${1:-}"
: "${CPANEL_USERNAME:?}" "${CPANEL_SERVER:?}" "${CPANEL_API_TOKEN:?}" "${RUNNER_IPV4:?}"
port="${O2SWITCH_PORT:-22}"
[[ "$RUNNER_IPV4" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]] || { echo "Adresse du runner invalide." >&2; exit 1; }
[[ "$port" =~ ^[0-9]+$ ]] || { echo "Port SSH invalide." >&2; exit 1; }

appel() { # appel <fonction> <paramètres> -> code de sortie 0 si status = 1
  local reponse
  reponse="$(curl -sS -m 45 -H "Authorization: cpanel ${CPANEL_USERNAME}:${CPANEL_API_TOKEN}" \
    "https://${CPANEL_SERVER}:2083/execute/SshWhitelist/$1?$2")"
  python3 - "$1" "$reponse" <<'PY'
import json, sys
fonction, brut = sys.argv[1], sys.argv[2]
try:
    data = json.loads(brut)
except ValueError:
    print(f"SshWhitelist/{fonction} : réponse illisible.", file=sys.stderr); sys.exit(1)
resultat = data.get("result") if isinstance(data.get("result"), dict) else data
if resultat.get("status") in (1, "1", True):
    sys.exit(0)
details = "; ".join(str(e) for e in (resultat.get("errors") or resultat.get("messages") or [])) or "sans détail"
absent = fonction == "remove" and any(m in details.lower() for m in ("n'existe pas", "does not exist", "not exist"))
print(("Déjà absente : " if absent else f"SshWhitelist/{fonction} refusé : ") + details, file=sys.stderr)
sys.exit(0 if absent else 1)
PY
}

case "$action" in
  add)
    appel add "address=${RUNNER_IPV4}&port=${port}&direction=in"
    echo "Autorisation SSH entrante ajoutée pour le runner (port ${port})."
    ;;
  remove)
    # Les deux sens, pour nettoyer aussi une autorisation créée par l'ancien script.
    statut=0
    for sens in in out; do appel remove "address=${RUNNER_IPV4}&port=${port}&direction=${sens}" || statut=1; done
    echo "Autorisation SSH du runner retirée (port ${port})."
    exit "$statut"
    ;;
  *) echo "Usage : autoriser-ssh.sh add|remove" >&2; exit 2 ;;
esac
