import glob
import os

from django.contrib.gis.utils import LayerMapping
from django.db.models import F
from nuts.models import Nuts
from nuts.scripts import const


def run():
    # Get data directory from environment
    datadir = os.environ.get('NUTS_DATA_DIRECTORY', '')
    if not datadir:
        print('Datadir not found, please specify NUTS_DATA_DIRECTORY env var.')
        return

    # Loat spatial data
    geosource = glob.glob(os.path.join(datadir, '*.shp'))[0]
    print('Loading geosource', geosource)

    # Delete existing models before loading data
    Nuts.objects.all().delete()

    # Use layermapping to load all shapes
    lm = LayerMapping(Nuts, geosource, const.NUTS_FIELD_MAPPING)
    lm.save(step=1000, progress=True)

    # Copy country code into countryfield table
    Nuts.objects.all().update(country=F('n0cd'))
