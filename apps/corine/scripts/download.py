import os

import patoolib
import requests

from corine.scripts import const


def run(unpack=True):
    # Get data directory from environment
    datadir = os.environ.get('CORINE_DATA_DIRECTORY', '')
    if not datadir:
        print('Datadir not found, please specify CORINE_DATA_DIRECTORY env var.')
        return

    for url in const.SOURCE_URLS_18_4:
        filepath = os.path.join(datadir, os.path.basename(url))
        print('Downloading file', url, filepath)

        response = requests.get(url, stream=True)
        with open(filepath, "wb") as handle:
            for data in response.iter_content(chunk_size=1024):
                if data:
                    handle.write(data)

        if unpack:
            print('Unpacking file', filepath)
            patoolib.extract_archive(filepath, outdir=datadir)
