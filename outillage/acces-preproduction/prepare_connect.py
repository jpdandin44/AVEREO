"""Prepare a private CONNECT candidate and verify its backup; never deploy."""
import hashlib
import json
from pathlib import Path
import re
import shutil
from datetime import datetime, timezone

TARGET = Path('/home/daje3540/connect-preprod.avereo.fr/public/.htaccess')
ACCOUNTS = Path('/home/daje3540/.htpasswds/preprod.avereo.fr/passwd')
PRIVATE = Path('/home/daje3540/private/preprod-access')
MARKER = '# AVEREO CONNECT PREPROD IP ALLOWLIST - 2026-07-30'


def compose(source, account_file):
    block = re.compile(re.escape(MARKER) + r'\n<IfModule mod_authz_core\.c>\n'
        r'[ \t]+Require ip (?P<ips>127\.0\.0\.1 ::1 [0-9.]+)\n</IfModule>\n'
        r'<IfModule !mod_authz_core\.c>\n[ \t]+Order Deny,Allow\n'
        r'[ \t]+Deny from all\n[ \t]+Allow from (?P=ips)\n</IfModule>')
    matches = list(block.finditer(source))
    if len(matches) != 1 or 'BEGIN AVEREO PREPROD BASIC AUTH' in source:
        raise ValueError('Le bloc IP observé a changé ; aucune préparation automatique.')
    if not str(account_file).startswith('/home/daje3540/.htpasswds/') or '\n' in str(account_file):
        raise ValueError('Fichier de comptes hors du chemin privé autorisé.')
    auth = '\n'.join([
        '# BEGIN AVEREO PREPROD BASIC AUTH',
        '# HTTP est refusé avant la demande de mot de passe.',
        'SSLRequireSSL',
        'AuthType Basic',
        'AuthName "AVEREO Preproduction"',
        'AuthBasicProvider file',
        f'AuthUserFile "{account_file}"',
        'Require valid-user',
        'ErrorDocument 401 default',
        'ErrorDocument 403 default',
        '# END AVEREO PREPROD BASIC AUTH',
    ])
    match = matches[0]
    return source[:match.start()] + auth + source[match.end():]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    for path in (TARGET, ACCOUNTS, PRIVATE.parent):
        if path.resolve() != path or path.is_symlink():
            raise ValueError('Chemin réel différent du chemin qualifié.')
    if not TARGET.is_file() or not ACCOUNTS.is_file() or not ACCOUNTS.stat().st_size:
        raise ValueError('Configuration ou fichier de comptes absent.')
    original = TARGET.read_bytes()
    candidate = compose(original.decode('utf-8'), ACCOUNTS).encode('utf-8')
    # A fresh, private folder; no target, account, or production file is written.
    PRIVATE.mkdir(exist_ok=True, mode=0o700)
    if PRIVATE.resolve() != PRIVATE or PRIVATE.stat().st_mode & 0o077:
        raise ValueError('Le dossier de sauvegarde doit être privé et sans lien.')
    folder = PRIVATE / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    folder.mkdir(mode=0o700)
    for filename, data in [('original.htaccess', original), ('candidate.htaccess', candidate)]:
        path = folder / filename
        with path.open('xb') as output:
            output.write(data)
        path.chmod(0o600)
    restore = folder / 'restore-check.htaccess'
    shutil.copyfile(folder / 'original.htaccess', restore)
    restore.chmod(0o600)
    if restore.read_bytes() != original or TARGET.read_bytes() != original:
        raise ValueError('Copie de restauration invalide ou cible modifiée en parallèle.')
    receipt = {'target': str(TARGET), 'backup_directory': str(folder),
        'original_sha256': sha(original), 'candidate_sha256': sha(candidate),
        'original_mode': oct(TARGET.stat().st_mode & 0o777),
        'restore_copy_verified': True, 'public_target_written': False,
        'account_file_written': False, 'production_written': False,
        'account_file': str(ACCOUNTS), 'prepared_at': datetime.now(timezone.utc).isoformat()}
    (folder / 'receipt.json').write_text(json.dumps(receipt, indent=2)+'\n')
    (folder / 'receipt.json').chmod(0o600)
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
