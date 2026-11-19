"""Create the public-only cPanel upload archive with correct permissions."""
from pathlib import Path
import argparse
import datetime
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
parser.add_argument('--test', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
files = [root / p for p in ('index.html', 'manifest.webmanifest', 'offline.html', 'sw.js')]
files += sorted(p for p in (root / 'assets').rglob('*') if p.is_file())
files += [root / p / 'index.html' for p in ('privacy-policy', 'guidelines-for-formatting-papers', 'participation', 'paper-submission', 'participation-plans')]
directories = set()
for file in files:
    if file.is_symlink():
        raise ValueError('Symlinks are not allowed')
    parent = file.parent
    while parent != root:
        directories.add(parent.relative_to(root).as_posix() + '/')
        parent = parent.parent
with zipfile.ZipFile(args.output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in sorted(directories) + [p.relative_to(root).as_posix() for p in files]:
        directory = name.endswith('/')
        item = zipfile.ZipInfo(name, datetime.datetime.now().timetuple()[:6])
        item.create_system = 3
        item.external_attr = ((0o40755 if directory else 0o100644) << 16) | (0x10 if directory else 0)
        item.compress_type = zipfile.ZIP_DEFLATED
        data = b'' if directory else (root / name).read_bytes()
        if args.test and name == 'index.html':
            data = data.replace(b'<head>', b'<head>\n<meta name="robots" content="noindex, nofollow">', 1)
        archive.writestr(item, data)
with zipfile.ZipFile(args.output) as archive:
    assert archive.testzip() is None
print(f'Created {args.output} ({args.output.stat().st_size / 1024**2:.2f} MB)')
