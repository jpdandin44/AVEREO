#!/usr/bin/env python3
import ftplib
import os
import posixpath
import ssl
import sys
from pathlib import Path


def fail(message):
    print(f"::error::{message}", file=sys.stderr)
    sys.exit(1)


def require_env(name):
    value = os.environ.get(name, "").strip()
    if not value:
        fail(f"{name} is required.")
    return value


def remote_parts(path):
    return [part for part in path.replace("\\", "/").strip("/").split("/") if part]


def connect():
    server = require_env("FTP_SERVER")
    port = int(os.environ.get("FTP_PORT", "21"))
    username = require_env("FTP_USERNAME")
    password = require_env("FTP_PASSWORD")
    protocol = os.environ.get("FTP_PROTOCOL", "ftps").strip().lower()
    timeout = int(os.environ.get("FTP_TIMEOUT", "45"))

    if protocol == "ftp":
        ftp = ftplib.FTP()
        ftp.connect(server, port, timeout=timeout)
        ftp.login(username, password)
        return ftp

    ftp = ftplib.FTP_TLS(context=ssl.create_default_context())
    ftp.connect(server, port, timeout=timeout)
    ftp.login(username, password)
    ftp.prot_p()
    return ftp


def cwd_remote(ftp, path):
    ftp.cwd("/")
    for part in remote_parts(path):
        ftp.cwd(part)


def list_entries(ftp):
    try:
        return [(name, facts.get("type", "")) for name, facts in ftp.mlsd()]
    except (ftplib.error_perm, AttributeError):
        entries = []
        for raw_name in ftp.nlst():
            name = posixpath.basename(raw_name.rstrip("/"))
            if name in ("", ".", ".."):
                continue
            try:
                ftp.cwd(name)
                ftp.cwd("..")
                entry_type = "dir"
            except ftplib.error_perm:
                entry_type = "file"
            entries.append((name, entry_type))
        return entries


def safe_local_path(base, relative):
    path = (base / Path(*remote_parts(relative))).resolve()
    if path != base and base not in path.parents:
        fail(f"Unsafe remote path returned by FTP server: {relative}")
    return path


def download_tree(ftp, remote_base, local_base, relative=""):
    cwd_remote(ftp, posixpath.join(remote_base, relative))
    downloaded = 0
    for name, entry_type in list_entries(ftp):
        if name in ("", ".", "..") or "/" in name or "\\" in name:
            continue
        child = posixpath.join(relative, name) if relative else name
        if entry_type == "dir":
            safe_local_path(local_base, child).mkdir(parents=True, exist_ok=True)
            downloaded += download_tree(ftp, remote_base, local_base, child)
            cwd_remote(ftp, posixpath.join(remote_base, relative))
            continue

        local_file = safe_local_path(local_base, child)
        local_file.parent.mkdir(parents=True, exist_ok=True)
        with local_file.open("wb") as handle:
            ftp.retrbinary(f"RETR {name}", handle.write)
        downloaded += 1
    return downloaded


def main():
    remote_dir = require_env("FTP_SERVER_DIR").replace("\\", "/").strip("/")
    local_dir = Path(require_env("FTP_BACKUP_DIR")).resolve()
    allow_missing = os.environ.get("FTP_ALLOW_MISSING", "").strip().lower() in ("1", "true", "yes")
    if not remote_dir:
        fail("FTP_SERVER_DIR resolved to an empty directory.")
    local_dir.mkdir(parents=True, exist_ok=True)

    ftp = connect()
    try:
        try:
            cwd_remote(ftp, remote_dir)
        except ftplib.error_perm as exc:
            if allow_missing:
                print(f"::warning::Remote backup directory does not exist: {remote_dir} ({exc})")
                return
            raise
        downloaded = download_tree(ftp, remote_dir, local_dir)
    finally:
        try:
            ftp.quit()
        except ftplib.all_errors:
            ftp.close()

    print(f"FTPS backup complete: {downloaded} files downloaded from {remote_dir}/")


if __name__ == "__main__":
    main()
