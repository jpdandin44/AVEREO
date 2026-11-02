"""Regénère les vues AVEREO Saisie unique avec le rendu Markdown mutualisé du chantier AVEREO."""

import argparse
import hashlib
import html
import json
import runpy
from pathlib import Path

DIRECTORY = Path(__file__).resolve().parent
ROOT = DIRECTORY.parent
PROJECT = 'avereo-app-saisie-unique'
DEFAULT_PORT = 5191


def approved_document_hashes(data):
    """Keep the exact reviewed bytes; current dashboards remain projections of JSON."""
    protected = {}
    for phase in data['phases']:
        if phase.get('status') != 'validated':
            continue
        decision = next((item for item in data['decisions'] if item.get('id') == phase.get('validationEvidence', {}).get('decisionId') and item.get('status') == 'approved'), None)
        for artifact in (decision or {}).get('evidence', {}).get('reviewedArtifacts', []):
            protected[artifact['path']] = artifact['sha256']
    return protected


def load_settings():
    path = ROOT / '.local/review-settings.json'
    if not path.is_file():
        raise SystemExit("Fichier absent : .local/review-settings.json. Il porte le chemin du générateur mutualisé "
                         "(clé « dashboardGenerator ») et reste propre au poste, hors Git.")
    return json.loads(path.read_text(encoding='utf-8-sig'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    settings = load_settings()
    renderer = runpy.run_path(settings['dashboardGenerator'])['markdown_view']
    data = json.loads((DIRECTORY / 'suivi-chantier.json').read_text(encoding='utf-8-sig'))
    ids = [phase['id'] for phase in data['phases']]
    if ids != list(range(len(ids))) or data['currentPhase'] not in ids:
        raise ValueError('Identifiants de phases incohérents.')
    for phase in data['phases']:
        for item in phase['deliverables']:
            path = (DIRECTORY / item['path']).resolve()
            if not path.is_relative_to(DIRECTORY):
                raise ValueError('Livrable hors du chantier.')
            if item['availability'] == 'present' and not path.is_file():
                raise ValueError(f"Livrable absent : {item['path']}")
    title = data['title']
    port = settings.get('port', DEFAULT_PORT)
    header = f"""---
project: {PROJECT}
document_type: tableau-de-bord
title: {title}
status: active
version: git
created: {data['created']}
updated: {data['updated']}
owner: jpdandin
tags: [suivi, saisie-unique, genere]
---

# {title}

Vue générée depuis `suivi-chantier.json`. Ne pas modifier manuellement.
La revue et les décisions se font dans [Projet local](http://127.0.0.1:{port}/).

"""
    catalog_md = ['## Livrables attendus par phase', '', 'Description issue du suivi JSON ; disponibilité vérifiée lors de la génération.', '']
    catalog_html = []
    for phase in data['phases']:
        catalog_md.extend([f"### Phase {phase['id']} — {phase['shortTitle']}", ''])
        items_html = []
        for item in phase['deliverables']:
            exists = (DIRECTORY / item['path']).is_file()
            label = 'Document disponible' if exists else 'Prévu — document non produit'
            title_item = item.get('title', item['path'])
            description = item.get('description', '')
            catalog_md.extend([f"**{title_item}** — {label} (`{item['path']}`).", '', description, ''])
            proofs = item.get('expectedEvidence', [])
            catalog_md.extend([f'- {proof}' for proof in proofs] + [''])
            proof_html = ''.join(f'<li>{html.escape(proof)}</li>' for proof in proofs)
            items_html.append(f'<article><h3>{html.escape(title_item)}</h3><p>{html.escape(label)} — <code>{html.escape(item["path"])}</code></p><p>{html.escape(description)}</p><ul>{proof_html}</ul></article>')
        catalog_html.append(f'<details><summary>Phase {phase["id"]} — {html.escape(phase["shortTitle"])}</summary>{"".join(items_html)}</details>')
    phase_summary = renderer(data)
    awaiting_review = [phase for phase in data['phases'] if phase['status'] == 'awaiting_review']
    if awaiting_review:
        pending_review = ' ; '.join(f"phase {phase['id']} — {phase['shortTitle']}" for phase in awaiting_review)
        phase_summary = phase_summary.replace('Aucune décision en attente.', f'Revue humaine attendue : {pending_review}. La décision reste à enregistrer dans le cockpit.')
    markdown = header + phase_summary + '\n\n' + '\n'.join(catalog_md).rstrip() + '\n'
    esc = html.escape
    rows = ''.join(f"<tr><td>{p['id']} — {esc(p['shortTitle'])}</td><td>{esc(data['statusLabels'][p['status']])}</td><td>{esc(p['deliveredOn'] or '—')}</td><td>{esc(p['validatedOn'] or 'Non acquise')}</td></tr>" for p in data['phases'])
    page = f'''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title>
<style>body{{font:17px system-ui;max-width:1000px;margin:40px auto;padding:0 20px;color:#17334d}}table{{border-collapse:collapse;width:100%}}th,td{{text-align:left;padding:14px;border-bottom:1px solid #d6e0e7}}a{{color:#095ca5}}pre{{white-space:pre-wrap;font:14px system-ui}}</style>
<h1>{esc(title)}</h1><p>Vue locale générée — {esc(data['updated'])}.</p><p><a href="http://127.0.0.1:{port}/">Ouvrir la revue dans Projet</a></p>
<table><thead><tr><th>Phase</th><th>État</th><th>Livraison</th><th>Validation humaine</th></tr></thead><tbody>{rows}</tbody></table><h2>Livrables attendus</h2>{"".join(catalog_html)}<h2>Source de suivi</h2><p><a href="suivi-chantier.json">JSON canonique</a> · <a href="tableau-de-bord.md">Compte rendu Markdown</a></p></html>\n'''
    changed = []
    derived = {'tableau-de-bord.md': markdown, 'tableau-de-bord.html': page}
    protected = approved_document_hashes(data)
    for filename, content in derived.items():
        path = DIRECTORY / filename
        if filename in protected:
            if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != protected[filename]:
                raise ValueError('Le document approuvé a changé : '+filename+'. Restaurer sa version exacte ou demander une nouvelle revue.')
            continue
        if not path.exists() or path.read_text(encoding='utf-8') != content:
            changed.append(filename)
            if not args.check:
                path.write_text(content, encoding='utf-8', newline='\n')
    if args.check and changed:
        print('Vues à actualiser : ' + ', '.join(changed))
        return 1
    print('Vues alignées sur le suivi AVEREO Saisie unique ; moteur de revue Projet réutilisé.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
