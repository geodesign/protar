from corine.models import Patch
from django.contrib.gis.db.models.functions import MakeValid


def run():
    print('Reprojecting corine geoms.')
    Patch.objects.update(geom_cleaned=MakeValid('geom'))
    print('Successfully reprojected and validated all corine geoms.')
