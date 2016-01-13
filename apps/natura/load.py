import os

from django.contrib.gis.utils import LayerMapping
from natura.models import Site

natura_mapping = {
    'sitecode': 'SITECODE',
    'sitename': 'SITENAME',
    'release_da': 'RELEASE_DA',
    'ms': 'MS',
    'sitetype': 'SITETYPE',
    'geom': 'POLYGON',
}

natura_shp = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data', 'Natura2000_end2014.shp'))


def run(verbose=True):
    lm = LayerMapping(Site, natura_shp, natura_mapping)

    lm.save(strict=True, verbose=verbose)
