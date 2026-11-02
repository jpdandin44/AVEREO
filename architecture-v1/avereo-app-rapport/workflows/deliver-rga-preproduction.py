"""Guarded two-application file delivery; Python 3.6 compatible; no SQL writes."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parent
ROOTS = {'connect': Path('/home/daje3540/connect-preprod.avereo.fr'),
         'rapport': Path('/home/daje3540/rapport-preprod.avereo.fr')}
SOURCE = BASE / 'candidate'
BACKUP = BASE / 'recovery'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def tree(root):
    result = {}
    for p in sorted(root.rglob('*')):
        assert not p.is_symlink(), 'Symlink refused'
        if p.is_file():
            result[p.relative_to(root).as_posix()] = sha(p)
    return result

def checked(root, name):
    p = root / name
    assert not Path(name).is_absolute() and '..' not in Path(name).parts
    assert root.resolve() in p.resolve().parents and not p.is_symlink()
    return p

def write_json(name, value):
    p = BASE / name
    p.write_text(json.dumps(value, indent=2) + '\n')
    p.chmod(0o600)

def files_for(key):
    return {n.split('/', 1)[1]: h for n, h in MANIFEST['files'].items() if n.startswith(key + '/')}


def validate_file_scope(manifest):
    names = set(manifest['files'])
    if manifest.get('kind') == 'rga-independent-access':
        connect = {'connect/' + p for p in ['src/Application.php', 'src/Config.php', 'public/index.php',
                   'src/Repository/RgaRegistration.php', 'bin/register-rga.php']}
        rapport = {'rapport/' + p for p in ['index.html', 'rga/guard.php', 'rga/gate.php', 'rga/connect-gate.php',
                   'rga/entry.php', 'rga/resume.php', 'rga/access.php']}
        assert {n for n in names if n.startswith('connect/')} == connect
        assert rapport <= names
        assert all(n in connect | rapport or (n.startswith('rapport/assets/') and n.endswith(('.js', '.css'))
                   and '..' not in n and n.count('/') == 2) for n in names)
    else:
        assert manifest.get('kind') is None
        assert all(n.startswith(('rapport/', 'connect/')) and 'gate.php' not in n for n in names)
        assert {n for n in names if n.startswith('connect/')} == {'connect/src/Application.php'}

def install(roots):
    # Rapport assets and its entry first; CONNECT shortcut last.
    for key in ['rapport', 'connect']:
        for name in sorted(files_for(key), key=lambda n: (n == 'index.html', n)):
            dest = checked(roots[key], name)
            dest.parent.mkdir(parents=True, exist_ok=True)
            temp = BASE / 'pending-file'
            shutil.copy2(SOURCE / key / name, temp)
            temp.chmod(0o644)
            os.replace(str(temp), str(dest))

def restore(roots, before):
    for key in ['connect', 'rapport']:
        for name, new_sha in files_for(key).items():
            dest = checked(roots[key], name)
            if name in before[key]:
                temp = BASE / 'pending-restore'
                shutil.copy2(BACKUP / key / name, temp)
                os.replace(str(temp), str(dest))
            elif dest.exists():
                assert sha(dest) == new_sha, 'New file changed; manual recovery required'
                dest.unlink()
        assert tree(roots[key]) == before[key], 'Restore mismatch'

def qualify():
    for key, root in ROOTS.items():
        assert root.is_dir() and root.resolve() == root and not root.is_symlink()
        response = subprocess.run(['uapi', '--output=json', 'DomainInfo', 'single_domain_data', 'domain=' + root.name],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True)
        expected = root / 'public' if key == 'connect' else root
        assert Path(json.loads(response.stdout)['result']['data']['documentroot']) == expected, 'Document root differs'
    php = r"""
    ob_start();
    $cp = file_exists('/home/daje3540/private/connect-preprod/config.php') ? '/home/daje3540/private/connect-preprod/config.php' : '/home/daje3540/private/connect/config.php';
    $c = require $cp;
    $p = require '/home/daje3540/private/connect-production/config.php';
    $r = require '/home/daje3540/.avereo/rapport-preprod/config.php';
    $rp = require '/home/daje3540/.avereo/rapport/config.php';
    ob_end_clean();
    echo json_encode(['connectConfigPath'=>$cp,
      'connectDatabaseDistinct'=>!empty($c['DB_DSN']) && !empty($p['DB_DSN']) && $c['DB_DSN'] !== $p['DB_DSN'],
      'rapportDatabaseDistinct'=>!empty($r['db_name']) && !empty($rp['db_name']) && $r['db_name'] !== $rp['db_name'],
      'launchPreproduction'=>parse_url($c['APP_LAUNCH_RAPPORT_URL'] ?? '',PHP_URL_HOST)==='rapport-preprod.avereo.fr',
      'portalPreproduction'=>parse_url($r['connect_portal_url'] ?? '',PHP_URL_HOST)==='connect-preprod.avereo.fr',
      'connectGateway'=>($r['auth_mode'] ?? '')==='connect_gateway']);
    """
    response = subprocess.run(['php', '-d', 'display_errors=0', '-r', php], stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, universal_newlines=True, check=True)
    checks = json.loads(response.stdout)
    assert all(v is True for k, v in checks.items() if k != 'connectConfigPath'), 'Isolation unverified'
    configs = [checks.pop('connectConfigPath'), '/home/daje3540/.avereo/rapport-preprod/config.php']
    checks['configs'] = {p: sha(Path(p)) for p in configs}
    checks['documentRootsVerified'] = True
    write_json('qualification.json', checks)
    return checks

def main():
    global MANIFEST
    assert BASE.parent == Path('/home/daje3540/.avereo/rga-preprod'), 'Private staging directory required'
    MANIFEST = json.loads((BASE / 'manifest.json').read_text())
    assert MANIFEST['targets'] == {k: str(v) for k, v in ROOTS.items()}
    assert len(MANIFEST['sourceSha']) == 40
    assert sha(BASE / 'candidate.zip') == MANIFEST['artifactSha256']
    validate_file_scope(MANIFEST)
    if not SOURCE.exists():
        with zipfile.ZipFile(BASE / 'candidate.zip') as archive:
            assert set(archive.namelist()) == set(MANIFEST['files'])
            for name in archive.namelist():
                checked(SOURCE, name)
            archive.extractall(str(SOURCE))
    assert tree(SOURCE) == MANIFEST['files']
    assert len(sys.argv) == 2 and sys.argv[1] in ('qualify', 'prepare', 'deploy', 'verify', 'rollback')
    action = sys.argv[1]
    now = datetime.now(timezone.utc).isoformat()
    if action == 'qualify':
        qualify()
        print(json.dumps({'status': 'qualified', 'isolated': True, 'documentRootsVerified': True}))
        return
    if action == 'prepare':
        q = qualify()
        for name, expected in MANIFEST['previousFiles'].items():
            key, rel = name.split('/', 1)
            assert sha(checked(ROOTS[key], rel)) == expected, 'Prior version differs: ' + name
        assert not BACKUP.exists() and not (BASE / 'recovery.json').exists()
        before = {k: tree(v) for k, v in ROOTS.items()}
        BACKUP.mkdir(mode=0o700)
        for key in ROOTS:
            shutil.copytree(str(ROOTS[key]), str(BACKUP / key))
            assert tree(BACKUP / key) == before[key]
        for i, name in enumerate(q['configs']):
            shutil.copy2(name, str(BACKUP / ('config-' + str(i) + '.php')))
        rehearsal = {k: BASE / ('rehearsal-' + k) for k in ROOTS}
        for key in ROOTS:
            shutil.copytree(str(BACKUP / key), str(rehearsal[key]))
        install(rehearsal)
        for key in ROOTS:
            assert tree(rehearsal[key]) == dict(before[key], **files_for(key))
        restore(rehearsal, before)
        state = {'observedAt': now, 'sourceSha': MANIFEST['sourceSha'], 'before': before, 'configs': q['configs'],
                 'backupVerified': True, 'restoreVerified': True, 'databaseWrites': False}
        write_json('recovery.json', state)
        print(json.dumps({'status': 'prepared', 'backupVerified': True, 'restoreVerified': True,
                          'files': {k: len(v) for k, v in before.items()}}))
        return
    state = json.loads((BASE / 'recovery.json').read_text())
    assert state['sourceSha'] == MANIFEST['sourceSha']
    for key in ROOTS:
        assert tree(BACKUP / key) == state['before'][key]
    for i, (name, expected) in enumerate(state['configs'].items()):
        active_expected = expected
        if action == 'verify' and MANIFEST.get('kind') == 'rga-independent-access' and (BASE / 'access-verification.json').exists():
            access = json.loads((BASE / 'access-verification.json').read_text())
            recovery = json.loads((BASE / 'access-recovery.json').read_text())
            assert access['sourceSha'] == MANIFEST['sourceSha'] and access['artifactSha256'] == MANIFEST['artifactSha256']
            if name == '/home/daje3540/private/connect-preprod/config.php':
                assert recovery['connectBefore'] == expected
                active_expected = recovery['connectAfter']
        assert sha(Path(name)) == active_expected and sha(BACKUP / ('config-' + str(i) + '.php')) == expected
    if action == 'deploy':
        assert all(tree(v) == state['before'][k] for k, v in ROOTS.items()), 'Hosted files changed since backup'
        qualify()
        try:
            install(ROOTS)
            assert all(tree(v) == dict(state['before'][k], **files_for(k)) for k, v in ROOTS.items())
        except Exception:
            restore(ROOTS, state['before'])
            raise
        write_json('delivery.json', {'observedAt': now, 'status': 'delivered', 'sourceSha': MANIFEST['sourceSha'],
            'artifactSha256': MANIFEST['artifactSha256'], 'privateConfigsUnchanged': True, 'databaseWrites': False})
    elif action == 'rollback':
        assert all(tree(v) == dict(state['before'][k], **files_for(k)) for k, v in ROOTS.items()), 'Later changes; review required'
        restore(ROOTS, state['before'])
    else:
        assert all(tree(v) == dict(state['before'][k], **files_for(k)) for k, v in ROOTS.items())
    write_json(action + '-verification.json', {'observedAt': now, 'status': action + '_verified',
        'sourceSha': MANIFEST['sourceSha'], 'artifactSha256': MANIFEST['artifactSha256'], 'databaseWrites': False})
    print(json.dumps({'action': action, 'status': 'verified', 'sourceSha': MANIFEST['sourceSha'], 'databaseWrites': False}))

if __name__ == '__main__':
    main()
