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
    geosource = glob.glob(os.path.join(datadir, 'PolbndA.shp'))[0]
    print('Loading geosource', geosource)

    # Delete existing models before loading data
    #Nuts.objects.all().delete()

    ## Use layermapping to load all shapes
    #lm = LayerMapping(Nuts, geosource, const.NUTS_FIELD_MAPPING)
    #lm.save(step=1000, progress=True, strict=True)

    # Remove inconsistent boundary artefacts
    Nuts.objects.filter(icc__icontains='#').delete()

    # Copy country code into countryfield table
    Nuts.objects.all().update(country=F('icc'))

    # Aggregate geoms by nuts region
    Nuts.objects.values('country').annotate(Union('geom'))
    #level1 = Nuts.objects.values('n0cd', 'n0nm', 'n0nme', 'n1cd', 'n1nm', 'country').annotate(Collect('geom'))
    #level2 = Nuts.objects.values('n0cd', 'n0nm', 'n0nme', 'n1cd', 'n1nm', 'n2cd', 'n2nm', 'country').annotate(Collect('geom'))

#    for reg in level2:
        #geom = reg['geom__collect']
        #result = geom[0]
        #print('---')
        #for dat in geom:
            #try:
                #result = result.union(dat)
            #except:
                #import ipdb; ipdb.set_trace()
        #print(result.wkt[:50], result.valid)
        #if not isinstance(result, MultiPolygon):
            #result=MultiPolygon(result)
        #reg['geom'] = result
        #del reg['geom__collect']
        #reg['level'] = 0
        #Nuts.objects.create(**reg)

    ##for reg in level1:
        ##reg['geom'] = MultiPolygon(reg['geom__collect'].envelope)
        ##del reg['geom__collect']
        ##reg['level'] = 1
        ##Nuts.objects.create(**reg)

    ##for reg in level2:
        ##reg['geom'] = MultiPolygon(reg['geom__collect'].envelope)
        ##del reg['geom__collect']
        ##reg['level'] = 2
        ##Nuts.objects.create(**reg)
