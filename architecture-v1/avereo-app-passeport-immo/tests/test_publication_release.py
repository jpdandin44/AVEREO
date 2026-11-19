import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

APP=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('publication_release',APP/'workflows/release-report-publications.py')
release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)


class PublicationReleaseTests(unittest.TestCase):
    def test_authentication_and_other_applications_are_not_replaceable(self):
        for app in ['rapport','passeport-immo']:
            for name in ['.htaccess','.user.ini','connect/session.php','api/auth.php','account-menu.js']:
                self.assertFalse(release.allowed(app,name))
        self.assertFalse(release.allowed('rapport','api/index.php'))
        self.assertTrue(release.allowed('passeport-immo','api/publications.php'))

    def test_api_dependencies_precede_router_and_entry_pages(self):
        names=['index.html','api/index.php','api/publications.php','assets/new.js','api/storage.php']
        self.assertEqual(sorted(names,key=lambda name:release.order((name,None))),['api/publications.php','api/storage.php','assets/new.js','api/index.php','index.html'])

    def test_unexpected_hosted_baseline_is_refused(self):
        manifest={'applications':{'rapport':{'sourceSha':'a'*40,'files':{'index.html':{'expectedHostedSha256':'old'}}}}}
        plan={'applications':{'rapport':{'operations':{'index.html':{'action':'replace','before':{'sha256':'changed'}}}}}}
        with patch.object(release.engine,'load_candidates',return_value=(manifest,{})):
            with self.assertRaisesRegex(ValueError,'baseline differs'):release.validate(Path('.'),plan)
