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


def warn(message):
    print(f"::warning::{message}")


def require_env(name):
    value = os.environ.get(name, "").strip()
    if not value:
        fail(f"{name} is required.")
    return value


def remote_parts(path):
    return [part for part in path.replace("\\", "/").strip("/").split("/") if part]


def ensure_remote_dir(ftp, path):
    ftp.cwd("/")
    for part in remote_parts(path):
        try:
            ftp.cwd(part)
        except ftplib.error_perm:
            ftp.mkd(part)
            ftp.cwd(part)


def cwd_relative(ftp, base_dir, relative_dir=""):
    ensure_remote_dir(ftp, base_dir)
    for part in remote_parts(relative_dir):
        ftp.cwd(part)


def list_entries(ftp):
    try:
        return [(name, facts.get("type", "")) for name, facts in ftp.mlsd()]
    except (ftplib.error_perm, AttributeError):
        entries = []
        for name in ftp.nlst():
            clean_name = posixpath.basename(name.rstrip("/"))
            if clean_name in ("", ".", ".."):
                continue
            try:
                ftp.cwd(clean_name)
                ftp.cwd("..")
                entry_type = "dir"
            except ftplib.error_perm:
                entry_type = "file"
            entries.append((clean_name, entry_type))
        return entries


def collect_remote_tree(ftp, base_dir, relative_dir=""):
    files = set()
    dirs = set()
    cwd_relative(ftp, base_dir, relative_dir)
    for name, entry_type in list_entries(ftp):
        if name in (".", ".."):
            continue
        relative_path = posixpath.join(relative_dir, name) if relative_dir else name
        if entry_type == "dir":
            dirs.add(relative_path)
            child_files, child_dirs = collect_remote_tree(ftp, base_dir, relative_path)
            files.update(child_files)
            dirs.update(child_dirs)
            cwd_relative(ftp, base_dir, relative_dir)
        else:
            files.add(relative_path)
    return files, dirs


def local_tree(local_dir):
    files = {}
    dirs = set()
    for path in local_dir.rglob("*"):
        relative_path = path.relative_to(local_dir).as_posix()
        if path.is_dir():
            dirs.add(relative_path)
        elif path.is_file():
            files[relative_path] = path
    return files, dirs


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

    context = ssl.create_default_context()
    ftp = ftplib.FTP_TLS(context=context)
    ftp.connect(server, port, timeout=timeout)
    ftp.login(username, password)
    ftp.prot_p()
    return ftp


def main():
    local_dir = Path(require_env("FTP_LOCAL_DIR")).resolve()
    server_dir = require_env("FTP_SERVER_DIR").replace("\\", "/").strip("/")

    if not local_dir.is_dir():
        fail(f"FTP_LOCAL_DIR does not exist or is not a directory: {local_dir}")
    if not server_dir:
        fail("FTP_SERVER_DIR resolved to an empty directory.")

    local_files, local_dirs = local_tree(local_dir)
    if "index.html" not in local_files:
        fail(f"index.html was not found in FTP_LOCAL_DIR: {local_dir}")

    ftp = connect()
    try:
        ensure_remote_dir(ftp, server_dir)
        remote_files, remote_dirs = collect_remote_tree(ftp, server_dir)

        for remote_file in sorted(remote_files - set(local_files)):
            try:
                cwd_relative(ftp, server_dir)
                ftp.delete(remote_file)
                print(f"Deleted stale file: {remote_file}")
            except ftplib.all_errors as exc:
                warn(f"Unable to delete stale file {remote_file}: {exc}")

        for directory in sorted(local_dirs):
            cwd_relative(ftp, server_dir)
            ensure_remote_dir(ftp, posixpath.join(server_dir, directory))

        for relative_path, file_path in sorted(local_files.items()):
            parent = posixpath.dirname(relative_path)
            cwd_relative(ftp, server_dir, parent)
            with file_path.open("rb") as handle:
                ftp.storbinary(f"STOR {file_path.name}", handle)
            print(f"Uploaded: {relative_path}")

        for remote_dir in sorted(remote_dirs - local_dirs, reverse=True):
            try:
                cwd_relative(ftp, server_dir)
                ftp.rmd(remote_dir)
                print(f"Deleted stale directory: {remote_dir}")
            except ftplib.all_errors as exc:
                warn(f"Unable to delete stale directory {remote_dir}: {exc}")
    finally:
        try:
            ftp.quit()
        except ftplib.all_errors:
            ftp.close()

    print(f"FTPS deploy complete: {len(local_files)} files uploaded to {server_dir}/")


if __name__ == "__main__":
    main()
