"""Inventaire public autorisé pour le candidat Passeport Immo."""
from pathlib import PurePosixPath

GATE_FILES = {'.htaccess', 'index.php', 'connect/entry.php', 'connect/logout.php', 'connect/gate.php'}
STORAGE_FILES = {'connect/session.php', 'api/index.php', 'api/storage.php', '.user.ini'}


def valid_name(name):
    if not isinstance(name, str) or not name:
        return False
    path = PurePosixPath(name)
    return (not path.is_absolute() and '\\' not in name and ':' not in name
            and name == path.as_posix() and not any(part in ('.', '..') for part in path.parts)
            and (name in {'.htaccess', '.user.ini'} or not any(part.startswith('.') for part in path.parts))
            and (name == 'index.html' or name in GATE_FILES or name in STORAGE_FILES
                 or len(path.parts) > 1 and path.parts[0] == 'assets'
                 and path.suffix.lower() not in {'.php', '.phtml', '.phar', '.ini'}))
