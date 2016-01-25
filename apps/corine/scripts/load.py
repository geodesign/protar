import datetime
import glob
import os
import re

from corine.models import Nomenclature, Patch
from corine.scripts import const
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.gdal.error import GDALException
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, WKBWriter
from django.contrib.gis.geos.error import GEOSException


def run():
    # Get data directory from environment
    datadir = os.environ.get('CORINE_DATA_DIRECTORY', '')
    if not datadir:
        print('Datadir not found, please specify CORINE_DATA_DIRECTORY env var.')
        return

    wkb_w = WKBWriter()
    wkb_w.outdim = 2

    for source in glob.glob(os.path.join(datadir, '*.sqlite')):
        # Detect file content either landcover or landcover change
        change = re.findall(r'^cha([^\_*\.sqlite]+)', os.path.basename(source))
        normal = re.findall(r'^clc([^\_*\.sqlite]+)', os.path.basename(source))

        if len(normal):
            # Select field mapping for landcover files
            mapping = const.FIELD_MAPPING

            # Get current year from regex match
            year = normal[0]

            # Set change flag
            change = False

        elif len(change):
            # Select field mapping for change files
            mapping = const.CHANGE_FIELD_MAPPING

            # Get current year from regex match
            year = change[0]

            # Get previous year based on base year
            previous = const.PREVIOUS_LOOKUP[year]
            code_previous_mapping = 'code_' + previous

            # Set change flag
            change = True

        else:
            raise ValueError('Could not interpret source.')

        # Mapping for the landcover code field source
        code_mapping = 'code_' + year

        # Convert regex match year to full year
        year = const.YEAR_MAPPING[year]

        Patch.objects.filter(year=year, change=change).delete()

        print('Processing {}data for year {}.'.format('change ' if change else '', year))

        # Get full nomenclature from nomenclature app. Convert to dict for speed.
        nomenclature = {int(x.code): x.id for x in Nomenclature.objects.all()}

        # Open datasource
        ds = DataSource(source)
        # Get layer from datasource
        lyr = ds[0]

        # Initiate counter and batch array
        counter = 0
        batch = []

        # Process features in layer
        for feat in lyr:
            counter += 1

            # Create patch instance without commiting
            patch = Patch(
                year=year,
                change=change,
                nomenclature_id=nomenclature[int(feat.get(code_mapping))],
            )

            try:
                # Make sure geom is a multi polygon
                multi = feat.geom.geos
                if multi.geom_type != 'MultiPolygon':
                    multi = MultiPolygon(multi)

                # If necessary, roundtrip through hex writer to drop z dim
                if multi.hasz:
                    multi = GEOSGeometry(wkb_w.write_hex(multi))

                patch.geom = multi
            except (GDALException, GEOSException):
                print(
                    'ERROR: Could not set geom for feature (objectid {objid}, counter {count})'
                    .format(objid=feat['OBJECTID'], count=counter)
                )
                continue

            # Set previous landcover for change patches
            if change:
                patch.nomenclature_previous_id = nomenclature[feat.get(code_previous_mapping)]

            # Set fields that are common in both types
            for k, v in mapping.items():
                setattr(patch, k, feat.get(v))

            # Apppend this patch to batch array
            batch.append(patch)

            if counter % 5000 == 0:
                # Commit batch to database
                Patch.objects.bulk_create(batch)

                # Clear batch array
                batch = []

                # Log progress
                now = '[{0}]'.format(datetime.datetime.now().strftime('%Y-%m-%d %T'))
                print('{} Processed {} features'.format(now, counter))

        # Commit remaining patches to database
        if len(batch):
            Patch.objects.bulk_create(batch)
