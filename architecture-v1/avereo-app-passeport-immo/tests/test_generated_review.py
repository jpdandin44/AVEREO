import hashlib
import json
import runpy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

APP = Path(__file__).resolve().parents[1]


class ApprovedViewsTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.docs = self.root / 'docs'
        self.docs.mkdir()
        (self.root / '.local').mkdir()
        renderer = self.root / 'renderer.py'
        renderer.write_text('def markdown_view(data):\n    return "Vue courante"\n', encoding='utf-8')
        (self.root / '.local/review-settings.json').write_text(json.dumps({'dashboardGenerator': str(renderer)}), encoding='utf-8')
        self.data = json.loads((APP / 'docs/suivi-chantier.json').read_text(encoding='utf-8'))
        for phase in self.data['phases']:
            for artifact in phase['deliverables']:
                if artifact['availability'] == 'present':
                    (self.docs / artifact['path']).write_text('Document fictif\n', encoding='utf-8')
        self.approved = b'Version fictive approuvee exactement\n'
        (self.docs / 'iteration-developpement.md').write_bytes(self.approved)
        self.data['phases'][0]['status'] = 'validated'
        self.data['phases'][0]['validationEvidence'] = {'decisionId': 'D-test'}
        self.data['decisions'] = [{'id': 'D-test', 'status': 'approved', 'evidence': {'reviewedArtifacts': [{'path': 'iteration-developpement.md', 'sha256': hashlib.sha256(self.approved).hexdigest()}]}}]
        self.module = runpy.run_path(str(APP / 'docs/actualiser-tableau-de-bord.py'))
        self.module['main'].__globals__.update(DIRECTORY=self.docs, ROOT=self.root)

    def generate(self, check=False):
        (self.docs / 'suivi-chantier.json').write_text(json.dumps(self.data), encoding='utf-8')
        with patch('sys.argv', ['generator'] + (['--check'] if check else [])):
            return self.module['main']()

    def test_approved_bytes_are_preserved_when_github_changes(self):
        self.assertEqual(self.generate(), 0)
        self.data['developmentWorkflow']['github']['state'] = 'closed'
        self.assertEqual(self.generate(), 0)
        self.assertEqual((self.docs / 'iteration-developpement.md').read_bytes(), self.approved)
        self.assertEqual(self.generate(check=True), 0)

    def test_current_dashboard_is_regenerated_without_changing_the_approved_file(self):
        self.generate()
        self.data['developmentWorkflow']['nextAction'] = 'Nouvelle action de test'
        self.generate()
        self.assertIn('Nouvelle action de test', (self.docs / 'tableau-de-bord.md').read_text(encoding='utf-8'))
        self.assertEqual((self.docs / 'iteration-developpement.md').read_bytes(), self.approved)

    def test_a_modified_approved_file_is_reported_without_overwriting_it(self):
        (self.docs / 'iteration-developpement.md').write_bytes(b'Changement non approuve\n')
        with self.assertRaisesRegex(ValueError, 'document approuvé a changé'):
            self.generate()
        self.assertEqual((self.docs / 'iteration-developpement.md').read_bytes(), b'Changement non approuve\n')

    def test_an_unapproved_document_keeps_normal_generation(self):
        self.data['phases'][0]['status'] = 'in_progress'
        self.generate()
        self.assertNotEqual((self.docs / 'iteration-developpement.md').read_bytes(), self.approved)
        self.assertEqual(self.generate(check=True), 0)


if __name__ == '__main__':
    unittest.main()
