"""Prepare an explicit file-only delivery plan. Never write to a hosted target.

Keep existing access rules and files differing only by CRLF. All other candidate
paths become guarded create/replace operations with an inverse operation. The
original application ZIPs remain unchanged; do not extract them over live roots.
"""
import argparse
import copy
import io
import json
from pathlib import Path, PurePosixPath
import re
from zipfile import ZipFile

from prepare_application_candidates import digest, pack

APPS = ('rapport', 'coupe', 'projet', 'thermo', 'drone')
HOME = '/home/daje3540'


def safe_name(name):
    parts = PurePosixPath(name).parts
    if (not parts or '\\' in name or ':' in name or name.startswith('/')
            or '..' in parts or str(PurePosixPath(name)) != name
            or any(p.startswith('.') and p != '.htaccess' for p in parts)
            or PurePosixPath(name).name == 'config.php'):
        raise ValueError('Chemin candidat interdit : ' + name)
    return name


def read_archive(data):
    with ZipFile(io.BytesIO(data)) as archive:
        result = {}
        total = 0
        for item in archive.infolist():
            name = safe_name(item.filename)
            if item.is_dir() or name in result or (item.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError('Entrée ZIP ambiguë ou lien : ' + name)
            total += item.file_size
            if total > 250 * 1024 * 1024 or len(result) >= 15000:
                raise ValueError('Archive trop volumineuse.')
            result[name] = archive.read(item)
        if not result:
            raise ValueError('Archive vide.')
        return result


def operation(name, content, observed):
    safe_name(name)
    if not observed.get('backup_matches_active'):
        raise ValueError('Sauvegarde non identique : ' + name)
    before = copy.deepcopy(observed['active'])
    if not isinstance(before.get('exists'), bool):
        raise ValueError('Existence avant livraison inconnue : ' + name)
    if before.get('exists'):
        if any(not re.fullmatch('[0-9a-f]{64}', before.get(k, '')) for k in ('sha256', 'sha256_lf')):
            raise ValueError('Empreinte avant livraison absente : ' + name)
        if not isinstance(before.get('mode'), int) or before['mode'] & ~0o777:
            raise ValueError('Mode avant livraison invalide : ' + name)
    candidate_lf = digest(content.replace(b'\r\n', b'\n'))
    if name == '.htaccess':
        if not before.get('exists'):
            raise ValueError('Règle hébergée absente.')
        action, reason = 'preserve', 'hosted_access_rule'
    elif before.get('exists') and before['sha256_lf'] == candidate_lf:
        action, reason = 'preserve', 'same_content_after_lf_normalization'
    else:
        action, reason = ('replace' if before.get('exists') else 'create'), 'candidate_change'
    after = before if action == 'preserve' else {
        'exists': True, 'sha256': digest(content), 'sha256_lf': candidate_lf,
        'bytes': len(content), 'mode': before['mode'] if before.get('exists') else 0o644,
    }
    inverse = {'action': 'none'} if action == 'preserve' else {
        'action': 'restore_backup' if action == 'replace' else 'remove_added_file',
        'require_current': copy.deepcopy(after),
        'restore': copy.deepcopy(before),
    }
    return {'action': action, 'reason': reason, 'before': before,
            'after': copy.deepcopy(after), 'rollback': inverse}


def prepare(original, metadata):
    files = read_archive(original)
    plan = json.loads(files.pop('plan-livraison-recette.json'))
    if tuple(a['app'] for a in plan['applications']) != APPS:
        raise ValueError('Le lot doit contenir les cinq applications qualifiées.')
    if not re.fullmatch('[0-9a-f]{40}', plan['source_sha']):
        raise ValueError('Référence source invalide.')
    if metadata.get('active_files_modified') is not False or not metadata.get('observed_at'):
        raise ValueError('Reçu en lecture seule absent.')
    hosted = {a['app']: a for a in metadata['applications']}
    if len(metadata['applications']) != len(APPS) or set(hosted) != set(APPS) or set(files) != {a + '.zip' for a in APPS}:
        raise ValueError('Périmètre de lot divergent.')
    recovery = plan['recovery_directory']
    if not recovery.startswith(HOME + '/private/preprod-alignment/recovery-') or '/..' in recovery:
        raise ValueError('Dossier privé de récupération invalide.')
    for app in plan['applications']:
        name = app['app']
        domain = name + '-preprod.avereo.fr'
        root = HOME + '/' + domain
        backup = recovery + '/' + name + '/backup'
        observed = hosted[name]
        if (app['domain'] != domain or app['document_root'] != root
                or observed['root'] != root or app['backup'] != backup or observed['backup'] != backup):
            raise ValueError('Cible ou sauvegarde divergente : ' + name)
        data = files[name + '.zip']
        if digest(data) != app['artifact_sha256']:
            raise ValueError('Archive différente du candidat : ' + name)
        candidate = read_archive(data)
        if set(candidate) != set(observed['files']):
            raise ValueError('Inventaire incomplet des chemins : ' + name)
        app['operations'] = {path: operation(path, content, observed['files'][path])
                             for path, content in sorted(candidate.items())}
        access = app['operations']['.htaccess']['before']
        if access['sha256'] != app['hosted_htaccess_sha256']:
            raise ValueError('Règle active différente du reçu : ' + name)
        app['preserve_hosted_htaccess'] = True
        app.pop('new_htaccess_sha256', None)
        app['access_overlay'] = 'Preserve the exact hosted root .htaccess bytes and mode; Coupe keeps its Drupal OAuth callback route.'
        app['promoted_files'] = {
            path: {'sha256': op['after']['sha256'], 'sha256_lf': op['after']['sha256_lf'],
                   'mode': op['after']['mode'],
                   'source': 'existing_hosted_file' if op['action'] == 'preserve' else 'verified_candidate_archive'}
            for path, op in app['operations'].items()
        }
        app['promoted_manifest_sha256'] = digest(json.dumps(app['promoted_files'], sort_keys=True).encode())
        app['operation_counts'] = {action: sum(op['action'] == action for op in app['operations'].values())
                                   for action in ('preserve', 'replace', 'create')}
    plan.update(host_metadata_observed_at=metadata['observed_at'],
                supersedes_batch_sha256=digest(original), deployment_performed=False,
                production_modified=False, includes_sql_migration=False,
                changes_private_configuration=False, changes_habilitations=False,
                requires_preproduction_approval=True)
    plan['delivery_method'] = {
        'write_only_explicit_create_replace_paths': True,
        'require_all_before_hashes_modes_and_missing_paths_before_first_write': True,
        'preserve_paths_not_listed_in_operations': True,
        'preserve_old_assets_and_private_configuration': True,
        'existing_file_modes_retained': True, 'new_file_mode': 0o644,
        'atomic_per_file_replacement': True, 'atomic_across_applications': False,
        'no_recursive_delete_or_bulk_unzip_into_live_root': True,
    }
    plan['rollback_method'] = {
        'restore_replaced_files_and_original_modes_from_verified_backup': True,
        'remove_only_added_files_matching_expected_deployed_hash_and_mode': True,
        'preflight_all_rollback_paths_before_first_write': True,
        'refuse_divergent_file_instead_of_overwriting_it': True,
        'remove_created_directories_only_if_empty': True,
        'preserve_data_private_configuration_and_unlisted_paths': True,
        'scope': 'files_and_modes_only_no_database_recovery',
        'active_deployment_rollback_performed': False,
    }
    plan['recipe'][-1] = ('Coupe: preserve Drupal OAuth callback query forwarding to the gated legacy app; '
                         'anonymous legacy-app.html must redirect/refuse. Do not activate the absent database or change auth_mode.')
    plan['recipe'].append('Do not call a schema-creating health endpoint; verify new synthetic Rapport drafts, save/reopen/export and legacy imports without changing customer reports.')
    files['plan-livraison-recette.json'] = (json.dumps(plan, ensure_ascii=False, indent=2) + '\n').encode()
    return plan, files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--original-batch', type=Path, required=True)
    parser.add_argument('--host-metadata', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    plan, files = prepare(args.original_batch.read_bytes(), json.loads(args.host_metadata.read_text('utf-8')))
    args.output.mkdir(parents=True, exist_ok=True)
    archive = args.output / 'lot-recette-cinq-applications.zip'
    pack(archive, files)
    (args.output / 'plan-livraison-recette.json').write_bytes(files['plan-livraison-recette.json'])
    print(json.dumps({'archive': str(archive), 'sha256': digest(archive.read_bytes()),
                      'applications': {a['app']: a['operation_counts'] for a in plan['applications']},
                      'hosted_writes': False}))


if __name__ == '__main__':
    main()
