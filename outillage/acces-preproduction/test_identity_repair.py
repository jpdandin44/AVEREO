"""Exercise stale-candidate refusal and actual file restoration, without hosting."""
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

import repair_identity as repair


class RepairContractTests(unittest.TestCase):
    def test_existing_package_changes_are_rejected(self):
        original = {'require': {'drupal/core-recommended': '^11.4'}}
        candidate = {'require': dict(original['require'], **repair.DEPENDENCIES)}
        old = {'packages': [{'name': 'drupal/core', 'version': '11.4.6'}]}
        changed = {'packages': [{'name': 'drupal/core', 'version': '11.5.0'}]}
        with self.assertRaisesRegex(ValueError, 'existante'):
            repair.verify_contract(original, candidate, old, changed)

    def test_unrelated_manifest_field_is_rejected(self):
        original = {'require': {}, 'extra': {'web-root': './'}}
        candidate = {'require': repair.DEPENDENCIES, 'extra': {'web-root': '../production'}}
        with self.assertRaisesRegex(ValueError, 'autre champ'):
            repair.verify_contract(original, candidate, {}, {})

    def test_production_root_is_refused(self):
        with patch.object(repair, 'TARGET', Path('/home/daje3540/avereo.fr')):
            with self.assertRaisesRegex(ValueError, 'qualifiee'):
                repair.validate_target()


class RepairFilesystemTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        self.target = root / 'target'
        self.private = root / 'private'
        self.folder = self.private / '20261006T180000000000Z'
        self.target.mkdir()
        self.folder.mkdir(parents=True)
        (self.target / 'vendor').mkdir()
        (self.target / 'vendor/autoload.php').write_text('original')
        (self.target / 'composer.json').write_text('{}')
        (self.target / 'composer.lock').write_text('{}')
        original_digest = repair.digest(self.target)
        for name in ('backup', 'candidate'):
            shutil.copytree(self.target, self.folder / name)
        (self.folder / 'candidate/vendor/autoload.php').write_text('candidate')
        (self.folder / 'candidate/composer.json').write_text('{"require":{}}')
        self.artifact = repair.digest(self.folder / 'candidate')
        self.receipt = {'target': str(self.target), 'artifact_sha256': self.artifact,
            'original_sha256': original_digest, 'modes': {name: 0o644 for name in repair.PARTS}}
        (self.folder / 'receipt.json').write_text(json.dumps(self.receipt))
        self.patches = [patch.object(repair, 'TARGET', self.target),
            patch.object(repair, 'PRIVATE', self.private), patch.object(repair, 'validate_target')]
        for item in self.patches:
            item.start()

    def tearDown(self):
        for item in reversed(self.patches):
            item.stop()
        self.temp.cleanup()

    def test_apply_and_rollback_restore_original_bytes(self):
        repair.apply(self.folder, self.artifact)
        self.assertEqual(repair.digest(self.target), self.artifact)
        repair.rollback(self.folder, self.artifact)
        self.assertEqual(repair.digest(self.target), self.receipt['original_sha256'])

    def test_concurrent_change_refuses_apply_without_writing(self):
        (self.target / 'vendor/new.php').write_text('external change')
        changed = repair.digest(self.target)
        with self.assertRaisesRegex(ValueError, 'concurrente'):
            repair.apply(self.folder, self.artifact)
        self.assertEqual(repair.digest(self.target), changed)
        self.assertFalse((self.folder / 'live-original.vendor').exists())

    def test_failure_during_file_promotion_restores_vendor(self):
        original = repair.atomic_file
        calls = []
        def fail_once(*args):
            calls.append(True)
            if len(calls) == 1:
                raise OSError('simulated transfer failure')
            return original(*args)
        with patch.object(repair, 'atomic_file', side_effect=fail_once):
            with self.assertRaises(OSError):
                repair.apply(self.folder, self.artifact)
        self.assertEqual(repair.digest(self.target), self.receipt['original_sha256'])


if __name__ == '__main__':
    unittest.main()
