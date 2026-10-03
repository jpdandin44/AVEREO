"""Appelle le contrôleur du skill installé, sans en copier la procédure."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--gate', choices=['preproduction', 'production', 'close'], required=True)
args = parser.parse_args()
settings = json.loads((ROOT / '.local/review-settings.json').read_text(encoding='utf-8-sig'))
skill = Path(settings['developmentProtocolSkill'])
checker = skill.parent / 'scripts/check-gate.py'
if not checker.is_file():
    raise SystemExit('Contrôleur absent : qualifier developmentProtocolSkill dans .local/review-settings.json.')
raise SystemExit(subprocess.call([sys.executable, str(checker), '--state', str(ROOT / 'docs/suivi-chantier.json'), '--gate', args.gate]))
