"""Package the merged CONNECT sources and the activation SQL; never deploy."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess

from prepare_application_candidates import pack

APP = 'architecture-v1/avereo-app-connect/'
ACTIVATION = '20260804140000_account_activation_status'
LEGACY = ['20260721120000_core', '20260729120000_pending_identities',
          '20260730120000_catalog_metadata', '20260803160000_user_application_access']


def prepare_bridge(source, source_sha, output):
    prefix = APP + 'integrations/drupal/avereo_identity_bridge/'
    paths = subprocess.check_output(['git', '-C', str(source), 'ls-tree', '-r', '-z', source_sha, '--', prefix])
    files = {}
    for entry in paths.split(b'\0'):
        if not entry:
            continue
        metadata, raw_path = entry.split(b'\t', 1)
        if not metadata.startswith(b'100644 blob '):
            raise ValueError('Type de fichier du pont non livrable.')
        name = raw_path.decode('utf-8')[len(prefix):]
        if name.startswith('tests/'):
            continue
        if any(part.startswith('.') for part in Path(name).parts) or name.endswith(('.log', '.zip')) or name == 'config.php':
            raise ValueError('Fichier prive dans le pont.')
        files[name] = subprocess.check_output(['git', '-C', str(source), 'show', source_sha + ':' + raw_path.decode()])
    if not {'avereo_identity_bridge.module', 'avereo_identity_bridge.routing.yml',
            'src/Controller/AccountActivationController.php', 'src/Form/ActivationPasswordForm.php'}.issubset(files):
        raise ValueError('Pont d’activation incomplet.')
    archive = output / 'identity-bridge.zip'
    pack(archive, files)
    proof = {'source_sha': source_sha, 'artifact_sha256': digest(archive.read_bytes()),
             'archive': archive.name, 'target': 'auth-next-preprod.avereo.fr',
             'module_directory': '/home/daje3540/auth-next-preprod.avereo.fr/modules/custom/avereo_identity_bridge',
             'files': {name: {'sha256': digest(data), 'bytes': len(data)} for name, data in sorted(files.items())},
             'private_settings_preserved': True, 'new_secret_created': False, 'remote_writes': False,
             'required_before_delivery': ['provider_recovery_qualified', 'activation_configuration_qualified',
                                         'exact_human_provider_approval', 'test_mail_transport_selected']}
    (output / 'identity-bridge.manifest.json').write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return proof


def digest(data):
    return hashlib.sha256(data).hexdigest()


def prepare(source, source_sha, output):
    if not re.fullmatch(r'[0-9a-f]{40}', source_sha):
        raise ValueError('SHA Git complet requis.')
    actual = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'origin/main'], text=True).strip()
    if source_sha != actual:
        raise ValueError('Le candidat doit correspondre à main observée.')
    paths = subprocess.check_output(['git', '-C', str(source), 'ls-tree', '-r', '-z',
                                    source_sha, '--', APP + 'backend/public', APP + 'backend/src',
                                    APP + 'backend/bin', APP + 'database'])
    files = {}
    for entry in paths.split(b'\0'):
        if not entry:
            continue
        metadata, raw_path = entry.split(b'\t', 1)
        if not metadata.startswith(b'100644 blob '):
            raise ValueError('Type de fichier non livrable.')
        name = raw_path.decode('utf-8')[len(APP):]
        if name.startswith('backend/'):
            name = name[len('backend/'):]
        if Path(name).name == '.gitkeep':
            continue
        if any(part.startswith('.') and part != '.htaccess' for part in Path(name).parts):
            raise ValueError('Fichier privé dans le candidat.')
        if name.endswith(('.log', '.zip')) or name.endswith('/config.php'):
            raise ValueError('Fichier non livrable.')
        files[name] = subprocess.check_output(['git', '-C', str(source), 'show', source_sha + ':' + raw_path.decode()])
    required = {'public/index.php', 'public/index.html', 'bin/migrate.php',
                'database/migrations/' + ACTIVATION + '.up.sql',
                'database/migrations/' + ACTIVATION + '.down.sql'}
    if not required.issubset(files):
        raise ValueError('Portail, runner ou migration absent.')
    up = files['database/migrations/' + ACTIVATION + '.up.sql']
    if not all(item in up for item in (b'onboarding_status', b'activation_email_sent_at', b"DEFAULT 'completed'")):
        raise ValueError('Contrat de migration inattendu.')
    output.mkdir(parents=True, exist_ok=True)
    archive = output / 'connect.zip'
    pack(archive, files)
    proof = {
        'source_sha': source_sha, 'artifact_sha256': digest(archive.read_bytes()),
        'prepared_at': datetime.now(timezone.utc).isoformat(), 'archive': 'connect.zip',
        'target': 'https://connect-preprod.avereo.fr',
        'application_root': '/home/daje3540/connect-preprod.avereo.fr',
        'document_root': '/home/daje3540/connect-preprod.avereo.fr/public',
        'private_configuration': '/home/daje3540/private/connect-preprod/config.php',
        'preserve_hosted_paths': ['public/.htaccess'],
        'preserve_private_configuration': True,
        'files': {name: {'sha256': digest(data), 'bytes': len(data)} for name, data in sorted(files.items())},
        'migration': {'version': ACTIVATION, 'up_sha256': digest(up),
                      'expected_before_versions': LEGACY, 'expected_after_versions': LEGACY + [ACTIVATION],
                      'existing_users_default': 'completed', 'automatic_down': False},
        'required_before_delivery': ['fresh_host_inventory', 'dedicated_database_verified',
                                    'private_database_dump', 'restore_on_separate_empty_test_database',
                                    'activation_bridge_qualified', 'exact_human_preproduction_approval'],
        'remote_writes': False, 'migration_executed_on_host': False,
        'passport_integration_included': False, 'deployment_authorized': False,
    }
    (output / 'connect.manifest.json').write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return proof


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--expected-sha', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = prepare(args.source.resolve(), args.expected_sha, args.output.resolve())
    print(json.dumps({k: v for k, v in result.items() if k != 'files'}, ensure_ascii=False))
    bridge = prepare_bridge(args.source.resolve(), args.expected_sha, args.output.resolve())
    print(json.dumps({k: v for k, v in bridge.items() if k != 'files'}, ensure_ascii=False))
