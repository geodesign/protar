import os

from django.contrib.gis.db.models import Union
from django.contrib.gis.db.models.functions import Centroid, MakeValid
from django.contrib.gis.geos import MultiPolygon, Polygon
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
    geosource = os.path.join(datadir, 'NUTSV9_LEAC.shp')
    print('Loading geosource', geosource)

    # Delete existing models before loading data
    Region.objects.all().delete()

    # Use layermapping to load all shapes
    lm = LayerMapping(Region, geosource, const.REGION_FIELD_MAPPING)
    lm.save(step=100, progress=True, strict=True)

    # Remove countries not covered by natura 2000
    Region.objects.filter(n0cd__in=['RU', 'NO', 'TR', 'CS', 'UA', 'MD', 'BY', 'CH']).delete()

    # Ensure all geometries are valid
    print('Repairing invalid geometries.')
    Region.objects.update(geom=MakeValid('geom'))

    print('Dissolving regions to create Level 2 boundaries.')
    boundaries = Region.objects.filter(level=3).values('n0cd', 'n0nme', 'n0nm', 'n1cd', 'n1nm', 'n2cd', 'n2nm').annotate(geom=Union('geom'))
    for boundary in boundaries:
        if not isinstance(boundary['geom'], MultiPolygon):
            boundary['geom'] = MultiPolygon(boundary['geom'])
        # Remove interior rings
        boundary['geom'] = MultiPolygon([Polygon(poly[0]) for poly in boundary['geom']])
        Region.objects.create(level=2, **boundary)

    print('Dissolving regions to create Level 1 boundaries.')
    boundaries = Region.objects.filter(level=2).values('n0cd', 'n0nme', 'n0nm', 'n1cd', 'n1nm').annotate(geom=Union('geom'))
    for boundary in boundaries:
        if not isinstance(boundary['geom'], MultiPolygon):
            boundary['geom'] = MultiPolygon(boundary['geom'])
        # Remove interior rings
        boundary['geom'] = MultiPolygon([Polygon(poly[0]) for poly in boundary['geom']])
        Region.objects.create(level=1, **boundary)

    print('Dissolving regions to create Level 0 boundaries.')
    boundaries = Region.objects.filter(level=1).values('n0cd', 'n0nme', 'n0nm').annotate(geom=Union('geom'))
    for boundary in boundaries:
        if not isinstance(boundary['geom'], MultiPolygon):
            boundary['geom'] = MultiPolygon(boundary['geom'])
        # Remove interior rings
        boundary['geom'] = MultiPolygon([Polygon(poly[0]) for poly in boundary['geom']])
        Region.objects.create(level=0, **boundary)

    # Copy country code into countryfield table
    Region.objects.all().update(country=F('n0cd'))

    # Ensure all geometries are valid
    print('Repairing invalid geometries.')
    Region.objects.update(geom=MakeValid('geom'))

    print('Computing site intersections.')
    for reg in Region.objects.all():
        # Filter sites that intersect with region
        sites = Site.objects.filter(geom__intersects=reg.geom).values_list('id', flat=True)

        # Store sites
        reg.sites.add(*sites)

    print('Computing centroids.')
    # Compute and store the centroid of each geometry
    Region.objects.all().update(centroid=Centroid('geom'))

    print('Successfully finished loading regions.')
