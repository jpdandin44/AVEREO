"""Delivery boundaries: access preservation, complete inventories and inverses."""
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile, ZipInfo

import prepare_delivery_batch as delivery
from prepare_application_candidates import digest, pack


def before(content, mode=0o640):
    return {'active': {'exists': True, 'sha256': digest(content),
                       'sha256_lf': digest(content.replace(b'\r\n', b'\n')),
                       'bytes': len(content), 'mode': mode}, 'backup_matches_active': True}


class DeliveryBatchTest(unittest.TestCase):
    def test_coupe_oauth_access_rule_survives_different_candidate(self):
        hosted = b'RewriteRule ^auth/ - [L]\n'
        op = delivery.operation('.htaccess', b'RewriteRule ^auth / [R=303,L]\n', before(hosted, 0o600))
        self.assertEqual(op['action'], 'preserve')
        self.assertEqual(op['after'], before(hosted, 0o600)['active'])
        self.assertEqual(op['rollback'], {'action': 'none'})

    def test_line_endings_do_not_trigger_security_file_replacement(self):
        op = delivery.operation('connect/gate.php', b'<?php\r\n// gate\r\n', before(b'<?php\n// gate\n', 0o600))
        self.assertEqual(op['action'], 'preserve')
        self.assertEqual(op['after']['mode'], 0o600)

    def test_inverse_records_both_replaced_and_new_files(self):
        old = before(b'old index', 0o640)
        replaced = delivery.operation('index.html', b'new index', old)
        added = delivery.operation('assets/new.js', b'new asset', {
            'active': {'exists': False}, 'backup_matches_active': True})
        self.assertEqual(replaced['after']['mode'], 0o640)
        self.assertEqual(replaced['rollback']['restore'], old['active'])
        self.assertEqual(replaced['rollback']['require_current'], replaced['after'])
        self.assertEqual(added['rollback']['action'], 'remove_added_file')
        self.assertEqual(added['rollback']['require_current']['sha256'], digest(b'new asset'))
        self.assertEqual(added['after']['mode'], 0o644)
        self.assertFalse(added['rollback']['restore']['exists'])

    def test_divergent_backup_and_missing_access_rule_are_refused(self):
        mismatch = before(b'old')
        mismatch['backup_matches_active'] = False
        with self.assertRaises(ValueError):
            delivery.operation('index.html', b'new', mismatch)
        with self.assertRaises(ValueError):
            delivery.operation('.htaccess', b'candidate', {
                'active': {'exists': False}, 'backup_matches_active': True})

    def test_archive_traversal_duplicate_and_symlink_are_refused(self):
        for names, symlink in ((['../outside.php'], False), (['index.html', 'index.html'], False),
                               (['index.html'], True), (['.env'], False), (['config.php'], False)):
            with self.subTest(names=names, symlink=symlink):
                data = io.BytesIO()
                with ZipFile(data, 'w') as archive:
                    for name in names:
                        info = ZipInfo(name)
                        info.create_system = 3
                        info.external_attr = (0o120777 if symlink else 0o100644) << 16
                        archive.writestr(info, b'synthetic')
                with self.assertRaises(ValueError):
                    delivery.read_archive(data.getvalue())

    def test_complete_five_target_plan_and_refusal_of_drift(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary)
            candidate = {'.htaccess': b'candidate access', 'index.html': b'new index',
                         'assets/new.js': b'new asset'}
            pack(path / 'app.zip', candidate)
            data = (path / 'app.zip').read_bytes()
            recovery = delivery.HOME + '/private/preprod-alignment/recovery-synthetic'
            apps, host = [], []
            for name in delivery.APPS:
                root = delivery.HOME + '/' + name + '-preprod.avereo.fr'
                backup = recovery + '/' + name + '/backup'
                apps.append({'app': name, 'domain': name + '-preprod.avereo.fr', 'document_root': root,
                             'backup': backup, 'artifact_sha256': digest(data),
                             'hosted_htaccess_sha256': digest(b'hosted access')})
                host.append({'app': name, 'root': root, 'backup': backup, 'files': {
                    '.htaccess': before(b'hosted access'), 'index.html': before(b'old index'),
                    'assets/new.js': {'active': {'exists': False}, 'backup_matches_active': True}}})
            plan = {'source_sha': 'a' * 40, 'applications': apps, 'recovery_directory': recovery,
                    'recipe': ['synthetic recipe']}
            files = {name + '.zip': data for name in delivery.APPS}
            files['plan-livraison-recette.json'] = json.dumps(plan).encode()
            pack(path / 'batch.zip', files)
            original = (path / 'batch.zip').read_bytes()
            metadata = {'observed_at': 'synthetic', 'active_files_modified': False, 'applications': host}
            result, _ = delivery.prepare(original, metadata)
            for app in result['applications']:
                self.assertEqual(app['operation_counts'], {'preserve': 1, 'replace': 1, 'create': 1})
                self.assertTrue(app['preserve_hosted_htaccess'])
            self.assertTrue(result['delivery_method']['preserve_paths_not_listed_in_operations'])
            self.assertFalse(result['includes_sql_migration'])
            changed = copy.deepcopy(metadata)
            changed['applications'][0]['root'] = delivery.HOME + '/rapport.avereo.fr'
            with self.assertRaises(ValueError):
                delivery.prepare(original, changed)
            changed = copy.deepcopy(metadata)
            del changed['applications'][0]['files']['assets/new.js']
            with self.assertRaises(ValueError):
                delivery.prepare(original, changed)
            changed = dict(files)
            changed['rapport.zip'] = b'changed archive'
            pack(path / 'changed.zip', changed)
            with self.assertRaises(ValueError):
                delivery.prepare((path / 'changed.zip').read_bytes(), metadata)


if __name__ == '__main__':
    unittest.main()
