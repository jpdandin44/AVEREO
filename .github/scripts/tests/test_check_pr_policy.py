from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "check-pr-policy.py"
SPEC = importlib.util.spec_from_file_location("check_pr_policy", SCRIPT_PATH)
assert SPEC and SPEC.loader
CHECKER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECKER)

TEMPLATE_PATH = Path(__file__).resolve().parents[2] / "PULL_REQUEST_TEMPLATE.md"


class PullRequestPolicyTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.template = TEMPLATE_PATH.read_text(encoding="utf-8")

    def valid_body(self) -> str:
        return (
            self.template.replace("[ ]", "[x]")
            .replace("URL_LOCALE_APPLICATION", "http://rapport.avereo.localhost")
            .replace("URL_DIFF_PULL_REQUEST", "https://github.com/example/repo/pull/1/files")
            .replace(
                "URL_VALIDATION_SECURITE_DONNEES",
                "https://github.com/example/repo/blob/branch/docs/security.md",
            )
            .replace(
                "URL_DOCUMENTATION",
                "https://github.com/example/repo/blob/branch/docs/readme.md",
            )
        )

    def test_accepts_exact_completed_template(self) -> None:
        errors = CHECKER.validate(
            "docs(policy): verifier les pull requests",
            self.valid_body(),
            self.template,
        )
        self.assertEqual([], errors)

    def test_prepublication_accepts_unchecked_exact_template(self) -> None:
        body = self.valid_body().replace("[x]", "[ ]")
        errors = CHECKER.validate(
            "docs(policy): verifier les pull requests",
            body,
            self.template,
            allow_unchecked=True,
        )
        self.assertEqual([], errors)

    def test_strict_mode_rejects_unchecked_items(self) -> None:
        body = self.valid_body().replace("[x]", "[ ]", 1)
        errors = CHECKER.validate(
            "docs(policy): verifier les pull requests",
            body,
            self.template,
        )
        self.assertTrue(any("non cochee" in error for error in errors))

    def test_rejects_lost_accents_even_when_checked(self) -> None:
        body = self.valid_body().replace("J'ai testé", "J'ai teste")
        errors = CHECKER.validate(
            "docs(policy): verifier les pull requests",
            body,
            self.template,
        )
        self.assertTrue(any("Libelle de checklist" in error for error in errors))

    def test_rejects_template_url_placeholders(self) -> None:
        body = self.template.replace("[ ]", "[x]")
        errors = CHECKER.validate(
            "docs(policy): verifier les pull requests",
            body,
            self.template,
        )
        self.assertTrue(any("Liens temporaires" in error for error in errors))

    def test_rejects_invalid_title(self) -> None:
        errors = CHECKER.validate("Mise a jour", self.valid_body(), self.template)
        self.assertTrue(any("Conventional Commits" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
