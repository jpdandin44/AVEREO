"""Candidate boundaries and reproducible archive integrity; no network."""
import hashlib
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile
import prepare_application_candidates as candidates


class ApplicationCandidatesTest(unittest.TestCase):
    def test_private_configuration_is_never_packaged(self):
        for name in ('.env', 'config.php', '.private/secret.txt'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('synthetic only')
                with self.assertRaises(ValueError):
                    candidates.code_files(root)

    def test_archive_is_reproducible_and_preserves_access_rules(self):
        files = {'index.html': b'<html>test</html>', '.htaccess': b'Require all denied\n',
                 'assets/test.js': b'console.log("test")'}
        with tempfile.TemporaryDirectory() as temporary:
            first, second = (Path(temporary) / name for name in ('first.zip', 'second.zip'))
            candidates.pack(first, files)
            candidates.pack(second, files)
            self.assertEqual(hashlib.sha256(first.read_bytes()).digest(),
                             hashlib.sha256(second.read_bytes()).digest())
            with ZipFile(first) as archive:
                self.assertEqual(archive.read('.htaccess'), b'Require all denied\n')
                self.assertEqual(set(archive.namelist()), set(files))

    def test_empty_source_is_refused(self):
        with tempfile.TemporaryDirectory() as temporary:
            with self.assertRaises(ValueError):
                candidates.code_files(Path(temporary))

    def test_symlink_is_refused(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            target = root / 'source.js'
            target.write_text('synthetic only')
            try:
                (root / 'alias.js').symlink_to(target)
            except OSError:
                self.skipTest('Création de lien symbolique non autorisée sur ce poste')
            with self.assertRaises(ValueError):
                candidates.code_files(root)
