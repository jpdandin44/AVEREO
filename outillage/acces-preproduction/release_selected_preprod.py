"""Guarded file delivery for exactly Rapport and Passeport Immo preproduction.

Staging and recovery stay private. Existing access rules and unlisted paths stay
untouched. All before-images are checked before the first live write. No SQL,
private configuration, account, entitlement or production mutation is supported.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tempfile
import zipfile

HOME = Path('/home/daje3540')
TARGETS = {'rapport': HOME/'rapport-preprod.avereo.fr',
           'passeport-immo': HOME/'passeport-immo-preprod.avereo.fr/public'}
PHP = '/opt/alt/php83/usr/bin/php'
MAX_BYTES = 300 * 1024 * 1024


def require(value, label):
    if not value:
        raise ValueError(label)


def digest(content):
    return hashlib.sha256(content).hexdigest()


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')


def safe_name(name):
    parts = PurePosixPath(name).parts
    require(parts and not name.startswith('/') and '\\' not in name and ':' not in name
            and '..' not in parts and str(PurePosixPath(name)) == name
            and all(not p.startswith('.') or p in ('.htaccess', '.user.ini') for p in parts)
            and 'config.php' not in parts, 'Unsafe candidate path')
    return name


def record(path):
    require(not path.is_symlink(), 'Symbolic link refused')
    if not path.exists():
        return {'exists': False}
    require(path.is_file(), 'Expected regular file')
    data = path.read_bytes()
    return {'exists': True, 'sha256': digest(data),
            'sha256_lf': digest(data.replace(b'\r\n', b'\n')),
            'mode': path.stat().st_mode & 0o777, 'bytes': len(data)}


def tree(root):
    require(root.is_dir() and root.resolve() == root, 'Root absent or linked')
    result = {}
    size = 0
    for path in sorted(root.rglob('*')):
        require(not path.is_symlink(), 'Linked tree entry')
        if path.is_file():
            result[path.relative_to(root).as_posix()] = record(path)
            size += result[path.relative_to(root).as_posix()]['bytes']
            require(size <= MAX_BYTES and len(result) <= 15000, 'Snapshot limit')
    return result


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    path.chmod(0o600)


def load_candidates(work):
    manifest = json.loads((work/'selection.json').read_text(encoding='utf-8'))
    require(set(manifest['applications']) == set(TARGETS), 'Exact two-app scope required')
    result = {}
    for name, app in manifest['applications'].items():
        data = (work/(name+'.zip')).read_bytes()
        require(digest(data) == app['artifactSha256'], 'Archive mismatch: '+name)
        with zipfile.ZipFile(work/(name+'.zip')) as archive:
            names = archive.namelist()
            require(len(names) == len(set(names)) and set(names) == set(app['files']), 'Archive inventory mismatch')
            require(sum(info.file_size for info in archive.infolist()) < MAX_BYTES, 'Archive limit')
            files = {}
            for item in archive.infolist():
                rel = safe_name(item.filename)
                require((item.external_attr >> 16) & 0o170000 != 0o120000, 'Archive symbolic link')
                content = archive.read(rel)
                require(digest(content) == app['files'][rel]['sha256'], 'Candidate file mismatch')
                files[rel] = content
        result[name] = files
    return manifest, result


def declared_root(domain):
    output = subprocess.check_output(['uapi', '--output=json', 'DomainInfo', 'single_domain_data', 'domain='+domain], stderr=subprocess.PIPE)
    result = json.loads(output)['result']
    require(result.get('status') == 1, 'Domain not declared: '+domain)
    data = result['data']
    return Path(data['documentroot'])


def atomic_write(path, content, mode):
    require(path.parent.is_dir() and path.parent.resolve() == path.parent, 'Unsafe destination parent')
    fd, temporary = tempfile.mkstemp(prefix='.avereo-delivery-', dir=str(path.parent))
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(temporary, mode)
        os.replace(temporary, str(path))
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def prepare(work):
    manifest, candidates = load_candidates(work)
    require(not (work/'plan.json').exists() and not (work/'recovery').exists(), 'Fresh preparation required')
    recovery = work/'recovery'
    recovery.mkdir(mode=0o700)
    plan = {'observedAt': now(), 'applications': {}, 'productionChanged': False,
            'privateConfigurationChanged': False, 'databaseMigration': False}
    for name, root in TARGETS.items():
        require(declared_root(name+'-preprod.avereo.fr') == root, 'Declared root differs')
        require(root.resolve() == root and root.is_dir(), 'Target isolation')
        before = tree(root)
        backup = recovery/name/'public'
        backup.parent.mkdir(mode=0o700)
        shutil.copytree(str(root), str(backup), copy_function=shutil.copy2)
        restored = recovery/name/'restored'
        shutil.copytree(str(backup), str(restored), copy_function=shutil.copy2)
        require(tree(backup) == before == tree(restored) == tree(root), 'File recovery mismatch')
        config = HOME/'.avereo'/(name+'-preprod')/'config.php'
        require(config.resolve() == config and config.is_file(), 'Private config absent or linked')
        private_copy = recovery/name/'private-config.php'
        shutil.copy2(str(config), str(private_copy))
        require(record(config) == record(private_copy), 'Private config recovery mismatch')
        operations = {}
        for rel, data in candidates[name].items():
            path = root/rel
            require(path.parent.resolve() == path.parent and path.parent.is_dir(), 'Candidate parent missing or linked')
            previous = record(path)
            if rel == '.htaccess':
                require(previous['exists'], 'Hosted access policy missing')
                action = 'preserve'
            elif previous['exists'] and previous['sha256_lf'] == digest(data.replace(b'\r\n', b'\n')):
                action = 'preserve'
            else:
                action = 'replace' if previous['exists'] else 'create'
            after = previous if action == 'preserve' else {
                'exists': True, 'sha256': digest(data), 'sha256_lf': digest(data.replace(b'\r\n', b'\n')),
                'mode': previous.get('mode', 0o644), 'bytes': len(data)}
            operations[rel] = {'action': action, 'before': previous, 'after': after}
        plan['applications'][name] = {'root': str(root), 'sourceSha': manifest['applications'][name]['sourceSha'],
            'artifactSha256': manifest['applications'][name]['artifactSha256'], 'before': before,
            'privateConfig': record(config), 'operations': operations,
            'counts': {a: sum(o['action']==a for o in operations.values()) for a in ('preserve','replace','create')},
            'fileRestore': 'passed'}
    command = [PHP, str(work/'backup_selected.php'), str(recovery)]
    output = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    require(output.returncode == 0, 'Data recovery failed: '+output.stderr.decode('utf-8', 'replace')[:180])
    plan['dataRecovery'] = json.loads((recovery/'data-recovery.json').read_text(encoding='utf-8'))
    write_json(work/'plan.json', plan)
    public = {k:v for k,v in plan.items() if k != 'applications'}
    public['applications'] = {name:{k:v for k,v in app.items() if k not in ('before','privateConfig')}
                              for name,app in plan['applications'].items()}
    write_json(work/'preflight-public.json', public)
    return {'status':'prepared', 'operations':{name:app['counts'] for name,app in plan['applications'].items()}}


def verify_preflight(work, plan):
    for name, root in TARGETS.items():
        app = plan['applications'][name]
        require(str(root) == app['root'] and declared_root(name+'-preprod.avereo.fr') == root, 'Target drift')
        require(tree(root) == app['before'], 'Active file drift: '+name)
        require(tree(work/'recovery'/name/'public') == app['before'], 'Backup drift')
        require(record(HOME/'.avereo'/(name+'-preprod')/'config.php') == app['privateConfig'], 'Private config drift')
        for rel, op in app['operations'].items():
            require(record(root/rel) == op['before'], 'Candidate path drift')


def apply(work):
    manifest, candidates = load_candidates(work)
    plan = json.loads((work/'plan.json').read_text(encoding='utf-8'))
    require(not (work/'delivery.json').exists(), 'Delivery already recorded')
    verify_preflight(work, plan)
    for name, app in plan['applications'].items():
        require(app['artifactSha256'] == manifest['applications'][name]['artifactSha256'], 'Plan candidate drift')
    writes = []
    try:
        for name, root in TARGETS.items():
            # New assets and gate are ready before publishing the index.
            for rel, op in sorted(plan['applications'][name]['operations'].items(), key=lambda item:(item[0]=='index.html',item[0])):
                if op['action'] == 'preserve':
                    continue
                require(record(root/rel) == op['before'], 'Concurrent path change')
                atomic_write(root/rel, candidates[name][rel], op['after']['mode'])
                writes.append((name,rel))
                require(record(root/rel) == op['after'], 'Written file mismatch')
        receipt = verify_installed(work, plan)
        receipt.update(status='delivered_verified', observedAt=now(), writes=[{'app':a,'path':p} for a,p in writes])
        write_json(work/'delivery.json', receipt)
        return {'status':receipt['status'], 'writtenFiles':len(writes), 'applications':list(TARGETS)}
    except Exception:
        # Revert only writes whose current bytes still match this delivery.
        for name,rel in reversed(writes):
            root=TARGETS[name]; op=plan['applications'][name]['operations'][rel]
            require(record(root/rel) == op['after'], 'Rollback conflict; manual recovery required')
            if op['before']['exists']:
                atomic_write(root/rel, (work/'recovery'/name/'public'/rel).read_bytes(), op['before']['mode'])
            else:
                (root/rel).unlink()
        require(all(tree(root)==plan['applications'][name]['before'] for name,root in TARGETS.items()), 'Rollback incomplete')
        raise


def verify_installed(work, plan):
    receipt={'applications':{},'productionChanged':False,'privateConfigurationChanged':False,'databaseMigration':False}
    for name,root in TARGETS.items():
        app=plan['applications'][name];expected=dict(app['before'])
        for rel,op in app['operations'].items():
            require(record(root/rel)==op['after'], 'Installed path mismatch')
            expected[rel]=op['after']
        require(tree(root)==expected,'Unlisted active paths changed')
        require(record(HOME/'.avereo'/(name+'-preprod')/'config.php')==app['privateConfig'],'Private config changed')
        receipt['applications'][name]={'root':str(root),'sourceSha':app['sourceSha'],
            'artifactSha256':app['artifactSha256'],'verifiedCandidatePaths':len(app['operations']),
            'operations':app['counts'],'hostedAccessPolicyPreserved':True,'unlistedPathsPreserved':True,
            'publicFiles':expected,'rollbackDirectory':str(work/'recovery'/name/'public')}
    return receipt


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['prepare','apply','verify'])
    parser.add_argument('--work',type=Path,required=True)
    args=parser.parse_args()
    work=args.work
    require(str(work).startswith(str(HOME/'private/preprod-rapport-passeport-')) and work.resolve()==work and work.is_dir(),'Private work folder required')
    os.umask(0o077)
    if args.action=='prepare': result=prepare(work)
    elif args.action=='apply': result=apply(work)
    else:
        plan=json.loads((work/'plan.json').read_text(encoding='utf-8'))
        result=verify_installed(work,plan)
        write_json(work/'verified-public.json',result)
        result={'status':'installed_files_verified'}
    print(json.dumps(result))


if __name__=='__main__':
    main()
