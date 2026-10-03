"""Regenerate read-only cockpit views; preserve approved deliverables."""
import hashlib, html, json, os, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
folder = Path(__file__).resolve().parent
state = json.loads((folder/'suivi-chantier.json').read_text(encoding='utf-8'))
github = state.get('developmentWorkflow',{}).get('github',{})
projection_changed = False
if all(github.get(key) is not None for key in ('prUrl','repository','number','state','headSha','observedAt')):
    projection = {key:github[key] for key in ('repository','number','state','headSha','observedAt')}
    projection['url'] = github['prUrl']
    phase = next(p for p in state['phases'] if p['id']==0)
    projection_changed = phase.get('pullRequest') != projection
    phase['pullRequest'] = projection
protocol = (ROOT/'skills/developpement-github-cockpit/references/protocole.md').read_text(encoding='utf-8')
body = protocol.split('---', 2)[2].lstrip()
source_folder = ROOT/'skills/developpement-github-cockpit/references'
def realign_link(match):
    url = match.group(1)
    if re.match(r'^[a-z]+:', url, re.I) or url.startswith('#'):
        return match.group(0)
    path, marker, anchor = url.partition('#')
    relative = os.path.relpath((source_folder/path).resolve(), folder).replace('\\', '/')
    return '](' + relative + (marker+anchor if marker else '') + ')'
body = re.sub(r'\]\(([^)]+)\)', realign_link, body)
front = '---\nproject: protocole-developpement\ndocument_type: generated-cockpit-document\ntitle: Protocole et preuves locales\nstatus: active\nversion: git\ncreated: 2026-10-03\nupdated: 2026-10-03\nowner: jpdandin\ntags: [cockpit, derive]\n---\n\n'
proof_path = ROOT/'data/verification.json'
proof = json.loads(proof_path.read_text(encoding='utf-8')) if proof_path.exists() else {'status':'Contrôles en cours'}
local = front + '# Revue locale du protocole\n\nDocument dérivé automatiquement de la source du skill. Les accords et livraisons réels restent distincts.\n\n## Contrôles de ce lot\n\n' + '\n'.join('- '+str(v) for v in proof.get('checks',['Contrôles en cours.'])) + '\n\n## Protocole de référence\n\n'+body
path = folder/'local.md'
approved = [p for d in state.get('decisions',[]) if d.get('status')=='approved' for p in (d.get('evidence') or {}).get('reviewedArtifacts',[])]
for p in approved:
    original=folder/p['path']
    if hashlib.sha256(original.read_bytes()).hexdigest()!=p['sha256']:
        raise ValueError('Preuve approuvée modifiée : '+p['path'])
if path.exists() and any(p['path']=='local.md' for p in approved) and path.read_text(encoding='utf-8')!=local:
    raise ValueError('La source a changé après approbation. Ouvrir une nouvelle revue sans écraser la preuve approuvée.')
path.write_text(local, encoding='utf-8', newline='\n')
if projection_changed:
    (folder/'suivi-chantier.json').write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
view_front=front.replace('generated-cockpit-document','generated-dashboard').replace('Protocole et preuves locales','Tableau de pilotage')
lines=[view_front+'# Pilotage des trois étapes','', '| Étape | État | Prochaine action |', '| --- | --- | --- |']
for p in state['phases']:
    lines.append('| '+p['shortTitle']+' | '+state['statusLabels'][p['status']]+' | '+p['nextAction']+' |')
lines += ['', 'Aucune décision humaine ni livraison de ce socle n’est créée par la génération.']
(folder/'tableau-de-bord.md').write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
(folder/'tableau-de-bord.html').write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><title>Pilotage</title><body><pre>'+html.escape('\n'.join(lines))+'</pre></body></html>',encoding='utf-8',newline='\n')
print('Vues du cockpit actualisées ; décisions inchangées.')
