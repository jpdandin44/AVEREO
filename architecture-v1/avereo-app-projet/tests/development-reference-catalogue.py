"""Vrais dépôts Git temporaires ; aucun accès réseau ou état utilisateur modifié."""
from pathlib import Path
import importlib.util,json,os,shutil,subprocess,tempfile,unittest

SOURCE=Path(__file__).resolve().parents[1]/'workflows/development-reference-catalogue.py'
spec=importlib.util.spec_from_file_location('catalogue',SOURCE)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
GIT=os.environ.get('AVEREO_TEST_GIT') or shutil.which('git')

@unittest.skipUnless(GIT,'Git requis')
class GitReferenceTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='avereo-git-reference-')
        self.root=Path(self.temp.name)/'AVEREO-reference';self.repo=self.root/'depot';self.repo.mkdir(parents=True)
        m.ROOT=self.root;m.cfg={'gitExecutable':GIT,'reference':{'mode':'git-clone','sourceRepository':str(self.repo),'repository':'jpdandin44/AVEREO'}}
        self.git('init','-b','main');self.git('config','user.name','Fixture');self.git('config','user.email','fixture@example.invalid')
        self.git('remote','add','origin','https://github.com/jpdandin44/AVEREO.git')
        self.ids=['connect','rapport','rga','projet','coupe','thermo','drone','passeport-immo','recherche','saisie-unique']
        for id in self.ids:
            suffix='avereo-app-rapport/frontend/public/rga' if id=='rga' else 'avereo-app-'+id
            p=self.repo/'architecture-v1'/suffix;p.mkdir(parents=True,exist_ok=True);(p/'fixture.txt').write_text(id)
        (self.repo/'architecture-v1/avereo-platform').mkdir();(self.repo/'architecture-v1/avereo-platform/fixture.txt').write_text('shared')
        self.git('add','.');self.git('commit','-m','fixture initial');self.git('commit','--allow-empty','-m','fixture history')
        self.git('update-ref','refs/remotes/origin/main','HEAD');self.git('config','branch.main.remote','origin');self.git('config','branch.main.merge','refs/heads/main')
    def tearDown(self):
        # TemporaryDirectory owns only this fixture. Git's read-only object files
        # require clearing their attribute on Windows during fixture cleanup.
        for p in self.root.rglob('*'):
            if p.is_file():p.chmod(0o600)
        self.temp.cleanup()
    def git(self,*args):
        return subprocess.run([GIT,'-C',str(self.repo),*args],check=True,capture_output=True,text=True).stdout.strip()
    def test_complete_clean_history_is_observed_without_mutation(self):
        before=self.git('rev-parse','HEAD');r=m.git_reference();self.assertEqual(r['sha'],before);self.assertEqual(r['git']['historyCommits'],2);self.assertFalse(r['git']['shallow']);self.assertEqual(self.git('status','--porcelain'),'')
    def test_dirty_reference_is_refused_without_discarding_work(self):
        p=self.repo/'personal-draft.txt';p.write_text('preserve me')
        with self.assertRaises(AssertionError):m.git_reference()
        self.assertEqual(p.read_text(),'preserve me')
    def test_other_remote_and_branch_are_refused(self):
        self.git('remote','set-url','origin','https://example.invalid/other.git')
        with self.assertRaises(AssertionError):m.git_reference()
        self.git('remote','set-url','origin','https://github.com/jpdandin44/AVEREO.git');self.git('checkout','-b','feature')
        with self.assertRaises(AssertionError):m.git_reference()
    def test_unqualified_main_and_shallow_history_are_refused(self):
        self.git('update-ref','refs/remotes/origin/main','HEAD~1')
        with self.assertRaises(AssertionError):m.git_reference()
        self.git('update-ref','refs/remotes/origin/main','HEAD');(self.repo/'.git/shallow').write_text(self.git('rev-parse','HEAD')+'\n')
        with self.assertRaises(AssertionError):m.git_reference()
    def test_export_without_git_cannot_be_a_reference(self):
        other=self.root/'versions/archive';other.mkdir(parents=True);m.cfg['reference']['sourceRepository']=str(other)
        with self.assertRaises(AssertionError):m.git_reference()
    def test_catalogue_keeps_archive_separate_from_ten_git_paths(self):
        (self.root/'data').mkdir();registry=self.root/'data/registry.json';registry.write_text(json.dumps({'applications':[{'id':id,'name':id} for id in self.ids],'entries':[]}))
        m.cfg.update(cockpitRegistry=str(registry),applicationIds=self.ids)
        (self.root/'data/fichiers-reference.json').write_text(json.dumps({'archive':str(self.root/'sauvegardes/source.zip'),'archiveSha256':'a'*64,'sourceSha':'b'*40,'directory':str(self.root/'versions/archive')}))
        c=m.catalogue(self.root/'versions/archive');self.assertEqual(len(c['applications']),10)
        for a in c['applications']:self.assertTrue(Path(a['referenceDirectory']).is_relative_to(self.repo));self.assertEqual(a['referenceSha'],self.git('rev-parse','HEAD'))
        self.assertEqual(c['referenceArchive']['sourceSha'],'b'*40);self.assertNotEqual(c['referenceArchive']['sourceSha'],c['reference']['sha'])

if __name__=='__main__':unittest.main()
