import os

import dbf

from django.contrib.gis.db.models import Union
from django.contrib.gis.geos import MultiPolygon
from django.contrib.gis.utils import LayerMapping
from django.db.models import F
from natura.models import Site
from regions.models import Region
from regions.scripts import const


def run():
    # Get data directory from environment
    datadir = os.environ.get('REGIONS_DATA_DIRECTORY', '')
    if not datadir:
        print('Datadir not found, please specify REGIONS_DATA_DIRECTORY env var.')
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

    # Remove countries not covered by natura 2000
    Region.objects.filter(icc__in=['GL', 'NO', 'IS', 'GE', 'CH']).delete()

    # Remove water areas
    Region.objects.filter(taa=5).delete()

    # Replace NA value with none
    Region.objects.filter(shn0='N_A').update(shn0=None)
    Region.objects.filter(shn1='N_A').update(shn1=None)
    Region.objects.filter(shn2='N_A').update(shn2=None)
    Region.objects.filter(shn3='N_A').update(shn3=None)
    Region.objects.filter(shn4='N_A').update(shn4=None)

    # Open table with descriptive names for regions
    tablesource = os.path.join(datadir, 'EBM_NAM.dbf')
    print('Loading tabular data from', tablesource)
    table = dbf.Table(tablesource)
    table.open()

    # Find index for identifier and name
    shn_index = table.field_names.index('shn')
    name_index = table.field_names.index('nama')

    # Update objects with names
    for row in table:
        # Get name from row
        name = row[name_index].strip()
        # Ignore row if name is NA
        if name == 'N_A':
            continue
        # Update names in region objects
        for i in range(4):
            # Get identifier as lookup
            lookup = {'shn' + str(i): row[shn_index].strip()}
            # Get regions for this row
            reg = Region.objects.filter(**lookup)
            # Write name if region match was found
            if reg.exists():
                data = {'name' + str(i): name}
                reg.update(**data)

    print('Dissolving regions to create country boundaries.')
    country_boundaries = Region.objects.values('shn0', 'icc').annotate(geom=Union('geom'))
    for boundary in country_boundaries:
        if not isinstance(boundary['geom'], MultiPolygon):
            boundary['geom'] = MultiPolygon(boundary['geom'])
        Region.objects.create(level=0, **boundary)

    region_boundaries = Region.objects.exclude(level=0).values('shn1', 'name1', 'icc').annotate(geom=Union('geom'))
    for boundary in region_boundaries:
        if not isinstance(boundary['geom'], MultiPolygon):
            boundary['geom'] = MultiPolygon(boundary['geom'])
        Region.objects.create(level=1, **boundary)

    # Copy country code into countryfield table
    Region.objects.all().update(country=F('icc'))

    print('Computing levels and site intersections.')
    for reg in Region.objects.all():
        if reg.level != -1:
            # For dissolved areas, add country name as name0
            reg.name0 = reg.country.name
            reg.save()
        else:
            # Determine level
            vals = (
                reg.shn0 is not None, reg.shn1 is not None, reg.shn2 is not None,
                reg.shn3 is not None, reg.shn4 is not None
            )
            level = sum(vals)
            if level < 2:
                level = 2
            reg.level = level
            reg.save()

        # Filter sites that intersect with region
        sites = Site.objects.filter(geom__intersects=reg.geom).values_list('id', flat=True)

        # Store sites
        reg.sites.add(*sites)
