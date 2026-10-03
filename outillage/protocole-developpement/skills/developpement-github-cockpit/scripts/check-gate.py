"""Read-only readiness check of declared iteration evidence; no authentication or deployment."""
import argparse
import json
import re
from datetime import datetime
from pathlib import Path

def evaluate(raw, gate):
    data = raw.get('developmentWorkflow', raw)
    errors = []
    def need(ok, message):
        if not ok:
            errors.append(message)
    def dated(value):
        if not isinstance(value, str):
            return False
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00')).tzinfo is not None
        except ValueError:
            return False
    def evidence(item):
        return isinstance(item, dict) and bool(item.get('evidence')) and dated(item.get('observedAt', item.get('recordedAt')))
    candidate = data.get('candidate') or {}
    sha, digest = candidate.get('sourceSha'), candidate.get('artifactSha256')
    need(isinstance(sha, str) and bool(re.fullmatch('[0-9a-f]{40}', sha)), 'SHA source complet manquant.')
    need(isinstance(digest, str) and bool(re.fullmatch('[0-9a-f]{64}', digest)), 'Empreinte de l’artefact manquante.')
    need(bool(data.get('iterationId')) and bool(data.get('owner')), 'Itération ou responsable manquant.')
    need(isinstance(data.get('blockers'), list) and not data['blockers'], 'Blocages présents ou non renseignés.')
    checks = data.get('checks') or []
    approvals = data.get('approvals') or []
    def matches(item):
        return isinstance(item, dict) and item.get('sourceSha') == sha and item.get('artifactSha256') == digest
    def check(kind, target=None):
        need(any(matches(c) and c.get('kind') == kind and c.get('status') == 'passed'
                 and evidence(c) and (target is None or c.get('target') == target) for c in checks),
             'Contrôle actuel absent : ' + kind + ((' sur ' + str(target)) if target else '') + '.')
    def approval(scope, target):
        need(any(matches(a) and a.get('scope') == scope and a.get('status') == 'approved'
                 and a.get('target') == target and a.get('actor')
                 and a.get('source') in ('user_chat', 'cockpit_review', 'github_human_review')
                 and evidence(a) for a in approvals), 'Accord humain exact absent : ' + scope + '.')
    def recovery(target, allow_empty):
        backups = data.get('backups') or []
        is_empty = allow_empty and target.get('empty') is True and target.get('isolated') is True and evidence(target)
        need(is_empty or any(isinstance(b, dict) and b.get('target') == target.get('id')
                            and b.get('id') and b.get('status') == 'verified'
                            and b.get('restoreStatus') == 'passed' and evidence(b) for b in backups),
             'Sauvegarde restaurée absente pour la cible, ou vacuité/isolement non prouvés.')
    for kind in ('local', 'ci', 'documentation'):
        check(kind)
    targets = data.get('targets') or {}
    preprod = targets.get('preproduction') or {}
    need(bool(preprod.get('id')) and preprod.get('ready') is True and preprod.get('isolated') is True and evidence(preprod),
         'Préproduction prête et isolée non prouvée.')
    if gate == 'preproduction':
        approval('preproduction', preprod.get('id'))
        recovery(preprod, True)
    if gate in ('production', 'close'):
        production = targets.get('production') or {}
        target = production.get('id')
        need(bool(target) and production.get('ready') is True and evidence(production), 'Cible de production non prouvée.')
        check('preproduction', preprod.get('id'))
        approval('review', preprod.get('id'))
        approval('production', target)
        github = data.get('github') or {}
        need(bool(github.get('repository')) and bool(github.get('prUrl'))
             and github.get('acceptedSourceSha') == sha and github.get('acceptedArtifactSha256') == digest
             and github.get('humanAcceptanceVerified') is True and evidence(github),
             'Acceptation GitHub du candidat non vérifiée.')
        recovery(production, False)
        rollback = data.get('rollback') or {}
        need(rollback.get('status') == 'tested' and rollback.get('target') == target
             and rollback.get('artifactSha256') == digest and evidence(rollback), 'Retour arrière de ce candidat non qualifié.')
        if gate == 'close':
            check('production', target)
            delivery = data.get('delivery') or {}
            need(matches(delivery) and delivery.get('target') == target and delivery.get('status') == 'delivered'
                 and evidence(delivery), 'Livraison réelle du candidat non établie.')
            need(isinstance(data.get('nextIteration'), list) and bool(data['nextIteration']),
                 'Suite d’itération non renseignée ; indiquer aussi une décision explicite de ne rien prévoir si applicable.')
    return {'gate': gate, 'declaredEvidenceConsistent': not errors, 'errors': errors,
            'limitation': 'Déclarations à vérifier aux sources ; ce résultat ne déploie pas et ne donne aucun accord.'}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--gate', choices=['preproduction', 'production', 'close'], required=True)
    args = parser.parse_args()
    try:
        raw = json.loads(args.state.read_text(encoding='utf-8-sig'))
        if not isinstance(raw, dict) or not isinstance(raw.get('developmentWorkflow', raw), dict):
            raise ValueError('La fiche doit être un objet JSON.')
        result = evaluate(raw, args.gate)
    except (OSError, ValueError, TypeError, AttributeError) as error:
        result = {'gate': args.gate, 'declaredEvidenceConsistent': False, 'errors': ['Fiche invalide : ' + str(error)]}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['declaredEvidenceConsistent'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
