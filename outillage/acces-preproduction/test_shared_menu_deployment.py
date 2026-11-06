"""Failure and conservation checks using fictitious temporary trees only."""
from pathlib import Path
import tempfile
import unittest
import shutil
from unittest.mock import patch
import deploy_shared_menu as deploy


class DeploymentTests(unittest.TestCase):
    def fixture(self, base):
        active = base / 'active'; active.mkdir()
        (active / 'index.html').write_bytes(b'previous UI')
        (active / 'a-page.html').write_bytes(b'previous secondary UI')
        (active / '.htaccess').write_bytes(b'access protection')
        planning = base / 'planning'; planning.mkdir()
        (planning / 'draft.json').write_bytes(b'fictitious planning')
        files = {'demo': {'account-menu.js': b'new menu', 'a-page.html': b'new secondary UI', 'index.html': b'new UI'}}
        recovery = base / 'recovery'
        backup = recovery / 'demo/backup'; backup.mkdir(parents=True)
        expected = base / 'expected'; expected.mkdir()
        ops = {}
        for rel, data in files['demo'].items():
            before = deploy.record(active / rel)
            if before['exists']: shutil.copy2(active / rel, backup / rel)
            (expected / rel).write_bytes(data)
            # Windows reports writable files as 0666; Linux reports its real mode.
            # Keep the production comparisons exact on both platforms.
            after = deploy.record(expected / rel)
            ops[rel] = {'action': 'replace' if before['exists'] else 'create',
                        'before': before, 'after': after}
        selection = {'applications': {'demo': {'operations': ops}}}
        plan = {'public': {'demo': deploy.tree(active)}, 'private': {},
                'planningRoot': str(planning), 'planning': deploy.tree(planning)}
        return active, files, recovery, selection, plan

    def test_success_changes_only_selected_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            active, files, recovery, selection, plan = self.fixture(Path(tmp).resolve())
            with patch.object(deploy, 'TARGETS', {'demo': active}):
                writes = deploy.install(selection, files, plan, recovery)
            self.assertEqual(len(writes), 3)
            self.assertEqual((active / 'index.html').read_bytes(), b'new UI')
            self.assertEqual((active / '.htaccess').read_bytes(), b'access protection')
            self.assertEqual(deploy.tree(Path(plan['planningRoot'])), plan['planning'])

    def test_failed_write_restores_created_file_without_touching_planning(self):
        with tempfile.TemporaryDirectory() as tmp:
            active, files, recovery, selection, plan = self.fixture(Path(tmp).resolve())
            def fail_on_page(path, data, mode):
                if path.name == 'index.html': raise OSError('fictitious write failure')
                deploy.atomic_write(path, data, mode)
            with patch.object(deploy, 'TARGETS', {'demo': active}):
                with self.assertRaisesRegex(RuntimeError, 'selected files restored'):
                    deploy.install(selection, files, plan, recovery, writer=fail_on_page)
            self.assertEqual(deploy.tree(active), plan['public']['demo'])
            self.assertEqual(deploy.tree(Path(plan['planningRoot'])), plan['planning'])

    def test_drift_refused_before_first_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            active, files, recovery, selection, plan = self.fixture(Path(tmp).resolve())
            (active / 'index.html').write_bytes(b'concurrent work')
            with patch.object(deploy, 'TARGETS', {'demo': active}):
                with self.assertRaisesRegex(ValueError, 'Active file drift'):
                    deploy.install(selection, files, plan, recovery)
            self.assertFalse((active / 'account-menu.js').exists())
            self.assertEqual((active / 'index.html').read_bytes(), b'concurrent work')

    def test_rollback_refuses_to_overwrite_concurrent_change(self):
        with tempfile.TemporaryDirectory() as tmp:
            active, files, recovery, selection, plan = self.fixture(Path(tmp).resolve())
            def concurrent_change(path, data, mode):
                if path.name == 'index.html':
                    (active / 'account-menu.js').write_bytes(b'newer unrelated work')
                    raise OSError('concurrent failure')
                deploy.atomic_write(path, data, mode)
            with patch.object(deploy, 'TARGETS', {'demo': active}):
                with self.assertRaisesRegex(ValueError, 'Rollback conflict'):
                    deploy.install(selection, files, plan, recovery, writer=concurrent_change)
            self.assertEqual((active / 'account-menu.js').read_bytes(), b'newer unrelated work')
            self.assertEqual((active / 'index.html').read_bytes(), b'previous UI')

    def test_wrong_payload_refused_before_loading_files(self):
        with self.assertRaisesRegex(ValueError, 'authorized payload'):
            deploy.apply(Path('unused'), '0' * 64)

    def test_non_private_workspace_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError, 'Exact private workspace'):
                deploy.load(Path(tmp))


if __name__ == '__main__': unittest.main()
