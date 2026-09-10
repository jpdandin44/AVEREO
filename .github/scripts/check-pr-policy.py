#!/usr/bin/env python3
"""Validate a pull request against the repository PR template."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys


TITLE_PATTERN = re.compile(
    r"^(feat|fix|chore|docs|refactor|test|ci|build)(\([a-z0-9._-]+\))?: .{8,}$"
)
CHECKBOX_PATTERN = re.compile(r"^- \[([ xX])\] (.+)$", re.MULTILINE)
LINK_TARGET_PATTERN = re.compile(r"\]\([^)]+\)")
PLACEHOLDER_PATTERN = re.compile(r"\bURL_[A-Z0-9_]+\b")


def default_template_path() -> Path:
    return Path(__file__).resolve().parents[1] / "PULL_REQUEST_TEMPLATE.md"


def canonicalize_check_label(label: str) -> str:
    """Ignore link destinations while preserving every visible character."""

    return LINK_TARGET_PATTERN.sub("](URL)", label.strip())


def checklist(document: str) -> list[tuple[str, str]]:
    return [
        (marker.lower(), canonicalize_check_label(label))
        for marker, label in CHECKBOX_PATTERN.findall(document)
    ]


def required_sections(template: str) -> list[str]:
    return [line.strip() for line in template.splitlines() if line.startswith("## ")]


def validate(
    title: str,
    body: str,
    template: str,
    *,
    allow_unchecked: bool = False,
) -> list[str]:
    errors: list[str] = []

    if not TITLE_PATTERN.fullmatch(title.strip()):
        errors.append(
            "Le titre doit respecter Conventional Commits "
            "(exemple : feat(api): ajouter un endpoint)."
        )

    for section in required_sections(template):
        if section not in body:
            errors.append(f"Section absente de la description : {section}")

    placeholders = sorted(set(PLACEHOLDER_PATTERN.findall(body)))
    if placeholders:
        errors.append(
            "Liens temporaires non remplaces : " + ", ".join(placeholders)
        )

    expected_checks = [label for _, label in checklist(template)]
    actual_checks = checklist(body)
    actual_by_label = {label: marker for marker, label in actual_checks}

    for expected in expected_checks:
        marker = actual_by_label.get(expected)
        if marker is None:
            errors.append(
                "Libelle de checklist absent ou modifie. Attendu exactement : "
                f"{expected}"
            )
            continue

        if not allow_unchecked and marker != "x":
            errors.append(f"Case de validation humaine non cochee : {expected}")

    return errors


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--body-file", type=Path)
    source.add_argument(
        "--github-json",
        metavar="PATH_OR_DASH",
        help="JSON contenant les champs title et body ; '-' lit l'entree standard.",
    )
    source.add_argument(
        "--pr-number",
        type=int,
        help="Lit directement la pull request avec GitHub CLI en UTF-8.",
    )
    parser.add_argument("--title")
    parser.add_argument("--repo", help="Depot OWNER/REPO utilise avec --pr-number.")
    parser.add_argument("--template", type=Path, default=default_template_path())
    parser.add_argument(
        "--allow-unchecked",
        action="store_true",
        help="Verifie la forme avant publication sans cocher a la place du responsable.",
    )
    return parser.parse_args()


def load_pr(args: argparse.Namespace) -> tuple[str, str]:
    if args.pr_number:
        command = ["gh", "pr", "view", str(args.pr_number), "--json", "title,body"]
        if args.repo:
            command.extend(["--repo", args.repo])
        completed = subprocess.run(
            command,
            check=True,
            capture_output=True,
            encoding="utf-8",
        )
        payload = json.loads(completed.stdout)
        return str(payload.get("title", "")), str(payload.get("body", ""))

    if args.github_json:
        raw = (
            sys.stdin.read()
            if args.github_json == "-"
            else Path(args.github_json).read_text(encoding="utf-8")
        )
        payload = json.loads(raw)
        return str(payload.get("title", "")), str(payload.get("body", ""))

    title = args.title if args.title is not None else os.environ.get("PR_TITLE", "")
    if args.body_file:
        body = args.body_file.read_text(encoding="utf-8")
    else:
        body = os.environ.get("PR_BODY", "")
    return title, body


def main() -> int:
    args = parse_arguments()
    try:
        title, body = load_pr(args)
    except (OSError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(f"::error::Impossible de lire la pull request : {error}")
        return 2
    template = args.template.read_text(encoding="utf-8")
    errors = validate(
        title,
        body,
        template,
        allow_unchecked=args.allow_unchecked,
    )

    if errors:
        for error in errors:
            print(f"::error::{error}")
        return 1

    mode = "prepublication" if args.allow_unchecked else "strict"
    print(f"PR policy validee en mode {mode}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
