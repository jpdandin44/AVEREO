"""Cross-application contract: real CONNECT issuer and real receiving gates."""
from pathlib import Path
import shutil
import subprocess
import unittest


class LaunchContractTest(unittest.TestCase):
    @unittest.skipUnless(shutil.which('php'), 'PHP absent : contrat transversal non exécuté')
    def test_each_application_accepts_only_its_real_connect_ticket(self):
        script = Path(__file__).with_suffix('.php')
        for app in ('rapport', 'coupe', 'projet', 'thermo', 'drone', 'recherche'):
            with self.subTest(app=app):
                result = subprocess.run(['php', str(script), app], capture_output=True,
                                        text=True, timeout=15)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn('PASS CONNECT', result.stdout)
                self.assertEqual(result.stderr, '')
