"""Publish public assets to the FTP account restricted to the test domain."""
import ftplib
import io
import os
from pathlib import Path
import ssl
import urllib.request

ROOT = Path(__file__).resolve().parent.parent


def public_files():
    files = sorted((ROOT / 'assets').rglob('*'))
    files += [ROOT / name for name in ('manifest.webmanifest', 'offline.html', 'sw.js', 'index.html')]
    for path in files:
        if path.is_symlink():
            raise ValueError('Symlinks cannot be deployed')
        if not path.is_file():
            continue
        data = path.read_bytes()
        if path.name == 'index.html':
            data = data.replace(b'<head>', b'<head>\n  <meta name="robots" content="noindex, nofollow">', 1)
        yield path.relative_to(ROOT).as_posix(), data


def deploy():
    server, username, password = (os.environ[key] for key in ('FTP_SERVER', 'FTP_USERNAME', 'FTP_PASSWORD'))
    if server != 'ftp.par-conference.com' or username != 'github-test@par-conference.com':
        raise ValueError('Deployment requires the dedicated test FTP account')
    files = list(public_files())
    with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=60) as ftp:
        ftp.connect(server, 21)
        ftp.login(username, password)
        ftp.prot_p()
        ftp.cwd('/')  # This account is jailed to test.par-conference.com.
        if {'wp-config.php', 'wp-admin', 'public_html'} & set(ftp.nlst()):
            raise RuntimeError('Unexpected production directory; refusing deployment')
        directories = sorted({str(Path(name).parent).replace('\\', '/') for name, _ in files if '/' in name}, key=lambda name: (name.count('/'), name))
        for directory in directories:
            try:
                ftp.mkd(directory)
            except ftplib.error_perm:
                ftp.cwd('/' + directory)  # Ensure it exists; do not hide real errors.
                ftp.cwd('/')
        for name, data in files:
            temporary = name + '.uploading'
            ftp.storbinary('STOR ' + temporary, io.BytesIO(data))
            ftp.sendcmd('SITE CHMOD 644 ' + temporary)
            ftp.rename(temporary, name)
            print('Published ' + name)
    # Verify the actual public entry point and bundle, not just FTP success.
    expected = dict(files)
    for name in ('index.html', 'assets/app.js', 'assets/styles.css'):
        request = urllib.request.Request('https://test.par-conference.com/' + name, headers={'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(request, timeout=60) as response:
            if response.read() != expected[name]:
                raise RuntimeError('Public verification failed: ' + name)
    print('Verified https://test.par-conference.com')


if __name__ == '__main__':
    deploy()
