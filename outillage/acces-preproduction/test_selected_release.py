"""Guardrails for the two-app file delivery; local fixtures, no hosting access."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec=importlib.util.spec_from_file_location('selected_release',Path(__file__).with_name('release_selected_preprod.py'))
release=importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class SelectedReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.work=Path(self.temp.name).resolve()

    def tearDown(self):
        self.temp.cleanup()

    def manifest(self):
        apps={}
        for name in release.TARGETS:
            archive=self.work/(name+'.zip')
            with zipfile.ZipFile(archive,'w') as out:
                out.writestr('index.html',b'candidate')
            apps[name]={'artifactSha256':release.digest(archive.read_bytes()),
                        'files':{'index.html':{'sha256':release.digest(b'candidate')}}}
        (self.work/'selection.json').write_text(json.dumps({'applications':apps}))
        return apps

    def test_traversal_and_private_paths_refused(self):
        for path in ('../index.html','/tmp/index.html','a\\x','a/../../x','.env','api/config.php','a:drive'):
            with self.subTest(path=path), self.assertRaises(ValueError): release.safe_name(path)

    def test_expected_runtime_names_allowed(self):
        for path in ('index.html','.htaccess','.user.ini','api/storage.php','assets/main.js'):
            self.assertEqual(path,release.safe_name(path))

    def test_valid_archive(self):
        self.manifest()
        _,files=release.load_candidates(self.work)
        self.assertEqual(set(files),set(release.TARGETS))

    def test_corrupt_archive_refused(self):
        self.manifest()
        (self.work/'rapport.zip').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError,'Archive mismatch'): release.load_candidates(self.work)

    def test_extra_app_refused(self):
        apps=self.manifest(); apps['connect']=apps['rapport']
        (self.work/'selection.json').write_text(json.dumps({'applications':apps}))
        with self.assertRaisesRegex(ValueError,'two-app'): release.load_candidates(self.work)

    def test_missing_candidate_file_refused(self):
        apps=self.manifest();apps['rapport']['files']['missing.php']={'sha256':'0'*64}
        (self.work/'selection.json').write_text(json.dumps({'applications':apps}))
        with self.assertRaisesRegex(ValueError,'inventory'): release.load_candidates(self.work)

    def test_wrong_file_digest_refused(self):
        apps=self.manifest();apps['rapport']['files']['index.html']['sha256']='0'*64
        (self.work/'selection.json').write_text(json.dumps({'applications':apps}))
        with self.assertRaisesRegex(ValueError,'file mismatch'): release.load_candidates(self.work)

    def test_atomic_file_replacement(self):
        path=self.work/'index.html';path.write_bytes(b'before')
        release.atomic_write(path,b'after',0o644)
        self.assertEqual(path.read_bytes(),b'after')
        self.assertEqual([p.name for p in self.work.iterdir()],['index.html'])

    def test_drift_refused_before_write(self):
        root=self.work/'rapport';root.mkdir();(root/'index.html').write_bytes(b'changed')
        plan={'applications':{'rapport':{'root':str(root),'before':{}}}}
        with patch.object(release,'TARGETS',{'rapport':root}), patch.object(release,'declared_root',return_value=root):
            with self.assertRaisesRegex(ValueError,'Active file drift'): release.verify_preflight(self.work,plan)
        self.assertEqual((root/'index.html').read_bytes(),b'changed')

    def delivery_fixture(self):
        root=self.work/'active';root.mkdir()
        (root/'index.html').write_bytes(b'before')
        (root/'.htaccess').write_bytes(b'private-policy')
        config=self.work/'.avereo/rapport-preprod/config.php'
        config.parent.mkdir(parents=True);config.write_bytes(b'private-config')
        backup=self.work/'recovery/rapport/public';backup.mkdir(parents=True)
        for source in root.iterdir(): (backup/source.name).write_bytes(source.read_bytes())
        before=release.tree(root);operations={};candidates={'new.js':b'new-js','index.html':b'new-index'}
        for rel,data in candidates.items():
            previous=release.record(root/rel)
            # Windows exposes different permission bits; use the observed mode.
            probe=self.work/'mode-probe';probe.write_bytes(data)
            after=release.record(probe);probe.unlink()
            operations[rel]={'action':'replace' if previous['exists'] else 'create','before':previous,'after':after}
        app={'root':str(root),'sourceSha':'a'*40,'artifactSha256':'b'*64,'before':before,
             'privateConfig':release.record(config),'operations':operations,'counts':{'create':1,'replace':1,'preserve':0}}
        (self.work/'plan.json').write_text(json.dumps({'applications':{'rapport':app}}))
        manifest={'applications':{'rapport':{'artifactSha256':'b'*64}}}
        return root,before,manifest,{'rapport':candidates}

    def test_failed_index_write_restores_entire_before_image(self):
        root,before,manifest,candidates=self.delivery_fixture();original=release.atomic_write
        def fail_index(path,content,mode):
            if path.name=='index.html': raise OSError('simulated write failure')
            original(path,content,mode)
        with patch.object(release,'TARGETS',{'rapport':root}),patch.object(release,'HOME',self.work),patch.object(release,'declared_root',return_value=root),patch.object(release,'load_candidates',return_value=(manifest,candidates)),patch.object(release,'atomic_write',side_effect=fail_index):
            with self.assertRaisesRegex(OSError,'simulated'):release.apply(self.work)
        self.assertEqual(release.tree(root),before)
        self.assertFalse((self.work/'delivery.json').exists())

    def test_success_keeps_access_policy_and_private_configuration(self):
        root,_,manifest,candidates=self.delivery_fixture()
        with patch.object(release,'TARGETS',{'rapport':root}),patch.object(release,'HOME',self.work),patch.object(release,'declared_root',return_value=root),patch.object(release,'load_candidates',return_value=(manifest,candidates)):
            result=release.apply(self.work)
        self.assertEqual(result['writtenFiles'],2)
        self.assertEqual((root/'.htaccess').read_bytes(),b'private-policy')
        self.assertEqual((self.work/'.avereo/rapport-preprod/config.php').read_bytes(),b'private-config')


if __name__=='__main__': unittest.main()
