"""Single-app delivery boundary and rollback rehearsal, on disposable files only."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location('archives_release', Path(__file__).resolve().parents[1] / 'workflows/release-archives-preproduction.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ArchivesReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.work = Path(self.temp.name).resolve()

    def tearDown(self):
        self.temp.cleanup()

    def selection(self):
        path = self.work / 'passeport-immo.zip'
        with ZipFile(path, 'w') as archive:
            archive.writestr('index.html', b'new index')
        digest = release.engine.digest(path.read_bytes())
        data = {'applications': {'passeport-immo': {'sourceSha': 'a'*40, 'artifactSha256': digest, 'files': {'index.html': {'sha256': release.engine.digest(b'new index')}}}}}
        (self.work / 'selection.json').write_text(json.dumps(data))
        return digest, data

    def test_exactly_one_application_and_pinned_archive(self):
        digest, data = self.selection()
        with self.assertRaisesRegex(ValueError, 'Reviewed PR144'):
            release.validate_scope(self.work)
        with patch.object(release, 'ARTIFACT', digest):
            release.validate_scope(self.work)
            data['applications']['rapport'] = data['applications']['passeport-immo']
            (self.work / 'selection.json').write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'scope required'):
                release.validate_scope(self.work)

    def test_protected_runtime_differences_block_all_live_writes(self):
        digest, _ = self.selection()
        for name in ['.htaccess', '.user.ini', 'account-menu.js', 'api/index.php', 'index.php', 'connect/entry.php', 'connect/session.php']:
            plan = {'applications': {'passeport-immo': {'operations': {name: {'action': 'replace'}}}}}
            (self.work / 'plan.json').write_text(json.dumps(plan))
            with self.subTest(name=name), patch.object(release, 'ARTIFACT', digest), patch.object(release.engine, 'apply') as apply:
                with self.assertRaisesRegex(ValueError, 'Protected runtime'):
                    release.perform('apply', self.work)
                apply.assert_not_called()

    def test_archive_import_code_and_assets_are_the_only_writable_paths(self):
        for name in ['index.html', 'api/storage.php', 'assets/main.js', 'assets/main.css']:
            self.assertTrue(release.allowed_write(name))
        for name in ['api/index.php', 'connect/gate.php', 'account-menu.js', '.htaccess']:
            self.assertFalse(release.allowed_write(name))

    def test_companion_upgrade_requires_exact_observed_before_image(self):
        digest, _ = self.selection()
        for name, before in release.COMPANION_BASELINES.items():
            plan = {'applications': {'passeport-immo': {'operations': {name: {'action': 'replace', 'before': {'sha256_lf': before}}}}}}
            with self.subTest(name=name), patch.object(release, 'ARTIFACT', digest):
                release.validate_scope(self.work, plan)
                plan['applications']['passeport-immo']['operations'][name]['before']['sha256_lf'] = 'changed'
                with self.assertRaisesRegex(ValueError, 'Protected runtime'):
                    release.validate_scope(self.work, plan)

    def test_candidate_then_rollback_on_copy_preserves_live_files(self):
        root = self.work / 'active'
        root.mkdir()
        (root / 'assets').mkdir()
        (root / 'index.html').write_bytes(b'old index')
        (root / '.htaccess').write_bytes(b'private access')
        config = self.work / '.avereo/passeport-immo-preprod/config.php'
        config.parent.mkdir(parents=True)
        config.write_bytes(b'fixture, no credentials')
        before = release.engine.tree(root)
        backup = self.work / 'recovery/passeport-immo/public'
        backup.parent.mkdir(parents=True)
        shutil.copytree(root, backup)
        candidates = {'passeport-immo': {'index.html': b'new index', 'assets/new.js': b'new asset'}}
        operations = {}
        for name, data in candidates['passeport-immo'].items():
            probe = self.work / 'mode-probe'
            probe.write_bytes(data)
            operations[name] = {'action': 'replace' if (root/name).exists() else 'create', 'before': release.engine.record(root/name), 'after': release.engine.record(probe)}
            probe.unlink()
        plan = {'applications': {'passeport-immo': {'root': str(root), 'before': before, 'privateConfig': release.engine.record(config), 'operations': operations}}}
        with patch.object(release.engine, 'HOME', self.work), patch.object(release.engine, 'TARGETS', {'passeport-immo': root}), patch.object(release.engine, 'declared_root', return_value=root):
            result = release.rehearse(self.work, plan, candidates)
        self.assertEqual(result['restoredOnCopy'], 'passed')
        self.assertEqual(release.engine.tree(root), before)
        self.assertEqual(release.engine.tree(backup.parent/'rollback-rehearsal'), before)

    def test_production_or_cron_drift_blocks_apply(self):
        digest, _ = self.selection()
        plan = {'applications': {'passeport-immo': {'operations': {}}}, 'rollbackRehearsal': {'restoredOnCopy': 'passed'}, 'externalGuards': {'cronSha256': 'before'}}
        (self.work / 'plan.json').write_text(json.dumps(plan))
        with patch.object(release, 'ARTIFACT', digest), patch.object(release, 'external_guards', return_value={'cronSha256': 'changed'}), patch.object(release.engine, 'apply') as apply:
            with self.assertRaisesRegex(ValueError, 'Production or cron drift'):
                release.perform('apply', self.work)
            apply.assert_not_called()


if __name__ == '__main__':
    unittest.main()
