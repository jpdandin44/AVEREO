"""Select the reviewed PR119 UI changes, then rehearse them on private copies.

No live deployment command is provided. Keep the full original preparation as
evidence; exclude unrelated drift from the small delivery payload.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import zipfile

from prepare_shared_menu import TARGETS, SOURCE, recover_files, require_source
from release_selected_preprod import declared_root, digest, record, require, safe_name

EXCLUDED = {
    'coupe': {'api/bootstrap.php', 'api/projects.php'},
    'projet': {'planning-core.js'},
    'passeport-immo': {'connect/gate.php'},
}


def coupe_menu_only(before, accepted):
    """Apply the four relevant PR119 UI edits to the installed OAuth variant."""
    html = before.decode('utf-8')
    source = accepted.decode('utf-8').replace('\r\n', '\n')
    script = '    <script defer src="/account-menu.js"></script>\n'
    old_button = '            <button id="online-auth-btn" onclick="app.handleOnlineAuthClick()" title="Connexion utilisateur AVEREO"><i class="fas fa-user-circle"></i> Connexion AVEREO</button>\n'
    start = source.index('            <avereo-account-menu id="coupe-account-menu"')
    end = source.index('            </avereo-account-menu>', start) + len('            </avereo-account-menu>\n')
    menu = source[start:end]
    old_label = 'btn.innerHTML = `<i class="fas fa-user-check"></i> ${this.escapeHTML(label)}`;'
    new_label = "btn.textContent = 'Se déconnecter';"
    require(script in source and new_label in source and old_button not in source,
            'Accepted source menu differs')
    # Preserve the original BOM and line endings, as well as all business logic.
    newline = '\r\n' if '\r\n' in html else '\n'
    original = html.replace('\r\n', '\n')
    html = original
    sidebar_end = '        </aside>\n\n        <!-- MAIN WORKSPACE : CANVAS -->'
    edits = [('</head>', script + '</head>'), (old_button, ''),
             (sidebar_end, menu + sidebar_end), (old_label, new_label)]
    preferences = ''
    start_marker = '    /* AVEREO Coupe preferences begin */'
    end_marker = '    /* AVEREO Coupe preferences end */'
    if start_marker in source:
        require(source.count(start_marker) == source.count(end_marker) == 1, 'Coupe preferences markers differ')
        start = source.index(start_marker)
        end = source.index(end_marker, start) + len(end_marker) + 1
        preferences = source[start:end]
        require('cad-grid-toggle' in original and 'cad-snap-toggle' in original, 'Coupe editor controls absent')
        anchor = '    window.onload = () => app.init();'
        edits.append((anchor, preferences + anchor))
    for old, new in edits:
        require(html.count(old) == 1, 'Installed Coupe menu anchor differs')
        html = html.replace(old, new, 1)
    require('connect_gateway' not in original and 'connect_gateway' not in html,
            'This overlay is only for the observed OAuth variant')
    inverse = html.replace(new_label, old_label, 1).replace(menu, '', 1)
    if preferences: inverse = inverse.replace(preferences, '', 1)
    inverse = inverse.replace(script, '', 1)
    # Restore the toolbar button at its original position for byte-level comparison.
    following = '            <button onclick="app.resetProject()"'
    require(inverse.count(following) == 1, 'Toolbar anchor differs')
    inverse = inverse.replace(following, old_button + following, 1)
    require(inverse == original, 'Non-menu Coupe change')
    return html.replace('\n', newline).encode('utf-8')


def build(delivery, output, expected_source=SOURCE):
    require(not output.exists(), 'Keep existing selection')
    receipt = json.loads((delivery / 'preparation-serveur.json').read_text(encoding='utf-8'))
    require_source(receipt['sourceSha'], expected_source)
    require(set(receipt['applications']) == set(TARGETS),
            'Preparation source or scope differs')
    selection = {'sourceSha': expected_source, 'observedAt': datetime.now(timezone.utc).isoformat(),
                 'status': 'prepared_not_deployed', 'applications': {}, 'exclusions': {},
                 'coupeAdaptation': 'PR119 menu only on the installed OAuth variant; inverse byte equality'}
    output.mkdir(parents=True)
    with zipfile.ZipFile(output / 'payload.zip', 'w', zipfile.ZIP_DEFLATED) as payload, \
            zipfile.ZipFile(delivery / 'review-serveur.zip') as review:
        for name, app in receipt['applications'].items():
            operations = {}
            with zipfile.ZipFile(delivery / 'candidats' / (name + '.zip')) as archive:
                require(digest((delivery / 'candidats' / (name + '.zip')).read_bytes()) == app['artifactSha256'],
                        'Original candidate differs')
                for rel, operation in app['operations'].items():
                    if operation['action'] == 'preserve' or rel in EXCLUDED.get(name, set()):
                        continue
                    safe_name(rel)
                    content = archive.read(('public/' if name == 'connect' else '') + rel)
                    if name == 'coupe' and rel == 'legacy-app.html':
                        before = review.read('before/coupe/legacy-app.html')
                        require(digest(before) == operation['before']['sha256'], 'Coupe before-image differs')
                        content = coupe_menu_only(before, content)
                        operation = dict(operation, after=dict(operation['after'],
                            sha256=digest(content), sha256_lf=digest(content.replace(b'\r\n', b'\n')), bytes=len(content)))
                    require(digest(content) == operation['after']['sha256'], 'Selected file differs')
                    payload.writestr(name + '/' + rel, content)
                    operations[rel] = operation
            selection['applications'][name] = {'root': app['root'], 'operations': operations,
                'counts': {action: sum(o['action'] == action for o in operations.values())
                           for action in ('replace', 'create')}}
            selection['exclusions'][name] = sorted(EXCLUDED.get(name, set()))
    selection['artifactSha256'] = digest((output / 'payload.zip').read_bytes())
    (output / 'selection.json').write_text(json.dumps(selection, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    return {'artifactSha256': selection['artifactSha256'],
            'files': sum(len(a['operations']) for a in selection['applications'].values())}


def verify(work, selected, expected_source=SOURCE):
    require(work.resolve() == work and work.parent == Path('/home/daje3540/private')
            and work.name.startswith('mon-espace-preprod-'), 'Private preparation required')
    require(selected.resolve() == selected and selected.parent == work, 'Private selection required')
    original = json.loads((work / 'preparation.json').read_text())
    selection = json.loads((selected / 'selection.json').read_text())
    require_source(original['sourceSha'], expected_source)
    require(selection['sourceSha'] == original['sourceSha']
            and set(selection['applications']) == set(TARGETS), 'Source or scope differs')
    require(digest((selected / 'payload.zip').read_bytes()) == selection['artifactSha256'], 'Payload differs')
    result = {'observedAt': datetime.now(timezone.utc).isoformat(), 'sourceSha': expected_source,
              'artifactSha256': selection['artifactSha256'], 'status': 'rehearsed_not_deployed',
              'applications': {}, 'liveFilesModified': False, 'databaseAccessed': False}
    with zipfile.ZipFile(selected / 'payload.zip') as archive:
        expected = {name + '/' + rel for name,a in selection['applications'].items() for rel in a['operations']}
        require(len(archive.namelist()) == len(expected) and set(archive.namelist()) == expected,
                'Payload inventory differs')
        for name, app in selection['applications'].items():
            root = TARGETS[name]
            require(str(root) == app['root'] and declared_root(name + '-preprod.avereo.fr') == root,
                    'Target drift')
            require(all(record(root / rel) == op['before'] for rel,op in original['applications'][name]['operations'].items()),
                    'Active file drift')
            files = {safe_name(rel): archive.read(name + '/' + rel) for rel in app['operations']}
            require(all(digest(files[rel]) == op['after']['sha256'] for rel,op in app['operations'].items()),
                    'Selected content differs')
            operations = recover_files(root, files, selected / 'recovery' / name)
            require(operations == app['operations'], 'Selected rehearsal differs')
            result['applications'][name] = {'root': str(root), 'fileCount': len(operations),
                                            'backupAndRestoreOnCopies': 'passed'}
    (selected / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['build', 'verify'])
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--selection', type=Path, required=True)
    parser.add_argument('--expected-source', default=SOURCE)
    args = parser.parse_args()
    result = build(args.work, args.selection, args.expected_source) if args.action == 'build' else verify(args.work, args.selection, args.expected_source)
    print(json.dumps(result))
