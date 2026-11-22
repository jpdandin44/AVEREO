"""500 MiB promotion cannot change access policy or accept an unknown baseline."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('large_delivery', Path(__file__).resolve().parents[1] / 'workflows/release-large-import-preproduction.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
release = module.release


class LargeImportReleaseTests(unittest.TestCase):
    def test_pin_and_single_application(self):
        self.assertEqual(release.ARTIFACT, '5f096131d1181389e50a69b59802d3d33f3dda0cefb4db17307cde951b4e0a13')
        self.assertEqual(set(release.engine.TARGETS), {'passeport-immo'})
        self.assertEqual(release.COMPANION_BASELINES, {})

    def test_limit_change_requires_exact_before_image(self):
        for name, digest in module.LIMIT_BASELINES.items():
            operation = {'action': 'replace', 'before': {'sha256_lf': digest}}
            plan = {'applications': {'passeport-immo': {'operations': {name: operation}}}}
            manifest = {'applications': {'passeport-immo': {'artifactSha256': release.ARTIFACT}}}
            with self.subTest(name=name), patch.object(release.engine, 'load_candidates', return_value=(manifest, {})):
                release.validate_scope(Path('.'), plan)
                operation['before']['sha256_lf'] = 'unknown'
                with self.assertRaisesRegex(ValueError, 'baseline differs'):
                    release.validate_scope(Path('.'), plan)

    def test_authentication_and_access_remain_protected(self):
        manifest = {'applications': {'passeport-immo': {'artifactSha256': release.ARTIFACT}}}
        for name in ['.htaccess', 'connect/gate.php', 'account-menu.js', 'connect/entry.php', 'connect/session.php', 'index.php']:
            plan = {'applications': {'passeport-immo': {'operations': {name: {'action': 'replace'}}}}}
            with self.subTest(name=name), patch.object(release.engine, 'load_candidates', return_value=(manifest, {})):
                with self.assertRaisesRegex(ValueError, 'Protected runtime'):
                    release.validate_scope(Path('.'), plan)


if __name__ == '__main__':
    unittest.main()
