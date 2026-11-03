"""Native login recipe against the disposable local Drupal site only."""
import http.cookiejar
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

BASE = os.environ.get("IDENTITY_LOCAL_BASE_URL", "http://127.0.0.1:8093")
assert urllib.parse.urlsplit(BASE).hostname in {"127.0.0.1", "localhost"}
assert os.environ.get("AVEREO_IDENTITY_LOCAL_FIXTURE") == "1"


class Form(HTMLParser):
    def __init__(self):
        super().__init__()
        self.fields = {}
        self.identifier = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "input" and attrs.get("name"):
            if attrs.get("type") == "hidden":
                self.fields[attrs["name"]] = attrs.get("value", "")
            if attrs["name"] == "name":
                self.identifier = attrs


def login(identifier, password):
    cookies = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
    page = opener.open(BASE + "/user/login").read().decode()
    form = Form()
    form.feed(page)
    assert form.identifier.get("maxlength") == "254"
    assert "Identifiant ou adresse e-mail" in page
    form.fields.update({"name": identifier, "pass": password, "op": "Log in"})
    try:
        response = opener.open(BASE + "/user/login", urllib.parse.urlencode(form.fields).encode())
    except urllib.error.HTTPError as error:
        if error.code != 403:
            raise
        response = error  # Native flood protection returns HTTP 403.
    body = response.read().decode()
    path = urllib.parse.urlsplit(response.url).path
    success = response.status == 200 and re.fullmatch(r"/user/[1-9][0-9]*", path) is not None and any(c.name.startswith(("SESS", "SSESS")) for c in cookies)
    return success, path, response.status, body


checks = {}
for identifier in ["client-test", "client@example.invalid", "CLIENT@EXAMPLE.INVALID"]:
    ok, path, _, _ = login(identifier, "fixture-client-local-only")
    checks["same_account_" + identifier] = ok and path == "/user/" + os.environ.get("IDENTITY_LOCAL_CLIENT_UID", "2")
checks["wrong_password_rejected"] = not login("client@example.invalid", "fixture-wrong-only")[0]
checks["blocked_email_rejected"] = not login("blocked@example.invalid", "fixture-client-local-only")[0]
checks["blocked_name_rejected"] = not login("blocked-test", "fixture-client-local-only")[0]
checks["unknown_email_rejected"] = not login("unknown@example.invalid", "fixture-client-local-only")[0]
checks["rate_email_failure"] = not login("rate@example.invalid", "fixture-wrong-only")[0]
checks["rate_name_failure"] = not login("rate-test", "fixture-wrong-only")[0]
ok, _, status, body = login("rate@example.invalid", "fixture-client-local-only")
checks["native_account_flood_shared_between_aliases"] = not ok and status == 403 and "failed login attempts" in body.lower() and "temporarily blocked" in body.lower()
assert all(checks.values()), checks
print(json.dumps({"passed": len(checks), "checks": checks, "scope": "real Drupal HTTP forms, native password/status/flood checks; local fixtures only"}))
