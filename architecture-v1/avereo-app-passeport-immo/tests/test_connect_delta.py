"""Refuse stale hosted runtime and qualify the historical CONNECT launch-only delta."""
import hashlib
import importlib.util
import unittest
from pathlib import Path

APP=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('connect_delta',APP/'workflows/package-connect-delta.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ConnectDeltaTests(unittest.TestCase):
    def setUp(self):
        self.before={
            'public/index.php':b"<?php\n// Existing private selector and authentication must remain byte-identical.\n"
                b"            'APP_LAUNCH_DRONE_URL', 'APP_LAUNCH_DRONE_SECRET',\n",
            'src/Config.php':b"<?php\n// Existing OAuth settings must remain byte-identical.\n"
                b"                'drone' => self::env('APP_LAUNCH_DRONE_URL'),\n"
                b"                'drone' => self::env('APP_LAUNCH_DRONE_SECRET'),\n",
        }
        self.source={name:(module.REPO/module.CONNECT/name).read_bytes() for name in module.FILES}
        self.observed={name:{'sha256':hashlib.sha256(content).hexdigest()} for name,content in self.before.items()}

    def test_only_launch_settings_are_added_without_activation_dependency(self):
        result=module.compatible_files(self.before,self.source,self.observed)
        for name,content in result.items():
            old_lines=self.before[name].splitlines(keepends=True)
            stripped=[line for line in content.splitlines(keepends=True) if b'APP_LAUNCH_PASSEPORT_IMMO_' not in line]
            self.assertEqual(stripped,old_lines)
            self.assertNotIn(b'IdentityAccountActivation',content)
            self.assertIn(b'APP_LAUNCH_PASSEPORT_IMMO_URL',content)
            self.assertIn(b'APP_LAUNCH_PASSEPORT_IMMO_SECRET',content)

    def test_stale_observation_is_refused(self):
        self.observed['public/index.php']['sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'Base différente'):
            module.compatible_files(self.before,self.source,self.observed)

    def test_changed_or_ambiguous_context_is_refused(self):
        name='src/Config.php'
        self.before[name]=self.before[name].replace(b"'drone' =>",b"'other' =>")
        self.observed[name]['sha256']=hashlib.sha256(self.before[name]).hexdigest()
        with self.assertRaisesRegex(ValueError,'Contexte non qualifié'):
            module.compatible_files(self.before,self.source,self.observed)

    def test_already_integrated_runtime_is_refused(self):
        self.before=module.compatible_files(self.before,self.source,self.observed)
        self.observed={name:{'sha256':hashlib.sha256(b).hexdigest()} for name,b in self.before.items()}
        with self.assertRaisesRegex(ValueError,'déjà présent'):
            module.compatible_files(self.before,self.source,self.observed)


if __name__=='__main__':unittest.main()
