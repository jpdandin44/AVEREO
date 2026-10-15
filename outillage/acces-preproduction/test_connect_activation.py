"""Refuse incorrect references/private files and verify deterministic packaging."""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import prepare_connect_activation as prepare


class ConnectActivationCandidateTests(unittest.TestCase):
    def setUp(self):
        self.files = {name: b'synthetic code' for name in (
            'backend/public/index.php', 'backend/public/index.html', 'backend/bin/migrate.php',
            'database/migrations/' + prepare.ACTIVATION + '.down.sql')}
        self.files['database/migrations/' + prepare.ACTIVATION + '.up.sql'] = (
            b"ALTER TABLE users ADD onboarding_status VARCHAR(16) DEFAULT 'completed', ADD activation_email_sent_at DATETIME(6);")
        self.mode = b'100644'
        self.bridge_files = {name: b'synthetic module' for name in (
            'avereo_identity_bridge.module', 'avereo_identity_bridge.routing.yml',
            'src/Controller/AccountActivationController.php', 'src/Form/ActivationPasswordForm.php',
            'tests/activation-flow.php')}

    def git(self, args, **kwargs):
        if 'rev-parse' in args:
            return 'a' * 40 + '\n'
        if 'ls-tree' in args:
            if 'avereo_identity_bridge' in args[-1]:
                prefix = prepare.APP + 'integrations/drupal/avereo_identity_bridge/'
                return b'\0'.join(self.mode + b' blob ' + b'0' * 40 + b'\t' + (prefix + name).encode() for name in self.bridge_files) + b'\0'
            return b'\0'.join(self.mode + b' blob ' + b'0' * 40 + b'\t' + (prepare.APP + name).encode() for name in self.files) + b'\0'
        prefix = prepare.APP + 'integrations/drupal/avereo_identity_bridge/'
        if prefix in args[-1]:
            return self.bridge_files[args[-1].split(':', 1)[1][len(prefix):]]
        return self.files[args[-1].split(':', 1)[1][len(prepare.APP):]]

    def test_wrong_or_short_reference_refused_before_packaging(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(prepare.subprocess, 'check_output', side_effect=self.git):
            for sha in ('abc', 'b' * 40):
                with self.assertRaises(ValueError):
                    prepare.prepare(Path('.'), sha, Path(folder) / 'output')
            self.assertFalse((Path(folder) / 'output').exists())

    def test_archive_reproducible_and_host_protections_preserved(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(prepare.subprocess, 'check_output', side_effect=self.git):
            first = prepare.prepare(Path('.'), 'a' * 40, Path(folder) / 'first')
            second = prepare.prepare(Path('.'), 'a' * 40, Path(folder) / 'second')
            self.assertEqual(first['artifact_sha256'], second['artifact_sha256'])
            self.assertEqual(first['preserve_hosted_paths'], ['public/.htaccess'])
            self.assertFalse(first['migration']['automatic_down'])
            self.assertFalse(first['remote_writes'])
            self.assertFalse(first['passport_integration_included'])

    def test_private_file_and_symlink_refused(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(prepare.subprocess, 'check_output', side_effect=self.git):
            self.files['backend/public/.env'] = b'synthetic'
            with self.assertRaises(ValueError):
                prepare.prepare(Path('.'), 'a' * 40, Path(folder) / 'output')
            del self.files['backend/public/.env']
            self.mode = b'120000'
            with self.assertRaises(ValueError):
                prepare.prepare(Path('.'), 'a' * 40, Path(folder) / 'output')

    def test_missing_or_changed_activation_contract_refused(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(prepare.subprocess, 'check_output', side_effect=self.git):
            self.files['database/migrations/' + prepare.ACTIVATION + '.up.sql'] = b'ALTER TABLE another_table;'
            with self.assertRaises(ValueError):
                prepare.prepare(Path('.'), 'a' * 40, Path(folder) / 'output')

    def test_bridge_excludes_tests_and_has_no_secret_or_deployment(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(prepare.subprocess, 'check_output', side_effect=self.git):
            output = Path(folder)
            first = prepare.prepare_bridge(Path('.'), 'a' * 40, output)
            second = prepare.prepare_bridge(Path('.'), 'a' * 40, output)
            self.assertEqual(first['artifact_sha256'], second['artifact_sha256'])
            self.assertNotIn('tests/activation-flow.php', first['files'])
            self.assertFalse(first['new_secret_created'])
            self.assertFalse(first['remote_writes'])

    def test_incomplete_or_private_bridge_refused(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(prepare.subprocess, 'check_output', side_effect=self.git):
            del self.bridge_files['src/Form/ActivationPasswordForm.php']
            with self.assertRaises(ValueError):
                prepare.prepare_bridge(Path('.'), 'a' * 40, Path(folder))
            self.bridge_files['.env'] = b'synthetic'
            with self.assertRaises(ValueError):
                prepare.prepare_bridge(Path('.'), 'a' * 40, Path(folder))
            del self.files['backend/bin/migrate.php']
            with self.assertRaises(ValueError):
                prepare.prepare(Path('.'), 'a' * 40, Path(folder) / 'output')


if __name__ == '__main__':
    unittest.main()
