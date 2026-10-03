import copy
import importlib.util
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('gate', ROOT/'skills/developpement-github-cockpit/scripts/check-gate.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class GateTests(unittest.TestCase):
    def fixture(self):
        date = '2026-10-03T12:00:00+02:00'
        proof = {'sourceSha':'a'*40,'artifactSha256':'b'*64,'evidence':'fixture:proof','observedAt':date}
        data = {'iterationId':'fixture-only','owner':'human-fixture','candidate':{'sourceSha':'a'*40,'artifactSha256':'b'*64},
                'blockers':[], 'checks':[dict(proof,kind=k,status='passed',target=('preprod' if k=='preproduction' else 'prod' if k=='production' else 'local')) for k in ['local','ci','documentation','preproduction','production']],
                'targets':{k:{'id':v,'ready':True,'isolated':k=='preproduction','empty':False,'evidence':'fixture:target','observedAt':date} for k,v in [('preproduction','preprod'),('production','prod')]},
                'approvals':[dict(proof,scope=s,status='approved',target=t,actor='human-fixture',source='user_chat') for s,t in [('preproduction','preprod'),('review','preprod'),('production','prod')]],
                'backups':[{'id':'fixture-backup','target':t,'status':'verified','restoreStatus':'passed','evidence':'fixture:restore','observedAt':date} for t in ['preprod','prod']],
                'rollback':dict(proof,status='tested',target='prod'),
                'github':{'repository':'example/fixture','prUrl':'fixture:pr','acceptedSourceSha':'a'*40,'acceptedArtifactSha256':'b'*64,'humanAcceptanceVerified':True,'evidence':'fixture:github','observedAt':date},
                'delivery':dict(proof,status='delivered',target='prod'),'nextIteration':['Étudier la suite.']}
        return data
    def assert_blocked(self, data, gate='production'):
        self.assertFalse(module.evaluate(data,gate)['declaredEvidenceConsistent'])
    def test_matching_proofs_allow_consistency_checks(self):
        for gate in ['preproduction','production','close']:
            self.assertTrue(module.evaluate(self.fixture(),gate)['declaredEvidenceConsistent'])
    def test_old_source_or_changed_artifact_invalidates_proofs(self):
        for field,size in [('sourceSha',40),('artifactSha256',64)]:
            data=self.fixture(); data['candidate'][field]='c'*size; self.assert_blocked(data)
    def test_green_ci_does_not_replace_real_preproduction(self):
        data=self.fixture(); data['checks']=[c for c in data['checks'] if c['kind']!='preproduction']; self.assert_blocked(data)
    def test_production_permission_is_separate(self):
        data=self.fixture(); data['approvals']=[a for a in data['approvals'] if a['scope']!='production']; self.assert_blocked(data)
    def test_wrong_environment_or_automated_approval_is_refused(self):
        for field,value in [('target','another-production'),('source','automation'),('actor','')]:
            data=self.fixture(); data['approvals'][2][field]=value; self.assert_blocked(data)
    def test_failed_restore_or_wrong_backup_target_blocks(self):
        for field,value in [('restoreStatus','failed'),('target','another-production')]:
            data=self.fixture(); data['backups'][1][field]=value; self.assert_blocked(data)
    def test_empty_isolated_preproduction_needs_evidence(self):
        data=self.fixture(); data['backups']=[]; data['targets']['preproduction']['empty']=True
        self.assertTrue(module.evaluate(data,'preproduction')['declaredEvidenceConsistent'])
        data['targets']['preproduction']['evidence']=None; self.assert_blocked(data,'preproduction')
    def test_wrong_rollback_and_unverified_github_are_refused(self):
        data=self.fixture(); data['rollback']['artifactSha256']='c'*64; self.assert_blocked(data)
        data=self.fixture(); data['github']['humanAcceptanceVerified']=False; self.assert_blocked(data)
    def test_delivery_is_not_a_successful_workflow_start(self):
        data=self.fixture(); data['delivery']['status']='started'; self.assert_blocked(data,'close')
    def test_production_checks_and_next_iteration_required(self):
        data=self.fixture(); data['checks']=[c for c in data['checks'] if c['kind']!='production']; self.assert_blocked(data,'close')
        data=self.fixture(); data['nextIteration']=[]; self.assert_blocked(data,'close')
    def test_unresolved_blockers_or_undated_proofs_refuse_progress(self):
        data=self.fixture(); data['blockers']=['Accès manquant']; self.assert_blocked(data)
        data=self.fixture(); data['checks'][0]['observedAt']=None; self.assert_blocked(data)
    def test_nested_state_read_does_not_modify_decisions(self):
        raw={'developmentWorkflow':self.fixture(),'decisions':[{'id':'historical-human-approval'}]}
        before=copy.deepcopy(raw)
        self.assertTrue(module.evaluate(raw,'production')['declaredEvidenceConsistent'])
        self.assertEqual(raw,before)
if __name__=='__main__': unittest.main()
