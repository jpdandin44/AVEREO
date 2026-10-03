"""Regénère les vues Passeport Immo avec le rendu Markdown mutualisé du chantier AVEREO."""

import argparse
import html
import json
import runpy
from pathlib import Path

DIRECTORY = Path(__file__).resolve().parent
ROOT = DIRECTORY.parent


def iteration_view(data):
    flow = data.get('developmentWorkflow')
    if not flow:
        return '', ''
    candidate = flow['candidate']
    github = flow['github']
    esc = html.escape
    labels = {'in_progress': 'En cours', 'awaiting_review': 'À valider', 'blocked': 'Bloquée', 'validated': 'Validée'}
    stages = [('local', 'Local'), ('preproduction', 'Préproduction'), ('production', 'Production')]
    rows = [f"| {name} | {labels.get(flow['stages'][key]['status'], flow['stages'][key]['status'])} | {flow['stages'][key]['nextAction']} |" for key, name in stages]
    kind_labels = {'local': 'Sur le poste', 'ci': 'GitHub Actions', 'documentation': 'Documentation'}
    result_labels = {'passed': 'Réussi', 'failed': 'Échec', 'pending': 'En attente'}
    checks = [f"| {kind_labels.get(check['kind'], check['kind'])} | {result_labels.get(check['status'], check['status'])} | {check['observedAt']} |" for check in flow['checks']]
    proofs = '\n'.join('- ' + kind_labels.get(check['kind'], check['kind']) + ' : ' + check['evidence'] for check in flow['checks'])
    gates = '\n'.join('- '+{'preproduction': 'Préproduction', 'production': 'Production', 'close': 'Clôture'}[gate['gate']] + ' : ' + ('conditions remplies' if gate['declaredEvidenceConsistent'] else 'passage refusé') + f" ({gate['observedAt']})." for gate in flow.get('gates', [])) or 'À contrôler.'
    blockers = '\n'.join('- '+item for item in flow['blockers']) or 'Aucun blocage déclaré.'
    pr = github.get('prUrl') or 'Non publiée'
    follow_up = github.get('followUpObservation', {})
    follow_up_state = {'open': 'Ouverte', 'merged': 'Fusionnée', 'closed': 'Fermée sans fusion'}.get(follow_up.get('state'), 'Non observée')
    formal_phase = next(phase for phase in data['phases'] if phase['id'] == data['currentPhase'])
    active_stage = dict(stages).get(flow['stage'], flow['stage'])
    active_action = flow['stages'][flow['stage']]['nextAction']
    missing_reviews = [f"phase {phase['id']}" for phase in data['phases'] if phase['id'] in (0, 1) and phase['status'] != 'validated']
    review_notice = ('Validation formelle restant à consigner : '+', '.join(missing_reviews)+'.') if missing_reviews else 'Phases 0 et 1 validées dans le suivi.'
    handoff = data.get('sessionHandoff', {})
    session_notice = ('Session clôturée à la demande du responsable : reprise prévue dans un nouveau chat du projet '+handoff['destinationProject']+'. Aucun travail ne reprend automatiquement.') if handoff.get('status') == 'closed_on_user_request' else ''
    if handoff.get('status') == 'resumed_on_user_request':
        session_notice = 'Reprise demandée par le responsable dans '+handoff['destinationProject']+' le '+handoff['resumedAt']+'.'
    preparation = flow.get('preproductionPreparation')
    requested_address = flow['targets']['preproduction'].get('requestedAddress')
    target_preference = ('\nAdresse demandée : `'+requested_address+'`. Le responsable privilégie une lune gratuite si disponible ; disponibilité, création, routage et accès privés restent à vérifier.\n') if requested_address else ''
    hosting = flow['targets']['preproduction'].get('hostingPreference', {})
    if requested_address and hosting.get('activationStatus') == 'awaiting_user_password':
        target_preference = '\nAdresse demandée : `'+requested_address+'`. Lune gratuite `'+hosting['preparedMoon']+'` disponible ; formulaire d’activation ouvert. Le responsable doit saisir et valider son nouveau mot de passe dans cPanel. Rattachement du sous-domaine, dossier et accès privé restent à vérifier.\n'
    preparation_md = ''
    if preparation:
        preparation_labels = {
            'prepared_local': 'Préparée sur le poste',
            'passed': 'Réussie',
            'passed_local_files_only': 'Réussie sur des fichiers temporaires locaux',
            'not_verified': 'Non vérifiée',
            'not_performed': 'Non effectuée',
        }
        preparation_md = f"""### Préparation locale de préproduction

- État : {preparation_labels.get(preparation['status'], preparation['status'])} ; observation : {preparation['observedAt']}.
- Empreinte du lot fermé : `{preparation['bundleSha256']}`.
- Assets du candidat conservés : {'Oui' if preparation['candidateAssetsUnchanged'] else 'Non'}.
- Relecture de l'archive : {preparation_labels.get(preparation['archiveReadback'], preparation['archiveReadback'])}.
- Restauration : {preparation_labels.get(preparation['restoreRehearsal'], preparation['restoreRehearsal'])} ; cible hébergée : {preparation_labels.get(preparation['hostedBackupRestore'], preparation['hostedBackupRestore'])}.
- Livraison distante : {preparation_labels.get(preparation['remoteDelivery'], preparation['remoteDelivery'])}.
- PR de préparation : {('[Ouvrir la PR]('+preparation['publication']['url']+')') if preparation.get('publication', {}).get('url') else 'Non publiée'}.

Cette préparation ne qualifie ni la cible ni l'accès privé. La récupération locale est distincte d'une sauvegarde restaurée de l'hébergement.

"""
    body = f"""## Où en est le développement ?

Travail actuel : **{active_stage} — {labels.get(flow['status'], flow['status'])}**.
{active_action}

{session_notice}

Parcours formel : **phase {formal_phase['id']} — {formal_phase['title']}**, {data['statusLabels'][formal_phase['status']].lower()}.
{review_notice} Les constats GitHub et les contrôles locaux ne remplacent pas les décisions de phase.

{target_preference}

## Itération GitHub et cockpit

**{flow['iterationId']}** — {flow['objective']}

Responsable : {flow['owner']}. Étape : {flow['stage']}. État : {labels.get(flow['status'], flow['status'])}.

Ces étapes techniques complètent les phases formelles du chantier ; une fusion GitHub ne modifie pas leurs décisions.

| Étape | État | Prochaine action |
|---|---|---|
{chr(10).join(rows)}

### Candidat et GitHub

- SHA source : `{candidate.get('sourceSha') or 'Non qualifié'}`.
- SHA-256 de l'archive : `{candidate.get('artifactSha256') or 'Non qualifié'}`.
- PR : {'[Ouvrir la PR]('+pr+')' if pr.startswith('https://github.com/') else pr}.
- Complément de suivi : {'[Ouvrir la PR de suivi]('+github['followUpPrUrl']+')' if github.get('followUpPrUrl', '').startswith('https://github.com/') else 'Aucun'}.
- État du complément : {follow_up_state} ; observation : {follow_up.get('observedAt') or 'Non observée'}.
- Dernière observation GitHub : {github.get('observedAt') or 'Non observé'}.
- Revue humaine de la source GitHub : {'Confirmée' if github.get('sourceReviewVerified') else 'Non consignée'}.
- Acceptation de l'archive exacte pour promotion : {'Vérifiée' if github['humanAcceptanceVerified'] else 'À consigner avant production'}.

### Contrôles datés

| Nature | Résultat | Observation |
|---|---|---|
{chr(10).join(checks)}

Preuves du candidat identifié ci-dessus :

{proofs}

### Contrôles de passage

{gates}

### Blocages de passage

{blockers}

Prochaine action : {flow['nextAction']}

### Accords et livraison

Accords spécifiques enregistrés : {len(flow['approvals'])}. Sauvegardes qualifiées : {len(flow['backups'])}.
Retour arrière : { {'not_tested': 'non testé', 'tested': 'testé'}.get(flow['rollback']['status'], flow['rollback']['status']) }. Livraison : { {'not_delivered': 'non réalisée', 'delivered': 'réalisée'}.get(flow['delivery']['status'], flow['delivery']['status']) }.
Les validations antérieures de phase ne sont ni remplacées ni déduites de ces constats.

### Suite proposée

{chr(10).join('- '+str(item) for item in flow['nextIteration']) or 'À définir.'}

{preparation_md}
"""
    stages_html = ''.join(f"<tr><td>{name}</td><td>{esc(labels.get(flow['stages'][key]['status'], flow['stages'][key]['status']))}</td><td>{esc(flow['stages'][key]['nextAction'])}</td></tr>" for key, name in stages)
    summary_html = f'<h2>Où en est le développement ?</h2><p>Travail actuel : <strong>{esc(active_stage)} — {esc(labels.get(flow["status"], flow["status"]))}</strong>.</p><p>{esc(active_action)}</p><p>{esc(session_notice)}</p><p>Parcours formel : phase {formal_phase["id"]} — {esc(formal_phase["title"])}. {esc(review_notice)}</p>'
    follow_up_html = f'<p>PR de suivi : {esc(github.get("followUpPrUrl") or "Aucune")} — {esc(follow_up_state)}.</p>'
    page = f'<section>{summary_html}<h2>Itération GitHub et cockpit</h2><p>{esc(flow["objective"])}</p><table><tr><th>Étape</th><th>État</th><th>Prochaine action</th></tr>{stages_html}</table><p>PR : {esc(pr)}</p>{follow_up_html}<p>SHA source : <code>{esc(candidate.get("sourceSha") or "Non qualifié")}</code></p><p>Artefact : <code>{esc(candidate.get("artifactSha256") or "Non qualifié")}</code></p><h3>Blocages</h3><ul>{"".join("<li>"+esc(item)+"</li>" for item in flow["blockers"])}</ul><p>{esc(flow["nextAction"])}</p><p><a href="iteration-developpement.md">Fiche complète générée</a></p></section>'
    return body.rstrip()+'\n', page


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    settings = json.loads((ROOT / '.local/review-settings.json').read_text(encoding='utf-8-sig'))
    renderer = runpy.run_path(settings['dashboardGenerator'])['markdown_view']
    data = json.loads((DIRECTORY / 'suivi-chantier.json').read_text(encoding='utf-8-sig'))
    derived = {}
    iteration_md, iteration_html = iteration_view(data)
    if iteration_md:
        derived['iteration-developpement.md'] = f"""---
project: avereo-app-passeport-immo
document_type: generated-iteration
title: Itération de développement Passeport Immo
status: active
version: git
created: {data['created']}
updated: {data['updated']}
owner: jpdandin
tags: [cockpit, genere]
---

# Itération de développement Passeport Immo

Vue générée depuis `developmentWorkflow` dans `suivi-chantier.json`. Ne pas modifier à la main.

""" + iteration_md
    ids = [phase['id'] for phase in data['phases']]
    if ids != list(range(len(ids))) or data['currentPhase'] not in ids:
        raise ValueError('Identifiants de phases incohérents.')
    for phase in data['phases']:
        for item in phase['deliverables']:
            path = (DIRECTORY / item['path']).resolve()
            if not path.is_relative_to(DIRECTORY):
                raise ValueError('Livrable hors du chantier.')
            if item['availability'] == 'present' and not path.is_file() and item['path'] not in derived:
                raise ValueError(f"Livrable absent : {item['path']}")
    title = data['title']
    header = f"""---
project: avereo-app-passeport-immo
document_type: tableau-de-bord
title: {title}
status: active
version: git
created: {data['created']}
updated: {data['updated']}
owner: jpdandin
tags: [suivi, passeport-immo, genere]
---

# {title}

Vue générée depuis `suivi-chantier.json`. Ne pas modifier manuellement.
La revue et les décisions se font dans [Projet local](http://127.0.0.1:{settings.get('port', 5193)}/).

"""
    catalog_md = ['## Livrables attendus par phase', '', 'Description issue du suivi JSON ; disponibilité vérifiée lors de la génération.', '']
    catalog_html = []
    for phase in data['phases']:
        catalog_md.extend([f"### Phase {phase['id']} — {phase['shortTitle']}", ''])
        items_html = []
        for item in phase['deliverables']:
            exists = (DIRECTORY / item['path']).is_file() or item['path'] in derived
            label = 'Document disponible' if exists else 'Prévu — document non produit'
            title_item = item.get('title', item['path'])
            description = item.get('description', '')
            catalog_md.extend([f"**{title_item}** — {label} (`{item['path']}`).", '', description, ''])
            proofs = item.get('expectedEvidence', [])
            catalog_md.extend([f'- {proof}' for proof in proofs] + [''])
            proof_html = ''.join(f'<li>{html.escape(proof)}</li>' for proof in proofs)
            items_html.append(f'<article><h3>{html.escape(title_item)}</h3><p>{html.escape(label)} — <code>{html.escape(item["path"])}</code></p><p>{html.escape(description)}</p><ul>{proof_html}</ul></article>')
        catalog_html.append(f'<details><summary>Phase {phase["id"]} — {html.escape(phase["shortTitle"])}</summary>{"".join(items_html)}</details>')
    markdown = header + renderer(data) + '\n\n' + iteration_md + '\n\n' + '\n'.join(catalog_md).rstrip() + '\n'
    esc = html.escape
    rows = ''.join(f"<tr><td>{p['id']} — {esc(p['shortTitle'])}</td><td>{esc(data['statusLabels'][p['status']])}</td><td>{esc(p['deliveredOn'] or '—')}</td><td>{esc(p['validatedOn'] or 'Non acquise')}</td></tr>" for p in data['phases'])
    page = f'''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title>
<style>body{{font:17px system-ui;max-width:1000px;margin:40px auto;padding:0 20px;color:#17334d}}table{{border-collapse:collapse;width:100%}}th,td{{text-align:left;padding:14px;border-bottom:1px solid #d6e0e7}}a{{color:#095ca5}}pre{{white-space:pre-wrap;font:14px system-ui}}</style>
<h1>{esc(title)}</h1><p>Vue locale générée — {esc(data['updated'])}.</p><p><a href="http://127.0.0.1:{settings.get('port', 5193)}/">Ouvrir la revue dans Projet</a></p>
<table><thead><tr><th>Phase</th><th>État</th><th>Livraison</th><th>Validation humaine</th></tr></thead><tbody>{rows}</tbody></table>{iteration_html}<h2>Livrables attendus</h2>{"".join(catalog_html)}<h2>Source de suivi</h2><p><a href="suivi-chantier.json">JSON canonique</a> · <a href="tableau-de-bord.md">Compte rendu Markdown</a></p></html>\n'''
    changed = []
    derived.update({'tableau-de-bord.md': markdown, 'tableau-de-bord.html': page})
    for filename, content in derived.items():
        path = DIRECTORY / filename
        if not path.exists() or path.read_text(encoding='utf-8') != content:
            changed.append(filename)
            if not args.check:
                path.write_text(content, encoding='utf-8', newline='\n')
    if args.check and changed:
        print('Vues à actualiser : ' + ', '.join(changed))
        return 1
    print('Vues alignées sur le suivi Passeport Immo ; moteur de revue Projet réutilisé.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
