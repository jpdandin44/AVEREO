"""Unit and local Apache tests with synthetic, disposable credentials only."""
import base64
import grp
import json
import os
from pathlib import Path
import pwd
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
import unittest
from urllib.request import Request

from check_access import CANDIDATES, NoRedirect, basic_header, observe, refused, target_url

HERE = Path(__file__).resolve().parent


class ContractTests(unittest.TestCase):
    def test_candidates_require_exact_https_hosts(self):
        for domain in CANDIDATES:
            self.assertEqual(target_url(domain), "https://" + domain + "/")
        for domain in ("avereo.fr", "connect.avereo.fr", "preprod.avereo.fr.evil.invalid",
                       "user:password@preprod.avereo.fr", "preprod.avereo.fr:80"):
            with self.assertRaises(ValueError):
                target_url(domain)

    def test_paths_cannot_leak_tokens_or_change_origin(self):
        self.assertTrue(target_url("connect-preprod.avereo.fr", "/api/v1/session").endswith("/session"))
        for path in ("//evil.invalid/", "/?token=secret", "/#fragment", "/../", "/%2e%2e/", "/\n"):
            with self.assertRaises(ValueError):
                target_url("connect-preprod.avereo.fr", path)

    def test_credentials_are_not_url_parameters(self):
        header = basic_header("synthetic", "dummy-value")
        self.assertEqual(base64.b64decode(header.split()[1]), b"synthetic:dummy-value")
        for username, password in (("a:b", "c"), ("a", ""), ("a", "b\nc")):
            with self.assertRaises(ValueError):
                basic_header(username, password)

    def test_redirect_handler_does_not_follow(self):
        self.assertIsNone(NoRedirect().redirect_request(Request("https://preprod.avereo.fr/"),
                          None, 302, "Found", {}, "https://external.invalid/"))

    def test_403_and_500_are_not_successful_basic_protection(self):
        for status in (200, 301, 302, 403, 404, 500, None):
            self.assertFalse(refused({"status": status, "basic_challenge": True}))
        self.assertFalse(refused({"status": 401, "basic_challenge": False}))
        self.assertTrue(refused({"status": 401, "basic_challenge": True}))

    def test_template_has_no_bypass_or_silent_module_fallback(self):
        source = (HERE / "basic-auth.htaccess.example").read_text()
        for forbidden in ("Require all granted", "Require ip", "<IfModule", "Satisfy any", "AuthMerging Off"):
            self.assertNotIn(forbidden, source)
        self.assertIn("Require valid-user", source)
        self.assertEqual(source.count("__PRIVATE_HTPASSWD_ABSOLUTE_PATH__"), 1)

    def test_tracking_requires_evidence_for_deployment(self):
        state = json.loads((HERE / "suivi.json").read_text())
        self.assertFalse(state["production_modified"])
        if state["server_modified"]:
            self.assertTrue(state["hosted_evidence"])
        for row in state["targets"]:
            if row["status"] == "qualifie":
                self.assertTrue(row["document_root"])
                self.assertTrue(row["backup_receipt"])
                self.assertTrue(row["deployment_receipt"])
                self.assertTrue(row["acceptance_receipt"])


@unittest.skipUnless(shutil.which("apache2") and shutil.which("htpasswd") and
                     Path("/usr/lib/apache2/modules").is_dir(), "Apache local indisponible")
class ApacheTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="avereo-basic-test-")
        cls.addClassCleanup(cls.tmp.cleanup)
        root = Path(cls.tmp.name)
        root.chmod(0o755)
        www = root / "www"
        protected = www / "protected"
        (protected / "api").mkdir(parents=True)
        (www / "index.html").write_text("outside-scope")
        (protected / "index.html").write_text("protected-fixture")
        (protected / "api" / "probe.html").write_text("api-fixture")
        (protected / ".env").write_text("synthetic-denied-file")
        cls.username, cls.password = "synthetic-user", secrets.token_urlsafe(24)
        passwd = root / "private-users"
        subprocess.run([shutil.which("htpasswd"), "-ciB", str(passwd), cls.username],
                       input=cls.password + "\n", text=True, capture_output=True, check=True)
        passwd.chmod(0o644)  # Synthetic only, outside DocumentRoot; readable by local Apache.
        fragment = (HERE / "basic-auth.htaccess.example").read_text().replace(
            "__PRIVATE_HTPASSWD_ABSOLUTE_PATH__", str(passwd))
        (protected / ".htaccess").write_text(fragment + '''
<Files ".env">
    Require all denied
</Files>
RewriteEngine On
RewriteRule ^redirect$ https://not-contacted.invalid/ [R=302,L]
''')
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        cls.base = f"http://127.0.0.1:{port}"
        # HTTP is permitted ONLY on local loopback for these disposable test credentials.
        user = pwd.getpwuid(os.getuid()).pw_name if os.getuid() else "www-data"
        group = grp.getgrgid(os.getgid()).gr_name if os.getuid() else "www-data"
        modules = ("mpm_event", "authn_core", "authn_file", "authz_core", "authz_host",
                   "authz_user", "auth_basic", "dir", "rewrite")
        config = root / "httpd.conf"
        config.write_text(f'ServerRoot "{root}"\nListen 127.0.0.1:{port}\nServerName localhost\n' +
            "\n".join(f"LoadModule {m}_module /usr/lib/apache2/modules/mod_{m}.so" for m in modules) +
            f'\nUser {user}\nGroup {group}\nPidFile "{root}/pid"\nErrorLog "{root}/error.log"\n'
            f'LogLevel crit\nDocumentRoot "{www}"\nDirectoryIndex index.html\n'
            f'<Directory "{www}">\nAllowOverride All\nRequire all granted\nOptions -Indexes\n</Directory>\n')
        subprocess.run([shutil.which("apache2"), "-t", "-f", str(config)],
                       capture_output=True, check=True)
        cls.process = subprocess.Popen([shutil.which("apache2"), "-f", str(config), "-DFOREGROUND"],
                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cls.addClassCleanup(cls.stop)
        for _ in range(50):
            if observe(cls.base + "/")["status"] == 200:
                return
            time.sleep(0.1)
        raise AssertionError("Le serveur Apache local ne demarre pas.")

    @classmethod
    def stop(cls):
        cls.process.terminate()
        try:
            cls.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            cls.process.kill()
            cls.process.wait()

    def test_anonymous_and_invalid_credentials_refused_on_root_and_api(self):
        for path in ("/protected/", "/protected/api/probe.html"):
            self.assertTrue(refused(observe(self.base + path)))
            self.assertTrue(refused(observe(self.base + path, basic_header("wrong", "wrong"))))

    def test_correct_credentials_work_on_root_and_api(self):
        for path in ("/protected/", "/protected/api/probe.html"):
            self.assertEqual(observe(self.base + path, basic_header(self.username, self.password))["status"], 200)

    def test_sensitive_file_stays_denied(self):
        self.assertEqual(observe(self.base + "/protected/.env",
                         basic_header(self.username, self.password))["status"], 403)

    def test_other_directory_is_unchanged(self):
        self.assertEqual(observe(self.base + "/")["status"], 200)

    def test_redirect_is_reported_not_followed(self):
        self.assertEqual(observe(self.base + "/protected/redirect",
                         basic_header(self.username, self.password))["status"], 302)


if __name__ == "__main__":
    unittest.main()
