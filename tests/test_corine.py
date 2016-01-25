import urllib

from corine.load import SOURCE_URLS
from django.test import TestCase


class CorineTests(TestCase):

    def test_file_sourcces(self):
        """
        Confirm that all source files are available on servers.
        """
        for url in SOURCE_URLS:
            # All file sources exist
            source = urllib.request.urlopen(url)
            meta = source.info()
            size = meta.get_all('Content-Length')[0]
            self.assertTrue(int(size) > 0)
