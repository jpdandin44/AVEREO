"""Contrôle les versions, l'intégrité et les chemins d'une livraison locale fictive."""
import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile, ZipInfo

script = Path(__file__).resolve().parents[1]/'workflows/prepare-preproduction.py'
spec = importlib.util.spec_from_file_location('prepare_preproduction',script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PreproductionTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='passeport-preproduction-test-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.archive = self.root/'candidate.zip'
        self.manifest = self.root/'candidate.manifest.json'
        self.files = {'index.html':b'<html>Fictif</html>','assets/app.js':b'console.log("fictif");'}
        self.candidate = {'sourceSha':'a'*40}
        self.build_fixture()

    def build_fixture(self, extra=None, symlink=False):
        files = dict(self.files)
        if extra: files.update(extra)
        with ZipFile(self.archive,'w') as archive:
            for name, content in files.items():
                info = ZipInfo(name)
                if symlink and name == 'assets/app.js':
                    info.create_system = 3
                    info.external_attr = 0o120777 << 16
                archive.writestr(info,content)
        self.candidate['artifactSha256'] = hashlib.sha256(self.archive.read_bytes()).hexdigest()
        manifest = dict(self.candidate,files=[{'path':name,'sha256':hashlib.sha256(content).hexdigest(),'size':len(content)} for name,content in files.items()])
        self.manifest.write_text(json.dumps(manifest),encoding='utf-8')

    def test_bundle_reproducible_and_candidate_unchanged(self):
        before = self.archive.read_bytes()
        first = module.prepare(self.archive,self.manifest,self.candidate,self.root/'first')
        second = module.prepare(self.archive,self.manifest,self.candidate,self.root/'second')
        self.assertEqual(first['bundleSha256'],second['bundleSha256'])
        self.assertEqual(self.archive.read_bytes(),before)
        self.assertEqual(first['restoreRehearsal'],'passed_local_files_only')
        self.assertEqual(first['hostedBackupRestore'],'not_verified')
        with ZipFile(self.root/'first/preproduction.zip') as archive:
            for name, content in self.files.items(): self.assertEqual(archive.read(name),content)
            self.assertIn(b'Require all denied',archive.read('.htaccess'))

    def test_wrong_source_refused(self):
        with self.assertRaises(ValueError):
            module.prepare(self.archive,self.manifest,dict(self.candidate,sourceSha='b'*40),self.root/'output')

    def test_modified_asset_refused(self):
        manifest = json.loads(self.manifest.read_text())
        manifest['files'][0]['sha256'] = '0'*64
        self.manifest.write_text(json.dumps(manifest))
        with self.assertRaises(ValueError):
            module.prepare(self.archive,self.manifest,self.candidate,self.root/'output')

    def test_unsafe_path_refused_without_external_write(self):
        self.build_fixture({'../outside.txt':b'fictif'})
        with self.assertRaises(ValueError):
            module.prepare(self.archive,self.manifest,self.candidate,self.root/'output')
        self.assertFalse((self.root/'outside.txt').exists())

    def test_undeclared_file_refused(self):
        with ZipFile(self.archive,'a') as archive: archive.writestr('secret.txt',b'fictif')
        self.candidate['artifactSha256'] = hashlib.sha256(self.archive.read_bytes()).hexdigest()
        manifest = json.loads(self.manifest.read_text())
        manifest['artifactSha256'] = self.candidate['artifactSha256']
        self.manifest.write_text(json.dumps(manifest))
        with self.assertRaises(ValueError):
            module.prepare(self.archive,self.manifest,self.candidate,self.root/'output')

    def test_symbolic_link_refused(self):
        self.build_fixture(symlink=True)
        with self.assertRaises(ValueError):
            module.prepare(self.archive,self.manifest,self.candidate,self.root/'output')


if __name__ == '__main__': unittest.main()
