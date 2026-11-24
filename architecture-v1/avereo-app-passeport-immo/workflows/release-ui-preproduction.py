"""Promote the frozen PR191 UI to Passeport Immo preproduction only."""
import argparse
import importlib.util
from pathlib import Path
import json

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('ui_release_base', HERE / 'release-archives-preproduction.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
release.ARTIFACT = '967407e1b86e346907ae997363b438809c8aae3f76321fe86413fe75f22771f9'
release.COMPANION_BASELINES = {}
release.allowed_write = lambda name: name == 'index.html' or name.startswith('assets/')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'apply', 'verify'])
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--authorized-artifact')
    args = parser.parse_args()
    work = args.work
    release.engine.require(work.parent == release.engine.HOME / 'private'
        and work.name.startswith('preprod-rapport-passeport-archives-ux-ui-')
        and work.resolve() == work and work.is_dir(), 'Dedicated private UI staging required')
    if args.action == 'apply':
        release.engine.require(args.authorized_artifact == release.ARTIFACT, 'Exact authorized PR191 artifact required')
    release.engine.os.umask(0o077)
    print(json.dumps(release.perform(args.action, work)))


if __name__ == '__main__':
    main()
