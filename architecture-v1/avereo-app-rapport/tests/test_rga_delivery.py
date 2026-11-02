import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('rga_delivery', Path(__file__).resolve().parents[1] / 'workflows/deliver-rga-preproduction.py')
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)


class DeliveryTests(unittest.TestCase):
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
