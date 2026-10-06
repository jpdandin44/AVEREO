"""Render the access inventory from its sole canonical source; preserve approvals."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
state = json.loads((root / 'suivi-chantier.json').read_text(encoding='utf-8'))
front = '''---
project: avereo-acces-preproduction
document_type: generated-hosted-record
title: Relevé des accès aux préproductions AVEREO
status: active
version: git
created: 2026-10-06
updated: 2026-10-06
owner: jpdandin
tags: [preproduction, exploitation, cockpit, derive]
---
'''
lines = [front, '# Relevé hébergé', '',
    'Vue dérivée du [suivi canonique](suivi-chantier.json). Les observations ne valent',
    'ni validation humaine ni bascule. La préparation initiale est conservée dans',
    '[son archive](archives/preparation-initiale.json).', '',
    '## État du lot', '', state['next_action'], '',
    '| Phase | État | Prochaine action |', '| --- | --- | --- |']
for phase in state['phases']:
    lines.append(f"| {phase['shortTitle']} | {state['statusLabels'][phase['status']]} | {phase['nextAction']} |")
review_links = (state.get('identity_repair') or {}).get('review_links')
if review_links:
    lines += ['', '## Accès pour la recette', '',
        f"- Application à tester : [{review_links['acceptance']['title']}]({review_links['acceptance']['url']}). Démarrer une nouvelle connexion depuis cette adresse.",
        f"- Fournisseur d’identité concerné : [{review_links['identity']['title']}]({review_links['identity']['url']}). Le parcours CONNECT y redirige automatiquement.",
        f"- Suivi du chantier : [{review_links['cockpit']['title']}]({review_links['cockpit']['url']}). Il affiche les phases et les preuves ; il ne teste pas la connexion applicative.",
        '- Tests locaux du correctif : [procédure de validation](README.md#validation-locale). Aucune interface locale du fournisseur d’identité n’est fournie.']
lines += ['', '## Domaines vérifiés', '',
    'Racines relevées dans cPanel le 6 octobre 2026, sous `/home/daje3540`.',
    'Contrôles sans identifiants, sans suivi des redirections, sans corps ni cookies.', '',
    '| Domaine | Racine réelle | HTTPS | HTTP | Observation |', '| --- | --- | --- | --- | --- |']
for row in state['targets']:
    observation = row['observation']
    https = observation['https'].get('status')
    http = observation['http'].get('status') or 'Non retesté'
    lines.append(f"| {row['domain']} | `{row['document_root']}` | {https} | {http} | {row['note']} |")
lines += ['', '## Candidat CONNECT et récupération', '']
receipt = state.get('connect_candidate')
if receipt:
    lines += [f"- Sauvegarde privée : `{receipt['backup_directory']}`.",
        f"- SHA-256 original : `{receipt['original_sha256']}`.",
        f"- SHA-256 candidat : `{receipt['candidate_sha256']}`.",
        '- Copie de restauration vérifiée octet par octet dans le dossier privé.']
    pilot = next(row for row in state['targets'] if row['domain'] == 'connect-preprod.avereo.fr')
    deployment = pilot.get('deployment_receipt')
    if deployment:
        lines += [f"- Pilote appliqué le `{deployment['applied_at']}` ; empreinte active vérifiée.",
            '- Sur CONNECT, le seul fichier public modifié est le `.htaccess` de préproduction.',
            '- Compte de consultation et fichiers de production inchangés.']
    else:
        lines += ['- Aucun fichier public, compte de consultation ou fichier de production modifié.']
else:
    lines += ['TBD — reçu de préparation privée à enregistrer avant bascule.']
lines += ['', '## Contrôles et limites', '']
for check in state.get('checks', []):
    lines.append(f"- {check['kind']} le `{check.get('observedAt', 'TBD')}` : {check['status']} — {check['evidence']}. {check.get('note', '')}")
lines += ['', 'Les tests Apache locaux sont complétés par les contrôles hébergés enregistrés ci-dessus.',
    'Le parcours CONNECT → Drupal → Rapport → sauvegarde → rechargement reste à recetter.',
    'La protection doit survivre au prochain déploiement ; cette pérennité reste à qualifier.', '',
    '## Points restant à traiter', '']
lines += ['- ' + item for item in state['blockers']]
incident = state.get('identity_incident')
if incident:
    lines += ['', '## Incident d’authentification', '',
        f"Diagnostic initial du `{incident['observedAt']}` sur `{incident['domain']}`. {incident['symptom']}", '',
        incident['preexisting_evidence'], '',
        f"Erreur du journal : `{incident['technical_error']}` dans `{incident['file']}`.",
        f"Drupal `{incident['drupal_version']}` ; Simple OAuth `{incident['simple_oauth_version']}`.", '',
        incident['cause'], '', 'Bibliothèques déclarées par le module et absentes du vendor lors du diagnostic initial :', '']
    lines += [f"- `{dependency['package']}` — contrainte `{dependency['declared_constraint']}`."
        for dependency in incident['missing_dependencies']]
    lines += ['', incident['next_action'], '', incident['constraints'], '',
        incident['source_repository'], '',
        ('Diagnostic initial en lecture seule ; réparation distante enregistrée ci-dessous.'
         if incident.get('remote_writes') else 'Diagnostic initial en lecture seule ; aucune réparation publique effectuée.'),
        'Les comptes et secrets sont inchangés.']
repair = state.get('identity_repair')
if repair:
    lines += ['', '## Réparation du fournisseur d’identité', '',
        f"Statut : `{repair['status']}`. Cible : `{repair['target_root']}`.", '',
        '[Contrat Composer natif](identite/README.md) ; [script ciblé](repair_identity.py).', '']
    candidate = repair.get('candidate')
    if candidate:
        lines += [f"Candidat préparé le `{candidate['prepared_at']}`.",
            f"Empreinte de l’artefact : `{candidate['artifact_sha256']}`.",
            f"Sauvegarde privée : `{candidate['folder']}` ; copie de restauration vérifiée.", '',
            'Packages ajoutés (les packages préexistants restent inchangés) :', '']
        lines += [f"- `{name}` — `{version}`." for name, version in candidate['added_packages'].items()]
    if repair.get('deployment'):
        delivery = repair['deployment']
        lines += ['', f"Appliqué le `{delivery['applied_at']}` ; empreinte active identique au candidat."]
    if repair.get('acceptance'):
        lines += ['', repair['acceptance']['summary']]
github = state['github']
github_status = 'fusionnée' if github.get('merged') else ('brouillon' if github.get('draft') else github['state'])
lines += ['', '## Source GitHub', '',
    f"[PR #{github['number']}]({github['url']}) — {github_status}, observée le `{github['observedAt']}`.",
    f"SHA source `{github['headSha']}`. Aucune validation de phase créée automatiquement."]
if github.get('merged'):
    lines += [f"Fusion enregistrée par GitHub le `{github['mergedAt']}` ; commit `{github['mergeCommit']}`."]
output = '\n'.join(lines) + '\n'
approved = [artifact for decision in state.get('decisions', [])
    if decision.get('status') == 'approved'
    for artifact in (decision.get('evidence') or {}).get('reviewedArtifacts', [])]
for artifact in approved:
    file = root / artifact['path']
    if hashlib.sha256(file.read_bytes()).hexdigest() != artifact['sha256']:
        raise ValueError('Document approuvé modifié : ' + artifact['path'])
    if artifact['path'] == 'releve-heberge.md' and file.read_text(encoding='utf-8') != output:
        raise ValueError('Le relevé approuvé doit être conservé ; ouvrir une nouvelle revue.')
(root / 'releve-heberge.md').write_text(output, encoding='utf-8', newline='\n')
print('Relevé dérivé actualisé ; décisions inchangées.')
