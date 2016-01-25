import os

import patoolib
import requests

from natura.scripts import const


def run():
    # Get data directory from environment
    datadir = os.environ.get('NATURA_DATA_DIRECTORY', '')
    if not datadir:
        print('Datadir not found, please specify NATURA_DATA_DIRECTORY env var.')
        return

    # Get geographic files
    url = const.NATURA2000_SITES_SOURCE
    filepath = os.path.join(datadir, os.path.basename(url))
    print('Downloading file', url, filepath)
    response = requests.get(url, stream=True)
    with open(filepath, "wb") as handle:
        for data in response.iter_content(chunk_size=1024):
            if data:
                handle.write(data)

    print('Unpacking file', filepath)
    patoolib.extract_archive(filepath, outdir=datadir)

    # Get tabular data
    url = const.NATURA2000_TABLE_SOURCE
    filepath = os.path.join(datadir, 'natura2000_tabular.zip')
    print('Downloading file', url, filepath)
    response = requests.get(url, stream=True)
    with open(filepath, "wb") as handle:
        for data in response.iter_content(chunk_size=1024):
            if data:
                handle.write(data)

    print('Unpacking file', filepath)
    patoolib.extract_archive(filepath, outdir=datadir)
