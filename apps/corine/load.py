import datetime
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

    year = const.YEAR_MAPPING[year]

    print(mapping, year)

    nomenclature = {x.code: x.id for x in Nomenclature.objects.all()}

    ds = DataSource(source)
    lyr = ds[0]
    counter = 0

    batch = []

    for feat in lyr:
        counter += 1

        patch = Patch(
            geom=feat.geom.wkb,
            year=year,
            nomenclature_id=nomenclature[feat.get(code_mapping)],
        )

        if change:
            patch.nomenclature_previous_id = nomenclature[feat.get(code_previous_mapping)]

        for k, v in mapping.items():
            setattr(patch, k, feat.get(v))

        batch.append(patch)

        if counter % 5000 == 0:
            Patch.objects.bulk_create(batch)
            batch = []
            now = '[{0}]'.format(datetime.datetime.now().strftime('%Y-%m-%d %T'))
            print('{} Processed {} features'.format(now, counter))

    Patch.objects.bulk_create(batch)
