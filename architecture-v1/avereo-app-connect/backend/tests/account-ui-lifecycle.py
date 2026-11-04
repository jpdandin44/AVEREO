"""Check that the actual local account review router exposes the whole lifecycle."""
from contextlib import closing
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import time
from urllib.error import URLError
from urllib.request import Request, urlopen

router = Path(__file__).resolve().with_name("account-ui-router.php")
php = shutil.which("php")
assert php, "PHP CLI required"
with tempfile.TemporaryDirectory(prefix="connect-ui-") as scratch:
    db = Path(scratch) / "accounts.sqlite"
    env = dict(os.environ, APP_ENV="local", ACCOUNT_UI_FIXTURE="true", ACCOUNT_UI_DB=str(db))
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        host, port = sock.getsockname()
    command = [php]
    if os.name == "nt" and b"pdo_sqlite" not in subprocess.check_output([php, "-m"]):
        command += ["-d", "extension=" + str(Path(php).parent / "ext/php_pdo_sqlite.dll")]
    command += ["-S", f"{host}:{port}", str(router)]
    with (Path(scratch) / "server.log").open("w+b") as log:
        server = subprocess.Popen(command, env=env, stdout=log, stderr=log)
        def call(path, method="GET", body=None):
            data = json.dumps(body).encode() if body is not None else None
            req = Request(f"http://{host}:{port}/api/v1/admin/organizations/7{path}", data, method=method,
                          headers={"Content-Type": "application/json", "X-CSRF-Token": "local-ui-csrf"})
            with urlopen(req, timeout=5) as response:
                return json.load(response)["data"]

        try:
            for _ in range(60):
                try:
                    call("/accounts")
                    break
                except URLError:
                    if server.poll() is not None:
                        raise RuntimeError("Review server stopped")
                    time.sleep(.05)
            else:
                raise RuntimeError("Review server did not start")
            with closing(sqlite3.connect(str(db) + ".reports")) as reports:
                for keep in (True, False):
                    email = f"account-ui-{secrets.token_hex(6)}@example.invalid"
                    created = call("/accounts", "POST", {"email": email, "displayName": "Cycle de recette",
                                                         "applications": ["rapport"]})
                    assert created["invitationSent"] is False
                    account_id = created["id"]
                    row = next(row for row in call("/accounts")["users"] if row["id"] == account_id)
                    assert row["canArchive"] and row["canDelete"] and row["canSendActivationEmail"]
                    lifecycle = f"/users/{account_id}/lifecycle"
                    assert call(lifecycle, "PATCH", {"archived": True})["archived"]
                    row = next(row for row in call("/accounts")["users"] if row["id"] == account_id)
                    assert row["canRestore"]
                    assert not call(lifecycle, "PATCH", {"archived": False})["archived"]
                    reports.execute("INSERT INTO rapport_reports VALUES ('avereo_connect', ?, ?)", (str(account_id), email))
                    reports.commit()
                    result = call(lifecycle, "DELETE", {"confirmationEmail": email, "keepReports": keep})
                    assert result["reportsPreserved"] is keep
                    assert reports.execute("SELECT COUNT(*) FROM rapport_reports WHERE owner_id=?", (str(account_id),)).fetchone()[0] == int(keep)
                    assert account_id not in [row["id"] for row in call("/accounts")["users"]]
        except Exception:
            log.seek(0)
            print(log.read().decode(errors="replace"))
            raise
        finally:
            server.terminate()
            server.wait(timeout=10)
print("PASS local CONNECT review: creation, archiving, restoration and both deletion choices")
