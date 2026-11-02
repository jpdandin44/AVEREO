import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('rga_delivery', Path(__file__).resolve().parents[1] / 'workflows/deliver-rga-preproduction.py')
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)


class DeliveryTests(unittest.TestCase):
    def test_distinct_rga_scope_keeps_rapport_gate_and_other_apps_protected(self):
        connect = ['src/Application.php', 'src/Config.php', 'public/index.php', 'src/Repository/RgaRegistration.php', 'bin/register-rga.php']
        rapport = ['index.html', 'rga/guard.php', 'rga/gate.php', 'rga/connect-gate.php', 'rga/entry.php', 'rga/resume.php', 'rga/access.php', 'assets/index-test.js']
        files = {**{'connect/' + n: 'hash' for n in connect}, **{'rapport/' + n: 'hash' for n in rapport}}
        delivery.validate_file_scope({'kind': 'rga-independent-access', 'files': files})
        for invalid in ['rapport/connect/gate.php', 'rapport/.htaccess', 'connect/src/Repository/PdoConnectRepository.php', 'rapport/assets/../gate.php']:
            with self.assertRaises(AssertionError):
                delivery.validate_file_scope({'kind': 'rga-independent-access', 'files': dict(files, **{invalid: 'hash'})})

    def test_install_restore_preserves_unrelated_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            delivery.BASE = root
            delivery.SOURCE = root / 'candidate'
            delivery.BACKUP = root / 'recovery'
            roots = {key: root / key for key in ('rapport', 'connect')}
            for key in roots:
                roots[key].mkdir()
                (roots[key] / 'index.html').write_text('old')
                (roots[key] / 'private-note').write_text('preserve')
                (delivery.SOURCE / key).mkdir(parents=True)
                (delivery.SOURCE / key / 'index.html').write_text('new')
                (delivery.SOURCE / key / 'new.js').write_text('new asset')
                delivery.shutil.copytree(roots[key], delivery.BACKUP / key)
            before = {k: delivery.tree(p) for k, p in roots.items()}
            delivery.MANIFEST = {'files': delivery.tree(delivery.SOURCE)}
            delivery.install(roots)
            for p in roots.values():
                self.assertEqual((p / 'index.html').read_text(), 'new')
                self.assertEqual((p / 'private-note').read_text(), 'preserve')
            delivery.restore(roots, before)
            self.assertEqual({k: delivery.tree(p) for k, p in roots.items()}, before)

    def test_paths_cannot_escape_target(self):
        with tempfile.TemporaryDirectory() as directory:
            for value in ['../escape', str(Path(directory).parent / 'escape')]:
                with self.assertRaises(AssertionError):
                    delivery.checked(Path(directory), value)

    def test_new_file_changed_after_delivery_is_not_deleted(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            delivery.BASE = root
            roots = {k: root / k for k in ('connect', 'rapport')}
            for p in roots.values():
                p.mkdir()
            (roots['connect'] / 'new.js').write_text('later user change')
            delivery.MANIFEST = {'files': {'connect/new.js': 'not-the-current-hash'}}
            with self.assertRaises(AssertionError):
                delivery.restore(roots, {'connect': {}, 'rapport': {}})
            self.assertTrue((roots['connect'] / 'new.js').exists())


if __name__ == '__main__':
    unittest.main()
