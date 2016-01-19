import csv
import glob
import os

from django.contrib.gis.utils import LayerMapping
from django.db.models import F
from natura import models

natura_mapping = {
    'sitecode': 'SITECODE',
    'sitename': 'SITENAME',
    'release_date': 'RELEASE_DA',
    'country_code': 'MS',
    'sitetype': 'SITETYPE',
    'geom': 'POLYGON',
}


def run(geosource=None, tablesource=None):
    if geosource:
        # Delete existing models before loading data
        models.Site.objects.all().delete()

        # Use layermapping to load all shapes
        lm = LayerMapping(models.Site, geosource, natura_mapping)
        lm.save(step=1000, progress=True)

        # Copy country code into countryfield table
        models.Site.objects.all().update(country=F('country_code'))

    if tablesource:
        # Cache the entire sitecode/id dict
        site_lookup = {x['sitecode']: x['id'] for x in models.Site.objects.values('id', 'sitecode')}

        # Loop through all csv files in the tablesource folder
        for csvfilename in glob.glob(tablesource + '*.csv'):
            print(csvfilename)

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

                # Every 1000 objects, commit to database and print progress message
                if counter % 1000 == 0:
                    model.objects.bulk_create(batch)
                    batch = []
                    print('Processed {} rows for {}'.format(counter, modelname))

            # Commit remaining objects to database
            model.objects.bulk_create(batch)
