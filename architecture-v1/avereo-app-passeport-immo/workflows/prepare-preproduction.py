"""Prépare localement une archive fermée du candidat identifié ; aucun accès distant."""
import argparse
import hashlib
import json
import re
import tempfile
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZipInfo, ZIP_STORED

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = Path(__file__).with_name('preproduction.htaccess')


def sha256(content):
    return hashlib.sha256(content).hexdigest()


def valid_name(name):
    if not isinstance(name, str):
        return False
    path = PurePosixPath(name)
    return (isinstance(name, str) and bool(name) and not path.is_absolute()
            and '\\' not in name and ':' not in name and name == path.as_posix()
            and not any(part in ('.', '..') or part.startswith('.') for part in path.parts)
            and (name == 'index.html' or len(path.parts) > 1 and path.parts[0] == 'assets'))


def candidate_files(archive_path, manifest_path, candidate):
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if not re.fullmatch(r'[0-9a-f]{40}', str(candidate.get('sourceSha', ''))):
        raise ValueError('SHA source du candidat absent ou invalide.')
    if not re.fullmatch(r'[0-9a-f]{64}', str(candidate.get('artifactSha256', ''))):
        raise ValueError('Empreinte du candidat absente ou invalide.')
    if manifest.get('sourceSha') != candidate['sourceSha']:
        raise ValueError('Le manifeste désigne une autre source.')
    if sha256(archive_path.read_bytes()) != candidate['artifactSha256'] or manifest.get('artifactSha256') != candidate['artifactSha256']:
        raise ValueError('Archive différente du candidat identifié.')
    expected = manifest.get('files', [])
    if not isinstance(expected, list) or not expected:
        raise ValueError('Inventaire du manifeste absent.')
    names = [item.get('path') for item in expected]
    if not all(isinstance(name, str) and valid_name(name) for name in names) or len(set(names)) != len(names) or 'index.html' not in names:
        raise ValueError('Inventaire invalide ou chemin hors des assets.')
    with ZipFile(archive_path) as archive:
        if sorted(archive.namelist()) != sorted(names) or archive.testzip() is not None:
            raise ValueError('Contenu ZIP différent du manifeste.')
        result = {}
        for item in expected:
            info = archive.getinfo(item['path'])
            if info.is_dir() or (info.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError('Dossier ou lien symbolique dans le candidat.')
            content = archive.read(info)
            if sha256(content) != item.get('sha256') or len(content) != item.get('size'):
                raise ValueError('Asset modifié : '+item['path'])
            result[item['path']] = content
    return result


def write_bundle(path, files):
    with ZipFile(path, 'w', compression=ZIP_STORED) as archive:
        for name, content in sorted(files.items()):
            info = ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, content)


def rehearse_restore(files, parent):
    # Seul ce répertoire temporaire créé par le script sera nettoyé.
    with tempfile.TemporaryDirectory(prefix='restore-', dir=parent) as temporary:
        folder = Path(temporary).resolve()
        if not folder.is_relative_to(parent.resolve()):
            raise ValueError('Répertoire de répétition hors de la destination locale.')
        for name, content in files.items():
            target = folder/name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
        (folder/'index.html').write_bytes(b'Incident local fictif')
        if (folder/'index.html').read_bytes() == files['index.html']:
            raise ValueError('La simulation ne modifie pas le fichier.')
        for name, content in files.items():
            (folder/name).write_bytes(content)
        if any(sha256((folder/name).read_bytes()) != sha256(content) for name, content in files.items()):
            raise ValueError('Restauration locale non conforme.')


def prepare(archive, manifest, candidate, output):
    files = candidate_files(archive, manifest, candidate)
    protection = TEMPLATE.read_text(encoding='utf-8').encode('utf-8')
    if 'Require all denied' not in protection.decode('utf-8').splitlines():
        raise ValueError('Protection initiale absente.')
    files['.htaccess'] = protection
    output.mkdir(parents=True, exist_ok=True)
    bundle = output/'preproduction.zip'
    write_bundle(bundle, files)
    with ZipFile(bundle) as packed:
        if packed.testzip() is not None or packed.namelist() != sorted(files):
            raise ValueError('Archive de préproduction non conforme.')
        for name, content in files.items():
            if packed.read(name) != content:
                raise ValueError('Fichier modifié dans le lot de livraison.')
        restored_files = {name:packed.read(name) for name in packed.namelist()}
    rehearse_restore(restored_files, output)
    proof = {
        'candidateSourceSha':candidate['sourceSha'],
        'candidateArtifactSha256':candidate['artifactSha256'],
        'bundleSha256':sha256(bundle.read_bytes()),
        'files':[{'path':name,'sha256':sha256(content),'size':len(content)} for name, content in sorted(files.items())],
        'candidateAssetsUnchanged':True,
        'initialAccess':'deny_all_configuration_requires_hosted_verification',
        'archiveReadback':'passed',
        'restoreRehearsal':'passed_local_files_only',
        'hostedBackupRestore':'not_verified',
        'remoteDelivery':'not_performed'
    }
    (output/'preproduction.manifest.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return proof


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidate', type=Path, default=ROOT/'.local/candidate.zip')
    parser.add_argument('--manifest', type=Path, default=ROOT/'.local/candidate.manifest.json')
    args = parser.parse_args()
    state = json.loads((ROOT/'docs/suivi-chantier.json').read_text(encoding='utf-8'))
    output = ROOT/'.local/preproduction-preparation/release'
    proof = prepare(args.candidate, args.manifest, state['developmentWorkflow']['candidate'], output)
    print(json.dumps({key:value for key,value in proof.items() if key != 'files'},ensure_ascii=False))


if __name__ == '__main__':
    main()
