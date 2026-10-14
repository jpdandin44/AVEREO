"""L'archive doit conserver le même ordre de noms sensibles à la casse sur Windows et Linux."""
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from zipfile import ZipFile

script=Path(__file__).resolve().parents[1]/'workflows/package-candidate.py'
spec=importlib.util.spec_from_file_location('package_candidate',script)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CandidatePackageTests(unittest.TestCase):
    def test_cross_platform_archive_order_and_bytes(self):
        with tempfile.TemporaryDirectory(prefix='passeport-package-') as temporary:
            root=Path(temporary)
            dist=root/'frontend/dist'
            (dist/'assets').mkdir(parents=True)
            fixtures={'index.html':b'<html>Fictif</html>','assets/index-Co.js':b'const fictif=1;','assets/index-CZ.css':b'body{color:black}'}
            for name,content in fixtures.items(): (dist/name).write_bytes(content)
            with patch.object(module,'ROOT',root):
                digest,manifest=module.build(root/'first.zip')
                repeat,_=module.build(root/'repeat.zip')
            self.assertEqual(digest,repeat)
            with ZipFile(root/'first.zip') as archive:
                self.assertEqual(archive.namelist(),['assets/index-CZ.css','assets/index-Co.js','index.html'])
                for name,content in fixtures.items(): self.assertEqual(archive.read(name),content)
            self.assertEqual([item['path'] for item in manifest],archive.namelist())

    def test_private_file_is_rejected_before_archive_creation(self):
        with tempfile.TemporaryDirectory(prefix='passeport-package-private-') as temporary:
            root=Path(temporary)
            dist=root/'frontend/dist'
            (dist/'connect').mkdir(parents=True)
            (dist/'index.html').write_bytes(b'<html>Fictif</html>')
            (dist/'connect/config.php').write_bytes(b'<?php /* fixture private */')
            with patch.object(module,'ROOT',root), self.assertRaises(ValueError):
                module.build(root/'candidate.zip')
            self.assertFalse((root/'candidate.zip').exists())

if __name__=='__main__': unittest.main()
