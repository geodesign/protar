import os
import re

from corine import const
from corine.models import Nomenclature, Patch
from django.contrib.gis.gdal import DataSource


def run(source, path=None):

    change = re.findall(r'^cha([^\_*\.sqlite]+)', os.path.basename(source))
    normal = re.findall(r'^clc([^\_*\.sqlite]+)', os.path.basename(source))

    if len(normal):
        mapping = const.FIELD_MAPPING
        # Get current year
        year = normal[0]
        change = False
    elif len(change):
        mapping = const.CHANGE_FIELD_MAPPING
        # Get current and previous year
        year = change[0]
        # Add code fields to mapping
        previous = const.PREVIOUS_LOOKUP[year]
        code_previous_mapping = 'code_' + previous
        change = True
    else:
        raise ValueError('Could not interpret source.')

    code_mapping = 'code_' + year

    print(mapping, year)

    nomenclature = Nomenclature.objects.all()

    ds = DataSource(source)
    lyr = ds[0]
    counter = 0

    for feat in lyr:
        counter += 1
        p = Patch(geom=feat.geom.wkb)

        p.nomenclature = nomenclature.get(code=feat.get(code_mapping))

        if change:
            p.nomenclature_previous = nomenclature.get(code=feat.get(code_previous_mapping))

        for k, v in mapping.items():
            setattr(p, k, feat.get(v))

        p.year = const.YEAR_MAPPING[year]

        p.save()

        if counter % 1000 == 0:
            print('Processed %s features' % counter)
