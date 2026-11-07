"""Install the authorized PR122 RGA file, preserving the full PR121 baseline.

Uses the already qualified private PR121 helpers. No configuration, account,
project or production writes; the prepared correction archive is never rebuilt.
"""
import argparse
import copy
import json
import os
from pathlib import Path
import sys
import zipfile

BASE = Path('/home/daje3540/private/mon-espace-preprod-317863a-20261106')
RUN = BASE / 'correction-pr122'
TARGET = Path('/home/daje3540/rapport-preprod.avereo.fr/rga/workspace.js')
SOURCE = '40daa7f684d0ecc40c15741f35b455a6a198aa55'
MERGE = '4f61b77c320716f4966d12d041034356e9ae9c42'
PAYLOAD = '0371e53552e7767d6ead4d2d9c233a9f68934eb8cc8e34dea12cdbe833762994'
BEFORE = '153f2ca36a11d251db01eeb7d639355454e45b8e90a0b42572c852984f5bc682'
AFTER = '6fc8ab86f593d1390bb1e3cdcb44338e6c44ab177ed465649e97ad1b447ab089'
sys.path.insert(0, str(BASE))
from deploy_shared_menu import load, verify_state
from release_selected_preprod import atomic_write, digest, now, record, require, write_json


def candidate():
    require(BASE.resolve() == BASE and RUN.resolve() == RUN and RUN.is_dir(), 'Private workspace differs')
    require(TARGET.resolve() == TARGET, 'Target path differs')
    archive = RUN / 'correction-rga.zip'
    require(digest(archive.read_bytes()) == PAYLOAD, 'Correction archive differs')
    with zipfile.ZipFile(archive) as package:
        require(package.namelist() == ['rga/workspace.js'], 'One RGA file expected')
        content = package.read('rga/workspace.js')
    require(digest(content) == AFTER, 'Corrected source differs')
    selection, _ = load(BASE)
    plan = json.loads((BASE / 'deployment/plan-private.json').read_text())
    previous = selection['applications']['rapport']['operations']['rga/workspace.js']['after']
    require(previous['sha256'] == BEFORE, 'PR121 baseline differs')
    corrected = copy.deepcopy(selection)
    corrected['applications']['rapport']['operations']['rga/workspace.js']['after'] = {
        'exists': True, 'sha256': AFTER, 'sha256_lf': AFTER,
        'bytes': len(content), 'mode': previous['mode'],
    }
    return content, selection, corrected, plan, previous


def receipt(status, plan):
    return {'observedAt': now(), 'status': status, 'sourceSha': SOURCE, 'mergeSha': MERGE,
            'artifactSha256': PAYLOAD, 'target': str(TARGET), 'fileCount': 1,
            'beforeSha256': BEFORE, 'afterSha256': AFTER,
            'otherPublicFilesPreserved': True, 'privateConfigurationsPreserved': 7,
            'planningFilesPreserved': len(plan['planning']), 'installedPr118Preserved': True,
            'databaseAccessed': False, 'productionChanged': False,
            'backup': str(RUN / 'recovery/workspace.js')}


def prepare():
    content, selection, _, plan, previous = candidate()
    verify_state(selection, plan, after=True)
    require(not (RUN / 'preflight.json').exists(), 'Preserve previous preflight')
    recovery = RUN / 'recovery'; recovery.mkdir(mode=0o700)
    original = TARGET.read_bytes()
    backup = recovery / 'workspace.js'; backup.write_bytes(original); backup.chmod(0o600)
    require(digest(backup.read_bytes()) == BEFORE, 'Backup differs')
    rehearsal = recovery / 'rehearsal.js'
    atomic_write(rehearsal, original, previous['mode'])
    atomic_write(rehearsal, content, previous['mode'])
    require(record(rehearsal)['sha256'] == AFTER, 'Copy installation failed')
    atomic_write(rehearsal, backup.read_bytes(), previous['mode'])
    require(record(rehearsal) == previous, 'Copy restoration failed')
    verify_state(selection, plan, after=True)
    result = receipt('prepared_not_deployed', plan)
    result.update({'liveFilesModified': False, 'backupAndRestoreOnCopy': 'passed'})
    write_json(RUN / 'preflight.json', result)
    return result


def apply(authorized):
    require(authorized == PAYLOAD, 'Exact authorized artifact required')
    content, selection, corrected, plan, previous = candidate()
    preflight = json.loads((RUN / 'preflight.json').read_text())
    require(preflight['artifactSha256'] == PAYLOAD and preflight['backupAndRestoreOnCopy'] == 'passed', 'Recovery not qualified')
    require(not (RUN / 'delivery.json').exists(), 'Preserve delivery evidence')
    verify_state(selection, plan, after=True)
    backup = (RUN / 'recovery/workspace.js').read_bytes()
    require(digest(backup) == BEFORE and record(TARGET) == previous, 'Before-image changed')
    try:
        atomic_write(TARGET, content, previous['mode'])
        verify_state(corrected, plan, after=True)
    except Exception:
        if record(TARGET)['sha256'] == AFTER:
            atomic_write(TARGET, backup, previous['mode'])
        verify_state(selection, plan, after=True)
        raise
    result = receipt('delivered_verified', plan)
    result['liveFilesModified'] = True
    write_json(RUN / 'delivery.json', result)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'apply', 'verify'])
    parser.add_argument('--authorized-artifact')
    args = parser.parse_args(); os.umask(0o077)
    if args.action == 'prepare': result = prepare()
    elif args.action == 'apply': result = apply(args.authorized_artifact)
    else:
        require((RUN / 'delivery.json').is_file(), 'Delivery receipt absent')
        _, _, corrected, plan, _ = candidate()
        verify_state(corrected, plan, after=True)
        result = receipt('installed_verified', plan)
        write_json(RUN / 'verification-finale.json', result)
    print(json.dumps(result))
