"""Promote the frozen PR146 500 MiB candidate to private preproduction only."""
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('archives_delivery', HERE / 'release-archives-preproduction.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
release.ARTIFACT = '5f096131d1181389e50a69b59802d3d33f3dda0cefb4db17307cde951b4e0a13'
# The earlier companion upgrade is historical; this lot cannot change authentication.
release.COMPANION_BASELINES = {}
LIMIT_BASELINES = {
    '.user.ini': '9140d459d58a6abd46a4b08fb49a1df84ace9ec7617b901034446997c9fb8b96',
    'api/index.php': '2430a150dc423f7b42e17eb6434ab067f3c2c18a0f2ee5dacf4e67c28883470d',
}
previous_validate = release.validate_scope


def validate_scope(work, plan=None):
    # Permit only the two observed limit files in addition to the existing import scope.
    if plan is not None:
        for name, operation in plan['applications']['passeport-immo']['operations'].items():
            if name in LIMIT_BASELINES and operation['action'] != 'preserve':
                release.engine.require(operation.get('before', {}).get('sha256_lf') == LIMIT_BASELINES[name],
                                       'Upload limit baseline differs: ' + name)
    return previous_validate(work, plan)


previous_allowed = release.allowed_write
release.allowed_write = lambda name: name in LIMIT_BASELINES or previous_allowed(name)
release.validate_scope = validate_scope

if __name__ == '__main__':
    release.main()
