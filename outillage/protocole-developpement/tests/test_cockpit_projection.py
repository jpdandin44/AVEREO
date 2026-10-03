"""Exercise PR projection while preserving fictional human approvals."""
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1]

class CockpitProjectionTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.folder = self.root/'docs/pilotage'
        self.folder.mkdir(parents=True)
        self.script = self.folder/'actualiser-tableau-de-bord.py'
        shutil.copyfile(SOURCE/'docs/pilotage/actualiser-tableau-de-bord.py',self.script)
        self.protocol = self.root/'skills/developpement-github-cockpit/references/protocole.md'
        self.protocol.parent.mkdir(parents=True)
        shutil.copyfile(SOURCE/'skills/developpement-github-cockpit/references/protocole.md',self.protocol)
        self.state_path = self.folder/'suivi-chantier.json'
        self.state = {'phases':[{'id':0,'shortTitle':'Local','status':'awaiting_review','nextAction':'Revue fictive'}],
                      'statusLabels':{'awaiting_review':'À valider','validated':'Validée'},'decisions':[],
                      'publication':{'deploymentAuthorized':False},
                      'developmentWorkflow':{'github':{'repository':'example/project','prUrl':'https://github.com/example/project/pull/5','number':5,'state':'open','headSha':'a'*40,'observedAt':'2026-10-03T00:00:00Z','humanAcceptanceVerified':False}}}
        self.write_state()
        self.assertEqual(self.run_generator().returncode,0)
        self.approved = (self.folder/'local.md').read_bytes()
        self.state = json.loads(self.state_path.read_text(encoding='utf-8'))
        self.state['decisions'] = [{'actor':'Test fictif','status':'approved','evidence':{'reviewedArtifacts':[{'path':'local.md','sha256':hashlib.sha256(self.approved).hexdigest()}]}}]
        self.state['phases'][0]['status'] = 'validated'

    def write_state(self):
        self.state_path.write_text(json.dumps(self.state),encoding='utf-8')

    def run_generator(self):
        return subprocess.run([sys.executable,str(self.script)],capture_output=True)

    def test_observation_refresh_keeps_approved_file_and_human_decisions(self):
        self.state['developmentWorkflow']['github']['headSha'] = 'b'*40
        self.write_state()
        self.assertEqual(self.run_generator().returncode,0)
        actual = json.loads(self.state_path.read_text(encoding='utf-8'))
        self.assertEqual(actual['phases'][0]['pullRequest']['headSha'],'b'*40)
        self.assertEqual(actual['phases'][0]['status'],'validated')
        self.assertEqual(actual['decisions'],self.state['decisions'])
        self.assertEqual(actual['publication'],self.state['publication'])
        self.assertFalse(actual['developmentWorkflow']['github']['humanAcceptanceVerified'])
        self.assertEqual((self.folder/'local.md').read_bytes(),self.approved)

    def test_changed_approved_content_is_rejected_without_partial_projection(self):
        previous = self.state['phases'][0]['pullRequest'].copy()
        self.state['developmentWorkflow']['github']['headSha'] = 'c'*40
        self.write_state()
        self.protocol.write_text(self.protocol.read_text(encoding='utf-8')+'\nModification fictive.\n',encoding='utf-8')
        self.assertNotEqual(self.run_generator().returncode,0)
        actual = json.loads(self.state_path.read_text(encoding='utf-8'))
        self.assertEqual(actual['phases'][0]['pullRequest'],previous)
        self.assertEqual(actual['decisions'],self.state['decisions'])
        self.assertEqual((self.folder/'local.md').read_bytes(),self.approved)

if __name__ == '__main__':
    unittest.main()
