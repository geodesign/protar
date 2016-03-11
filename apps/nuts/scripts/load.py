import glob
import os

from django.contrib.gis.utils import LayerMapping
from django.db.models import F
from nuts.models import Nuts
from nuts.scripts import const
from django.contrib.gis.db.models import Collect, Union
from django.contrib.gis.geos import MultiPolygon

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
    lm.save(step=1000, progress=True, strict=True)

    # Copy country code into countryfield table
    Nuts.objects.all().update(country=F('n0cd'))

    # Aggregate geoms by nuts region
    level0 = Nuts.objects.values('n0cd', 'n0nm', 'n0nme', 'country').annotate(Union('geom'))

    level1 = Nuts.objects.values('n0cd', 'n0nm', 'n0nme', 'n1cd', 'n1nm', 'country').annotate(Collect('geom'))
    level2 = Nuts.objects.values('n0cd', 'n0nm', 'n0nme', 'n1cd', 'n1nm', 'n2cd', 'n2nm', 'country').annotate(Collect('geom'))

    for reg in level0:
        if not reg['geom__collect'].valid:
            continue
        print('-')
        reg['geom'] = MultiPolygon(reg['geom__collect'])
        del reg['geom__collect']
        reg['level'] = 0
        Nuts.objects.create(**reg)

    #for reg in level1:
        #reg['geom'] = MultiPolygon(reg['geom__collect'].envelope)
        #del reg['geom__collect']
        #reg['level'] = 1
        #Nuts.objects.create(**reg)

    #for reg in level2:
        #reg['geom'] = MultiPolygon(reg['geom__collect'].envelope)
        #del reg['geom__collect']
        #reg['level'] = 2
        #Nuts.objects.create(**reg)
