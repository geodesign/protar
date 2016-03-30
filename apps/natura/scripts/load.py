import csv
import glob
import os

from django.contrib.gis.db.models.functions import Centroid
from django.contrib.gis.utils import LayerMapping
from django.db.models import F
from natura import models
from natura.scripts import const


def run():
    # Get data directory from environment
    datadir = os.environ.get('NATURA_DATA_DIRECTORY', '')
    if not datadir:
        print('Datadir not found, please specify NATURA_DATA_DIRECTORY env var.')
        return

    # Loat spatial data
    geosource = glob.glob(os.path.join(datadir, '*.shp'))[0]
    print('Loading geosource', geosource)

    # Delete existing models before loading data
    models.Site.objects.all().delete()

    # Use layermapping to load all shapes
    lm = LayerMapping(models.Site, geosource, const.NATURA_FIELD_MAPPING)
    lm.save(step=100, progress=True)

    # Copy country code into countryfield table
    models.Site.objects.all().update(country=F('country_code'))

    # Cache the entire sitecode/id dict
    site_lookup = {x['sitecode']: x['id'] for x in models.Site.objects.values('id', 'sitecode')}

    # Loop through all csv files in the tablesource folder
    for csvfilename in glob.glob(os.path.join(datadir, '*.csv')):
        print('Loading table', csvfilename)

        csvfile = open(csvfilename, 'r', encoding='utf-8-sig')

        # Extract modelname from filename
        modelname = os.path.basename(csvfilename).split('.')[0].title()

        # Change directive species flag for species from otherspecies table
        # This script unifies the otherspecies and species tables.
        otherspecies = False
        if modelname == 'Otherspecies':
            modelname = 'Species'
            otherspecies = True

        # Get model class based on modelname
        model = getattr(models, modelname)
        model.objects.all().delete()

        # Instantiate csv reader, counter and batch array
        reader = csv.DictReader(csvfile)
        counter = 0
        batch = []
        for row in reader:
            counter += 1

            # Convert row names to lower letters for field matching
            row = {k.lower(): v if v is not '' else None for k, v in row.items()}

            # Replace protected name field with allowed name
            if 'global' in row:
                row['global_assessment'] = row.pop('global')

            # Set site foreign key
            if 'sitecode' in row:
                row['site_id'] = site_lookup.get(row.pop('sitecode'), None)

            # Take different encodings into account
            if 'spgroup' in row:
                row['speciesgroup'] = row.pop('spgroup')

            # Change directive species flag for species from otherspecies table
            if otherspecies:
                row['directivespecies'] = False

            # Remove fields that are already in site
            row.pop('country_code', None)
            row.pop('sitetype', None)
            row.pop('sitename', None)

            # Add model to batch
            batch.append(model(**row))

            # Every 100 objects, commit to database and print progress message
            if counter % 100 == 0:
                model.objects.bulk_create(batch)
                batch = []
                print('Processed {} rows for {}'.format(counter, modelname))

        # Commit remaining objects to database
        model.objects.bulk_create(batch)

    # Compute and store the centroid of each geometry
    models.Site.objects.update(centroid=Centroid('geom'))

    # Print success message
    print('Successfully processed natura data.')
