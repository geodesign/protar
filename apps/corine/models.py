from django.contrib.gis.db import models


class Patch(models.Model):
    """
    Corine Land Cover 2006 patch.
    """
    code_06 = models.CharField(max_length=0)
    id = models.CharField(max_length=0)
    remark = models.CharField(max_length=0)
    area_ha = models.FloatField()
    shape_length = models.FloatField()
    shape_area = models.FloatField()
    geom = models.MultiPolygonField(srid=3035)
    objects = models.GeoManager()

    def __str__(self):
        return str(self.code_06)
