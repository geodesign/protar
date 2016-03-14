import glob
import os
import dbf

from django.contrib.gis.utils import LayerMapping
from django.db.models import F
from nuts.models import Region
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
    geosource = os.path.join(datadir, 'PolbndA.shp')
    print('Loading geosource', geosource)

    # Delete existing models before loading data
    Region.objects.all().delete()

    # Use layermapping to load all shapes
    lm = LayerMapping(Region, geosource, const.REGION_FIELD_MAPPING)
    lm.save(step=1000, progress=True, strict=True)

    # Remove inconsistent boundary artefacts
    Region.objects.filter(icc__icontains='#').delete()

    # Copy country code into countryfield table
    Region.objects.all().update(country=F('icc'))

    # Replace NA value with none
    Region.objects.filter(shn0='N_A').update(shn0=None)
    Region.objects.filter(shn1='N_A').update(shn1=None)
    Region.objects.filter(shn2='N_A').update(shn2=None)
    Region.objects.filter(shn3='N_A').update(shn3=None)
    Region.objects.filter(shn4='N_A').update(shn4=None)

    # Open table with descriptive names for regions
    tablesource = os.path.join(datadir, 'EBM_NAM.dbf')
    table = dbf.Table(tablesource)
    table.open()

    # Find index for identifier and name
    shn_index = table.field_names.index('shn')
    name_index = table.field_names.index('nama')

    # Update objects with names
    for row in table:
        nut = None
        for i in range(4):
            lookup = {'shn' + str(i): row[shn_index].strip()}
            nut = Region.objects.filter(**lookup)
            if nut.exists():
                data = {'name' + str(i): row[name_index].strip()}
                nut.update(**data)

    # Aggregate geoms by nuts region
    country_boundaries = Region.objects.values('country').annotate(geom=Union('geom'))
    for boundary in country_boundaries:
        if not isinstance(boundary['geom'], MultiPolygon):
            boundary['geom'] = MultiPolygon(boundary['geom'])
        Region.objects.create(**boundary)
