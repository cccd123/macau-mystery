"""Administrative commands for local object-storage initialization."""
from __future__ import annotations

import argparse

from app.object_storage import ObjectStorageService


def main() -> int:
    parser = argparse.ArgumentParser(description="Object storage administration")
    parser.add_argument("command", choices=("init",))
    args = parser.parse_args()
    if args.command == "init":
        ObjectStorageService().initialize_bucket()
        print("Object storage bucket and public-read policy are ready.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
