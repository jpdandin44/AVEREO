"""Guard the new delivery's source versions and additive-migration prerequisite."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('organisation_release',Path(__file__).resolve().parents[1]/'workflows/release-document-organisation-preproduction.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
release=module.release


class OrganisationReleaseTests(unittest.TestCase):
    def test_exact_baseline_required_before_api_replacement(self):
        manifest={'applications':{'passeport-immo':{'artifactSha256':release.ARTIFACT}}}
        for name,digest in module.BASELINES.items():
            op={'action':'replace','before':{'sha256_lf':digest}}
            plan={'applications':{'passeport-immo':{'operations':{name:op}}}}
            with patch.object(release.engine,'load_candidates',return_value=(manifest,{})):
                module.validate_scope(Path('.'),plan)
                op['before']['sha256_lf']='unknown'
                with self.assertRaisesRegex(ValueError,'baseline differs'):module.validate_scope(Path('.'),plan)

    def test_preserved_access_policy_must_match_candidate(self):
        manifest={'applications':{'passeport-immo':{'artifactSha256':release.ARTIFACT,'files':{'.htaccess':{'sha256':'reviewed'}}}}}
        plan={'applications':{'passeport-immo':{'operations':{'.htaccess':{'action':'preserve','before':{'sha256_lf':'changed'}}}}}}
        with patch.object(release.engine,'load_candidates',return_value=(manifest,{})):
            with self.assertRaisesRegex(ValueError,'Protected candidate differs'):module.validate_scope(Path('.'),plan)

    def test_migration_failure_blocks_every_public_write(self):
        with tempfile.TemporaryDirectory()as folder:
            work=Path(folder);(work/'organisation-rehearsal-public.json').write_text(json.dumps({'status':'passed','liveRowsChanged':False}))
            with patch.object(module,'qualification',side_effect=ValueError('migration not installed')),patch.object(release,'perform')as perform:
                with self.assertRaisesRegex(ValueError,'migration not installed'):module.perform('apply',work)
                perform.assert_not_called()

    def test_single_target_and_frozen_candidate(self):
        self.assertEqual(set(release.engine.TARGETS),{'passeport-immo'})
        self.assertEqual(release.ARTIFACT,'ad0b3f1ae198f51aa253af74be8941e6407228d8899b1de7dd47d411adc48a3e')
        self.assertEqual(release.COMPANION_BASELINES,{})
