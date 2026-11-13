import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'workflows'/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
delivery=module('sharing_delivery','release-sharing-preproduction.py')
services=module('sharing_services','prepare-sharing-services.py')

class SharingDeliveryTests(unittest.TestCase):
    def test_dependency_installed_before_router_and_html(self):
        names=['index.html','api/index.php','assets/new.js','api/sharing.php']
        self.assertEqual(sorted(names,key=lambda n:delivery.order((n,None))),['api/sharing.php','assets/new.js','api/index.php','index.html'])

    def test_unknown_existing_sharing_endpoint_is_never_overwritten(self):
        manifest={'applications':{'passeport-immo':{'artifactSha256':delivery.release.ARTIFACT}}}
        plan={'applications':{'passeport-immo':{'operations':{'api/sharing.php':{'action':'replace','before':{'exists':True}}}}}}
        with patch.object(delivery.release.engine,'load_candidates',return_value=(manifest,{})):
            with self.assertRaisesRegex(ValueError,'must not overwrite'):delivery.validate(Path('.'),plan)

    def test_authentication_files_are_not_allowed_writes(self):
        self.assertEqual(set(delivery.release.engine.TARGETS),{'passeport-immo'})
        for name in ['connect/gate.php','connect/session.php','.htaccess','.user.ini','api/storage.php','account-menu.js']:
            self.assertFalse(delivery.release.allowed_write(name))

    @unittest.skipUnless(shutil.which('php'),'PHP CLI required')
    def test_private_configuration_preserves_existing_values_and_remains_valid_php(self):
        with tempfile.TemporaryDirectory()as folder:
            root=Path(folder);config=root/'config.php';aliases=root/'aliases.json';out=root/'after.php'
            config.write_text("<?php return ['environment'=>'preprod','storage_password'=>'fixture-only','nested'=>['unchanged'=>true]];")
            aliases.write_text(json.dumps({'fixture-expert':'avereo_connect:99'}))
            code=services.configuration_code(config,aliases,root/'accounts.json')
            result=subprocess.check_output(['php','-r',code]);services.write(out,result)
            data=json.loads(subprocess.check_output(['php','-r','$c=require '+json.dumps(str(out))+';echo json_encode($c);']))
            self.assertEqual(data['storage_password'],'fixture-only');self.assertEqual(data['nested'],{'unchanged':True})
            self.assertEqual(data['document_share_aliases'],{'fixture-expert':'avereo_connect:99'})
