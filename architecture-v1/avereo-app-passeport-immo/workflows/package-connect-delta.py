"""Prépare deux fichiers runtime CONNECT avec préconditions d'empreinte, sans accès distant."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_STORED

APP = Path(__file__).resolve().parents[1]
REPO = APP.parents[1]
CONNECT = 'architecture-v1/avereo-app-connect/backend/'
FILES = ['public/index.php', 'src/Config.php']


def git(*arguments):
    return subprocess.check_output(['git', *arguments], cwd=REPO)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-sha', required=True)
    parser.add_argument('--output', type=Path, default=APP/'.local/connect-preparation')
    args = parser.parse_args()
    source = git('rev-parse', 'HEAD').decode().strip()
    base = git('rev-parse', args.base_sha+'^{commit}').decode().strip()
    if len(args.base_sha) != 40 or base != args.base_sha:
        raise ValueError('Fournir le SHA complet de la base relue.')
    if git('status', '--porcelain', '--', *[CONNECT+name for name in FILES]).strip():
        raise ValueError('Commiter les deux fichiers runtime avant emballage.')
    args.output.mkdir(parents=True, exist_ok=True)
    archive = args.output/'runtime-connect.zip'
    files = []
    with ZipFile(archive, 'w', compression=ZIP_STORED) as packed:
        for name in sorted(FILES):
            before = git('show', base+':'+CONNECT+name)
            content = git('show', source+':'+CONNECT+name)
            entry = ZipInfo(name, (1980,1,1,0,0,0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            packed.writestr(entry, content)
            files.append({'path':name,'expectedBeforeSha256':hashlib.sha256(before).hexdigest(),
                'sha256':hashlib.sha256(content).hexdigest(),'size':len(content)})
    with ZipFile(archive) as packed:
        assert packed.testzip() is None and packed.namelist() == sorted(FILES)
        for item in files:
            assert hashlib.sha256(packed.read(item['path'])).hexdigest() == item['sha256']
    manifest = {'sourceSha':source,'baseSha':base,'artifactSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),
        'files':files,'configurationIncluded':False,'databaseMigrationIncluded':False,
        'deploymentAllowed':False,'precondition':'Refuser si un fichier hébergé diffère de expectedBeforeSha256.'}
    (args.output/'runtime-connect.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in manifest.items() if k!='files'},ensure_ascii=False))


if __name__ == '__main__':
    main()
