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
'''.replace('updated: 2026-10-06', 'updated: ' + state.get('updated', '2026-10-06'))
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
    verification = state['identity_repair'].get('review_link_verification')
    if verification:
        lines += ['', f"Contrôle du lien le `{verification['observed_at']}` :", '', verification['summary']]
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
rapport_version = state.get('rapport_version_diagnostic')
if rapport_version:
    lines += ['', '## Version Rapport en préproduction', '',
        f"Diagnostic du `{rapport_version['observed_at']}` : `{rapport_version['status']}`.", '',
        rapport_version['user_report'], '', rapport_version['summary'], '',
        f"- Lancement configuré : `{rapport_version['connect_launch_url']}`.",
        f"- Bundle hébergé : `{rapport_version['hosted_script_url']}`.",
        f"- SHA-256 hébergé : `{rapport_version['hosted_script_sha256']}`.",
        f"- Catalogue de `main` : blob Git `{rapport_version['classification_git_blob_sha']}`.",
        f"- Évolution intégrée : [PR #61]({rapport_version['merged_pull_request']}) ; fusion le `{rapport_version['merged_at']}`.", '',
        rapport_version['next_action']]

alignment = state.get('application_alignment')
if alignment:
    lines += ['', '## Alignement des applications', '',
        f"Contrôle du `{alignment['observed_at']}` ; statut `{alignment['status']}`.", '',
        f"Référence commune des huit candidats : `{alignment['source_sha']}` (`{alignment['source_reference']}`).",
        f"Ensemble local : `{alignment['candidate_directory']}/ensemble-candidats.zip` ; SHA-256 `{alignment['ensemble_artifact_sha256']}`.",
        f"[Inventaire des fichiers, builds et observations HTTP]({alignment['evidence_path']}).",
        'Les archives sont des candidats locaux. Aucune application n’a été remplacée par ces archives et aucune recette authentifiée n’est déclarée réussie.', '',
        '| Application | Contrôles locaux | HTTPS / HTTP anonymes | Version et état hébergés |',
        '| --- | --- | --- | --- |']
    for app in alignment['applications']:
        https = app['https_status'] if app['https_status'] is not None else 'Indisponible'
        http = app['http_status'] if app['http_status'] is not None else 'Indisponible'
        lines.append(f"| {app['app']} | {app['local_evidence']} | {https} / {http} | {app['hosted_observation']} |")
    lines += ['', 'Deux choix de création Rapport : ' + ', '.join(alignment['report_selectable_types']) + '.',
        'Les anciens types restent lisibles ; aucune donnée de rapport hébergée n’a été modifiée.', '',
        '### Corrections et qualifications par cible', '']
    hosted_evidence = alignment.get('hosted_evidence_path')
    if hosted_evidence:
        recovery = alignment['file_recovery']
        batch = alignment['prepared_delivery_batch']
        lines += [f"[Inventaire hébergé, comparaison et reçus de récupération]({hosted_evidence}).",
            f"Sept cibles existantes sauvegardées ; copies restaurées en privé vérifiées le `{recovery['observed_at']}`. Fichiers seulement : aucune récupération de base n’est attestée.",
            f"Dossier privé : `{recovery['recovery_directory']}`.",
            'Les empreintes frontend différentes établissent un écart d’artefact ; seule la version Rapport possède aussi une preuve fonctionnelle des anciens choix.', '',
            '**Lot de recette préparé** : ' + ', '.join(batch['applications']) + '.',
            f"Référence `{batch['source_sha']}` ; archive `{batch['archive']}` ; SHA-256 `{batch['artifact_sha256']}`.",
            'Le plan exact figure dans le reçu courant indiqué ci-dessous. Configuration privée, habilitations et données conservées ; aucune migration SQL prévue. Les cinq règles hébergées restent identiques, y compris le retour OAuth de Coupe ; son sas historique reste protégé.',
            'Ce lot attend son accord de préproduction. CONNECT, Recherche et Passeport Immo ont des prérequis distincts et sont exclus du remplacement préparé.', '']
    resumed = alignment.get('latest_resumption')
    if resumed:
        lines += ['### Reprise du 9 octobre', '',
            f"Observations serveur du `{resumed['hosted_observed_at']}` et chemins candidats du `{resumed['paths_observed_at']}`.",
            f"[Reçu de reprise et plan corrigé]({resumed['evidence_path']}).", '',
            resumed['summary'], '',
            'Claude a effectué une revue locale en lecture seule ; les conclusions retenues ont été vérifiées sur les sources et les reçus serveur.', '',
            '| Application | Conservés | Remplacés prévus | Ajoutés prévus |',
            '| --- | --- | --- | --- |']
        for app, counts in resumed['operation_counts'].items():
            lines.append(f"| {app} | {counts['preserve']} | {counts['replace']} | {counts['create']} |")
        lines += ['', 'Les fichiers conservés incluent les règles d’accès et les différences limitées aux fins de ligne.',
            'Retour arrière prévu : restaurer uniquement les fichiers remplacés et leurs modes depuis la copie vérifiée ; retirer uniquement les ajouts encore identiques au candidat. Refuser toute dérive. Aucun retour arrière d’une livraison active du nouveau lot n’est déclaré réussi.', '']
    ci = alignment.get('tooling_ci')
    if ci:
        lines += [f"CI des outils sur `{ci['source_sha']}` : [{ci['tests']} tests sans saut]({ci['url']}) et [CI générale]({ci['general_ci_url']}) réussis.",
            'Ces runs valident les sources ; ils ne produisent pas les archives locales et ne prouvent pas le contenu hébergé. PR Policy reste ignorée sur le brouillon.', '']
    lines += [f"- **{app['app']}** : {app['next_action']}" for app in alignment['applications']]
    lines += ['', '### Dépendances et limites', '']
    lines += ['- ' + item for item in alignment['dependencies'].values()]
    lines += ['', 'Le contrôle de passage multi-applications reste bloqué :', '']
    lines += ['- ' + item for item in alignment['blockers']]
    lines += ['', 'Les décisions historiques du pilote et de la réparation d’identité conservent leur portée.',
        'Les candidats applicatifs ne possèdent encore aucun accord de remplacement enregistré. Les reçus de fichiers qualifient les cibles existantes, sans couvrir les bases ni une recette authentifiée.',
        'Les workflows de production restent manuels ; le merge et l’ouverture publique sont des décisions distinctes.']

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
