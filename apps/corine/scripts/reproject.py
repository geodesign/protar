from django.contrib.gis.db.models.functions import MakeValid, Transform
from corine.models import Patch


def run():
    Patch.objects.update(geom_wgs=MakeValid(Transform('geom', 4326)))
