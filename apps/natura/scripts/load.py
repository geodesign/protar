import csv
import glob
import os
from datetime import datetime

from django.contrib.gis.db.models.functions import Centroid, Transform
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
            row = {k.lower(): v if v not in ['', 'NULL'] else None for k, v in row.items()}

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

            # Convert dates into right fromat
            if row.get('date_compilation', ''):
                row['date_compilation'] = datetime.strptime(row['date_compilation'], "%d/%m/%Y")
            if row.get('date_update', ''):
                row['date_update'] = datetime.strptime(row['date_update'], "%d/%m/%Y")
            if row.get('date_spa', ''):
                row['date_spa'] = datetime.strptime(row['date_spa'], "%d/%m/%Y")
            if row.get('date_prop_sci', ''):
                row['date_prop_sci'] = datetime.strptime(row['date_prop_sci'], "%d/%m/%Y")
            if row.get('date_conf_sci', ''):
                row['date_conf_sci'] = datetime.strptime(row['date_conf_sci'], "%d/%m/%Y")
            if row.get('date_sac', ''):
                row['date_sac'] = datetime.strptime(row['date_sac'], "%d/%m/%Y")

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
                if counter % 5000 == 0:
                    print('Processed {} rows for {}'.format(counter, modelname))

        # Commit remaining objects to database
        model.objects.bulk_create(batch)

    # Compute and store the centroid of each geometry
    models.Site.objects.update(centroid=Centroid(Transform('geom', 4326)))

    # Print success message
    print('Successfully processed natura data.')
