#!/usr/bin/env python3
import base64
import json
import os
import sys
import urllib.parse
import urllib.request


def fail(message):
    print(f"::error::{message}", file=sys.stderr)
    sys.exit(1)


def require_env(name):
    value = os.environ.get(name, "").strip()
    if not value:
        fail(f"{name} is required.")
    return value


def iter_docroots(value):
    if isinstance(value, dict):
        for key, item in value.items():
            normalized_key = key.replace("_", "").replace("-", "").lower()
            if normalized_key in {"documentroot", "docroot"} and isinstance(item, str):
                yield item
            yield from iter_docroots(item)
    elif isinstance(value, list):
        for item in value:
            yield from iter_docroots(item)


def normalize_cpanel_host(value):
    candidate = value.strip()
    if "://" not in candidate:
        candidate = f"https://{candidate}"
    parsed = urllib.parse.urlparse(candidate)
    return parsed.hostname or candidate.replace("https://", "").replace("http://", "").split("/", 1)[0].split(":", 1)[0]


def main():
    if len(sys.argv) != 2:
        fail("Usage: cpanel-domain-docroot.py <domain>")

    domain = sys.argv[1].strip()
    username = require_env("CPANEL_USERNAME")
    server = normalize_cpanel_host(require_env("CPANEL_SERVER"))
    password = os.environ.get("CPANEL_PASSWORD", "")
    api_token = os.environ.get("CPANEL_API_TOKEN", "")

    if not password and not api_token:
        fail("Either CPANEL_PASSWORD or CPANEL_API_TOKEN is required.")

    endpoint = (
        f"https://{server}:2083/execute/DomainInfo/single_domain_data?"
        + urllib.parse.urlencode({"domain": domain})
    )

    request = urllib.request.Request(endpoint)
    if password:
        token = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
        request.add_header("Authorization", f"Basic {token}")
    else:
        request.add_header("Authorization", f"cpanel {username}:{api_token}")

    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8-sig"))

    result = payload.get("result") if isinstance(payload.get("result"), dict) else payload
    status = result.get("status")
    if status not in (1, "1", True):
        details = result.get("errors") or result.get("messages") or result
        fail(f"cPanel DomainInfo/single_domain_data failed: {details}")

    docroots = [item.replace("\\", "/").rstrip("/") for item in iter_docroots(result.get("data"))]
    if not docroots:
        fail(f"No document root found in cPanel data for {domain}.")

    docroot = docroots[0]
    home_prefix = f"/home/{username}/"
    if docroot.startswith(home_prefix):
        server_dir = docroot[len(home_prefix):]
    else:
        server_dir = docroot.lstrip("/")

    if not server_dir:
        fail(f"Resolved empty FTP directory from document root {docroot!r}.")

    print(server_dir)


if __name__ == "__main__":
    main()
