"""UI delivery must never advance an API, access policy or shared account menu."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location('ui_release', Path(__file__).resolve().parents[1] / 'workflows/release-ui-preproduction.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
release = module.release


class UiReleaseTests(unittest.TestCase):
    def test_ui_only(self):
        self.assertEqual(release.COMPANION_BASELINES, {})
        for name in ['index.html', 'assets/new.js', 'assets/new.css']:
            self.assertTrue(release.allowed_write(name))
        for name in ['.htaccess', '.user.ini', 'account-menu.js', 'index.php', 'api/storage.php', 'api/publications.php', 'connect/gate.php']:
            self.assertFalse(release.allowed_write(name))

    def test_protected_difference_stops_before_apply(self):
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            with ZipFile(work / 'passeport-immo.zip', 'w') as archive:
                archive.writestr('index.html', b'fixture')
            digest = release.engine.digest((work / 'passeport-immo.zip').read_bytes())
            selection = {'applications': {'passeport-immo': {'artifactSha256': digest, 'files': {'index.html': {'sha256': release.engine.digest(b'fixture')}}}}}
            (work / 'selection.json').write_text(json.dumps(selection))
            for name in ['api/storage.php', 'account-menu.js', '.htaccess', 'index.php']:
                plan = {'applications': {'passeport-immo': {'operations': {name: {'action': 'replace'}}}}}
                (work / 'plan.json').write_text(json.dumps(plan))
                with self.subTest(name=name), patch.object(release, 'ARTIFACT', digest), patch.object(release.engine, 'apply') as apply:
                    with self.assertRaisesRegex(ValueError, 'Protected runtime'):
                        release.perform('apply', work)
                    apply.assert_not_called()


if __name__ == '__main__':
    unittest.main()
