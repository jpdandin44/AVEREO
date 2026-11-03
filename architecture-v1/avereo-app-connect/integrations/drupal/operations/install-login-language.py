"""Private staging only. Explicit check/backup/install/rollback; Python 3.6+."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import zipfile

if sys.flags.optimize:
    raise RuntimeError("Run without Python optimization: verification assertions are required")

parser = argparse.ArgumentParser()
parser.add_argument("--archive", required=True)
parser.add_argument("--archive-sha256", required=True)
parser.add_argument("--action", choices=["check", "backup", "install", "rollback"], default="check")
args = parser.parse_args()
archive = Path(args.archive).resolve()
stage = archive.parent
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert digest(archive) == args.archive_sha256, "Archive differs from approved artifact"
with zipfile.ZipFile(str(archive)) as package:
    manifest = json.loads(package.read("manifest.json").decode("utf-8"))
    assert digest(Path(__file__).resolve()) == manifest["installerSha256"], "Installer differs from candidate"
    root = Path(manifest["drupalRoot"])
    assert manifest["environment"] == "preproduction"
    assert root.is_dir() and root.resolve() == root and root.name.endswith("-preprod.avereo.fr")
    assert stage != root and not str(stage).startswith(str(root) + os.sep), "Staging must stay private"
    module = root / "modules/custom/avereo_identity_bridge"
    assert module.resolve() == module and module.is_dir()
    allowed = {"avereo_identity_bridge.module", "src/Controller/AccountProvisioningController.php", "src/Authentication/LoginIdentifierResolver.php"}
    files = manifest["files"]
    assert len(files) == 3 and {f["path"] for f in files} == allowed
    for entry in files:
        rel = entry["path"]
        data = package.read("module/" + rel)
        assert hashlib.sha256(data).hexdigest() == entry["sha256"]
        path = stage / "candidate" / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        subprocess.run(["php", "-l", str(path)], check=True, stdout=subprocess.DEVNULL)
    operation = package.read("operations/reconcile-login.php")
    assert hashlib.sha256(operation).hexdigest() == manifest["operationSha256"]
    operation_path = stage / "reconcile-login.php"
    operation_path.write_bytes(operation)
    os.chmod(str(operation_path), 0o600)

for entry in files:
    target = module / entry["path"]
    assert not target.is_symlink()
    for parent in target.parents:
        if parent == root:
            break
        if parent.exists():
            assert not parent.is_symlink()

backup_file = stage / "backup-receipt.json"
installation_file = stage / "installation-receipt.json"
new_dir = module / "src/Authentication"

def baseline_matches(entry):
    target = module / entry["path"]
    return digest(target) == entry["baselineSha256"] if entry["baselineSha256"] else not target.exists()

def cache_rebuild():
    subprocess.run(["bash", "vendor/bin/drush", "--uri=" + manifest["drupalUri"], "cache:rebuild"], cwd=str(root), check=True)

def atomic(data, target, mode):
    parent_mode = stat.S_IMODE(target.parent.stat().st_mode)
    temp = target.with_name(target.name + ".login-language.tmp")
    assert not temp.exists()
    try:
        os.chmod(str(target.parent), parent_mode | 0o700)
        temp.write_bytes(data)
        os.chmod(str(temp), mode)
        os.replace(str(temp), str(target))
    finally:
        os.chmod(str(target.parent), parent_mode)

def remove_entry(target, directory=False):
    parent_mode = stat.S_IMODE(target.parent.stat().st_mode)
    try:
        os.chmod(str(target.parent), parent_mode | 0o700)
        target.rmdir() if directory else target.unlink()
    finally:
        os.chmod(str(target.parent), parent_mode)

if args.action in ["check", "backup"]:
    assert not installation_file.exists(), "Already installed; inspect receipt"
    assert all(baseline_matches(f) for f in files), "Fresh baseline differs"
    if args.action == "backup":
        assert not backup_file.exists(), "Backup already exists; do not overwrite"
        saved = []
        for entry in files:
            target = module / entry["path"]
            row = {"path": entry["path"], "existed": target.exists()}
            if target.exists():
                before = stage / "before" / entry["path"]
                copy = stage / "restore-copy" / entry["path"]
                before.parent.mkdir(parents=True, exist_ok=True)
                copy.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(str(target), str(before))
                shutil.copy2(str(before), str(copy))
                mode = stat.S_IMODE(target.stat().st_mode)
                assert digest(copy) == digest(target) and stat.S_IMODE(copy.stat().st_mode) == mode
                row.update({"sha256": digest(target), "mode": mode})
            saved.append(row)
        backup_file.write_text(json.dumps({"sourceCommit": manifest["sourceCommit"], "artifactSha256": args.archive_sha256, "files": saved, "newDirectoryExisted": new_dir.exists(), "restoration": "passed_private_copy_bytes_and_modes"}, indent=2) + "\n")
        os.chmod(str(backup_file), 0o600)
    print(json.dumps({"action": args.action, "baselineMatched": True, "applicationChanged": False, "backupAndRestore": args.action == "backup"}))
elif args.action == "install":
    saved = json.loads(backup_file.read_text())
    assert saved["artifactSha256"] == args.archive_sha256 and saved["restoration"] == "passed_private_copy_bytes_and_modes"
    assert not installation_file.exists() and all(baseline_matches(f) for f in files)
    for row in saved["files"]:
        if row["existed"]:
            assert digest(stage / "before" / row["path"]) == row["sha256"]
    if not new_dir.exists():
        parent_mode = stat.S_IMODE(new_dir.parent.stat().st_mode)
        try:
            os.chmod(str(new_dir.parent), parent_mode | 0o700)
            new_dir.mkdir(mode=0o755)
        finally:
            os.chmod(str(new_dir.parent), parent_mode)
    changed = []
    try:
        for entry in sorted(files, key=lambda f: 0 if f["baselineSha256"] is None else 1):
            row = next(r for r in saved["files"] if r["path"] == entry["path"])
            atomic((stage / "candidate" / entry["path"]).read_bytes(), module / entry["path"], row.get("mode", 0o644))
            changed.append(entry)
            assert digest(module / entry["path"]) == entry["sha256"]
        cache_rebuild()
    except BaseException:
        assert all(digest(module / f["path"]) == f["sha256"] for f in changed), "Concurrent edit: manual recovery required"
        for entry in reversed(changed):
            target = module / entry["path"]
            row = next(r for r in saved["files"] if r["path"] == entry["path"])
            if row["existed"]:
                atomic((stage / "before" / entry["path"]).read_bytes(), target, row["mode"])
            else:
                remove_entry(target)
        if not saved["newDirectoryExisted"] and new_dir.exists() and not list(new_dir.iterdir()):
            remove_entry(new_dir, directory=True)
        cache_rebuild()
        raise
    receipt = {"sourceCommit": manifest["sourceCommit"], "artifactSha256": args.archive_sha256, "installedFiles": 3, "noAccountNameChanged": True, "noDatabaseMigration": True}
    installation_file.write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt))
else:
    saved = json.loads(backup_file.read_text())
    assert saved["artifactSha256"] == args.archive_sha256
    assert all(digest(module / f["path"]) == f["sha256"] for f in files), "Concurrent edit: stop rollback before any change"
    assert all(digest(stage / "before" / row["path"]) == row["sha256"] for row in saved["files"] if row["existed"])
    for entry in reversed(files):
        target = module / entry["path"]
        row = next(r for r in saved["files"] if r["path"] == entry["path"])
        if row["existed"]:
            before = stage / "before" / entry["path"]
            assert digest(before) == row["sha256"]
            atomic(before.read_bytes(), target, row["mode"])
        else:
            remove_entry(target)
    if not saved["newDirectoryExisted"] and new_dir.exists() and not list(new_dir.iterdir()):
        remove_entry(new_dir, directory=True)
    cache_rebuild()
    (stage / "rollback-receipt.json").write_text(json.dumps({"artifactSha256": args.archive_sha256, "restoredFiles": 2, "removedNewFile": True, "accountDataUntouched": True}) + "\n")
    print("CODE_ROLLBACK_COMPLETE_ACCOUNT_DATA_UNTOUCHED")
