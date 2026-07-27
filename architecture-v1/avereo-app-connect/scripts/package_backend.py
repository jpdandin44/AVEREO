from __future__ import annotations

import argparse
import tarfile
from pathlib import Path


def normalized(info: tarfile.TarInfo) -> tarfile.TarInfo:
    info.uid = 0
    info.gid = 0
    info.uname = "root"
    info.gname = "root"
    info.mode = 0o755 if info.isdir() else 0o644
    info.mtime = 0
    info.pax_headers = {}
    return info


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    source = args.source.resolve(strict=True)
    destination = args.destination.resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)

    with tarfile.open(destination, "w:gz", format=tarfile.USTAR_FORMAT) as archive:
        archive.add(source, arcname=".", recursive=True, filter=normalized)


if __name__ == "__main__":
    main()
