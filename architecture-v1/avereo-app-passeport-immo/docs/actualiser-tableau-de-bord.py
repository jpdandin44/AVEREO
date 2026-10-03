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
    checks = [f"| {check['kind']} | {check['status']} | {check.get('sourceSha') or 'Non qualifié'} | {check['observedAt']} | {check['evidence']} |" for check in flow['checks']]
    blockers = '\n'.join('- '+item for item in flow['blockers']) or 'Aucun blocage déclaré.'
    pr = github.get('prUrl') or 'Non publiée'
    body = f"""## Itération GitHub et cockpit

**{flow['iterationId']}** — {flow['objective']}

Responsable : {flow['owner']}. Étape : {flow['stage']}. État : {labels.get(flow['status'], flow['status'])}.

| Étape | État | Prochaine action |
|---|---|---|
{chr(10).join(rows)}

### Candidat et GitHub

- SHA source : `{candidate.get('sourceSha') or 'Non qualifié'}`.
- SHA-256 de l'archive : `{candidate.get('artifactSha256') or 'Non qualifié'}`.
- PR : {pr}.
- Dernière observation GitHub : {github.get('observedAt') or 'Non observé'}.
- Acceptation humaine GitHub : {'Vérifiée' if github['humanAcceptanceVerified'] else 'Non acquise'}.

### Contrôles datés

| Nature | Résultat | SHA source | Observation | Preuve |
|---|---|---|---|---|
{chr(10).join(checks)}

### Blocages de passage

{blockers}

Prochaine action : {flow['nextAction']}

### Accords et livraison

Accords spécifiques enregistrés : {len(flow['approvals'])}. Sauvegardes qualifiées : {len(flow['backups'])}.
Retour arrière : {flow['rollback']['status']}. Livraison : {flow['delivery']['status']}.
Les validations antérieures de phase ne sont ni remplacées ni déduites de ces constats.

### Suite proposée

{chr(10).join('- '+str(item) for item in flow['nextIteration']) or 'À définir.'}
"""
    stages_html = ''.join(f"<tr><td>{name}</td><td>{esc(labels.get(flow['stages'][key]['status'], flow['stages'][key]['status']))}</td><td>{esc(flow['stages'][key]['nextAction'])}</td></tr>" for key, name in stages)
    page = f'<section><h2>Itération GitHub et cockpit</h2><p>{esc(flow["objective"])}</p><table><tr><th>Étape</th><th>État</th><th>Prochaine action</th></tr>{stages_html}</table><p>PR : {esc(pr)}</p><p>SHA source : <code>{esc(candidate.get("sourceSha") or "Non qualifié")}</code></p><p>Artefact : <code>{esc(candidate.get("artifactSha256") or "Non qualifié")}</code></p><h3>Blocages</h3><ul>{"".join("<li>"+esc(item)+"</li>" for item in flow["blockers"])}</ul><p>{esc(flow["nextAction"])}</p><p><a href="iteration-developpement.md">Fiche complète générée</a></p></section>'
    return body, page


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
