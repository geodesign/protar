import os

from corine.models import Patch
from django.contrib.gis.utils import LayerMapping

clc_mapping = {
    'code_06': 'code_06',
    'id': 'id',
    'remark': 'remark',
    'area_ha': 'area_ha',
    'shape_length': 'shape_length',
    'shape_area': 'shape_area',
    'geom': 'MULTIPOLYGON',
}

clc_sqlite = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data', 'clc06.sqlite'))


def run(verbose=True):
    lm = LayerMapping(Patch, clc_sqlite, clc_mapping)

    lm.save(strict=True, verbose=verbose)
