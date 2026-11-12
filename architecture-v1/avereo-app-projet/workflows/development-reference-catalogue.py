"""Créer une référence locale traçable sans modifier les copies de développement."""
from pathlib import Path
from datetime import datetime
import argparse, hashlib, json, os, re, subprocess

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'data/configuration-reference.json'
ENV = dict(os.environ, GIT_OPTIONAL_LOCKS='0')

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def write(path, obj):
    p = Path(path); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''): h.update(chunk)
    return h.hexdigest()

def git(repo, *args, binary=False):
    result = subprocess.run([cfg['gitExecutable'], '-C', str(repo), *args], env=ENV, capture_output=True)
    if result.returncode: raise RuntimeError(f'Git {args[0]} refusé dans {repo}: code {result.returncode}')
    return result.stdout if binary else result.stdout.decode('utf-8', errors='replace').strip()

def repos():
    candidates = []
    for parent in cfg['scanDirectories']:
        parent = Path(parent)
        if parent.exists():
            candidates.extend(p for p in parent.iterdir() if p.is_dir() and (p / '.git').exists())
    candidates.extend(Path(p) for p in cfg['additionalRepositories'])
    if cfg.get('reference', {}).get('mode') == 'git-clone': candidates.append(Path(cfg['reference']['sourceRepository']))
    found = {}
    for path in candidates:
        if not (path / '.git').exists(): continue
        key = str(path.resolve()).casefold()
        if key in found: continue
        try:
            head = git(path, 'rev-parse', 'HEAD')
            common = git(path, 'rev-parse', '--path-format=absolute', '--git-common-dir')
            status = git(path, 'status', '--porcelain=v1', '--untracked-files=normal')
            try: main = git(path, 'rev-parse', 'refs/remotes/origin/main')
            except RuntimeError: main = None
            try: origin = git(path, 'config', '--get', 'remote.origin.url')
            except RuntimeError: origin = ''
            # Ne conserver ni URL avec authentification ni identifiant d'accès.
            match = re.search(r'github\.com[:/]([\w.-]+/[\w.-]+)', origin)
            repository = match.group(1).removesuffix('.git') if match else None
            found[key] = {'path': str(path), 'repository': repository, 'head': head,
                'branch': git(path, 'branch', '--show-current') or '(détachée)', 'localMain': main,
                'lastCommit': git(path, 'log', '-1', '--format=%cI'), 'gitCommonDirectory': common,
                'hasLocalChanges': bool(status), 'statusSha256': hashlib.sha256(status.encode()).hexdigest(),
                'changedOrUntrackedEntries': len(status.splitlines()) if status else 0,
                'classification': 'copie de travail conservée, contenu et rôle à relire avant reprise'}
        except RuntimeError:
            found[key] = {'path': str(path), 'classification': 'dossier Git non lisible, à qualifier'}
    return sorted(found.values(), key=lambda x: x['path'].casefold())

def canonical_files():
    registry = read(cfg['cockpitRegistry'])
    paths = {str(Path(cfg['cockpitRegistry']))}
    for entry in registry['entries']:
        paths.add(str(Path(entry['root']) / entry['file']))
    return {p: digest(p) for p in sorted(paths) if Path(p).is_file()}

def inventory():
    return {'observedAt': datetime.now().astimezone().isoformat(), 'method': 'lecture Git locale sans fetch ni modification des copies',
            'repositories': repos(), 'canonicalFiles': canonical_files()}

def backups():
    items = []
    for parent in cfg['backupScanDirectories']:
        parent = Path(parent)
        if not parent.exists(): continue
        for p in parent.iterdir():
            if p.resolve() == ROOT.resolve(): continue
            if re.search(r'backup|sauvegarde|archives|livraisons', p.name, re.I) or (p.is_file() and (p.suffix.lower() == '.zip' or p.name.endswith(('.tar.gz','.tgz')))):
                items.append({'path': str(p), 'name': p.name, 'type': 'directory' if p.is_dir() else 'file',
                    'qualification': 'emplacement conservé ; inventaire de présence uniquement, restauration non testée'})
    return sorted(items, key=lambda x: x['path'].casefold())

def verify_snapshot():
    m = read(ROOT / 'data/fichiers-reference.json')
    assert m['sourceSha'] == cfg.get('archiveReference', cfg['reference'])['sha']
    assert digest(m['archive']) == m['archiveSha256']
    base = Path(m['directory'])
    expected = {f['path'] for f in m['files']}
    actual = {p.relative_to(base).as_posix() for p in base.rglob('*') if p.is_file()}
    assert expected == actual, 'Ajout ou perte de fichier dans la référence'
    for f in m['files']: assert digest(base / f['path']) == f['sha256'], f['path']
    return m

def git_reference():
    ref = cfg['reference']; repo = Path(ref['sourceRepository'])
    assert ref.get('mode') == 'git-clone', 'Un clone Git de référence est requis'
    assert repo.resolve() == (ROOT/'depot').resolve() and (repo/'.git').is_dir(), 'Clone dédié attendu dans depot'
    remote = git(repo, 'config', '--get', 'remote.origin.url')
    assert remote in ['https://github.com/jpdandin44/AVEREO.git', 'git@github.com:jpdandin44/AVEREO.git'], 'Dépôt distant inattendu'
    assert git(repo, 'rev-parse', '--is-shallow-repository') == 'false', 'Historique complet requis'
    branch = git(repo, 'branch', '--show-current'); head = git(repo, 'rev-parse', 'HEAD')
    assert branch == 'main', 'La référence doit rester sur main ; utiliser une copie de travail pour les évolutions'
    assert not git(repo, 'status', '--porcelain=v1'), 'Modifications présentes dans le clone de référence ; aucune réécriture'
    assert head == git(repo, 'rev-parse', 'refs/remotes/origin/main'), 'main locale distincte de origin/main ; qualifier avant actualisation'
    return {**ref, 'sha':head, 'branch':branch,
            'status':'Clone Git complet propre ; observation locale, sans synchronisation continue',
            'git':{'branch':branch,'headSha':head,'shallow':False,'clean':True,
                   'historyCommits':int(git(repo,'rev-list','--count','HEAD')),
                   'originMainSha':head,'upstream':git(repo,'rev-parse','--abbrev-ref','@{upstream}')}}


def catalogue(folder):
    reference = git_reference()
    folder = Path(reference['sourceRepository'])
    source = read(cfg['cockpitRegistry'])
    entries = []
    for app in source['applications']:
        if app['id'] not in cfg['applicationIds']: continue
        app_path = ('avereo-app-rapport/frontend/public/rga' if app['id'] == 'rga' else 'avereo-app-' + app['id'])
        dest = folder / 'architecture-v1' / app_path
        if not dest.is_dir(): raise RuntimeError('Application absente : ' + app['id'])
        tracking = [{'id': e['id'], 'root': e['root'], 'file': e['file'], **({'dataPath': e['dataPath']} if 'dataPath' in e else {})}
            for e in source['entries'] if app['id'] in e.get('applicationIds', [e['id']]) and e['id'] != 'reference-applications']
        entries.append({'id': app['id'], 'name': app['name'], 'referenceDirectory': str(dest),
            'referenceSha': reference['sha'], 'workingDirectoryInCockpit': app.get('directory'),
            'canonicalTrackers': tracking, 'preproduction': {'status': 'non recontrôlée dans ce lot', 'source': 'suivis canoniques'},
            'production': {'status': 'non recontrôlée dans ce lot', 'source': 'suivis canoniques'}})
    assert len(entries) == len(cfg['applicationIds'])
    m = read(ROOT / 'data/fichiers-reference.json')
    result = {'schema': 'avereo-local-reference-catalog', 'version': 'git', 'owner': 'jpdandin',
        'observedAt': datetime.now().astimezone().isoformat(), 'reference': reference,
        'referenceArchive': {'path': m['archive'], 'sha256': m['archiveSha256'], 'sourceSha':m['sourceSha'], 'directory':m['directory'], 'role':'archive historique sans répertoire Git, distincte du clone de référence'},
        'policy': 'Clone Git complet sur main pour la référence ; branches et travaux conservés ; archives séparées et livraisons qualifiées dans les suivis.',
        'cockpitRegistry': cfg['cockpitRegistry'], 'applications': entries,
        'sharedPlatformDirectory': str(folder / 'architecture-v1/avereo-platform')}
    write(ROOT / 'data/catalogue-applications.json', result)
    return result

def views(cat, inv, archives):
    stamp = datetime.now().astimezone().isoformat()
    front = '---\nproject: avereo-reference\ndocument_type: generated-index\ntitle: Catalogue local des applications AVEREO\nstatus: active\nversion: git\ncreated: 2026-11-10\nupdated: ' + stamp[:10] + '\nowner: jpdandin\ntags: [reference, catalogue, genere]\n---\n\n'
    md = front + '# Catalogue des applications AVEREO\n\nVue générée depuis `data/catalogue-applications.json`. Ne pas modifier cette vue manuellement.\n\n'
    md += 'Clone Git complet : [ouvrir le dépôt](<' + cat['reference']['sourceRepository'] + '>), branche `main`, HEAD observé `' + cat['reference']['sha'][:12] + '`. Historique conservé. Les références Git distantes restent celles du dernier fetch ; aucune synchronisation continue.\n\n'
    md += '| Application | Sources de référence | Suivis métier existants |\n| --- | --- | --- |\n'
    for a in cat['applications']:
        links = '; '.join(f"[{e['id']}](<{Path(e['root']) / e['file']}>)" for e in a['canonicalTrackers'])
        md += f"| {a['name']} | [{a['id']}](<{a['referenceDirectory']}>) | {links} |\n"
    md += '\n## Socle commun\n\n[Plateforme partagée](<' + cat['sharedPlatformDirectory'] + '>). RGA a une entrée distincte et ses sources restent dans Rapport.\n'
    (ROOT / 'docs/catalogue-applications.md').write_text(md, encoding='utf-8')
    md = front.replace('Catalogue local des applications AVEREO', 'Copies de travail conservées') + '# Développements et copies conservés\n\nCe registre constate les copies locales ; une copie présente ne prouve pas qu’un développement est encore actif. Ne supprimer aucune copie sur la seule base de son ancienneté.\n\n| Dossier | Branche | Dernier commit local | Modifications locales |\n| --- | --- | --- | --- |\n'
    for r in inv['repositories']:
        path = Path(r['path']); md += f"| [{path.name}](<{path}>) | {r.get('branch', 'À qualifier')} | {r.get('head', '')[:12]} | {'Oui' if r.get('hasLocalChanges') else 'Non détectées'} |\n"
    (ROOT / 'docs/developpements-conserves.md').write_text(md, encoding='utf-8')
    specs = [{'link':str(ROOT/'Clone Git AVEREO.lnk'),'target':cat['reference']['sourceRepository']}, {'link':str(ROOT/'applications/clone-git-avereo.lnk'),'target':cat['reference']['sourceRepository']}]
    for a in cat['applications']: specs.append({'link': str(ROOT / 'applications' / (a['id'] + '.lnk')), 'target': a['referenceDirectory']})
    specs.append({'link': str(ROOT / 'applications/plateforme-commune.lnk'), 'target': cat['sharedPlatformDirectory']})
    for r in inv['repositories']:
        p = Path(r['path']); suffix = hashlib.sha256(str(p).encode()).hexdigest()[:6]
        specs.append({'link': str(ROOT / 'developpements' / (p.name + '-' + suffix + '.lnk')), 'target': str(p)})
    for a in archives:
        p = Path(a['path']); suffix = hashlib.sha256(str(p).encode()).hexdigest()[:6]
        specs.append({'link': str(ROOT / 'sauvegardes' / (p.name + '-' + suffix + '.lnk')), 'target': str(p)})
    specs.append({'link': str(ROOT / 'pilotage/Pilotage AVEREO.lnk'), 'target': str(Path(cfg['cockpitRegistry']).parents[1])})
    specs.append({'link': str(ROOT / 'pilotage/Catalogue des versions.lnk'), 'target': str(ROOT / 'data/catalogue-applications.json')})
    write(ROOT / 'data/raccourcis.json', specs)

def main():
    global ROOT, CONFIG, cfg
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=['inventory', 'verify'])
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args(); ROOT = args.root.resolve(); CONFIG = ROOT/'data/configuration-reference.json'; cfg = read(CONFIG)
    if args.operation == 'verify':
        m = verify_snapshot(); ref = git_reference(); print(json.dumps({'verifiedFiles': m['fileCount'], 'archiveSha256': m['archiveSha256'], 'gitHead':ref['sha'], 'historyCommits':ref['git']['historyCommits']})); return
    for d in ['applications','developpements','sauvegardes','pilotage','versions','data','docs','scripts','tests','api','prompts','workflows']:
        (ROOT / d).mkdir(parents=True, exist_ok=True)
    inv = inventory()
    m = verify_snapshot(); folder = Path(m['directory'])
    cat = catalogue(folder); saved = backups()
    write(ROOT / 'data/inventaire-developpements.json', inv)
    write(ROOT / 'data/inventaire-sauvegardes.json', {'observedAt': inv['observedAt'], 'locations': saved})
    views(cat, inv, saved)
    after = inventory()
    assert inv['canonicalFiles'] == after['canonicalFiles'], 'Sources canoniques modifiées pendant la lecture'
    assert inv['repositories'] == after['repositories'], 'État Git modifié pendant la lecture'
    write(ROOT / 'data/verification-preservation.json', {'observedAt': after['observedAt'],
        'repositoriesChecked': len(inv['repositories']), 'canonicalFilesChecked': len(inv['canonicalFiles']),
        'result': 'identiques avant et après organisation', 'method': 'HEAD branche référence locale main état Git et SHA256 des suivis ; aucune copie source modifiée'})
    print(json.dumps({'applications': len(cat['applications']), 'workingCopies': len(inv['repositories']), 'backupLocations': len(saved), 'reference': cat['reference']['sha']}))

if __name__ == '__main__': main()
