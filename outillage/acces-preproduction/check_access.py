#!/usr/bin/env python3
"""Read-only HTTPS checks. No deployment, redirect following or secret logging."""
from __future__ import annotations

import argparse
import base64
import getpass
import json
import re
import secrets
import ssl
import sys
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, HTTPSHandler, Request, build_opener

# Candidates to inventory, NOT an attestation that these hosts exist or are ready.
CANDIDATES = (
    "preprod.avereo.fr", "connect-preprod.avereo.fr", "rapport-preprod.avereo.fr",
    "coupe-preprod.avereo.fr", "projet-preprod.avereo.fr", "thermo-preprod.avereo.fr",
    "drone-preprod.avereo.fr", "auth-preprod.avereo.fr", "auth-next-preprod.avereo.fr",
)


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def target_url(domain: str, path: str = "/") -> str:
    if domain not in CANDIDATES:
        raise ValueError("Cible absente de la liste explicite des preproductions.")
    if not re.fullmatch(r"/[A-Za-z0-9_./-]*", path) or ".." in path or path.startswith("//"):
        raise ValueError("Chemin invalide ; ni requete, ni fragment, ni URL externe admis.")
    return "https://" + domain + path


def basic_header(username: str, password: str) -> str:
    if not username or ":" in username or not password:
        raise ValueError("Identifiants de consultation invalides.")
    if any(ord(c) < 32 or ord(c) == 127 for c in username + password):
        raise ValueError("Caracteres de controle interdits.")
    return "Basic " + base64.b64encode((username + ":" + password).encode("utf-8")).decode("ascii")


def observe(url: str, authorization: str | None = None) -> dict:
    # No default cookie jar and no forwarding of credentials to another host.
    opener = build_opener(NoRedirect(), HTTPSHandler(context=ssl.create_default_context()))
    headers = {"Accept": "text/html,application/json", "Cache-Control": "no-cache"}
    if authorization:
        headers["Authorization"] = authorization
    request = Request(url, headers=headers, method="GET")
    try:
        response = opener.open(request, timeout=15)
    except HTTPError as error:
        response = error  # HTTP status is evidence; response body is never read.
    except (URLError, OSError, ValueError):
        # Do not echo exception content: it may contain a URL or transport details.
        return {"status": None, "basic_challenge": False, "transport": "failed"}
    try:
        challenges = response.headers.get_all("WWW-Authenticate", [])
        return {
            "status": response.code,
            "basic_challenge": any(re.search(r"\bBasic\s", h, re.I) for h in challenges),
            "transport": "ok",
        }
    finally:
        response.close()


def refused(result: dict) -> bool:
    return result["status"] == 401 and result["basic_challenge"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--domain", required=True, choices=CANDIDATES)
    parser.add_argument("--path", default="/")
    parser.add_argument("--authenticated", action="store_true",
                        help="Demande les identifiants dans le terminal, sans les journaliser.")
    args = parser.parse_args()
    try:
        url = target_url(args.domain, args.path)
    except ValueError as error:
        parser.error(str(error))
    results = {
        "anonymous": observe(url),
        "invalid_credentials": observe(url, basic_header("invalid-" + secrets.token_hex(12),
                                                         secrets.token_urlsafe(32))),
    }
    valid = all(refused(result) for result in results.values())
    if args.authenticated and not valid:
        print(json.dumps({"domain": args.domain, "checks": results,
                          "http_checks_passed": False,
                          "authorized_check": "skipped_invalid_basic_protection",
                          "application_journey_verified": False}, indent=2))
        return 1
    if args.authenticated:
        if not sys.stdin.isatty():
            parser.error("Un terminal interactif est requis ; ne pas fournir le mot de passe par pipe.")
        try:
            username = input("Identifiant de consultation : ").strip()
            password = getpass.getpass("Mot de passe de consultation (masque) : ")
            authorization = basic_header(username, password)
        except (EOFError, KeyboardInterrupt, ValueError):
            print("Verification authentifiee annulee ; aucun secret affiche.")
            return 2
        results["authorized"] = observe(url, authorization)
        del password, authorization
        valid = valid and results["authorized"]["status"] in (200, 302, 303)
    print(json.dumps({"domain": args.domain, "path": args.path, "checks": results,
                      "http_checks_passed": valid,
                      "application_journey_verified": False}, ensure_ascii=False, indent=2))
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
