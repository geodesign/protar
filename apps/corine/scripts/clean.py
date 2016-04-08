from corine.models import Patch
from django.contrib.gis.db.models.functions import MakeValid


def run():
    print('Cleaning corine geoms.')
    Patch.objects.update(geom=MakeValid('geom'))
    print('Successfully cleaned all corine geoms.')
